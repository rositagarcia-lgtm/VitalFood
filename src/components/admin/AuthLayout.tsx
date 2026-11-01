import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, KeyRound, Leaf, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PASOS = [
  { n: 1, titulo: "Correo y contraseña", icon: KeyRound },
  { n: 2, titulo: "Código de tu celular", icon: ShieldCheck },
];

/** Pantalla dividida para el acceso al panel: marca a la izquierda y formulario a la derecha. */
export function AuthLayout({
  paso,
  titulo,
  subtitulo,
  children,
  volver,
}: {
  paso: 1 | 2;
  titulo: string;
  subtitulo: ReactNode;
  children: ReactNode;
  volver: { to: "/" | "/admin/login"; label: string };
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#4e1420] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/images/vital-foods-about.webp"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#6b1f2e]/95 via-[#4e1420]/85 to-[#3a0f18]/95" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.08) 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex items-center gap-2.5 text-xl font-extrabold">
          <span className="grid size-10 place-items-center rounded-full bg-[#9acd32] text-[#2f4a0b]">
            <Leaf className="size-5" strokeWidth={2.5} />
          </span>
          <span>
            vital<span className="text-[#9acd32]">foods</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9acd32]">
            Panel de administración
          </p>
          <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight">
            Todo lo que ve tu cliente, se edita desde aquí.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            Menú, precios, calorías, promociones, sedes y la página Nosotros, siempre al día.
          </p>
        </div>
        <ol className="relative grid gap-3">
          {PASOS.map((p) => {
            const hecho = p.n < paso;
            const actual = p.n === paso;
            return (
              <li
                key={p.n}
                className={cn(
                  "flex items-center gap-3 text-sm",
                  !actual && !hecho && "text-white/55",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border",
                    hecho && "border-[#9acd32] bg-[#9acd32] text-[#2f4a0b]",
                    actual && "border-white bg-white text-[#6b1f2e]",
                    !actual && !hecho && "border-white/30",
                  )}
                >
                  {hecho ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <p.icon className="size-4" />
                  )}
                </span>
                <span className="font-bold">
                  Paso {p.n} · {p.titulo}
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-extrabold text-brand-wine lg:invisible">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="size-4" strokeWidth={2.5} />
            </span>
            <span>
              vital<span className="text-primary">foods</span>
            </span>
          </span>
          <Link
            to={volver.to}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> {volver.label}
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-2 flex gap-1.5 lg:hidden" aria-hidden="true">
            {PASOS.map((p) => (
              <span
                key={p.n}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  p.n <= paso ? "bg-brand-wine" : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-wine">
            Paso {paso} de 2
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{titulo}</h1>
          <div className="mt-2 text-sm text-muted-foreground">{subtitulo}</div>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Acceso solo para el equipo autorizado. Tras 5 intentos fallidos, la cuenta se bloquea 15
          minutos.
        </p>
      </main>
    </div>
  );
}
