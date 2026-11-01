import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ConfirmDelete,
  EmptyState,
  Field,
  PageHeader,
  StatusBadge,
  SubmitButton,
} from "@/components/admin/ui";
import { useAction } from "@/components/admin/hooks";
import { ICONOS } from "@/lib/icons";
import { canAccess } from "@/lib/permissions";
import { toInt } from "@/lib/utils";
import { deleteBloque, listBloques, saveBloque, type BloqueInput } from "@/functions/admin/empresa";
import type { Bloque, TipoBloque } from "@/lib/types";

export const Route = createFileRoute("/admin/_panel/nosotros")({
  staticData: { title: "Contenido de Nosotros", section: "Negocio" },
  beforeLoad: ({ context }) => {
    if (!canAccess(context.user, "empresa")) throw redirect({ to: "/admin" });
  },
  loader: () => listBloques(),
  component: NosotrosPage,
});

const TIPOS: { id: TipoBloque; nombre: string; uno: string; ayuda: string; icono: string }[] = [
  {
    id: "valor",
    nombre: "Valores",
    uno: "valor",
    ayuda: "Lo que guía a la empresa. Se muestran junto a la misión y visión.",
    icono: "leaf",
  },
  {
    id: "hito",
    nombre: "Historia (hitos)",
    uno: "hito",
    ayuda: "Momentos importantes con su año. Se ordenan por año.",
    icono: "store",
  },
  {
    id: "garantia",
    nombre: "Garantías",
    uno: "garantía",
    ayuda: "Por qué confiar: registro sanitario, cadena de frío, etc.",
    icono: "shield",
  },
  {
    id: "opinion",
    nombre: "Opiniones",
    uno: "opinión",
    ayuda: "Comentarios reales de clientes, con su permiso.",
    icono: "star",
  },
];

type FormState = Omit<BloqueInput, "anio" | "estrellas"> & { anio: string; estrellas: number };

