import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, dbErrorMessage } from "@/server/db";
import { requireModule } from "@/server/session";
import { validate } from "@/server/validation";
import { logActivity } from "@/server/activity";
import type { Opcion } from "@/lib/types";

const macro = z.number({ message: "Ingresa un número (puede ser negativo)." }).min(-500).max(500);

const opcionSchema = z.object({
  id: z.number().int().positive().optional(),
  grupo: z.enum(["tamano", "proteina", "base", "extra"]),
  nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(80),
  detalle: z.string().trim().max(80).nullable(),
  precio_extra: z
    .number({ message: "Ingresa un precio válido." })
    .min(0, "El precio no puede ser negativo.")
    .max(999),
  proteinas: macro,
  carbohidratos: macro,
  grasas: macro,
  fibra: macro,
  factor: z
    .number({ message: "Ingresa un factor válido." })
    .min(0.3, "El factor mínimo es 0.3.")
    .max(3, "El factor máximo es 3."),
  orden: z.number().int().min(0).max(999),
  activo: z.boolean(),
});

export type OpcionInput = z.infer<typeof opcionSchema>;

export const listOpciones = createServerFn({ method: "GET" }).handler(async () => {
  await requireModule("platillos");
  const rows = await db()`
    SELECT id, grupo, nombre, detalle, precio_extra::float8 AS precio_extra, proteinas::float8 AS proteinas,
           carbohidratos::float8 AS carbohidratos, grasas::float8 AS grasas, fibra::float8 AS fibra,
           factor::float8 AS factor, orden, activo
    FROM opciones ORDER BY grupo, orden, id
  `;
  return rows as Opcion[];
});

export const saveOpcion = createServerFn({ method: "POST" })
  .validator(validate(opcionSchema))
  .handler(async ({ data }) => {
    const user = await requireModule("platillos");
    // El factor solo aplica a los tamaños; las demás opciones suman o restan macronutrientes
    const factor = data.grupo === "tamano" ? data.factor : 1;
    const m =
      data.grupo === "tamano"
        ? { p: 0, c: 0, g: 0, f: 0 }
        : { p: data.proteinas, c: data.carbohidratos, g: data.grasas, f: data.fibra };
    const detalle = data.detalle || null;
    try {
      if (data.id) {
        await db()`
          UPDATE opciones SET grupo = ${data.grupo}, nombre = ${data.nombre}, detalle = ${detalle},
            precio_extra = ${data.precio_extra}, proteinas = ${m.p}, carbohidratos = ${m.c}, grasas = ${m.g},
            fibra = ${m.f}, factor = ${factor}, orden = ${data.orden}, activo = ${data.activo}
          WHERE id = ${data.id}
        `;
      } else {
        await db()`
          INSERT INTO opciones (grupo, nombre, detalle, precio_extra, proteinas, carbohidratos, grasas, fibra, factor, orden, activo)
          VALUES (${data.grupo}, ${data.nombre}, ${detalle}, ${data.precio_extra}, ${m.p}, ${m.c}, ${m.g}, ${m.f},
                  ${factor}, ${data.orden}, ${data.activo})
        `;
      }
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
    await logActivity(user, data.id ? "editar" : "crear", "Opciones del menú", data.nombre);
    return { ok: true };
  });

export const deleteOpcion = createServerFn({ method: "POST" })
  .validator(validate(z.object({ id: z.number().int().positive() })))
  .handler(async ({ data }) => {
    const user = await requireModule("platillos");
    const rows = await db()`DELETE FROM opciones WHERE id = ${data.id} RETURNING nombre`;
    await logActivity(user, "eliminar", "Opciones del menú", String(rows[0]?.["nombre"] ?? ""));
    return { ok: true };
  });
