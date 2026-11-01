import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Calculator, ImageOff, Pencil, Plus, Search, Star, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDelete, EmptyState, Field, PageHeader, SubmitButton } from "@/components/admin/ui";
import { GalleryField, ImageField } from "@/components/admin/ImageField";
import { useAction } from "@/components/admin/hooks";
import { toInt } from "@/lib/utils";
import { canAccess } from "@/lib/permissions";
import {
  deletePlatillo,
  listPlatillos,
  savePlatillo,
  togglePlatillo,
  type PlatilloInput,
} from "@/functions/admin/platillos";
import { listCategorias } from "@/functions/admin/categorias";
import { formatPrice, optimizedImage } from "@/lib/images";
import { kcalFromMacros, platoKcal } from "@/lib/nutrition";
import type { Platillo } from "@/lib/types";

export const Route = createFileRoute("/admin/_panel/platillos")({
  staticData: { title: "Platillos y precios", section: "Menú" },
  beforeLoad: ({ context }) => {
    if (!canAccess(context.user, "platillos")) throw redirect({ to: "/admin" });
  },
  loader: async () => {
    const [platillos, categorias] = await Promise.all([listPlatillos(), listCategorias()]);
    return { platillos, categorias };
  },
  component: PlatillosPage,
});

const NUMEROS = [
  "precio",
  "precio_oferta",
  "porcion_g",
  "proteinas",
  "carbohidratos",
  "grasas",
  "fibra",
  "kcal_manual",
] as const;
type Numero = (typeof NUMEROS)[number];
type FormState = Omit<PlatilloInput, Numero> & Record<Numero, string>;

const parseMoney = (v: string) => Number.parseFloat(v.replace(",", "."));
const parseOpt = (v: string) => (v.trim() ? parseMoney(v) : null);
const str = (n: number | null) => (n === null ? "" : String(n));

const OBJETIVOS: { id: PlatilloInput["objetivos"][number]; nombre: string }[] = [
  { id: "proteina", nombre: "Más proteína" },
  { id: "bajo", nombre: "Bajo en calorías" },
  { id: "vegano", nombre: "Vegano" },
  { id: "energia", nombre: "Energía para el día" },
];
const ETIQUETAS_SUGERIDAS = [
  "Alto en proteína",
  "Sin gluten",
  "Vegetariano",
  "Vegano",
  "Sin lactosa",
  "Sin azúcar añadida",
];

const ALL = "todas";

