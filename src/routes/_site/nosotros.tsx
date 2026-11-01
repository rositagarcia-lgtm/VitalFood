import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, ExternalLink, Eye, Target } from "lucide-react";
import { Crumbs, Picture } from "@/components/site/cards";
import { Stats, buildOrbs } from "@/components/site/Stats";
import { getNosotrosData } from "@/functions/public";
import { FacebookIcon, Ico, InstagramIcon, NamedIco, TikTokIcon, WhatsAppIcon } from "@/lib/icons";
import { waLink } from "@/lib/contact";
import type { Bloque } from "@/lib/types";

export const Route = createFileRoute("/_site/nosotros")({
  loader: () => getNosotrosData(),
  head: ({ loaderData }) => {
    const e = loaderData?.empresa;
    const desc = e?.intro_texto ?? "Conoce la historia, misión, visión y valores de Vital Foods.";
    return {
      meta: [
        { title: `Nosotros | ${e?.nombre ?? "Vital Foods"}` },
        { name: "description", content: desc },
        { property: "og:title", content: `Nosotros | ${e?.nombre ?? "Vital Foods"}` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Nosotros,
});

const delay = (i: number, step = 0.08) =>
  i % 4 ? { transitionDelay: `${(i % 4) * step}s` } : undefined;
const iniciales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]!.toUpperCase())
    .join("");

function Nosotros() {
  const { empresa: e, bloques, sedes, foto, cifras } = Route.useLoaderData();
  const de = (tipo: Bloque["tipo"]) => bloques.filter((b) => b.tipo === tipo);
  const valores = de("valor");
  const hitos = [...de("hito")].sort((a, b) => (a.anio ?? 0) - (b.anio ?? 0) || a.orden - b.orden);
  const garantias = de("garantia");
  const opiniones = de("opinion");
  const orbs = buildOrbs(
    cifras,
    ["anios", "equipo", "sedes", "clientes", "platillos"],
    e.ciudad,
    e.anio_fundacion,
    sedes.map((s) => s.nombre),
  );
  const parrafos = (e.historia_texto ?? "")
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const redes = [
    { url: e.instagram, label: "Instagram", icon: InstagramIcon },
    { url: e.facebook, label: "Facebook", icon: FacebookIcon },
    { url: e.tiktok, label: "TikTok", icon: TikTokIcon },
  ].filter((r) => r.url);
  const fotoEmpresa = e.imagen_url;

  return (
    <>
      <div className="intro">
        <div className="wrap">
          <Crumbs items={[{ label: "Inicio", to: "/" }, { label: "Nosotros" }]} />
          <div className="intro-grid">
            <div>
              <span className="eyebrow">Nosotros</span>
              <h1>{e.intro_titulo ?? e.nombre}</h1>
              <p>{e.intro_texto ?? e.eslogan}</p>
              <div className="actions">
                <Link className="cta" to="/menu">
                  Ver menú <Ico icon={ArrowRight} />
                </Link>
                {sedes.length > 0 && (
                  <Link className="btn-ghost" to="/" hash="sedes">
                    Nuestras sedes
                  </Link>
                )}
              </div>
            </div>
            <div className="photo">
              <Picture
                url={fotoEmpresa}
                alt={`Equipo y cocina de ${e.nombre}`}
                width={900}
                sizes="(max-width: 760px) 100vw, 50vw"
                eager
              />
              {e.anio_fundacion && (
                <div className="since">
                  <span className="ibadge">
                    <Ico icon={CalendarHeart} />
                  </span>
                  <div>
                    <b>Desde {e.anio_fundacion}</b>
                    <small>cocinando fresco cada día</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Stats orbs={orbs} />

      {parrafos.length > 0 && (
        <section className="sec teaser" id="historia">
          <div className="wrap">
            <div className="box reveal">
              <Picture
                url={foto ?? fotoEmpresa}
                alt=""
                width={900}
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <div className="txt">
                <span className="eyebrow">Nuestra historia</span>
                {e.historia_titulo && <h2 className="serif">{e.historia_titulo}</h2>}
                {parrafos.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {(e.mision || e.vision || valores.length > 0) && (
        <section className="sec alt" id="mision">
          <div className="wrap">
            <div className="head reveal">
              <div>
                <span className="eyebrow">Lo que nos guía</span>
                <h2 className="serif">
                  {[
                    e.mision || e.vision ? "Misión, visión" : null,
                    valores.length ? "valores" : null,
                  ]
                    .filter(Boolean)
                    .join(" y ")}
                </h2>
              </div>
              <p className="lead">Lo que hacemos cada día y hacia dónde vamos.</p>
            </div>
            {(e.mision || e.vision) && (
              <div className="grid-2">
                {e.mision && (
                  <div className="icard big reveal">
                    <span className="ibadge">
                      <Ico icon={Target} />
                    </span>
                    <h3>Misión</h3>
                    <p>{e.mision}</p>
                  </div>
                )}
                {e.vision && (
                  <div className="icard big reveal" style={{ transitionDelay: ".1s" }}>
                    <span className="ibadge">
                      <Ico icon={Eye} />
                    </span>
                    <h3>Visión</h3>
                    <p>{e.vision}</p>
                  </div>
                )}
              </div>
            )}
            {valores.length > 0 && (
              <div className="grid-4" style={{ marginTop: e.mision || e.vision ? 20 : 0 }}>
                {valores.map((b, i) => (
                  <Tarjeta key={b.id} b={b} i={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {hitos.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="head reveal">
              <div>
                <span className="eyebrow">Nuestro camino</span>
                <h2 className="serif">Cómo hemos crecido</h2>
              </div>
            </div>
            <div className="grid-4 steps">
              {hitos.map((b, i) => (
                <Tarjeta key={b.id} b={b} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {garantias.length > 0 && (
        <section className="sec alt" id="confianza">
          <div className="wrap">
            <div className="head reveal">
              <div>
                <span className="eyebrow">Por qué confiar en nosotros</span>
                <h2 className="serif">Lo que garantizamos en cada plato</h2>
              </div>
              <p className="lead">Transparencia en lo que comes, desde la cocina hasta tu mesa.</p>
            </div>
            <div className="grid-3">
              {garantias.map((b, i) => (
                <Tarjeta key={b.id} b={b} i={i % 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {opiniones.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="head reveal">
              <div>
                <span className="eyebrow">Opiniones</span>
                <h2 className="serif">Lo que dicen nuestros clientes</h2>
              </div>
              {e.resenas_url && (
                <a className="btn-ghost" href={e.resenas_url} target="_blank" rel="noreferrer">
                  Ver todas las reseñas <Ico icon={ExternalLink} />
                </a>
              )}
            </div>
            <div className="grid-3">
              {opiniones.map((b, i) => (
                <div key={b.id} className="icard reveal" style={delay(i % 3)}>
                  <div
                    className="stars"
                    role="img"
                    aria-label={`${b.estrellas ?? 5} de 5 estrellas`}
                  >
                    {"★".repeat(b.estrellas ?? 5)}
                    {"☆".repeat(5 - (b.estrellas ?? 5))}
                  </div>
                  <p style={{ color: "#3b4136", marginTop: 12 }}>“{b.texto}”</p>
                  <div className="who">
                    <span className="ibadge">{iniciales(b.autor ?? b.titulo)}</span>
                    <div>
                      {b.autor ?? b.titulo}
                      {b.detalle && <small>{b.detalle}</small>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(redes.length > 0 || e.whatsapp) && (
        <section className="sec alt teaser follow">
          <div className="wrap">
            <div className="box rev reveal">
              <Picture
                url={fotoEmpresa}
                alt=""
                width={900}
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <div className="txt">
                <span className="eyebrow">Síguenos</span>
                <h2 className="serif">Novedades, recetas y promociones</h2>
                <p>Únete a nuestra comunidad y entérate primero de los nuevos platos.</p>
                <div className="soc-row">
                  {redes.map((r) => (
                    <a
                      key={r.label}
                      className="btn-ghost"
                      href={r.url!}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Ico icon={r.icon} />
                      {r.label}
                    </a>
                  ))}
                  {e.whatsapp && (
                    <a className="cta" href={waLink(e.whatsapp)} target="_blank" rel="noreferrer">
                      <Ico icon={WhatsAppIcon} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** Misma tarjeta para valores, hitos y garantías. */
function Tarjeta({ b, i }: { b: Bloque; i: number }) {
  return (
    <div className="icard reveal" style={delay(i)}>
      <span className="ibadge">
        <NamedIco name={b.icono} />
      </span>
      {b.tipo === "hito" && b.anio && <span className="year">{b.anio}</span>}
      <h3>{b.titulo}</h3>
      <p>{b.texto}</p>
    </div>
  );
}
