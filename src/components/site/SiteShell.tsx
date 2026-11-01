import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Clock, House, Info, Leaf, Mail, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { FacebookIcon, Ico, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/lib/icons";
import { formatPhone, waLink } from "@/lib/contact";
import type { Empresa } from "@/lib/types";

export type SiteData = { empresa: Empresa; sedes: { id: number; nombre: string }[] };

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Vital Foods, ir al inicio">
      <Ico icon={Leaf} />
      <em>
        vital<span>foods</span>
      </em>
    </Link>
  );
}

function usePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

/** Aparición al hacer scroll: agrega la clase "in" cuando cada bloque entra en pantalla. */
function useReveal(path: string) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".vf .reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.2 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
}

export function Redes({ empresa, className }: { empresa: Empresa; className?: string }) {
  const redes = [
    { url: empresa.instagram, label: "Instagram", icon: InstagramIcon },
    { url: empresa.facebook, label: "Facebook", icon: FacebookIcon },
    { url: empresa.tiktok, label: "TikTok", icon: TikTokIcon },
    {
      url: empresa.whatsapp ? waLink(empresa.whatsapp) : null,
      label: "WhatsApp",
      icon: WhatsAppIcon,
    },
  ].filter((r) => r.url);
  if (!redes.length) return null;
  return (
    <div className={className ?? "soc"}>
      {redes.map((r) => (
        <a key={r.label} href={r.url!} target="_blank" rel="noreferrer" aria-label={r.label}>
          <Ico icon={r.icon} />
        </a>
      ))}
    </div>
  );
}

export function SiteShell({ site, children }: { site: SiteData; children: ReactNode }) {
  const path = usePath();
  const { empresa, sedes } = site;
  const [hint, setHint] = useState(true);
  useReveal(path);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  const on = (p: string) => ((p === "/" ? path === "/" : path.startsWith(p)) ? "on" : undefined);
  const enPlato = path.startsWith("/menu/") && path.length > 6;

  return (
    <div className="vf">
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="vf-header">
        <div className="wrap hbar">
          <Logo />
          <nav className="mainnav" aria-label="Navegación principal">
            <Link to="/" className={on("/")}>
              Inicio
            </Link>
            <Link to="/menu" className={on("/menu")}>
              Menú
            </Link>
            <Link to="/nosotros" className={on("/nosotros")}>
              Nosotros
            </Link>
            <Link to="/" hash="sedes">
              Sedes
            </Link>
            <a href="#contacto">Contacto</a>
          </nav>
          <Link to="/menu" className="cta desk">
            <Ico icon={UtensilsCrossed} />
            Ver menú
          </Link>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>

      <footer className="vf-footer" id="contacto">
        <div className="wrap">
          <div className="fgrid">
            <div>
              <Logo />
              <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>{empresa.eslogan}</p>
              <Redes empresa={empresa} />
            </div>
            <div>
              <h4>Explora</h4>
              <ul>
                <li>
                  <Link to="/">Inicio</Link>
                </li>
                <li>
                  <Link to="/menu">Menú</Link>
                </li>
                <li>
                  <Link to="/nosotros">Nosotros</Link>
                </li>
                <li>
                  <Link to="/" hash="sedes">
                    Sedes
                  </Link>
                </li>
              </ul>
            </div>
            {sedes.length > 0 && (
              <div>
                <h4>Sedes</h4>
                <ul>
                  {sedes.map((s) => (
                    <li key={s.id}>{s.nombre}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4>Contacto</h4>
              <ul>
                {empresa.whatsapp && (
                  <li>
                    <Ico icon={WhatsAppIcon} />
                    <a href={waLink(empresa.whatsapp)} target="_blank" rel="noreferrer">
                      {formatPhone(empresa.whatsapp)}
                    </a>
                  </li>
                )}
                {empresa.telefono && (
                  <li>
                    <Ico icon={Phone} />
                    <a href={`tel:${empresa.telefono.replace(/[^\d+]/g, "")}`}>
                      {empresa.telefono}
                    </a>
                  </li>
                )}
                {empresa.email && (
                  <li>
                    <Ico icon={Mail} />
                    <a href={`mailto:${empresa.email}`}>{empresa.email}</a>
                  </li>
                )}
                {empresa.horario && (
                  <li>
                    <Ico icon={Clock} />
                    {empresa.horario}
                  </li>
                )}
                <li>
                  <Ico icon={MapPin} />
                  {empresa.ciudad}
                </li>
              </ul>
            </div>
          </div>
          <div className="legal">
            <span>
              © {new Date().getFullYear()} {empresa.nombre}. Todos los derechos reservados.
            </span>
            {empresa.reclamaciones_url && (
              <a href={empresa.reclamaciones_url} target="_blank" rel="noreferrer">
                Libro de Reclamaciones
              </a>
            )}
          </div>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Navegación móvil">
        <Link to="/" className={on("/")}>
          <Ico icon={House} />
          Inicio
        </Link>
        <Link to="/menu" className={on("/menu")}>
          <Ico icon={UtensilsCrossed} />
          Menú
        </Link>
        <Link to="/nosotros" className={on("/nosotros")}>
          <Ico icon={Info} />
          Nosotros
        </Link>
        <Link to="/" hash="sedes">
          <Ico icon={MapPin} />
          Sedes
        </Link>
      </nav>

      {empresa.whatsapp && !enPlato && (
        <div className={hint ? "wa-float hint" : "wa-float"}>
          <span className="bubble">¿Te ayudamos con tu pedido?</span>
          <a
            href={waLink(empresa.whatsapp, "Hola, quiero hacer un pedido.")}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
          >
            <Ico icon={WhatsAppIcon} />
          </a>
        </div>
      )}
    </div>
  );
}