function PlatillosPage() {
  const { platillos, categorias } = Route.useLoaderData();
  const { cloudinary } = Route.useRouteContext();
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState(ALL);
  const [editing, setEditing] = useState<FormState | null>(null);
  const { pending, run } = useAction();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return platillos.filter(
      (p) =>
        (categoria === ALL || String(p.categoria_id) === categoria) &&
        (!q ||
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion ?? "").toLowerCase().includes(q)),
    );
  }, [platillos, query, categoria]);

  const open = (p?: Platillo) =>
    setEditing(
      p
        ? {
            id: p.id,
            categoria_id: p.categoria_id,
            nombre: p.nombre,
            descripcion: p.descripcion ?? "",
            precio: p.precio.toFixed(2),
            precio_oferta: p.precio_oferta === null ? "" : p.precio_oferta.toFixed(2),
            disponible: p.disponible,
            destacado: p.destacado,
            orden: p.orden,
            imagen_url: p.imagen_url,
            imagen_public_id: p.imagen_public_id,
            porcion_g: str(p.porcion_g),
            proteinas: str(p.proteinas),
            carbohidratos: str(p.carbohidratos),
            grasas: str(p.grasas),
            fibra: str(p.fibra),
            kcal_manual: str(p.kcal_manual),
            etiquetas: p.etiquetas,
            objetivos: p.objetivos.filter((o): o is FormState["objetivos"][number] =>
              OBJETIVOS.some((x) => x.id === o),
            ),
            ingredientes: p.ingredientes ?? "",
            alergenos: p.alergenos ?? "",
            conservacion: p.conservacion ?? "",
            personalizable: p.personalizable,
            galeria: p.galeria,
          }
        : {
            categoria_id: categorias[0]?.id ?? 0,
            nombre: "",
            descripcion: "",
            precio: "",
            precio_oferta: "",
            disponible: true,
            destacado: false,
            orden: platillos.length + 1,
            imagen_url: null,
            imagen_public_id: null,
            porcion_g: "",
            proteinas: "",
            carbohidratos: "",
            grasas: "",
            fibra: "",
            kcal_manual: "",
            etiquetas: [],
            objetivos: [],
            ingredientes: "",
            alergenos: "",
            conservacion: "",
            personalizable: false,
            galeria: [],
          },
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const porcion = parseOpt(editing.porcion_g);
    const kcal = parseOpt(editing.kcal_manual);
    const data: PlatilloInput = {
      ...editing,
      precio: parseMoney(editing.precio),
      precio_oferta: parseOpt(editing.precio_oferta),
      porcion_g: porcion === null ? null : Math.round(porcion),
      proteinas: parseOpt(editing.proteinas),
      carbohidratos: parseOpt(editing.carbohidratos),
      grasas: parseOpt(editing.grasas),
      fibra: parseOpt(editing.fibra),
      kcal_manual: kcal === null ? null : Math.round(kcal),
    };
    const ok = await run(
      () => savePlatillo({ data }),
      editing.id ? "Platillo actualizado." : "Platillo creado.",
    );
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Menú"
        title="Platillos y precios"
        description="Lo que tus clientes ven en el menú y en el detalle de cada plato: precios, fotos, calorías y etiquetas. Los cambios se publican al guardar."
        action={
          <Button variant="burgundy" onClick={() => open()} disabled={categorias.length === 0}>
            <Plus /> Nuevo platillo
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar platillo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-card pl-9"
            aria-label="Buscar platillo"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="bg-card sm:w-56" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          {platillos.length === 0
            ? "Aún no hay platillos."
            : "Ningún platillo coincide con la búsqueda."}
        </EmptyState>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platillo</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Nutrición</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Visible</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => {
                const thumb = optimizedImage(p.imagen_url, 120);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageOff className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold">
                            {p.nombre}
                            {p.destacado && (
                              <Star
                                className="size-3.5 fill-warning text-warning"
                                aria-label="Se muestra en la portada"
                              />
                            )}
                          </p>
                          <p className="max-w-xs truncate text-xs text-muted-foreground">
                            {p.descripcion}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.categoria}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-right text-sm lg:table-cell">
                      {platoKcal(p) !== null ? (
                        <span className="tabular-nums">
                          <strong>{platoKcal(p)}</strong> kcal
                          {p.proteinas !== null && (
                            <span className="text-muted-foreground"> · {p.proteinas} g prot.</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                          <TriangleAlert className="size-3" /> Falta completar
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {p.precio_oferta === null ? (
                        formatPrice(p.precio)
                      ) : (
                        <span className="grid justify-items-end">
                          <span className="text-brand-wine">{formatPrice(p.precio_oferta)}</span>
                          <s className="text-xs font-normal text-muted-foreground">
                            {formatPrice(p.precio)}
                          </s>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.disponible}
                        aria-label={`Disponibilidad de ${p.nombre}`}
                        onCheckedChange={(disponible) =>
                          void run(() => togglePlatillo({ data: { id: p.id, disponible } }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => open(p)}
                        aria-label={`Editar ${p.nombre}`}
                      >
                        <Pencil />
                      </Button>
                      <ConfirmDelete
                        title={`Eliminar ${p.nombre}`}
                        description="El platillo y su imagen se eliminarán. Esta acción no se puede deshacer."
                        onConfirm={() =>
                          void run(
                            () => deletePlatillo({ data: { id: p.id } }),
                            "Platillo eliminado.",
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {editing && (
            <form onSubmit={submit} className="grid gap-6">
              <DialogHeader>
                <DialogTitle>{editing.id ? "Editar platillo" : "Nuevo platillo"}</DialogTitle>
                <DialogDescription>
                  Los cambios se reflejan de inmediato en la web.
                </DialogDescription>
              </DialogHeader>

              <Seccion
                titulo="Fotos"
                ayuda="La foto principal sale en el menú. Las adicionales se ven en el detalle del plato (máximo 6)."
              >
                <ImageField
                  carpeta="platillos"
                  cloudinary={cloudinary}
                  label="Foto principal"
                  value={{ url: editing.imagen_url, publicId: editing.imagen_public_id }}
                  onChange={(img) =>
                    setEditing({ ...editing, imagen_url: img.url, imagen_public_id: img.publicId })
                  }
                />
                <div className="grid gap-1.5">
                  <span className="text-sm font-medium">Fotos adicionales</span>
                  <GalleryField
                    carpeta="platillos"
                    cloudinary={cloudinary}
                    value={editing.galeria}
                    onChange={(galeria) => setEditing({ ...editing, galeria })}
                  />
                </div>
              </Seccion>

              <Seccion titulo="Datos del plato">
                <Field label="Nombre" htmlFor="nombre">
                  <Input
                    id="nombre"
                    value={editing.nombre}
                    onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                    maxLength={100}
                    required
                  />
                </Field>
                <Field
                  label="Descripción corta"
                  htmlFor="descripcion"
                  hint="Se muestra en la tarjeta del menú y arriba en el detalle."
                >
                  <Textarea
                    id="descripcion"
                    value={editing.descripcion ?? ""}
                    onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                    rows={2}
                    maxLength={1000}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Categoría" htmlFor="categoria">
                    <Select
                      value={String(editing.categoria_id)}
                      onValueChange={(v) => setEditing({ ...editing, categoria_id: Number(v) })}
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Precio normal (S/)" htmlFor="precio">
                    <Input
                      id="precio"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={editing.precio}
                      onChange={(e) => setEditing({ ...editing, precio: e.target.value })}
                      required
                    />
                  </Field>
                  <Field
                    label="Precio de oferta (S/)"
                    htmlFor="oferta"
                    hint="Opcional. Vacío = sin oferta."
                  >
                    <Input
                      id="oferta"
                      inputMode="decimal"
                      placeholder="Sin oferta"
                      value={editing.precio_oferta}
                      onChange={(e) => setEditing({ ...editing, precio_oferta: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={editing.disponible}
                      onCheckedChange={(disponible) => setEditing({ ...editing, disponible })}
                    />
                    Visible en la web
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={editing.destacado}
                      onCheckedChange={(destacado) => setEditing({ ...editing, destacado })}
                    />
                    Mostrar en la portada
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <span className="shrink-0">Posición</span>
                    <Input
                      type="number"
                      min={0}
                      value={editing.orden}
                      onChange={(e) => setEditing({ ...editing, orden: toInt(e.target.value) })}
                      className="h-8 w-20"
                      aria-label="Posición en la lista (1 aparece primero)"
                    />
                  </label>
                </div>
              </Seccion>

              <Nutricion editing={editing} setEditing={setEditing} />

              <Seccion
                titulo="Etiquetas y objetivos"
                ayuda="Sirven para los filtros del menú (por ejemplo “Sin gluten” o “Más proteína”)."
              >
                <Etiquetas
                  value={editing.etiquetas}
                  sugeridas={[
                    ...new Set([...ETIQUETAS_SUGERIDAS, ...platillos.flatMap((p) => p.etiquetas)]),
                  ]}
                  onChange={(etiquetas) => setEditing({ ...editing, etiquetas })}
                />
                <fieldset className="grid gap-2">
                  <legend className="mb-1.5 text-sm font-medium">Ideal para</legend>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS.map((o) => {
                      const on = editing.objetivos.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setEditing({
                              ...editing,
                              objetivos: on
                                ? editing.objetivos.filter((x) => x !== o.id)
                                : [...editing.objetivos, o.id],
                            })
                          }
                          className={
                            on
                              ? "rounded-full border border-brand-wine bg-brand-wine px-3 py-1.5 text-sm font-semibold text-brand-wine-foreground"
                              : "rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:border-foreground/40"
                          }
                        >
                          {o.nombre}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Switch
                    checked={editing.personalizable}
                    onCheckedChange={(personalizable) => setEditing({ ...editing, personalizable })}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">El cliente puede personalizarlo</span>
                    <span className="block text-xs text-muted-foreground">
                      Muestra en el detalle las opciones de tamaño, proteína, base y extras (se
                      configuran en “Opciones del menú”) y recalcula precio y calorías según lo que
                      elija.
                    </span>
                  </span>
                </label>
              </Seccion>

              <Seccion
                titulo="Información del detalle"
                ayuda="Cada texto aparece como una sección desplegable en la página del plato. Vacío = no se muestra."
              >
                <Field label="Ingredientes" htmlFor="ingredientes">
                  <Textarea
                    id="ingredientes"
                    rows={2}
                    maxLength={1000}
                    value={editing.ingredientes ?? ""}
                    onChange={(e) => setEditing({ ...editing, ingredientes: e.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Alérgenos"
                    htmlFor="alergenos"
                    hint="Ej.: Contiene frutos secos y lácteos."
                  >
                    <Textarea
                      id="alergenos"
                      rows={2}
                      maxLength={300}
                      value={editing.alergenos ?? ""}
                      onChange={(e) => setEditing({ ...editing, alergenos: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="Conservación y preparación"
                    htmlFor="conservacion"
                    hint="Ej.: Refrigerar entre 0 y 5 °C."
                  >
                    <Textarea
                      id="conservacion"
                      rows={2}
                      maxLength={300}
                      value={editing.conservacion ?? ""}
                      onChange={(e) => setEditing({ ...editing, conservacion: e.target.value })}
                    />
                  </Field>
                </div>
              </Seccion>

              <DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 border-t bg-background px-6 py-4">
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

function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-wine">
          {titulo}
        </h3>
        {ayuda && <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

const MACROS = [
  { k: "proteinas", label: "Proteínas", factor: 4, color: "bg-brand-wine" },
  { k: "carbohidratos", label: "Carbohidratos", factor: 4, color: "bg-primary" },
  { k: "grasas", label: "Grasas", factor: 9, color: "bg-warning" },
] as const;

/**
 * Nutrición: con proteínas, carbohidratos y grasas por porción, las calorías se calculan solas
 * (4 kcal por gramo de proteína o carbohidrato y 9 por gramo de grasa). Si el plato tiene una
 * ficha técnica con otra cifra, se puede escribir a mano.
 */
function Nutricion({
  editing,
  setEditing,
}: {
  editing: FormState;
  setEditing: (f: FormState) => void;
}) {
  const n = (v: string) => {
    const x = parseOpt(v);
    return x === null || Number.isNaN(x) ? null : x;
  };
  const valores = {
    proteinas: n(editing.proteinas),
    carbohidratos: n(editing.carbohidratos),
    grasas: n(editing.grasas),
  };
  const { proteinas: p, carbohidratos: c, grasas: g } = valores;
  const completo = p !== null && c !== null && g !== null;
  const calculadas = completo ? kcalFromMacros(p, c, g) : null;
  const manual = n(editing.kcal_manual);
  const algo = p !== null || c !== null || g !== null;
  const set = (k: Numero, v: string) => setEditing({ ...editing, [k]: v });
  const pct = (k: (typeof MACROS)[number]) =>
    calculadas ? (((valores[k.k] ?? 0) * k.factor) / calculadas) * 100 : 0;

  return (
    <Seccion
      titulo="Nutrición por porción"
      ayuda="Escribe los gramos de una porción. Si aún no los tienes, deja todo vacío: la web indicará que se está completando."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Field label="Porción (g)" htmlFor="porcion_g">
          <Input
            id="porcion_g"
            inputMode="numeric"
            placeholder="450"
            value={editing.porcion_g}
            onChange={(e) => set("porcion_g", e.target.value)}
          />
        </Field>
        {MACROS.map((m) => (
          <Field key={m.k} label={`${m.label} (g)`} htmlFor={m.k}>
            <Input
              id={m.k}
              inputMode="decimal"
              placeholder="0"
              value={editing[m.k]}
              onChange={(e) => set(m.k, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Fibra (g)" htmlFor="fibra">
          <Input
            id="fibra"
            inputMode="decimal"
            placeholder="Opcional"
            value={editing.fibra}
            onChange={(e) => set("fibra", e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Calculator className="size-5 text-brand-wine" aria-hidden="true" />
          {completo ? (
            <p className="text-sm tabular-nums" aria-live="polite">
              <span className="text-muted-foreground">
                4 × {p} + 4 × {c} + 9 × {g} ={" "}
              </span>
              <strong className="text-lg text-brand-wine">{calculadas} kcal</strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {algo
                ? "Completa proteínas, carbohidratos y grasas para calcular las calorías."
                : "Las calorías se calculan solas al escribir los macronutrientes."}
            </p>
          )}
        </div>
        {completo && calculadas ? (
          <>
            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              {MACROS.map((m) => (
                <span key={m.k} className={m.color} style={{ width: `${pct(m)}%` }} />
              ))}
            </div>
            <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
              {MACROS.map((m) => (
                <span key={m.k}>
                  {m.label}: {Math.round(pct(m))}% de las calorías
                </span>
              ))}
            </p>
          </>
        ) : null}
        <div className="mt-4 grid gap-1.5 sm:max-w-sm">
          <label htmlFor="kcal_manual" className="text-sm font-medium">
            Calorías según ficha técnica (opcional)
          </label>
          <div className="flex gap-2">
            <Input
              id="kcal_manual"
              inputMode="numeric"
              placeholder={calculadas !== null ? `Usar las calculadas (${calculadas})` : "Ej.: 520"}
              value={editing.kcal_manual}
              onChange={(e) => set("kcal_manual", e.target.value)}
            />
            {editing.kcal_manual && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => set("kcal_manual", "")}
                aria-label="Usar las calorías calculadas"
              >
                <X />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {manual !== null
              ? `La web mostrará ${Math.round(manual)} kcal${calculadas !== null && Math.abs(manual - calculadas) > calculadas * 0.15 ? ". Difiere bastante del cálculo: revisa los gramos" : ""}.`
              : "Déjalo vacío para usar el cálculo automático."}
          </p>
        </div>
      </div>
    </Seccion>
  );
}

function Etiquetas({
  value,
  sugeridas,
  onChange,
}: {
  value: string[];
  sugeridas: string[];
  onChange: (v: string[]) => void;
}) {
  const [texto, setTexto] = useState("");
  const agregar = (t: string) => {
    const v = t.trim().slice(0, 40);
    setTexto("");
    if (!v || value.some((x) => x.toLowerCase() === v.toLowerCase()) || value.length >= 10) return;
    onChange([...value, v]);
  };
  const libres = sugeridas.filter((s) => !value.includes(s));
  return (
    <div className="grid gap-2">
      <label htmlFor="etiqueta" className="text-sm font-medium">
        Etiquetas
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-lime-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Quitar ${t}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="etiqueta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              agregar(texto);
            } else if (e.key === "Backspace" && !texto && value.length)
              onChange(value.slice(0, -1));
          }}
          onBlur={() => texto && agregar(texto)}
          placeholder={value.length ? "" : "Escribe y presiona Enter"}
          className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none"
          maxLength={40}
        />
      </div>
      {libres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {libres.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => agregar(s)}
              className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:border-brand-wine hover:text-brand-wine"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
