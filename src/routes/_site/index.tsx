import { useCallback, useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Navigation } from "lucide-react";
import { DishCard, Picture } from "@/components/site/cards";
import { Stats, buildOrbs } from "@/components/site/Stats";
import { getHomeData } from "@/functions/public";
import { Ico } from "@/lib/icons";
import { mapEmbed } from "@/lib/contact";
import type { Promocion, Sede } from "@/lib/types";

export const Route = createFileRoute("/_site/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: "Vital Foods | Comida saludable en Trujillo" },
      {
        name: "description",
        content:
          "Bowls, desayunos, ensaladas y más opciones frescas, con su información nutricional, en las sedes de Vital Foods.",
      },
      { property: "og:title", content: "Vital Foods | Disfruta lo saludable" },
      {
        property: "og:description",
        content: "Sabores frescos y nutritivos preparados para sentirte bien.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { destacados, sedes, promociones, empresa, cifras } = Route.useLoaderData();
  const orbs = buildOrbs(
    cifras,
    ["anios", "clientes", "sedes", "platillos"],
    empresa.ciudad,
    empresa.anio_fundacion,
    sedes.map((s) => s.nombre),
  );

  return (
    <>
      <Hero promociones={promociones} nombre={empresa.nombre} eslogan={empresa.eslogan} />
      <Stats orbs={orbs} />

      {destacados.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="head reveal">
              <div>
                <span className="eyebrow">Destacados</span>
                <h2 className="serif">Lo más pedido esta semana</h2>
              </div>
              <Link className="btn-ghost" to="/menu">
                Ver menú completo <Ico icon={ArrowRight} />
              </Link>
            </div>
            <div className="cards">
              {destacados.map((p, i) => (
                <DishCard key={p.id} p={p} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="teaser" style={{ paddingBottom: 96 }}>
        <div className="wrap">
          <div className="box reveal">
            <Picture
              url={empresa.imagen_url ?? "/images/vital-foods-about.webp"}
              alt=""
              width={900}
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <div className="txt">
              <span className="eyebrow">Quiénes somos</span>
              <h2 className="serif">{empresa.intro_titulo ?? `Conoce ${empresa.nombre}`}</h2>
              {empresa.intro_texto && <p>{empresa.intro_texto}</p>}
              <div>
                <Link className="cta" to="/nosotros">
                  Conoce {empresa.nombre} <Ico icon={ArrowRight} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sedes.length > 0 && <Sedes sedes={sedes} ciudad={empresa.ciudad} />}
    </>
  );
}

const INTERVALO = 6000;

/** Banner de campañas: pasan solas cada 6 s y los puntos permiten elegir. Se editan en Promociones. */
function Hero({
  promociones,
  nombre,
  eslogan,
}: {
  promociones: Promocion[];
  nombre: string;
  eslogan: string;
}) {
  const [cur, setCur] = useState(0);
  const [pausa, setPausa] = useState(false);
  const timer = useRef<number>(0);
  const total = promociones.length;

  const show = useCallback((i: number) => setCur(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausa) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setTimeout(() => show(cur + 1), INTERVALO);
    return () => window.clearTimeout(timer.current);
  }, [cur, total, pausa, show]);

  if (!total)
    return (
      <div className="hero-empty">
        <div className="wrap">
          <h1>{nombre}</h1>
          <p>{eslogan}</p>
        </div>
      </div>
    );

  return (
    <div
      className="hero"
      aria-roledescription="carrusel"
      aria-label="Campañas"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
    >
      {promociones.map((p, i) => (
        <div key={p.id} className={i === cur ? "slide on" : "slide"} aria-hidden={i !== cur}>
          <Picture url={p.imagen_url} alt="" width={1600} sizes="100vw" eager={i === 0} />
          <div className="shade" />
          <div className="wrap">
            <div className="content">
              <span className="eyebrow">{p.etiqueta}</span>
              {i === 0 ? <h1>{p.titulo}</h1> : <h2 className="h1">{p.titulo}</h2>}
              <p>{p.descripcion}</p>
              <div className="actions">
                <a className="cta" href={p.enlace_boton} tabIndex={i === cur ? 0 : -1}>
                  {p.texto_boton} <Ico icon={ArrowRight} />
                </a>
                {p.enlace_boton !== "/menu" && i === 0 && (
                  <Link className="btn-ghost" to="/menu" tabIndex={i === cur ? 0 : -1}>
                    Ver menú
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {total > 1 && (
        <div className="dots" role="tablist" aria-label="Elegir campaña">
          {promociones.map((p, i) => (
            <button
              key={`${p.id}-${i === cur ? cur : "x"}`}
              type="button"
              role="tab"
              aria-selected={i === cur}
              aria-label={`Campaña ${i + 1}: ${p.titulo}`}
              className={i === cur ? (pausa ? "on paused" : "on") : undefined}
              onClick={() => show(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Sedes({ sedes, ciudad }: { sedes: Sede[]; ciudad: string }) {
  const [sel, setSel] = useState(0);
  const sede = sedes[sel] ?? sedes[0]!;

  return (
    <section className="sec sedes" id="sedes">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <span className="eyebrow">Siempre cerca de ti</span>
            <h2 className="serif">Encuéntranos en {ciudad}</h2>
          </div>
          <p className="lead">Elige una sede para ver su ubicación y horario.</p>
        </div>
        <div className="loc reveal">
          <div className="list">
            {sedes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === sel ? "item on" : "item"}
                aria-pressed={i === sel}
                onClick={() => setSel(i)}
              >
                <h3>{s.nombre}</h3>
                <p>
                  <Ico icon={MapPin} />
                  {s.direccion}
                  {s.referencia ? ` · ${s.referencia}` : ""}
                </p>
                <p>
                  <Ico icon={Clock} />
                  {s.horario}
                </p>
                {i === sel && s.mapa_url && (
                  <a
                    className="go"
                    href={s.mapa_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Cómo llegar <Ico icon={Navigation} />
                  </a>
                )}
              </button>
            ))}
          </div>
          <div className="map">
            <iframe
              key={sede.id}
              title={`Mapa de la sede ${sede.nombre}`}
              loading="lazy"
              src={mapEmbed(sede.direccion, ciudad)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
