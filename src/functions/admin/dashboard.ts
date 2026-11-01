import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { isCloudinaryConfigured } from "@/server/cloudinary";
import { requireUser } from "@/server/session";
import { canAccess } from "@/lib/permissions";
import type { Actividad } from "@/lib/types";

export type Alerta = { nivel: "media" | "baja"; titulo: string; detalle: string; to: string };

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const sql = db();

  const [totales, sinImagen, categoriasVacias, noDisponibles, recientes, contenido] =
    await Promise.all([
      sql`
      SELECT
        (SELECT count(*)::int FROM platillos) AS platillos,
        (SELECT count(*)::int FROM platillos WHERE disponible) AS disponibles,
        (SELECT count(*)::int FROM platillos WHERE precio_oferta IS NOT NULL AND disponible) AS ofertas,
        (SELECT count(*)::int FROM categorias WHERE activo) AS categorias,
        (SELECT count(*)::int FROM sedes WHERE activo) AS sedes,
        (SELECT count(*)::int FROM promociones WHERE activo) AS promociones
    `,
      sql`SELECT nombre FROM platillos WHERE imagen_url IS NULL ORDER BY nombre`,
      sql`
      SELECT c.nombre FROM categorias c
      WHERE c.activo AND NOT EXISTS (SELECT 1 FROM platillos p WHERE p.categoria_id = c.id)
      ORDER BY c.nombre
    `,
      sql`SELECT nombre FROM platillos WHERE NOT disponible ORDER BY nombre`,
      sql`
      SELECT id::int, usuario, accion, modulo, detalle, created_at::text
      FROM actividad ORDER BY created_at DESC LIMIT 6
    `,
      sql`
      SELECT
        (SELECT count(*)::int FROM platillos
          WHERE disponible AND kcal_manual IS NULL
            AND (proteinas IS NULL OR carbohidratos IS NULL OR grasas IS NULL)) AS sin_nutricion,
        (SELECT count(*)::int FROM platillos WHERE disponible AND personalizable) AS personalizables,
        (SELECT count(*)::int FROM opciones WHERE activo) AS opciones,
        (SELECT whatsapp IS NULL FROM empresa WHERE id = 1) AS sin_whatsapp
    `,
    ]);
  const c = contenido[0] ?? {};

  const alertas: Alerta[] = [];
  if (canAccess(user, "platillos")) {
    for (const row of sinImagen) {
      alertas.push({
        nivel: "media",
        titulo: String(row["nombre"]),
        detalle: "Platillo sin foto",
        to: "/admin/platillos",
      });
    }
    for (const row of noDisponibles) {
      alertas.push({
        nivel: "baja",
        titulo: String(row["nombre"]),
        detalle: "Oculto en la web porque no está disponible",
        to: "/admin/platillos",
      });
    }
  }
  if (canAccess(user, "platillos")) {
    const n = Number(c["sin_nutricion"] ?? 0);
    if (n > 0) {
      alertas.push({
        nivel: "media",
        titulo: n === 1 ? "1 platillo sin calorías" : `${n} platillos sin calorías`,
        detalle: "Completa proteínas, carbohidratos y grasas para mostrar su nutrición",
        to: "/admin/platillos",
      });
    }
    if (Number(c["personalizables"] ?? 0) > 0 && Number(c["opciones"] ?? 0) === 0) {
      alertas.push({
        nivel: "media",
        titulo: "Opciones para personalizar",
        detalle: "Hay platillos personalizables pero aún no hay opciones",
        to: "/admin/opciones",
      });
    }
  }
  if (canAccess(user, "empresa") && c["sin_whatsapp"] === true) {
    alertas.push({
      nivel: "media",
      titulo: "WhatsApp de pedidos",
      detalle: "Agrégalo para activar el botón “Pedir por WhatsApp”",
      to: "/admin/empresa",
    });
  }
  if (canAccess(user, "categorias")) {
    for (const row of categoriasVacias) {
      alertas.push({
        nivel: "baja",
        titulo: String(row["nombre"]),
        detalle: "Categoría sin platillos",
        to: "/admin/categorias",
      });
    }
  }
  if (user.rol === "admin" && !isCloudinaryConfigured()) {
    alertas.unshift({
      nivel: "media",
      titulo: "Subida de fotos",
      detalle: "Falta configurar el servicio de imágenes",
      to: "/admin",
    });
  }

  const t = totales[0] ?? {};
  return {
    totales: {
      platillos: Number(t["platillos"] ?? 0),
      disponibles: Number(t["disponibles"] ?? 0),
      ofertas: Number(t["ofertas"] ?? 0),
      categorias: Number(t["categorias"] ?? 0),
      sedes: Number(t["sedes"] ?? 0),
      promociones: Number(t["promociones"] ?? 0),
    },
    alertas,
    recientes: recientes as Actividad[],
  };
});
