import { useState, type ReactNode } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, PageHeader, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { useAction } from "@/components/admin/hooks";
import { canAccess } from "@/lib/permissions";
import { getEmpresaAdmin, saveEmpresa, type EmpresaInput } from "@/functions/admin/empresa";
import type { Empresa } from "@/lib/types";

export const Route = createFileRoute("/admin/_panel/empresa")({
  staticData: { title: "Información de la empresa", section: "Negocio" },
  beforeLoad: ({ context }) => {
    if (!canAccess(context.user, "empresa")) throw redirect({ to: "/admin" });
  },
  loader: () => getEmpresaAdmin(),
  component: EmpresaPage,
});

const NUMEROS = ["anio_fundacion", "clientes_mes", "equipo"] as const;
type Numero = (typeof NUMEROS)[number];
type TextKey = Exclude<keyof Empresa, Numero | "imagen_url" | "imagen_public_id">;
type FormState = Record<TextKey | Numero, string> &
  Pick<Empresa, "imagen_url" | "imagen_public_id">;

const toForm = (e: Empresa): FormState => {
  const f = {} as Record<string, string | null>;
  for (const [k, v] of Object.entries(e))
    f[k] = k.startsWith("imagen") ? (v as string | null) : v === null ? "" : String(v);
  return f as FormState;
};

