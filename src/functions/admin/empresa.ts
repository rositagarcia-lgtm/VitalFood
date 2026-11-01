import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, dbErrorMessage } from "@/server/db";
import { destroyImage } from "@/server/cloudinary";
import { requireModule } from "@/server/session";
import { validate } from "@/server/validation";
import { imageFields, optionalUrl } from "@/server/schemas";
import { logActivity } from "@/server/activity";
import type { Bloque, Empresa } from "@/lib/types";

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`).nullable();
const numero = (min: number, max: number, msg: string) =>
  z.number({ message: msg }).int(msg).min(min, msg).max(max, msg).nullable();

const empresaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(80),
  eslogan: z.string().trim().min(2, "El eslogan es obligatorio.").max(200),
  ciudad: z.string().trim().min(2, "La ciudad es obligatoria.").max(80),
  anio_fundacion: numero(1950, new Date().getFullYear(), "Ingresa un año válido."),
  clientes_mes: numero(0, 10_000_000, "Ingresa un número válido de clientes."),
  equipo: numero(0, 100_000, "Ingresa un número válido de personas."),
  intro_titulo: texto(160),
  intro_texto: texto(500),
  historia_titulo: texto(160),
  historia_texto: texto(3000),
  mision: texto(400),
  vision: texto(400),
  whatsapp: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\+?\d{9,15}$/.test(v.replace(/\s/g, "")),
      "Escribe el WhatsApp con código de país, por ejemplo 51987654321.",
    )
    .nullable(),
  telefono: texto(30),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ingresa un correo válido.")
    .nullable(),
  horario: texto(160),
  instagram: optionalUrl.nullable(),
  facebook: optionalUrl.nullable(),
  tiktok: optionalUrl.nullable(),
  resenas_url: optionalUrl.nullable(),
  reclamaciones_url: optionalUrl.nullable(),
  ...imageFields,
});

export type EmpresaInput = z.infer<typeof empresaSchema>;

export const getEmpresaAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireModule("empresa");
  const rows = await db()`SELECT * FROM empresa WHERE id = 1`;
  const {
    id: _id,
    updated_at: _u,
    ...e
  } = rows[0] as Empresa & { id: number; updated_at: unknown };
  return e as Empresa;
});

export const saveEmpresa = createServerFn({ method: "POST" })
  .validator(validate(empresaSchema))
  .handler(async ({ data }) => {
    const user = await requireModule("empresa");
    const v = (x: string | null) => (x && x.trim() ? x.trim() : null);
    const whatsapp = data.whatsapp ? data.whatsapp.replace(/[\s+]/g, "") || null : null;
    const sql = db();
    const prev = await sql`SELECT imagen_public_id FROM empresa WHERE id = 1`;
    try {
      await sql`
        UPDATE empresa SET
          nombre = ${data.nombre}, eslogan = ${data.eslogan}, ciudad = ${data.ciudad},
          anio_fundacion = ${data.anio_fundacion}, clientes_mes = ${data.clientes_mes}, equipo = ${data.equipo},
          intro_titulo = ${v(data.intro_titulo)}, intro_texto = ${v(data.intro_texto)},
          historia_titulo = ${v(data.historia_titulo)}, historia_texto = ${v(data.historia_texto)},
          mision = ${v(data.mision)}, vision = ${v(data.vision)},
          whatsapp = ${whatsapp}, telefono = ${v(data.telefono)}, email = ${v(data.email)}, horario = ${v(data.horario)},
          instagram = ${v(data.instagram)}, facebook = ${v(data.facebook)}, tiktok = ${v(data.tiktok)},
          resenas_url = ${v(data.resenas_url)}, reclamaciones_url = ${v(data.reclamaciones_url)},
          imagen_url = ${data.imagen_url}, imagen_public_id = ${data.imagen_public_id}
        WHERE id = 1
      `;
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
    const oldId = prev[0]?.["imagen_public_id"] as string | null | undefined;
    if (oldId && oldId !== data.imagen_public_id) await destroyImage(oldId);
    await logActivity(user, "editar", "Empresa", "Información de la empresa");
    return { ok: true };
  });

// ---------------------------------------------------------------- bloques de Nosotros

const bloqueSchema = z.object({
  id: z.number().int().positive().optional(),
  tipo: z.enum(["valor", "garantia", "hito", "opinion"]),
  titulo: z.string().trim().min(2, "El título es obligatorio.").max(120),
  texto: z.string().trim().min(2, "El texto es obligatorio.").max(500),
  icono: z.string().trim().min(1).max(40),
  anio: z.number().int().min(1950).max(2100).nullable(),
  autor: texto(80),
  detalle: texto(120),
  estrellas: z.number().int().min(1).max(5).nullable(),
  orden: z.number().int().min(0).max(999),
  activo: z.boolean(),
});

export type BloqueInput = z.infer<typeof bloqueSchema>;

const NOMBRE_TIPO = {
  valor: "Valor",
  garantia: "Garantía",
  hito: "Hito",
  opinion: "Opinión",
} as const;

export const listBloques = createServerFn({ method: "GET" }).handler(async () => {
  await requireModule("empresa");
  const rows = await db()`
    SELECT id, tipo, titulo, texto, icono, anio, autor, detalle, estrellas, orden, activo
    FROM bloques ORDER BY tipo, orden, id
  `;
  return rows as Bloque[];
});

export const saveBloque = createServerFn({ method: "POST" })
  .validator(validate(bloqueSchema))
  .handler(async ({ data }) => {
    const user = await requireModule("empresa");
    if (data.tipo === "hito" && !data.anio) throw new Error("Indica el año del hito.");
    if (data.tipo === "opinion" && !data.autor) throw new Error("Indica quién dio la opinión.");
    const autor = data.autor || null;
    const detalle = data.detalle || null;
    const estrellas = data.tipo === "opinion" ? (data.estrellas ?? 5) : null;
    if (data.id) {
      await db()`
        UPDATE bloques SET tipo = ${data.tipo}, titulo = ${data.titulo}, texto = ${data.texto}, icono = ${data.icono},
          anio = ${data.anio}, autor = ${autor}, detalle = ${detalle}, estrellas = ${estrellas},
          orden = ${data.orden}, activo = ${data.activo}
        WHERE id = ${data.id}
      `;
    } else {
      await db()`
        INSERT INTO bloques (tipo, titulo, texto, icono, anio, autor, detalle, estrellas, orden, activo)
        VALUES (${data.tipo}, ${data.titulo}, ${data.texto}, ${data.icono}, ${data.anio}, ${autor}, ${detalle},
                ${estrellas}, ${data.orden}, ${data.activo})
      `;
    }
    await logActivity(
      user,
      data.id ? "editar" : "crear",
      "Nosotros",
      `${NOMBRE_TIPO[data.tipo]}: ${data.titulo}`,
    );
    return { ok: true };
  });

export const deleteBloque = createServerFn({ method: "POST" })
  .validator(validate(z.object({ id: z.number().int().positive() })))
  .handler(async ({ data }) => {
    const user = await requireModule("empresa");
    const rows = await db()`DELETE FROM bloques WHERE id = ${data.id} RETURNING tipo, titulo`;
    const r = rows[0];
    if (r)
      await logActivity(
        user,
        "eliminar",
        "Nosotros",
        `${NOMBRE_TIPO[r["tipo"] as Bloque["tipo"]]}: ${String(r["titulo"])}`,
      );
    return { ok: true };
  });