function NosotrosPage() {
  const bloques = Route.useLoaderData();
  const [tab, setTab] = useState<TipoBloque>("valor");
  const [editing, setEditing] = useState<FormState | null>(null);
  const { pending, run } = useAction();
  const tipo = TIPOS.find((t) => t.id === tab)!;
  const lista = bloques.filter((b) => b.tipo === tab);

  const open = (b?: Bloque) =>
    setEditing(
      b
        ? {
            id: b.id,
            tipo: b.tipo,
            titulo: b.titulo,
            texto: b.texto,
            icono: b.icono,
            anio: b.anio ? String(b.anio) : "",
            autor: b.autor ?? "",
            detalle: b.detalle ?? "",
            estrellas: b.estrellas ?? 5,
            orden: b.orden,
            activo: b.activo,
          }
        : {
            tipo: tab,
            titulo: "",
            texto: "",
            icono: tipo.icono,
            anio: "",
            autor: "",
            detalle: "",
            estrellas: 5,
            orden: lista.length + 1,
            activo: true,
          },
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const anio = editing.anio.trim() ? Number(editing.anio) : null;
    const ok = await run(
      () =>
        saveBloque({
          data: {
            ...editing,
            anio,
            titulo:
              editing.tipo === "opinion" && !editing.titulo
                ? (editing.autor ?? "")
                : editing.titulo,
          },
        }),
      editing.id ? "Guardado." : "Agregado. Ya se ve en Nosotros.",
    );
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Negocio"
        title="Contenido de Nosotros"
        description="Valores, historia, garantías y opiniones de la página Nosotros. Si una sección no tiene elementos activos, no se muestra."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href="/nosotros" target="_blank" rel="noreferrer">
                Ver página <ExternalLink />
              </a>
            </Button>
            <Button variant="burgundy" onClick={() => open()}>
              <Plus /> Agregar {tipo.uno}
            </Button>
          </div>
        }
      />

      <div role="tablist" aria-label="Tipo de contenido" className="flex flex-wrap gap-2">
        {TIPOS.map((t) => {
          const n = bloques.filter((b) => b.tipo === t.id).length;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? "rounded-full bg-brand-wine px-4 py-2 text-sm font-bold text-brand-wine-foreground"
                  : "rounded-full border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              }
            >
              {t.nombre} <span className="ml-1 opacity-70">{n}</span>
            </button>
          );
        })}
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">{tipo.ayuda}</p>

      {lista.length === 0 ? (
        <EmptyState>
          Aún no hay {tipo.nombre.toLowerCase()}. Usa “Agregar {tipo.uno}”.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((b) => {
            const Icon = (ICONOS[b.icono] ?? ICONOS["leaf"]!).icon;
            return (
              <li key={b.id} className="flex flex-col rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  {b.tipo === "opinion" ? (
                    <span
                      className="text-sm tracking-widest text-warning"
                      aria-label={`${b.estrellas ?? 5} estrellas`}
                    >
                      {"★".repeat(b.estrellas ?? 5)}
                      <span className="text-muted-foreground/40">
                        {"★".repeat(5 - (b.estrellas ?? 5))}
                      </span>
                    </span>
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-lime-soft text-brand-wine">
                      <Icon className="size-5" />
                    </span>
                  )}
                  <StatusBadge active={b.activo} on="Visible" off="Oculto" />
                </div>
                {b.tipo === "hito" && (
                  <p className="mt-3 text-2xl font-extrabold text-brand-wine">{b.anio}</p>
                )}
                <h3 className="mt-2 font-extrabold">{b.tipo === "opinion" ? b.autor : b.titulo}</h3>
                {b.tipo === "opinion" && b.detalle && (
                  <p className="text-xs text-muted-foreground">{b.detalle}</p>
                )}
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {b.tipo === "opinion" ? `“${b.texto}”` : b.texto}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">Posición {b.orden}</span>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => open(b)}
                      aria-label={`Editar ${b.titulo}`}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      title={`Eliminar “${b.titulo}”`}
                      description="Se quitará de la página Nosotros. Esta acción no se puede deshacer."
                      onConfirm={() =>
                        void run(() => deleteBloque({ data: { id: b.id } }), "Eliminado.")
                      }
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing && (
            <form onSubmit={submit} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>
                  {editing.id ? "Editar" : "Agregar"}{" "}
                  {TIPOS.find((t) => t.id === editing.tipo)?.uno}
                </DialogTitle>
                <DialogDescription>Se publica en la página Nosotros al guardar.</DialogDescription>
              </DialogHeader>

              {editing.tipo === "opinion" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre del cliente" htmlFor="autor" hint="Ej.: Carla R.">
                      <Input
                        id="autor"
                        value={editing.autor ?? ""}
                        maxLength={80}
                        onChange={(e) =>
                          setEditing({ ...editing, autor: e.target.value, titulo: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field label="Detalle" htmlFor="detalle" hint="Ej.: Cliente en Centro.">
                      <Input
                        id="detalle"
                        value={editing.detalle ?? ""}
                        maxLength={120}
                        onChange={(e) => setEditing({ ...editing, detalle: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="Comentario" htmlFor="texto">
                    <Textarea
                      id="texto"
                      rows={3}
                      maxLength={500}
                      value={editing.texto}
                      onChange={(e) => setEditing({ ...editing, texto: e.target.value })}
                      required
                    />
                  </Field>
                  <fieldset>
                    <legend className="mb-1.5 text-sm font-medium">Calificación</legend>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEditing({ ...editing, estrellas: n })}
                          aria-label={`${n} estrellas`}
                          aria-pressed={editing.estrellas === n}
                          className="rounded p-0.5"
                        >
                          <Star
                            className={
                              n <= editing.estrellas
                                ? "size-6 fill-warning text-warning"
                                : "size-6 text-muted-foreground/40"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : (
                <>
                  <div
                    className={
                      editing.tipo === "hito" ? "grid gap-4 sm:grid-cols-[110px_1fr]" : "grid gap-4"
                    }
                  >
                    {editing.tipo === "hito" && (
                      <Field label="Año" htmlFor="anio">
                        <Input
                          id="anio"
                          inputMode="numeric"
                          maxLength={4}
                          value={editing.anio}
                          onChange={(e) =>
                            setEditing({ ...editing, anio: e.target.value.replace(/\D/g, "") })
                          }
                          required
                        />
                      </Field>
                    )}
                    <Field label="Título" htmlFor="titulo">
                      <Input
                        id="titulo"
                        value={editing.titulo}
                        maxLength={120}
                        onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Texto" htmlFor="texto">
                    <Textarea
                      id="texto"
                      rows={3}
                      maxLength={500}
                      value={editing.texto}
                      onChange={(e) => setEditing({ ...editing, texto: e.target.value })}
                      required
                    />
                  </Field>
                  <fieldset>
                    <legend className="mb-1.5 text-sm font-medium">Ícono</legend>
                    <div className="grid grid-cols-8 gap-1.5">
                      {Object.entries(ICONOS).map(([id, { icon: Icon, nombre }]) => (
                        <button
                          key={id}
                          type="button"
                          title={nombre}
                          aria-label={nombre}
                          aria-pressed={editing.icono === id}
                          onClick={() => setEditing({ ...editing, icono: id })}
                          className={
                            editing.icono === id
                              ? "grid aspect-square place-items-center rounded-lg bg-brand-wine text-brand-wine-foreground"
                              : "grid aspect-square place-items-center rounded-lg border text-muted-foreground hover:border-brand-wine hover:text-brand-wine"
                          }
                        >
                          <Icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}

              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <Switch
                    checked={editing.activo}
                    onCheckedChange={(activo) => setEditing({ ...editing, activo })}
                  />
                  Visible en la web
                </label>
                <label className="flex items-center gap-3 text-sm font-medium">
                  <span className="shrink-0">Posición</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-20"
                    value={editing.orden}
                    onChange={(e) => setEditing({ ...editing, orden: toInt(e.target.value) })}
                    aria-label="Posición"
                  />
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <SubmitButton pending={pending}>Guardar</SubmitButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
