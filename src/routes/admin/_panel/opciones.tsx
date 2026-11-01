import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Info, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { canAccess } from "@/lib/permissions";
import { toInt } from "@/lib/utils";
import { formatPrice } from "@/lib/images";
import { GRUPOS, byGroup, optionKcal, type Grupo } from "@/lib/nutrition";
import {
  deleteOpcion,
  listOpciones,
  saveOpcion,
  type OpcionInput,
} from "@/functions/admin/opciones";
import type { Opcion } from "@/lib/types";

export const Route = createFileRoute("/admin/_panel/opciones")({
  staticData: { title: "Opciones para personalizar", section: "Menú" },
  beforeLoad: ({ context }) => {
    if (!canAccess(context.user, "platillos")) throw redirect({ to: "/admin" });
  },
  loader: () => listOpciones(),
  component: OpcionesPage,
});

const NUMS = ["precio_extra", "proteinas", "carbohidratos", "grasas", "fibra", "factor"] as const;
type Num = (typeof NUMS)[number];
type FormState = Omit<OpcionInput, Num> & Record<Num, string>;

const parse = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : 0);
const signo = (n: number, u = "") => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}${u}`;

const NOMBRE_UNO: Record<Grupo, string> = {
  tamano: "tamaño",
  proteina: "proteína",
  base: "base",
  extra: "extra",
};

function OpcionesPage() {
  const opciones = Route.useLoaderData();
  const [editing, setEditing] = useState<FormState | null>(null);
  const { pending, run } = useAction();

  const open = (grupo: Grupo, o?: Opcion) =>
    setEditing(
      o
        ? {
            id: o.id,
            grupo: o.grupo,
            nombre: o.nombre,
            detalle: o.detalle ?? "",
            precio_extra: String(o.precio_extra),
            proteinas: String(o.proteinas),
            carbohidratos: String(o.carbohidratos),
            grasas: String(o.grasas),
            fibra: String(o.fibra),
            factor: String(o.factor),
            orden: o.orden,
            activo: o.activo,
          }
        : {
            grupo,
            nombre: "",
            detalle: "",
            precio_extra: "0",
            proteinas: "0",
            carbohidratos: "0",
            grasas: "0",
            fibra: "0",
            factor: "1",
            orden: byGroup(opciones, grupo).length + 1,
            activo: true,
          },
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const data: OpcionInput = {
      ...editing,
      precio_extra: parse(editing.precio_extra),
      proteinas: parse(editing.proteinas),
      carbohidratos: parse(editing.carbohidratos),
      grasas: parse(editing.grasas),
      fibra: parse(editing.fibra),
      factor: parse(editing.factor) || 1,
    };
    const ok = await run(
      () => saveOpcion({ data }),
      editing.id ? "Opción guardada." : "Opción agregada.",
    );
    if (ok) setEditing(null);
  };

  const kcalForm = editing
    ? optionKcal({
        proteinas: parse(editing.proteinas),
        carbohidratos: parse(editing.carbohidratos),
        grasas: parse(editing.grasas),
      })
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Menú"
        title="Opciones para personalizar"
        description="Lo que el cliente puede elegir en los platos marcados como personalizables. El precio y las calorías se recalculan solos."
      />

      <div className="flex gap-3 rounded-xl border bg-lime-soft/40 p-4 text-sm">
        <Info className="mt-0.5 size-5 shrink-0 text-brand-wine" />
        <div className="grid gap-1">
          <p>
            <strong>Cómo se calcula:</strong> cada opción indica cuánto <em>cambia</em> respecto a
            la receta original del plato (puede ser negativo, por ejemplo cambiar arroz por hojas
            resta carbohidratos). Las calorías salen de 4 × proteínas + 4 × carbohidratos + 9 ×
            grasas.
          </p>
          <p className="text-muted-foreground">
            En tamaño, proteína y base, la primera opción es la que viene por defecto: déjala en 0.
            Los extras son opcionales. Los tamaños multiplican toda la porción (1 = normal, 1.3 = 30
            % más).
          </p>
        </div>
      </div>

      {GRUPOS.map((g) => {
        const list = byGroup(opciones, g.id);
        return (
          <section key={g.id} className="grid gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">{g.nombre}</h2>
                <p className="text-sm text-muted-foreground">{g.ayuda}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => open(g.id)}>
                <Plus /> Agregar {NOMBRE_UNO[g.id]}
              </Button>
            </div>
            {list.length === 0 ? (
              <EmptyState>
                Sin opciones. Si un grupo está vacío, no se muestra en la web.
              </EmptyState>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {list.map((o, i) => {
                  const k = optionKcal(o);
                  return (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                    >
                      <div className="min-w-40 flex-1">
                        <p className="font-semibold">
                          {o.nombre}
                          {i === 0 && g.id !== "extra" && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Por defecto
                            </span>
                          )}
                        </p>
                        {o.detalle && <p className="text-xs text-muted-foreground">{o.detalle}</p>}
                      </div>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {o.grupo === "tamano" ? (
                          <>× {o.factor} porción</>
                        ) : (
                          <>
                            {signo(o.proteinas, " g P")} · {signo(o.carbohidratos, " g C")} ·{" "}
                            {signo(o.grasas, " g G")} ·{" "}
                            <strong className="text-foreground">{signo(k, " kcal")}</strong>
                          </>
                        )}
                      </p>
                      <p className="w-24 text-right text-sm font-semibold tabular-nums">
                        {o.precio_extra ? `+ ${formatPrice(o.precio_extra)}` : "Sin costo"}
                      </p>
                      <StatusBadge active={o.activo} on="Activa" off="Oculta" />
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => open(o.grupo, o)}
                          aria-label={`Editar ${o.nombre}`}
                        >
                          <Pencil />
                        </Button>
                        <ConfirmDelete
                          title={`Eliminar ${o.nombre}`}
                          description="Deja de estar disponible para personalizar. Esta acción no se puede deshacer."
                          onConfirm={() =>
                            void run(
                              () => deleteOpcion({ data: { id: o.id } }),
                              "Opción eliminada.",
                            )
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          {editing && (
            <form onSubmit={submit} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>
                  {editing.id ? "Editar" : "Agregar"} {NOMBRE_UNO[editing.grupo]}
                </DialogTitle>
                <DialogDescription>
                  {GRUPOS.find((g) => g.id === editing.grupo)?.ayuda}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="nombre">
                  <Input
                    id="nombre"
                    value={editing.nombre}
                    maxLength={80}
                    onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label="Detalle (opcional)"
                  htmlFor="detalle"
                  hint={editing.grupo === "tamano" ? "Ej.: 450 g" : "Ej.: a la plancha"}
                >
                  <Input
                    id="detalle"
                    value={editing.detalle ?? ""}
                    maxLength={80}
                    onChange={(e) => setEditing({ ...editing, detalle: e.target.value })}
                  />
                </Field>
              </div>
              <Field
                label="Precio adicional (S/)"
                htmlFor="precio_extra"
                hint="0 si no cambia el precio."
              >
                <Input
                  id="precio_extra"
                  inputMode="decimal"
                  value={editing.precio_extra}
                  onChange={(e) => setEditing({ ...editing, precio_extra: e.target.value })}
                />
              </Field>
              {editing.grupo === "tamano" ? (
                <Field
                  label="Multiplica la porción por"
                  htmlFor="factor"
                  hint="1 = porción normal · 0.7 = 30 % menos · 1.3 = 30 % más."
                >
                  <Input
                    id="factor"
                    inputMode="decimal"
                    value={editing.factor}
                    onChange={(e) => setEditing({ ...editing, factor: e.target.value })}
                  />
                </Field>
              ) : (
                <div className="grid gap-3">
                  <p className="text-sm font-medium">
                    Cambio frente a la receta original (gramos, puede ser negativo)
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(
                      [
                        ["proteinas", "Proteínas"],
                        ["carbohidratos", "Carbohidratos"],
                        ["grasas", "Grasas"],
                        ["fibra", "Fibra"],
                      ] as const
                    ).map(([k, label]) => (
                      <Field key={k} label={label} htmlFor={k}>
                        <Input
                          id={k}
                          inputMode="decimal"
                          value={editing[k]}
                          onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                        />
                      </Field>
                    ))}
                  </div>
                  <p
                    className="rounded-lg bg-muted/60 px-3 py-2 text-sm tabular-nums"
                    aria-live="polite"
                  >
                    Calorías de esta opción:{" "}
                    <strong className="text-brand-wine">{signo(kcalForm, " kcal")}</strong>
                  </p>
                </div>
              )}
              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <Switch
                    checked={editing.activo}
                    onCheckedChange={(activo) => setEditing({ ...editing, activo })}
                  />
                  Disponible
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
