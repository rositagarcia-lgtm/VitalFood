export type Rol = "admin" | "editor";

export type Modulo = "platillos" | "categorias" | "sedes" | "promociones" | "empresa";

export type SessionUser = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  permisos: Modulo[];
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  total_platillos: number;
};

export type Platillo = {
  id: number;
  categoria_id: number;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  imagen_public_id: string | null;
  disponible: boolean;
  orden: number;
  precio_oferta: number | null;
  destacado: boolean;
  precio_actualizado_at: string;
  /** El precio cambió en los últimos 7 días (calculado en la base de datos). */
  precio_reciente: boolean;
  slug: string;
  porcion_g: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  fibra: number | null;
  kcal_manual: number | null;
  etiquetas: string[];
  objetivos: string[];
  ingredientes: string | null;
  alergenos: string | null;
  conservacion: string | null;
  personalizable: boolean;
  galeria: ImagenGaleria[];
};

export type ImagenGaleria = { url: string; public_id: string | null };

export type Opcion = {
  id: number;
  grupo: "tamano" | "proteina" | "base" | "extra";
  nombre: string;
  detalle: string | null;
  precio_extra: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  factor: number;
  orden: number;
  activo: boolean;
};

export type Empresa = {
  nombre: string;
  eslogan: string;
  ciudad: string;
  anio_fundacion: number | null;
  clientes_mes: number | null;
  equipo: number | null;
  intro_titulo: string | null;
  intro_texto: string | null;
  historia_titulo: string | null;
  historia_texto: string | null;
  mision: string | null;
  vision: string | null;
  imagen_url: string | null;
  imagen_public_id: string | null;
  whatsapp: string | null;
  telefono: string | null;
  email: string | null;
  horario: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  resenas_url: string | null;
  reclamaciones_url: string | null;
};

export type TipoBloque = "valor" | "garantia" | "hito" | "opinion";

export type Bloque = {
  id: number;
  tipo: TipoBloque;
  titulo: string;
  texto: string;
  icono: string;
  anio: number | null;
  autor: string | null;
  detalle: string | null;
  estrellas: number | null;
  orden: number;
  activo: boolean;
};

export type Sede = {
  id: number;
  nombre: string;
  direccion: string;
  horario: string;
  referencia: string | null;
  mapa_url: string | null;
  orden: number;
  activo: boolean;
};

export type Variante = "launch" | "practicality" | "organization";

export type Promocion = {
  id: number;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  descripcion_secundaria: string | null;
  sticker: string | null;
  texto_boton: string;
  enlace_boton: string;
  imagen_url: string | null;
  imagen_public_id: string | null;
  variante: Variante;
  caracteristicas: string[];
  orden: number;
  activo: boolean;
};

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  permisos: Modulo[];
  totp_activo: boolean;
  bloqueado: boolean;
  ultimo_acceso: string | null;
  created_at: string;
};

export type Actividad = {
  id: number;
  usuario: string;
  accion: "crear" | "editar" | "eliminar" | "seguridad";
  modulo: string;
  detalle: string;
  created_at: string;
};
