/** Enlace de WhatsApp con mensaje opcional. El número se guarda solo con dígitos (p. ej. 51987654321). */
export function waLink(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${numero.replace(/\D/g, "")}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

/** 51987654321 → +51 987 654 321 */
export function formatPhone(numero: string): string {
  const d = numero.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("51"))
    return `+51 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return `+${d}`;
}

/** Mapa embebido de Google a partir de la dirección (no requiere clave de API). */
export function mapEmbed(direccion: string, ciudad: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${direccion}, ${ciudad}`)}&z=16&output=embed`;
}
