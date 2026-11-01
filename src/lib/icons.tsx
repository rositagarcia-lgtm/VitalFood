import {
  Apple,
  Award,
  BadgeCheck,
  CalendarDays,
  CalendarHeart,
  ChartPie,
  ChefHat,
  ClockCheck,
  Dumbbell,
  Eye,
  GraduationCap,
  HandHeart,
  Heart,
  Leaf,
  MapPin,
  MessageCircleHeart,
  Recycle,
  Rocket,
  Salad,
  ShieldCheck,
  Smile,
  Snowflake,
  Sparkles,
  Sprout,
  Star,
  Store,
  Target,
  Truck,
  Users,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode, SVGProps } from "react";

/** Íconos que se pueden elegir desde el panel para valores, garantías e hitos. */
export const ICONOS: Record<string, { icon: LucideIcon; nombre: string }> = {
  leaf: { icon: Leaf, nombre: "Hoja" },
  heart: { icon: Heart, nombre: "Corazón" },
  users: { icon: Users, nombre: "Personas" },
  sparkles: { icon: Sparkles, nombre: "Brillo" },
  recycle: { icon: Recycle, nombre: "Reciclaje" },
  sprout: { icon: Sprout, nombre: "Brote" },
  store: { icon: Store, nombre: "Tienda" },
  school: { icon: GraduationCap, nombre: "Estudiantes" },
  calendar: { icon: CalendarDays, nombre: "Calendario" },
  "calendar-heart": { icon: CalendarHeart, nombre: "Aniversario" },
  "clock-check": { icon: ClockCheck, nombre: "A tiempo" },
  shield: { icon: ShieldCheck, nombre: "Seguridad" },
  chart: { icon: ChartPie, nombre: "Nutrición" },
  snow: { icon: Snowflake, nombre: "Refrigerado" },
  message: { icon: MessageCircleHeart, nombre: "Mensajes" },
  target: { icon: Target, nombre: "Objetivo" },
  eye: { icon: Eye, nombre: "Visión" },
  star: { icon: Star, nombre: "Estrella" },
  pin: { icon: MapPin, nombre: "Ubicación" },
  chef: { icon: ChefHat, nombre: "Cocina" },
  truck: { icon: Truck, nombre: "Delivery" },
  award: { icon: Award, nombre: "Premio" },
  badge: { icon: BadgeCheck, nombre: "Certificado" },
  hand: { icon: HandHeart, nombre: "Cuidado" },
  salad: { icon: Salad, nombre: "Ensalada" },
  apple: { icon: Apple, nombre: "Fruta" },
  wheat: { icon: Wheat, nombre: "Cereal" },
  dumbbell: { icon: Dumbbell, nombre: "Deporte" },
  zap: { icon: Zap, nombre: "Energía" },
  smile: { icon: Smile, nombre: "Sonrisa" },
  rocket: { icon: Rocket, nombre: "Lanzamiento" },
};

/** Ícono envuelto en <i> para que tome el tamaño de la fuente, como en el diseño aprobado. */
export function Ico({
  icon: Icon,
  className,
}: {
  icon: LucideIcon | ((p: SVGProps<SVGSVGElement>) => ReactNode);
  className?: string;
}) {
  return (
    <i className={className ? `ico ${className}` : "ico"} aria-hidden="true">
      <Icon />
    </i>
  );
}

export function NamedIco({ name }: { name: string }) {
  return <Ico icon={(ICONOS[name] ?? ICONOS["leaf"]!).icon} />;
}

// Logos de redes sociales (lucide no incluye WhatsApp ni TikTok)
const svg = (d: string) =>
  function Brand(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d={d} />
      </svg>
    );
  };

export const WhatsAppIcon = svg(
  "M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.44 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.3l5.68-1.49a11.33 11.33 0 0 0 5.43 1.38h.01c6.26 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.04",
);
export const InstagramIcon = svg(
  "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88",
);
export const FacebookIcon = svg(
  "M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07",
);
export const TikTokIcon = svg(
  "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07",
);
