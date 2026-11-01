import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Feather,
  Leaf,
  MapPin,
  ZoomIn,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Crumbs, Picture, RelatedCard, descuento } from "@/components/site/cards";
import { getPlatoData } from "@/functions/public";
import { Ico, WhatsAppIcon } from "@/lib/icons";
import { formatPrice, optimizedImage } from "@/lib/images";
import { waLink } from "@/lib/contact";
import {
  GRUPOS,
  OBJETIVOS,
  byGroup,
  computeTotals,
  defaultSelection,
  goalSelection,
  optionKcal,
  type Objetivo,
  type Seleccion,
  type Totales,
} from "@/lib/nutrition";
import type { Opcion, Platillo } from "@/lib/types";
import { useSite } from "../_site";

export const Route = createFileRoute("/_site/menu/$slug")({
  loader: async ({ params }) => {
    const data = await getPlatoData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.plato;
    if (!p) return { meta: [{ title: "Plato no encontrado | Vital Foods" }] };
    const desc =
      p.descripcion ?? `${p.nombre} de Vital Foods, ${formatPrice(p.precio_oferta ?? p.precio)}.`;
    return {
      meta: [
        { title: `${p.nombre} | Vital Foods` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.nombre} | Vital Foods` },
        { property: "og:description", content: desc },
        ...(p.imagen_url
          ? [{ property: "og:image", content: optimizedImage(p.imagen_url, 1200) ?? p.imagen_url }]
          : []),
      ],
    };
  },
  notFoundComponent: NoEncontrado,
  component: PlatoPage,
});

function NoEncontrado() {
  return (
    <div className="wrap notfound">
      <h1>No encontramos este plato</h1>
      <p>Puede que ya no esté disponible o que el enlace haya cambiado.</p>
      <Link className="cta" to="/menu">
        Ver el menú
      </Link>
    </div>
  );
}

const GOAL_ICON: Record<Objetivo, LucideIcon> = {
  proteina: Dumbbell,
  lowcarb: Leaf,
  ligero: Feather,
  energia: Zap,
};

function PlatoPage() {
  const { plato, opciones, relacionados } = Route.useLoaderData();
  const { empresa } = useSite();
  const [sel, setSel] = useState<Seleccion>(() => defaultSelection(opciones));
  const [goal, setGoal] = useState<Objetivo | null>(null);

  // Al pasar de un plato a otro (relacionados) se reinicia la elección
  useEffect(() => {
    setSel(defaultSelection(opciones));
    setGoal(null);
  }, [plato.id, opciones]);

  const perso = plato.personalizable && opciones.length > 0;
  const t = useMemo(() => computeTotals(plato, opciones, sel), [plato, opciones, sel]);
  const off = descuento(plato);
  const elegir = (next: Seleccion) => {
    setSel(next);
    setGoal(null);
  };

  const pedido = useMemo(
    () => mensajePedido(plato, opciones, sel, t.precio, perso),
    [plato, opciones, sel, t.precio, perso],
  );
  const tamano = opciones.find((o) => o.id === sel.tamano);

  return (
    <>
      <div className="wrap">
        <Crumbs
          pad
          items={[
            { label: "Inicio", to: "/" },
            { label: "Menú", to: "/menu" },
            { label: plato.categoria, to: "/menu", search: { categoria: plato.categoria } },
            { label: plato.nombre },
          ]}
        />
        <div className="detail">
          <Galeria plato={plato} />

          <div className="info">
            <h1>{plato.nombre}</h1>
            <p className="sub">
              {plato.categoria}
              {perso ? " · Personalizable" : ""}
            </p>
            <div className="pricebox">
              <b key={t.precio} className="bump">
                {formatPrice(t.precio)}
              </b>
              {plato.precio_oferta !== null && <s>{formatPrice(plato.precio)}</s>}
              {off !== null && <span className="off">{off}% de descuento</span>}
            </div>
            {plato.etiquetas.length > 0 && (
              <div className="tags">
                {plato.etiquetas.map((e) => (
                  <span key={e}>{e}</span>
                ))}
              </div>
            )}
            {plato.descripcion && <p className="desc">{plato.descripcion}</p>}

            {perso && (
              <div>
                <Metas
                  opciones={opciones}
                  goal={goal}
                  onGoal={(g) => {
                    setSel(goalSelection(g, opciones, sel));
                    setGoal(g);
                  }}
                />
                {GRUPOS.filter((g) => g.id !== "extra").map((g) => {
                  const list = byGroup(opciones, g.id);
                  if (!list.length) return null;
                  return (
                    <div className="pblock" key={g.id}>
                      <h2>{g.nombre}</h2>
                      <div className="choices" role="radiogroup" aria-label={g.nombre}>
                        {list.map((o) => {
                          const on = sel[g.id as "tamano" | "proteina" | "base"] === o.id;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              className={on ? "choice on" : "choice"}
                              onClick={() => elegir({ ...sel, [g.id]: o.id })}
                            >
                              <b>{o.nombre}</b>
                              <span>{detalleOpcion(o)}</span>
                              {o.precio_extra > 0 && <em>+ {formatPrice(o.precio_extra)}</em>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {byGroup(opciones, "extra").length > 0 && (
                  <div className="pblock">
                    <h2>
                      Extras <small>Opcional</small>
                    </h2>
                    <div className="extras">
                      {byGroup(opciones, "extra").map((o) => (
                        <label key={o.id}>
                          <span>
                            <input
                              type="checkbox"
                              checked={sel.extras.includes(o.id)}
                              onChange={(e) =>
                                elegir({
                                  ...sel,
                                  extras: e.target.checked
                                    ? [...sel.extras, o.id]
                                    : sel.extras.filter((x) => x !== o.id),
                                })
                              }
                            />
                            {o.nombre}
                            {o.detalle ? <small> · {o.detalle}</small> : null}
                          </span>
                          <small>
                            {o.precio_extra ? `+ ${formatPrice(o.precio_extra)}` : "Gratis"}
                          </small>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pblock">
              <h2>
                Valores nutricionales{" "}
                <small>
                  {t.porcion ? `Porción de ${t.porcion} g` : "Por porción"}
                  {perso && tamano ? ` · ${tamano.nombre}` : ""}
                </small>
              </h2>
              {t.kcal !== null ? (
                <>
                  <Nutricion t={t} />
                  <p className="ref">
                    Valores referenciales por porción{perso ? ", calculados según tu elección" : ""}
                    . Pueden variar ligeramente según la preparación.
                  </p>
                </>
              ) : (
                <p className="nodata">
                  Estamos completando la información nutricional de este plato.
                </p>
              )}
            </div>

            <div className="buy">
              {empresa.whatsapp ? (
                <a
                  className="cta"
                  href={waLink(empresa.whatsapp, pedido)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Ico icon={WhatsAppIcon} />
                  Pedir por WhatsApp · {formatPrice(t.precio)}
                </a>
              ) : (
                <Link className="cta" to="/" hash="sedes">
                  <Ico icon={MapPin} />
                  Pídelo en nuestras sedes
                </Link>
              )}
            </div>

            {(plato.ingredientes || plato.alergenos || plato.conservacion) && (
              <div className="acc" style={{ marginTop: 26 }}>
                {plato.ingredientes && (
                  <Acordeon titulo="Ingredientes" texto={plato.ingredientes} abierto />
                )}
                {plato.alergenos && <Acordeon titulo="Alérgenos" texto={plato.alergenos} />}
                {plato.conservacion && (
                  <Acordeon titulo="Conservación y preparación" texto={plato.conservacion} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {relacionados.length > 0 && <Relacionados items={relacionados} />}
    </>
  );
}

function detalleOpcion(o: Opcion): string {
  if (o.detalle) return o.detalle;
  if (o.grupo === "tamano")
    return o.factor === 1 ? "Porción regular" : `${Math.round(o.factor * 100)}% de la porción`;
  const k = optionKcal(o);
  const firma = (n: number, u: string) => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10} ${u}`;
  if (o.grupo === "proteina")
    return o.proteinas ? firma(o.proteinas, "g proteína") : "Receta original";
  if (o.grupo === "base")
    return o.carbohidratos ? firma(o.carbohidratos, "g carbohidratos") : "Receta original";
  return k ? firma(k, "kcal") : "";
}

function mensajePedido(
  p: Platillo,
  opciones: Opcion[],
  sel: Seleccion,
  total: number,
  perso: boolean,
): string {
  const nombre = (id: number | null) => opciones.find((o) => o.id === id)?.nombre;
  const partes = perso
    ? [
        nombre(sel.tamano),
        nombre(sel.proteina),
        nombre(sel.base),
        ...sel.extras.map((id) => `extra ${nombre(id) ?? ""}`),
      ].filter(Boolean)
    : [];
  return `Hola, quiero pedir: ${p.nombre}${partes.length ? ` (${partes.join(", ")})` : ""}. Total ${formatPrice(total)}.`;
}

function Metas({
  opciones,
  goal,
  onGoal,
}: {
  opciones: Opcion[];
  goal: Objetivo | null;
  onGoal: (g: Objetivo) => void;
}) {
  // Cada meta solo se ofrece si hay opciones con las que se puede lograr
  const tiene = (g: Opcion["grupo"]) => byGroup(opciones, g).length > 1;
  const disponibles = OBJETIVOS.filter((o) =>
    o.id === "proteina"
      ? tiene("proteina") || byGroup(opciones, "extra").some((x) => x.proteinas >= 5)
      : o.id === "ligero"
        ? tiene("proteina") || tiene("base")
        : tiene("base"),
  );
  if (!disponibles.length) return null;
  return (
    <div className="pblock">
      <h2>
        ¿Qué priorizas? <small>Ajusta el plato a tu objetivo</small>
      </h2>
      <div className="goals">
        {disponibles.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={goal === o.id}
            className={goal === o.id ? "goal on" : "goal"}
            onClick={() => onGoal(o.id)}
          >
            <Ico icon={GOAL_ICON[o.id]} />
            {o.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

const BARRAS = [
  { n: "Proteínas", k: "proteinas", max: 70, col: "var(--vf-wine)" },
  { n: "Carbohidratos", k: "carbohidratos", max: 130, col: "var(--vf-lime)" },
  { n: "Grasas", k: "grasas", max: 50, col: "#e3a008" },
  { n: "Fibra", k: "fibra", max: 25, col: "#5aa36b" },
] as const;

/** Anillo de calorías y barras de macronutrientes; muestran cuánto cambió con cada elección. */
function Nutricion({ t }: { t: Totales }) {
  // Se guarda el total anterior para mostrar la diferencia (+/-) de cada elección
  const [pair, setPair] = useState<{ cur: Totales; prev: Totales | null }>({ cur: t, prev: null });
  if (pair.cur !== t) setPair({ cur: t, prev: pair.cur });
  const [shown, setShown] = useState<Totales | null>(null);
  const [kcal, setKcal] = useState(0);
  const from = pair.prev?.kcal ?? 0;

  useEffect(() => {
    const to = t.kcal ?? 0;
    const raf1 = requestAnimationFrame(() => setShown(t));
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setKcal(to);
    else {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 700);
        setKcal(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf);
    };
  }, [t, from]);

  const base = pair.prev;
  return (
    <div className="nutri">
      <div className="kring" role="img" aria-label={`${t.kcal} kilocalorías`}>
        <svg viewBox="0 0 130 130" aria-hidden="true">
          <circle className="bg" cx="65" cy="65" r="56" />
          <circle
            className="fg"
            cx="65"
            cy="65"
            r="56"
            style={{ strokeDashoffset: 352 - Math.min(1, (shown?.kcal ?? 0) / 900) * 352 }}
          />
        </svg>
        <div>
          <div>
            <b>{kcal}</b>
            <small>kcal</small>
          </div>
        </div>
      </div>
      <div>
        {BARRAS.map((b) => {
          const v = t[b.k];
          if (v === null) return null;
          const antes = base?.[b.k] ?? null;
          const diff = antes === null ? 0 : Math.round((v - antes) * 10) / 10;
          const w = Math.min(100, ((shown?.[b.k] ?? 0) / b.max) * 100);
          return (
            <div className="mbar" key={b.k}>
              <div className="lbl">
                <span>{b.n}</span>
                <span className={diff > 0 ? "up" : diff < 0 ? "down" : undefined}>
                  {v} g{diff ? ` (${diff > 0 ? "+" : ""}${diff})` : ""}
                </span>
              </div>
              <div className="track">
                <i style={{ width: `${w}%`, background: b.col }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Galeria({ plato }: { plato: Platillo }) {
  const fotos = [plato.imagen_url, ...plato.galeria.map((g) => g.url)].filter((u): u is string =>
    Boolean(u),
  );
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => setI(0), [plato.id]);
  const go = (n: number) => setI((n + fotos.length) % fotos.length);

  return (
    <div className="gallery" style={fotos.length < 2 ? { gridTemplateColumns: "1fr" } : undefined}>
      {fotos.length > 1 && (
        <div className="thumbs">
          {fotos.map((u, k) => (
            <button
              key={u + k}
              type="button"
              className={k === i ? "on" : undefined}
              aria-label={`Foto ${k + 1}`}
              onClick={() => go(k)}
              onMouseEnter={() => go(k)}
            >
              <img src={optimizedImage(u, 200)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div
        className={zoom ? "stage zoom" : "stage"}
        onMouseMove={(e) => {
          if (!fotos.length || !window.matchMedia("(hover: hover)").matches) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom(
            `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
          );
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {fotos.length ? (
          <img
            key={fotos[i]}
            src={optimizedImage(fotos[i], 1200)}
            alt={plato.nombre}
            style={zoom ? { transformOrigin: zoom, transform: "scale(1.9)" } : undefined}
          />
        ) : (
          <Picture url={null} alt={plato.nombre} width={0} sizes="" />
        )}
        {fotos.length > 0 && (
          <span className="hint">
            <Ico icon={ZoomIn} />
            Pasa el mouse para ampliar
          </span>
        )}
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              className="arrow prev"
              aria-label="Foto anterior"
              onClick={() => go(i - 1)}
            >
              <Ico icon={ChevronLeft} />
            </button>
            <button
              type="button"
              className="arrow next"
              aria-label="Foto siguiente"
              onClick={() => go(i + 1)}
            >
              <Ico icon={ChevronRight} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Acordeon({
  titulo,
  texto,
  abierto = false,
}: {
  titulo: string;
  texto: string;
  abierto?: boolean;
}) {
  return (
    <details open={abierto}>
      <summary>
        {titulo} <Ico icon={ChevronDown} />
      </summary>
      <p>{texto}</p>
    </details>
  );
}

function Relacionados({ items }: { items: Platillo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (dir: number) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.75 });
  return (
    <div className="wrap related">
      <div className="rhead">
        <h2>También te puede interesar</h2>
        <div>
          <button type="button" aria-label="Anterior" onClick={() => mover(-1)}>
            <Ico icon={ChevronLeft} />
          </button>
          <button type="button" aria-label="Siguiente" onClick={() => mover(1)}>
            <Ico icon={ChevronRight} />
          </button>
        </div>
      </div>
      <div className="track-r" ref={ref}>
        {items.map((p) => (
          <RelatedCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
