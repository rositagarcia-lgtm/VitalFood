import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Info,
  MapPin,
  Megaphone,
  Tags,
  TriangleAlert,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { getDashboard } from "@/functions/admin/dashboard";
import { ROLE_LABEL } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { canAccess } from "@/lib/permissions";
import { ACCION, timeAgo } from "@/components/admin/NotificationsBell";
import type { Modulo } from "@/lib/types";

export const Route = createFileRoute("/admin/_panel/")({
  staticData: { title: "Panel de administración" },
  loader: () => getDashboard(),
  component: Dashboard,
});

const quickActions: {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  modulo: Modulo;
}[] = [
  {
    modulo: "platillos",
    title: "Platillos y precios",
    description: "Precios, ofertas, fotos y disponibilidad",
    to: "/admin/platillos",
    icon: UtensilsCrossed,
  },
  {
    modulo: "categorias",
    title: "Categorías",
    description: "Organiza las secciones del menú",
    to: "/admin/categorias",
    icon: Tags,
  },
  {
    modulo: "sedes",
    title: "Sedes",
    description: "Direcciones y horarios de atención",
    to: "/admin/sedes",
    icon: MapPin,
  },
  {
    modulo: "promociones",
    title: "Banners de portada",
    description: "Imágenes y mensajes del inicio de la web",
    to: "/admin/promociones",
    icon: Megaphone,
  },
  {
    modulo: "empresa",
    title: "Empresa y Nosotros",
    description: "Contacto, redes, cifras, misión, visión y opiniones",
    to: "/admin/empresa",
    icon: Building2,
  },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { totales, alertas, recientes } = Route.useLoaderData();
  const acciones = quickActions.filter((a) => canAccess(user, a.modulo));
  const medias = alertas.filter((a) => a.nivel === "media").length;
  const bajas = alertas.length - medias;

  const stats = [
    {
      label: "Platillos",
      value: totales.platillos,
      hint: `${totales.disponibles} visibles · ${totales.ofertas} en oferta`,
      icon: UtensilsCrossed,
    },
    { label: "Categorías", value: totales.categorias, hint: "activas en el menú", icon: Tags },
    { label: "Sedes", value: totales.sedes, hint: "abiertas al público", icon: MapPin },
    { label: "Banners", value: totales.promociones, hint: "en la portada", icon: Megaphone },
  ];

  return (
    <div className="space-y-10">
      <section className="border-l-2 border-brand-wine pl-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-wine">
          Visión general
        </p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">Vital Foods</h1>
        <p className="mt-2 text-muted-foreground">
          Elige una sección para actualizar lo que ven tus clientes en la web.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-md border bg-background px-2 py-1">{ROLE_LABEL[user.rol]}</span>
          <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-success">
            Base de datos conectada
          </span>
        </div>
      </section>

      <hr />

      <section>
        <h2 className="mb-4 text-lg font-bold">Acciones rápidas</h2>
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          {acciones.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-start gap-3 bg-card p-5 transition-colors hover:bg-muted"
            >
              <action.icon className="mt-0.5 size-5 shrink-0 text-brand-wine" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{action.title}</p>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </p>
              <span className="grid size-8 place-items-center rounded-md border text-brand-wine">
                <stat.icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-4xl font-extrabold tabular-nums">{stat.value}</p>
            <p className="mt-3 text-sm text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-bold">Alertas</h2>
        <p className="mb-4 text-sm text-muted-foreground">Pendientes que requieren seguimiento.</p>
        <div className="overflow-hidden rounded-xl border bg-card">
          {alertas.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm">
              <CheckCircle2 className="size-5 text-success" />
              Todo está en orden.
            </div>
          ) : (
            <>
              <div className="flex gap-2 border-b p-4 text-xs font-medium">
                {medias > 0 && (
                  <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-warning">
                    {medias} {medias === 1 ? "media" : "medias"}
                  </span>
                )}
                {bajas > 0 && (
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-sky-600 dark:text-sky-400">
                    {bajas} {bajas === 1 ? "baja" : "bajas"}
                  </span>
                )}
              </div>
              <ul className="divide-y">
                {alertas.map((alerta) => (
                  <li key={`${alerta.detalle}-${alerta.titulo}`}>
                    <Link
                      to={alerta.to}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full",
                          alerta.nivel === "media"
                            ? "bg-warning/15 text-warning"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                        )}
                      >
                        {alerta.nivel === "media" ? (
                          <TriangleAlert className="size-4" />
                        ) : (
                          <Info className="size-4" />
                        )}
                      </span>
                      <p className="text-sm">
                        <span className="font-semibold">{alerta.titulo}</span>
                        <span className="text-muted-foreground"> · {alerta.detalle}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Cambios recientes</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Lo último que se modificó desde el panel.
        </p>
        {recientes.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            Todavía no hay cambios registrados.
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {recientes.map((r) => (
              <li key={r.id} className="px-5 py-3 text-sm">
                <span className="font-semibold">{r.usuario}</span>{" "}
                <span className="text-muted-foreground">{ACCION[r.accion]}</span> {r.detalle}
                <span className="block text-xs text-muted-foreground">
                  {r.modulo} · {timeAgo(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
