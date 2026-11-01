import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, dbErrorMessage } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { validate } from "@/server/validation";
import { logActivity } from "@/server/activity";
import { assertAllowedEmail } from "@/server/email-policy";
import type { Actividad, Usuario } from "@/lib/types";

const MODULOS = ["platillos", "categorias", "sedes", "promociones", "empresa"] as const;

const usuarioSchema = z.object({
  id: z.number().int().positive().optional(),
  nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(100),
  email: z.string().trim().toLowerCase().email("Ingresa un correo válido.").max(150),
  rol: z.enum(["admin", "editor"]),
  activo: z.boolean(),
  permisos: z.array(z.enum(MODULOS)),
  // Obligatoria al crear; al editar, vacía significa "no cambiar"
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 10, "La contraseña debe tener al menos 10 caracteres."),
});

export type UsuarioInput = z.infer<typeof usuarioSchema>;

const idSchema = validate(z.object({ id: z.number().int().positive() }));

export const listUsuarios = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const rows = await db()`
    SELECT id, nombre, email, rol, activo, permisos, totp_activo,
           COALESCE(bloqueado_hasta > CURRENT_TIMESTAMP, FALSE) AS bloqueado,
           ultimo_acceso::text, created_at::text
    FROM usuarios ORDER BY nombre
  `;
  return rows as Usuario[];
});

export const saveUsuario = createServerFn({ method: "POST" })
  .validator(validate(usuarioSchema))
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const sql = db();

    if (data.id === me.id && (!data.activo || data.rol !== "admin")) {
      throw new Error("No puedes desactivarte ni quitarte el rol de administrador.");
    }
    if (!data.id && !data.password) throw new Error("Define una contraseña para el nuevo usuario.");
    if (data.rol === "editor" && data.permisos.length === 0) {
      throw new Error("Marca al menos una sección que el editor pueda modificar.");
    }

    // Solo se exige el dominio cuando el correo es nuevo o cambia
    const prev = data.id ? await sql`SELECT email FROM usuarios WHERE id = ${data.id}` : [];
    if (prev[0]?.["email"] !== data.email) assertAllowedEmail(data.email);

    const permisos = data.rol === "admin" ? [...MODULOS] : data.permisos;
    const hash = data.password ? await bcrypt.hash(data.password, 12) : null;
    try {
      if (data.id) {
        await sql`
          UPDATE usuarios
          SET nombre = ${data.nombre}, email = ${data.email}, rol = ${data.rol}, activo = ${data.activo},
              permisos = ${permisos}, password_hash = COALESCE(${hash}, password_hash)
          WHERE id = ${data.id}
        `;
      } else {
        await sql`
          INSERT INTO usuarios (nombre, email, rol, activo, permisos, password_hash)
          VALUES (${data.nombre}, ${data.email}, ${data.rol}, ${data.activo}, ${permisos}, ${hash})
        `;
      }
    } catch (error) {
      const message = dbErrorMessage(error);
      throw new Error(
        message.startsWith("Ya existe") ? "Ya existe un usuario con ese correo." : message,
      );
    }
    await logActivity(
      me,
      data.id ? "editar" : "crear",
      "Usuarios",
      `${data.nombre} (${data.email})`,
    );
    return { ok: true };
  });

export const deleteUsuario = createServerFn({ method: "POST" })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    if (data.id === me.id) throw new Error("No puedes eliminar tu propia cuenta.");
    const rows = await db()`DELETE FROM usuarios WHERE id = ${data.id} RETURNING nombre, email`;
    await logActivity(
      me,
      "eliminar",
      "Usuarios",
      `${String(rows[0]?.["nombre"] ?? "")} (${String(rows[0]?.["email"] ?? "")})`,
    );
    return { ok: true };
  });

/** Obliga al usuario a vincular de nuevo su app de autenticación (por ejemplo, si cambió de celular). */
export const resetUsuarioMfa = createServerFn({ method: "POST" })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const rows = await db()`
      UPDATE usuarios SET totp_activo = FALSE, totp_secreto = NULL, totp_ultimo_paso = NULL
      WHERE id = ${data.id} RETURNING nombre
    `;
    await logActivity(
      me,
      "seguridad",
      "Usuarios",
      `Restableció la verificación en dos pasos de ${String(rows[0]?.["nombre"] ?? "")}`,
    );
    return { ok: true };
  });

export const unlockUsuario = createServerFn({ method: "POST" })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const rows = await db()`
      UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ${data.id} RETURNING nombre
    `;
    await logActivity(
      me,
      "seguridad",
      "Usuarios",
      `Desbloqueó la cuenta de ${String(rows[0]?.["nombre"] ?? "")}`,
    );
    return { ok: true };
  });

export const listActividad = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const rows = await db()`
    SELECT id::int, usuario, accion, modulo, detalle, created_at::text
    FROM actividad ORDER BY created_at DESC LIMIT 200
  `;
  return rows as Actividad[];
});
