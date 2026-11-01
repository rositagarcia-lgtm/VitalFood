import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { validate } from "@/server/validation";
import type { Bloque, Empresa, Opcion, Platillo, Promocion, Sede } from "@/lib/types";

type Sql = ReturnType<typeof db>;

// Campos públicos de un platillo (sin datos internos como el id de la imagen en la nube)
const PLATILLO = `
  p.id, p.categoria_id, c.nombre AS categoria, p.nombre, p.slug, p.descripcion,
  p.precio::float8 AS precio, p.precio_oferta::float8 AS precio_oferta,
  p.imagen_url, NULL AS imagen_public_id, p.disponible, p.destacado, p.orden,
  p.precio_actualizado_at::text,
  (p.precio_actualizado_at > p.created_at + interval '1 minute'
    AND p.precio_actualizado_at > CURRENT_TIMESTAMP - interval '7 days') AS precio_reciente,
  p.porcion_g, p.proteinas::float8 AS proteinas, p.carbohidratos::float8 AS carbohidratos,
  p.grasas::float8 AS grasas, p.fibra::float8 AS fibra, p.kcal_manual, p.etiquetas, p.objetivos,
  p.ingredientes, p.alergenos, p.conservacion, p.personalizable, p.galeria`;

const platillos = (sql: Sql, where = "TRUE") =>
  sql.query(
    `SELECT ${PLATILLO} FROM platillos p JOIN categorias c ON c.id = p.categoria_id
     WHERE p.disponible AND c.activo AND (${where}) ORDER BY c.orden, p.orden, p.nombre`,
  ) as unknown as Promise<Platillo[]>;

const EMPRESA = `nombre, eslogan, ciudad, anio_fundacion, clientes_mes, equipo, intro_titulo, intro_texto,
  historia_titulo, historia_texto, mision, vision, imagen_url, NULL AS imagen_public_id, whatsapp, telefono,
  email, horario, instagram, facebook, tiktok, resenas_url, reclamaciones_url`;

async function empresa(sql: Sql): Promise<Empresa> {
  const rows = await sql.query(`SELECT ${EMPRESA} FROM empresa WHERE id = 1`);
  return rows[0] as Empresa;
}

const sedes = (sql: Sql) =>
  sql`SELECT id, nombre, direccion, horario, referencia, mapa_url, orden, activo
      FROM sedes WHERE activo ORDER BY orden, nombre` as unknown as Promise<Sede[]>;

export type Cifras = {
  anios: number | null;
  clientes: number | null;
  equipo: number | null;
  sedes: number;
  platillos: number;
};

function cifras(e: Empresa, totalSedes: number, totalPlatillos: number): Cifras {
  const anios = e.anio_fundacion ? Math.max(0, new Date().getFullYear() - e.anio_fundacion) : null;
  return {
    anios: anios || null,
    clientes: e.clientes_mes,
    equipo: e.equipo,
    sedes: totalSedes,
    platillos: totalPlatillos,
  };
}

/** Datos que usan todas las páginas públicas: encabezado, pie de página y botón de WhatsApp. */
export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = db();
  const [e, s] = await Promise.all([empresa(sql), sedes(sql)]);
  return { empresa: e, sedes: s.map((x) => ({ id: x.id, nombre: x.nombre })) };
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = db();
  const [lista, s, promociones, e] = await Promise.all([
    platillos(sql),
    sedes(sql),
    sql`SELECT id, etiqueta, titulo, descripcion, descripcion_secundaria, sticker, texto_boton,
               enlace_boton, imagen_url, imagen_public_id, variante, caracteristicas, orden, activo
        FROM promociones WHERE activo ORDER BY orden, id` as unknown as Promise<Promocion[]>,
    empresa(sql),
  ]);
  const marcados = lista.filter((p) => p.destacado);
  // Si nadie marcó destacados, la portada muestra los primeros del menú
  const destacados = (marcados.length ? marcados : lista).slice(0, 3);
  return {
    destacados,
    sedes: s,
    promociones,
    empresa: e,
    cifras: cifras(e, s.length, lista.length),
  };
});

export const getMenuData = createServerFn({ method: "GET" }).handler(async () => {
  const lista = await platillos(db());
  const categorias: string[] = [];
  for (const p of lista) if (!categorias.includes(p.categoria)) categorias.push(p.categoria);
  const etiquetas = [...new Set(lista.flatMap((p) => p.etiquetas))].sort();
  const actualizado = lista.reduce<string | null>(
    (max, p) => (max === null || p.precio_actualizado_at > max ? p.precio_actualizado_at : max),
    null,
  );
  return { platillos: lista, categorias, etiquetas, actualizado };
});

const OPCIONES = `id, grupo, nombre, detalle, precio_extra::float8 AS precio_extra, proteinas::float8 AS proteinas,
  carbohidratos::float8 AS carbohidratos, grasas::float8 AS grasas, fibra::float8 AS fibra,
  factor::float8 AS factor, orden, activo`;

export const getPlatoData = createServerFn({ method: "GET" })
  .validator(validate(z.object({ slug: z.string().min(1).max(120) })))
  .handler(async ({ data }) => {
    const sql = db();
    const [lista, opciones] = await Promise.all([
      platillos(sql),
      sql.query(
        `SELECT ${OPCIONES} FROM opciones WHERE activo ORDER BY grupo, orden, id`,
      ) as unknown as Promise<Opcion[]>,
    ]);
    const plato = lista.find((p) => p.slug === data.slug);
    if (!plato) return null;
    const relacionados = [
      ...lista.filter((p) => p.id !== plato.id && p.categoria_id === plato.categoria_id),
      ...lista.filter((p) => p.id !== plato.id && p.categoria_id !== plato.categoria_id),
    ].slice(0, 8);
    return { plato, opciones: plato.personalizable ? opciones : [], relacionados };
  });

export const getNosotrosData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = db();
  const [e, s, bloques, total] = await Promise.all([
    empresa(sql),
    sedes(sql),
    sql`SELECT id, tipo, titulo, texto, icono, anio, autor, detalle, estrellas, orden, activo
        FROM bloques WHERE activo ORDER BY orden, id` as unknown as Promise<Bloque[]>,
    sql`SELECT count(*)::int AS n,
               (array_agg(imagen_url ORDER BY destacado DESC, orden) FILTER (WHERE imagen_url IS NOT NULL))[1] AS foto
        FROM platillos WHERE disponible`,
  ]);
  const foto = (total[0]?.["foto"] as string | null | undefined) ?? null;
  return {
    empresa: e,
    bloques,
    sedes: s,
    foto,
    cifras: cifras(e, s.length, Number(total[0]?.["n"] ?? 0)),
  };
});
