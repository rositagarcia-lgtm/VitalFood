import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
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

/**
 * Aparición al hacer scroll. El contenido llega visible desde el servidor; recién cuando la página
 * cargó sus scripts se activa la animación (clase "anim" en <html>). Los bloques que ya están en
 * pantalla se marcan antes de pintar para que no parpadeen, y un MutationObserver detecta los
 * bloques que aparecen al navegar entre páginas, así ninguno queda invisible.
 */
function useReveal() {
  useLayoutEffect(() => {
    const root = document.querySelector(".vf");
    if (!root) return;
    const visible = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;
    if (!("IntersectionObserver" in window) || !("MutationObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15 },
    );
    const vistos = new WeakSet<Element>();
    const scan = (marcarVisibles: boolean) => {
      root.querySelectorAll(".reveal:not(.in)").forEach((el) => {
        if (vistos.has(el)) return;
        vistos.add(el);
        if (marcarVisibles && visible(el)) el.classList.add("in");
        else io.observe(el);
      });
    };
    scan(true);
    document.documentElement.classList.add("anim");
    const mo = new MutationObserver(() => scan(false));
    mo.observe(root, { childList: true, subtree: true });
    // Si se baja muy rápido, un bloque puede quedar arriba sin haber cruzado la pantalla
    let raf = 0;
    const pasados = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        root.querySelectorAll(".reveal:not(.in)").forEach((el) => {
          if (el.getBoundingClientRect().bottom < 0) el.classList.add("in");
        }),
      );
    };
    window.addEventListener("scroll", pasados, { passive: true });
    return () => {
      window.removeEventListener("scroll", pasados);
      cancelAnimationFrame(raf);
      mo.disconnect();
      io.disconnect();
      document.documentElement.classList.remove("anim");
    };
  }, []);
}

/**
 * Mantiene los datos al día sin recargar: vuelve a pedirlos al regresar a la pestaña (por ejemplo,
 * después de guardar algo en el panel) y cada minuto mientras la página está a la vista.
 */
function useAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let ultimo = Date.now();
    const refrescar = () => {
      if (document.visibilityState !== "visible" || Date.now() - ultimo < 5000) return;
      ultimo = Date.now();
      void router.invalidate();
    };
    const timer = window.setInterval(refrescar, 60_000);
    document.addEventListener("visibilitychange", refrescar);
    window.addEventListener("focus", refrescar);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("focus", refrescar);
    };
  }, [router]);
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
  useReveal();
  useAutoRefresh();

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
