import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarHeart,
  MapPin,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Ico } from "@/lib/icons";
import type { Cifras } from "@/functions/public";

type Orb = {
  key: string;
  icon: LucideIcon;
  value: number;
  prefix?: string;
  title: string;
  text: string;
  link?: { label: string; to: "/" | "/menu" | "/nosotros"; hash?: string };
};

/** Arma los círculos con las cifras que el administrador completó; las vacías no se muestran. */
export function buildOrbs(
  c: Cifras,
  orden: string[],
  ciudad: string,
  fundacion: number | null,
  sedes: string[],
): Orb[] {
  const all: Record<string, Orb | null> = {
    anios: c.anios
      ? {
          key: "anios",
          icon: CalendarHeart,
          value: c.anios,
          prefix: "+",
          title: c.anios === 1 ? "Año de trayectoria" : "Años de trayectoria",
          text: `Cocinando saludable en ${ciudad} desde ${fundacion}.`,
          link: { label: "Saber más", to: "/nosotros" },
        }
      : null,
    clientes: c.clientes
      ? {
          key: "clientes",
          icon: Users,
          value: c.clientes,
          prefix: "+",
          title: "Clientes felices",
          text: "Personas que comen con nosotros cada mes.",
          link: { label: "Saber más", to: "/nosotros" },
        }
      : null,
    equipo: c.equipo
      ? {
          key: "equipo",
          icon: Users,
          value: c.equipo,
          prefix: "+",
          title: "Personas en el equipo",
          text: "Cocina, nutrición y atención al cliente.",
        }
      : null,
    sedes: c.sedes
      ? {
          key: "sedes",
          icon: MapPin,
          value: c.sedes,
          title: c.sedes === 1 ? "Sede cerca de ti" : "Sedes cerca de ti",
          text: listar(sedes) + ".",
          link: { label: "Ver sedes", to: "/", hash: "sedes" },
        }
      : null,
    platillos: c.platillos
      ? {
          key: "platillos",
          icon: UtensilsCrossed,
          value: c.platillos,
          title: "Platos en el menú",
          text: "Opciones frescas para cada momento del día.",
          link: { label: "Ver menú", to: "/menu" },
        }
      : null,
  };
  return orden
    .map((k) => all[k])
    .filter((o): o is Orb => Boolean(o))
    .slice(0, 3);
}

function listar(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function formatear(n: number) {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toLocaleString("es-PE", { maximumFractionDigits: k < 10 ? 1 : 0 })}k`;
  }
  return Math.round(n).toLocaleString("es-PE");
}

/** Número que sube desde 0 cuando el bloque entra en pantalla. */
function Counter({
  to,
  start,
  prefix = "",
}: {
  to: number;
  start: boolean;
  prefix?: string | undefined;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 1600);
      setN(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to]);
  return (
    <b>
      {prefix}
      {formatear(n)}
    </b>
  );
}

export function Stats({ orbs }: { orbs: Orb[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setVisible(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!orbs.length) return null;

  // En celular los círculos se deslizan; los puntos indican cuál se está viendo
  const onScroll = () => {
    const r = row.current;
    if (!r) return;
    const center = r.scrollLeft + r.clientWidth / 2;
    const items = [...r.children] as HTMLElement[];
    let best = 0;
    items.forEach((el, i) => {
      const d = (x: HTMLElement) => Math.abs(x.offsetLeft + x.offsetWidth / 2 - center);
      if (d(el) < d(items[best]!)) best = i;
    });
    setActive(best);
  };

  return (
    <div ref={ref} className={visible ? "circles stats in" : "circles stats"}>
      <div ref={row} className="wrap crow" onScroll={onScroll}>
        {orbs.map((o) => (
          <div className="orb" key={o.key}>
            <span className="ibadge">
              <Ico icon={o.icon} />
            </span>
            <Counter to={o.value} start={visible} prefix={o.prefix} />
            <h3>{o.title}</h3>
            <p>{o.text}</p>
            {o.link && (
              <Link to={o.link.to} {...(o.link.hash ? { hash: o.link.hash } : {})}>
                {o.link.label} <Ico icon={ArrowRight} />
              </Link>
            )}
          </div>
        ))}
      </div>
      {orbs.length > 1 && (
        <div className="swipe-dots" aria-hidden="true">
          {orbs.map((o, i) => (
            <span key={o.key} className={i === active ? "on" : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
