import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, dbErrorMessage } from "@/server/db";
import { destroyImage } from "@/server/cloudinary";
import { requireModule } from "@/server/session";
import { validate } from "@/server/validation";
import { imageFields } from "@/server/schemas";
import { logActivity } from "@/server/activity";
import type { ImagenGaleria, Platillo } from "@/lib/types";

const gramos = z
  .number({ message: "Ingresa los gramos como número." })
  .min(0, "No puede ser negativo.")
  .max(999)
  .nullable();
const lista = z.array(z.string().trim().min(1).max(40)).max(10, "Máximo 10 elementos.");

const platilloSchema = z
  .object({
    id: z.number().int().positive().optional(),
    categoria_id: z
      .number({ message: "Elige una categoría." })
      .int()
      .positive("Elige una categoría."),
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre es obligatorio.")
      .max(100, "Máximo 100 caracteres."),
    descripcion: z.string().trim().max(1000, "Máximo 1000 caracteres.").nullable(),
    precio: z
      .number({ message: "Ingresa un precio válido." })
      .min(0, "El precio no puede ser negativo.")
      .max(99999, "Precio demasiado alto."),
    precio_oferta: z.number({ message: "Ingresa un precio de oferta válido." }).min(0).nullable(),
    disponible: z.boolean(),
    destacado: z.boolean(),
    orden: z.number().int().min(0).max(999),
    porcion_g: z
      .number({ message: "Ingresa la porción en gramos." })
      .int()
      .min(1)
      .max(5000)
      .nullable(),
    proteinas: gramos,
    carbohidratos: gramos,
    grasas: gramos,
    fibra: gramos,
    kcal_manual: z
      .number({ message: "Ingresa las calorías como número." })
      .int()
      .min(0)
      .max(9999)
      .nullable(),
    etiquetas: lista,
    objetivos: z.array(z.enum(["proteina", "bajo", "vegano", "energia"])),
    ingredientes: z.string().trim().max(1000).nullable(),
    alergenos: z.string().trim().max(300).nullable(),
    conservacion: z.string().trim().max(300).nullable(),
    personalizable: z.boolean(),
    galeria: z
      .array(
        z.object({
          url: z
            .string()
            .trim()
            .max(500)
            .refine((v) => v.startsWith("/") || v.startsWith("https://")),
          public_id: z.string().max(255).nullable(),
        }),
      )
      .max(6, "Máximo 6 fotos adicionales."),
    ...imageFields,
  })
  .refine((v) => v.precio_oferta === null || v.precio_oferta < v.precio, {
    message: "El precio de oferta debe ser menor que el precio normal.",
  })
  .refine(
    (v) =>
      [v.proteinas, v.carbohidratos, v.grasas].every((x) => x === null) ||
      [v.proteinas, v.carbohidratos, v.grasas].every((x) => x !== null),
    {
      message: "Completa proteínas, carbohidratos y grasas juntos (o deja los tres vacíos).",
    },
  );

export type PlatilloInput = z.infer<typeof platilloSchema>;

const money = (n: number) => `S/ ${n.toFixed(2)}`;

export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/&/g, " y ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "platillo"
  );
}

export const listPlatillos = createServerFn({ method: "GET" }).handler(async () => {
  await requireModule("platillos");
  const rows = await db()`
    SELECT p.id, p.categoria_id, c.nombre AS categoria, p.nombre, p.slug, p.descripcion,
           p.precio::float8 AS precio, p.precio_oferta::float8 AS precio_oferta,
           p.imagen_url, p.imagen_public_id, p.disponible, p.destacado, p.orden,
           p.precio_actualizado_at::text,
           (p.precio_actualizado_at > p.created_at + interval '1 minute' AND p.precio_actualizado_at > CURRENT_TIMESTAMP - interval '7 days') AS precio_reciente,
           p.porcion_g, p.proteinas::float8 AS proteinas, p.carbohidratos::float8 AS carbohidratos,
           p.grasas::float8 AS grasas, p.fibra::float8 AS fibra, p.kcal_manual, p.etiquetas, p.objetivos,
           p.ingredientes, p.alergenos, p.conservacion, p.personalizable, p.galeria
    FROM platillos p
    JOIN categorias c ON c.id = p.categoria_id
    ORDER BY c.orden, p.orden, p.nombre
  `;
  return rows as Platillo[];
});

