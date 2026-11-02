import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Indicador de carga al pasar de una página a otra: una barra fina arriba y un círculo que gira.
 * Solo aparece si la espera supera 300 ms (así no parpadea en cargas rápidas) y no se muestra en
 * las actualizaciones automáticas de datos, porque esas no cambian de página.
 */
export function NavProgress() {
  const navegando = useRouterState({
    select: (s) => s.location.href !== (s.resolvedLocation?.href ?? s.location.href),
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!navegando) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(t);
  }, [navegando]);

  if (!visible) return null;
  return (
    <div className="nav-progress" role="status" aria-live="polite">
      <span className="nav-progress-bar" />
      <span className="nav-progress-pill">
        <span className="nav-progress-spin" aria-hidden="true" />
        Cargando…
      </span>
    </div>
  );
}