function EmpresaPage() {
  const empresa = Route.useLoaderData();
  const { cloudinary } = Route.useRouteContext();
  const [f, setF] = useState<FormState>(() => toForm(empresa));
  const { pending, run } = useAction();
  const anio = new Date().getFullYear();

  const set =
    (k: TextKey | Numero) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  const txt = (
    k: TextKey,
    label: string,
    opts: { hint?: string; placeholder?: string; rows?: number; max?: number; type?: string } = {},
  ) => (
    <Field label={label} htmlFor={k} {...(opts.hint ? { hint: opts.hint } : {})}>
      {opts.rows ? (
        <Textarea
          id={k}
          rows={opts.rows}
          maxLength={opts.max}
          value={f[k]}
          onChange={set(k)}
          placeholder={opts.placeholder}
        />
      ) : (
        <Input
          id={k}
          type={opts.type ?? "text"}
          maxLength={opts.max}
          value={f[k]}
          onChange={set(k)}
          placeholder={opts.placeholder}
        />
      )}
    </Field>
  );
  const num = (v: string) => {
    const t = v.trim().replace(/[.,\s]/g, "");
    return t ? Number(t) : null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data: EmpresaInput = {
      nombre: f.nombre,
      eslogan: f.eslogan,
      ciudad: f.ciudad,
      anio_fundacion: num(f.anio_fundacion),
      clientes_mes: num(f.clientes_mes),
      equipo: num(f.equipo),
      intro_titulo: f.intro_titulo,
      intro_texto: f.intro_texto,
      historia_titulo: f.historia_titulo,
      historia_texto: f.historia_texto,
      mision: f.mision,
      vision: f.vision,
      whatsapp: f.whatsapp,
      telefono: f.telefono,
      email: f.email,
      horario: f.horario,
      instagram: f.instagram,
      facebook: f.facebook,
      tiktok: f.tiktok,
      resenas_url: f.resenas_url,
      reclamaciones_url: f.reclamaciones_url,
      imagen_url: f.imagen_url,
      imagen_public_id: f.imagen_public_id,
    };
    await run(() => saveEmpresa({ data }), "Información guardada. Ya se ve en la web.");
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <PageHeader
        eyebrow="Negocio"
        title="Información de la empresa"
        description="Datos que aparecen en el encabezado, el pie de página, el botón de WhatsApp, las cifras y la página Nosotros."
        action={
          <Button asChild variant="outline">
            <a href="/nosotros" target="_blank" rel="noreferrer">
              Ver Nosotros <ExternalLink />
            </a>
          </Button>
        }
      />

      <Bloque titulo="Identidad" ayuda="Nombre, frase y foto principal de la empresa.">
        <div className="grid gap-4 sm:grid-cols-3">
          {txt("nombre", "Nombre comercial", { max: 80 })}
          {txt("ciudad", "Ciudad", { max: 80 })}
          {txt("horario", "Horario general", {
            max: 160,
            placeholder: "Lun – Dom · 8:00 a.m. – 9:00 p.m.",
          })}
        </div>
        {txt("eslogan", "Frase de la marca", { max: 200, hint: "Se muestra en el pie de página." })}
        <ImageField
          carpeta="empresa"
          cloudinary={cloudinary}
          label="Foto de la empresa (Nosotros y portada)"
          value={{ url: f.imagen_url, publicId: f.imagen_public_id }}
          onChange={(img) => setF({ ...f, imagen_url: img.url, imagen_public_id: img.publicId })}
        />
      </Bloque>

      <Bloque
        titulo="Cifras"
        ayuda="Se muestran en los círculos de la portada y de Nosotros. Si dejas una vacía, ese círculo no aparece. Las sedes y la cantidad de platos se cuentan solas."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Año de fundación"
            htmlFor="anio_fundacion"
            hint={
              num(f.anio_fundacion)
                ? `Se mostrará: +${Math.max(0, anio - (num(f.anio_fundacion) ?? anio))} años`
                : "Ej.: 2018"
            }
          >
            <Input
              id="anio_fundacion"
              inputMode="numeric"
              maxLength={4}
              value={f.anio_fundacion}
              onChange={set("anio_fundacion")}
            />
          </Field>
          <Field
            label="Clientes al mes"
            htmlFor="clientes_mes"
            hint="Solo cifras reales. Ej.: 20000 se ve como +20k."
          >
            <Input
              id="clientes_mes"
              inputMode="numeric"
              value={f.clientes_mes}
              onChange={set("clientes_mes")}
            />
          </Field>
          <Field label="Personas en el equipo" htmlFor="equipo" hint="Se muestra en Nosotros.">
            <Input id="equipo" inputMode="numeric" value={f.equipo} onChange={set("equipo")} />
          </Field>
        </div>
      </Bloque>

      <Bloque titulo="Textos de Nosotros" ayuda="Los bloques vacíos no se muestran en la web.">
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("intro_titulo", "Título principal", {
            max: 160,
            placeholder: "Cocinamos lo que nos gustaría comer cada día",
          })}
          {txt("historia_titulo", "Título de la historia", { max: 160 })}
        </div>
        {txt("intro_texto", "Presentación", {
          rows: 2,
          max: 500,
          hint: "También aparece en la portada, junto a “Conoce Vital Foods”.",
        })}
        {txt("historia_texto", "Nuestra historia", {
          rows: 5,
          max: 3000,
          hint: "Usa Enter para separar párrafos.",
        })}
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("mision", "Misión", { rows: 3, max: 400 })}
          {txt("vision", "Visión", { rows: 3, max: 400 })}
        </div>
      </Bloque>

      <Bloque
        titulo="Contacto"
        ayuda="El WhatsApp activa el botón flotante y el botón “Pedir por WhatsApp” de cada plato."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {txt("whatsapp", "WhatsApp", {
            placeholder: "51987654321",
            hint: "Con código de país, solo números.",
          })}
          {txt("telefono", "Teléfono", { max: 30 })}
          {txt("email", "Correo", { type: "email", max: 120 })}
        </div>
      </Bloque>

      <Bloque
        titulo="Redes y enlaces"
        ayuda="Pega la dirección completa (https://…). Las redes vacías no se muestran."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {txt("instagram", "Instagram", { placeholder: "https://instagram.com/…" })}
          {txt("facebook", "Facebook", { placeholder: "https://facebook.com/…" })}
          {txt("tiktok", "TikTok", { placeholder: "https://tiktok.com/@…" })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("resenas_url", "Reseñas (Google u otra)", {
            placeholder: "https://g.page/…",
            hint: "Botón “Ver todas las reseñas” en Nosotros.",
          })}
          {txt("reclamaciones_url", "Libro de Reclamaciones", {
            placeholder: "https://…",
            hint: "Enlace en el pie de página.",
          })}
        </div>
      </Bloque>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="button" variant="outline" onClick={() => setF(toForm(empresa))}>
          Descartar cambios
        </Button>
        <SubmitButton pending={pending}>Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}

function Bloque({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-extrabold">{titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ayuda}</p>
      </div>
      {children}
    </section>
  );
}