async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  const rows =
    await db()`SELECT slug FROM platillos WHERE slug LIKE ${base + "%"} AND id <> ${exceptId ?? 0}`;
  const taken = new Set(rows.map((r) => String(r["slug"])));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export const savePlatillo = createServerFn({ method: "POST" })
  .validator(validate(platilloSchema))
  .handler(async ({ data }) => {
    const user = await requireModule("platillos");
    const sql = db();
    const nul = (x: string | null) => (x && x.trim() ? x.trim() : null);
    const etiquetas = [...new Set(data.etiquetas.map((e) => e.trim()).filter(Boolean))];
    const galeria = JSON.stringify(data.galeria);
    try {
      if (data.id) {
        const prev = await sql`
          SELECT imagen_public_id, galeria, precio::float8 AS precio, precio_oferta::float8 AS precio_oferta
          FROM platillos WHERE id = ${data.id}
        `;
        await sql`
          UPDATE platillos
          SET categoria_id = ${data.categoria_id}, nombre = ${data.nombre}, descripcion = ${nul(data.descripcion)},
              precio = ${data.precio}, precio_oferta = ${data.precio_oferta}, disponible = ${data.disponible},
              destacado = ${data.destacado}, orden = ${data.orden},
              imagen_url = ${data.imagen_url}, imagen_public_id = ${data.imagen_public_id},
              porcion_g = ${data.porcion_g}, proteinas = ${data.proteinas}, carbohidratos = ${data.carbohidratos},
              grasas = ${data.grasas}, fibra = ${data.fibra}, kcal_manual = ${data.kcal_manual},
              etiquetas = ${etiquetas}, objetivos = ${data.objetivos}, ingredientes = ${nul(data.ingredientes)},
              alergenos = ${nul(data.alergenos)}, conservacion = ${nul(data.conservacion)},
              personalizable = ${data.personalizable}, galeria = ${galeria}::jsonb
          WHERE id = ${data.id}
        `;
        const old = prev[0] ?? {};
        const oldId = old["imagen_public_id"] as string | null | undefined;
        if (oldId && oldId !== data.imagen_public_id) await destroyImage(oldId);
        // Fotos de la galería que se quitaron
        const kept = new Set(data.galeria.map((g) => g.public_id).filter(Boolean));
        for (const g of (old["galeria"] as ImagenGaleria[] | undefined) ?? []) {
          if (g.public_id && !kept.has(g.public_id)) await destroyImage(g.public_id);
        }

        const cambios: string[] = [];
        if (old["precio"] !== data.precio)
          cambios.push(`precio ${money(Number(old["precio"]))} → ${money(data.precio)}`);
        if ((old["precio_oferta"] ?? null) !== data.precio_oferta) {
          cambios.push(
            data.precio_oferta === null ? "quitó la oferta" : `oferta ${money(data.precio_oferta)}`,
          );
        }
        await logActivity(
          user,
          "editar",
          "Platillos",
          `${data.nombre}${cambios.length ? ` (${cambios.join(", ")})` : ""}`,
        );
      } else {
        const slug = await uniqueSlug(slugify(data.nombre));
        await sql`
          INSERT INTO platillos (categoria_id, nombre, slug, descripcion, precio, precio_oferta, disponible, destacado,
                                 orden, imagen_url, imagen_public_id, porcion_g, proteinas, carbohidratos, grasas,
                                 fibra, kcal_manual, etiquetas, objetivos, ingredientes, alergenos, conservacion,
                                 personalizable, galeria)
          VALUES (${data.categoria_id}, ${data.nombre}, ${slug}, ${nul(data.descripcion)}, ${data.precio},
                  ${data.precio_oferta}, ${data.disponible}, ${data.destacado}, ${data.orden}, ${data.imagen_url},
                  ${data.imagen_public_id}, ${data.porcion_g}, ${data.proteinas}, ${data.carbohidratos},
                  ${data.grasas}, ${data.fibra}, ${data.kcal_manual}, ${etiquetas}, ${data.objetivos},
                  ${nul(data.ingredientes)}, ${nul(data.alergenos)}, ${nul(data.conservacion)},
                  ${data.personalizable}, ${galeria}::jsonb)
        `;
        await logActivity(user, "crear", "Platillos", `${data.nombre} (${money(data.precio)})`);
      }
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
    return { ok: true };
  });

export const togglePlatillo = createServerFn({ method: "POST" })
  .validator(validate(z.object({ id: z.number().int().positive(), disponible: z.boolean() })))
  .handler(async ({ data }) => {
    const user = await requireModule("platillos");
    const rows = await db()`
      UPDATE platillos SET disponible = ${data.disponible} WHERE id = ${data.id} RETURNING nombre
    `;
    await logActivity(
      user,
      "editar",
      "Platillos",
      `${String(rows[0]?.["nombre"] ?? "")} ${data.disponible ? "disponible" : "no disponible"}`,
    );
    return { ok: true };
  });

export const deletePlatillo = createServerFn({ method: "POST" })
  .validator(validate(z.object({ id: z.number().int().positive() })))
  .handler(async ({ data }) => {
    const user = await requireModule("platillos");
    const rows = await db()`
      DELETE FROM platillos WHERE id = ${data.id} RETURNING nombre, imagen_public_id, galeria
    `;
    const r = rows[0];
    await destroyImage(r?.["imagen_public_id"] as string | null | undefined);
    for (const g of (r?.["galeria"] as ImagenGaleria[] | undefined) ?? [])
      await destroyImage(g.public_id);
    await logActivity(user, "eliminar", "Platillos", String(r?.["nombre"] ?? ""));
    return { ok: true };
  });
