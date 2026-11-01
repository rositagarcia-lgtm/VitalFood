import type { Modulo, SessionUser } from "./types";

/** Módulos del panel que se pueden asignar a un editor, con nombres en lenguaje simple. */
export const MODULOS: { id: Modulo; nombre: string; descripcion: string }[] = [
  { id: "platillos", nombre: "Platillos", descripcion: "Precios, fotos, ofertas y disponibilidad" },
  { id: "categorias", nombre: "Categorías", descripcion: "Secciones del menú" },
  { id: "sedes", nombre: "Sedes", descripcion: "Direcciones y horarios" },
  { id: "promociones", nombre: "Promociones", descripcion: "Banners de la portada" },
  {
    id: "empresa",
    nombre: "Empresa y Nosotros",
    descripcion: "Datos de contacto, redes, misión y visión",
  },
];

export function canAccess(user: Pick<SessionUser, "rol" | "permisos">, modulo: Modulo): boolean {
  return user.rol === "admin" || user.permisos.includes(modulo);
}
