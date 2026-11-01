import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChartPie, ChevronRight, Salad } from "lucide-react";
import { Ico } from "@/lib/icons";
import { formatPrice, imageSrcSet, optimizedImage } from "@/lib/images";
import { platoKcal } from "@/lib/nutrition";
import type { Platillo } from "@/lib/types";

export function descuento(p: Pick<Platillo, "precio" | "precio_oferta">): number | null {
  if (p.precio_oferta === null || p.precio_oferta >= p.precio || p.precio <= 0) return null;
  return Math.round((1 - p.precio_oferta / p.precio) * 100);
}

export const precioFinal = (p: Pick<Platillo, "precio" | "precio_oferta">) =>
  p.precio_oferta ?? p.precio;

export function Picture({
  url,
  alt,
  width,
  sizes,
  className,
  eager = false,
}: {
  url: string | null | undefined;
  alt: string;
  width: number;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  if (!url)
    return (
      <span className="noimg" role="img" aria-label={alt}>
        <Ico icon={Salad} />
      </span>
    );
  return (
    <img
      src={optimizedImage(url, width)}
      srcSet={imageSrcSet(url, [width / 2, width, width * 1.5].map(Math.round))}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export type Crumb = {
  label: string;
  to?: "/" | "/menu" | "/nosotros";
  search?: { categoria: string };
};

export function Crumbs({ items, pad = false }: { items: Crumb[]; pad?: boolean }) {
  return (
    <nav aria-label="Ruta de navegación" className={pad ? "crumbs pad" : "crumbs"}>
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={c.label + i}>
            {last || !c.to ? (
              <b aria-current={last ? "page" : undefined}>{c.label}</b>
            ) : (
              <Link to={c.to} {...(c.search ? { search: c.search } : {})}>
                {c.label}
              </Link>
            )}
            {!last && <Ico icon={ChevronRight} />}
          </Fragment>
        );
      })}
    </nav>
  );
}

function Precio({ p }: { p: Platillo }) {
  return p.precio_oferta !== null ? (
    <span>
      <s>{formatPrice(p.precio)}</s>
      <b>{formatPrice(p.precio_oferta)}</b>
    </span>
  ) : (
    <b>{formatPrice(p.precio)}</b>
  );
}

/** Tarjeta de la portada (destacados). */
export function DishCard({ p, delay = 0 }: { p: Platillo; delay?: number }) {
  const kcal = platoKcal(p);
  return (
    <Link
      to="/menu/$slug"
      params={{ slug: p.slug }}
      className="card reveal"
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      <div className="ph">
        <Picture
          url={p.imagen_url}
          alt={p.nombre}
          width={600}
          sizes="(max-width: 760px) 100vw, 33vw"
        />
        {p.precio_oferta !== null && <span className="ptag">Oferta</span>}
        <span className="peek">
          <span>
            <Ico icon={ChartPie} /> Ver detalle y nutrición
          </span>
          <Ico icon={ArrowUpRight} />
        </span>
      </div>
      <div className="body">
        <small>{p.categoria}</small>
        <h3>{p.nombre}</h3>
        {p.descripcion && <p>{p.descripcion}</p>}
        {(kcal !== null || p.proteinas !== null || p.etiquetas.length > 0) && (
          <div className="macros">
            {kcal !== null && <span>{kcal} kcal</span>}
            {p.proteinas !== null && <span>{Math.round(p.proteinas)} g proteína</span>}
            {p.etiquetas[0] && <span>{p.etiquetas[0]}</span>}
          </div>
        )}
        <div className="price">
          <span className="more">
            Ver detalle <Ico icon={ArrowRight} />
          </span>
          <Precio p={p} />
        </div>
      </div>
    </Link>
  );
}

/** Tarjeta del menú, al estilo de una tienda: foto grande y datos debajo. */
export function ProductCard({ p, index }: { p: Platillo; index: number }) {
  const kcal = platoKcal(p);
  const off = descuento(p);
  const sub = [
    p.categoria,
    kcal !== null ? `${kcal} kcal` : null,
    p.proteinas !== null ? `${Math.round(p.proteinas)} g proteína` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const extra = p.galeria[0]?.url;
  return (
    <Link
      to="/menu/$slug"
      params={{ slug: p.slug }}
      className="prod"
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <div className="ph">
        <Picture
          url={p.imagen_url}
          alt={p.nombre}
          width={500}
          sizes="(max-width: 760px) 50vw, 25vw"
        />
        {p.imagen_url && (
          <Picture
            url={extra ?? p.imagen_url}
            alt=""
            width={500}
            sizes="(max-width: 760px) 50vw, 25vw"
            className="alt"
          />
        )}
        {off !== null && <span className="pbadge">-{off}%</span>}
      </div>
      <div className="meta">
        <p className="kicker">
          {p.personalizable
            ? "Personalizable"
            : off !== null
              ? "Oferta"
              : p.destacado
                ? "Destacado"
                : ""}
        </p>
        <h3>{p.nombre}</h3>
        <p className="sub">{sub}</p>
        {p.etiquetas.length > 0 && (
          <div className="chips">
            {p.etiquetas.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
        <p className="price">
          {formatPrice(precioFinal(p))}
          {p.precio_oferta !== null && <s>{formatPrice(p.precio)}</s>}
        </p>
        {off !== null && <p className="off">{off}% de descuento</p>}
      </div>
    </Link>
  );
}

/** Tarjeta pequeña del carrusel "También te puede interesar". */
export function RelatedCard({ p }: { p: Platillo }) {
  const kcal = platoKcal(p);
  const off = descuento(p);
  return (
    <Link to="/menu/$slug" params={{ slug: p.slug }} className="rc">
      <div className="ph">
        <Picture
          url={p.imagen_url}
          alt={p.nombre}
          width={400}
          sizes="(max-width: 760px) 70vw, 25vw"
        />
      </div>
      <p>{off !== null ? `-${off}% de descuento` : p.personalizable ? "Personalizable" : " "}</p>
      <h3>{p.nombre}</h3>
      <span>
        {[p.categoria, kcal !== null ? `${kcal} kcal` : null].filter(Boolean).join(" · ")}
      </span>
      <b>{formatPrice(precioFinal(p))}</b>
    </Link>
  );
}
