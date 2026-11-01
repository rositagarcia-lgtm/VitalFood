import { useEffect, useRef, useState } from "react";
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/ui";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { useAdminTheme } from "@/components/admin/hooks";
import { getCurrentUser, getMfaState, startMfaSetup, verifyMfa } from "@/functions/auth";

export const Route = createFileRoute("/admin/verificacion")({
  beforeLoad: async () => {
    if (await getCurrentUser()) throw redirect({ to: "/admin" });
    const estado = await getMfaState();
    if (!estado) throw redirect({ to: "/admin/login" });
    return { estado };
  },
  head: () => ({
    meta: [
      { title: "Verificación en dos pasos | Vital Foods" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerificacionPage,
});

function VerificacionPage() {
  useAdminTheme();
  const { estado } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const configurar = estado.modo === "configurar";

  useEffect(() => {
    if (!configurar) return;
    startMfaSetup()
      .then(setSetup)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudo preparar el código QR."),
      );
  }, [configurar]);

  const enviando = useRef(false);
  const enviar = async (valor: string) => {
    if (enviando.current) return;
    enviando.current = true;
    setError(null);
    setPending(true);
    try {
      await verifyMfa({ data: { code: valor } });
      await router.invalidate();
      await navigate({ to: "/admin" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo verificar el código.");
      setCode("");
      setPending(false);
      document.getElementById("code")?.focus();
    } finally {
      enviando.current = false;
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length === 6) void enviar(code);
  };

  return (
    <AuthLayout
      paso={2}
      titulo={configurar ? "Protege tu cuenta" : "Verificación en dos pasos"}
      subtitulo={
        <>
          Ingresando como <strong className="text-foreground">{estado.email}</strong>
        </>
      }
      volver={{ to: "/admin/login", label: "Cambiar de cuenta" }}
    >
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {configurar ? (
          <div className="grid gap-4 text-sm">
            <p className="font-semibold">
              Además de la contraseña, el panel pide un código de tu celular. Solo se configura una
              vez:
            </p>
            <ol className="grid gap-2.5 text-muted-foreground">
              {[
                <>
                  Instala <strong className="text-foreground">Google Authenticator</strong> o{" "}
                  <strong className="text-foreground">Microsoft Authenticator</strong>.
                </>,
                <>En la app, elige “Agregar cuenta” y escanea este código.</>,
                <>Escribe abajo el código de 6 dígitos que aparece en la app.</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime-soft text-xs font-extrabold text-brand-wine">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="grid place-items-center rounded-xl border bg-white p-3">
              {setup ? (
                <div
                  role="img"
                  aria-label="Código QR para vincular la app de autenticación"
                  className="size-44 [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: setup.qr }}
                />
              ) : (
                <Loader2 className="my-16 size-6 animate-spin text-muted-foreground" />
              )}
            </div>
            {setup && (
              <details className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                <summary className="cursor-pointer font-semibold">
                  ¿No puedes escanear? Escribe esta clave
                </summary>
                <code className="mt-2 block break-all font-mono text-sm tracking-wider">
                  {setup.secret.match(/.{1,4}/g)?.join(" ")}
                </code>
              </details>
            )}
          </div>
        ) : (
          <p className="flex items-start gap-3 rounded-xl bg-lime-soft/60 p-4 text-sm text-foreground">
            <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-wine" />
            Abre tu app de autenticación y escribe el código de 6 dígitos de Vital Foods. Cambia
            cada 30 segundos.
          </p>
        )}

        <Field label="Código de 6 dígitos" htmlFor="code">
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(v);
              // Se envía solo al completar los 6 dígitos
              if (v.length === 6) void enviar(v);
            }}
            disabled={pending}
            className="h-14 text-center font-mono text-3xl tracking-[0.5em]"
            placeholder="······"
            autoFocus
            required
          />
        </Field>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="burgundy"
          disabled={pending || code.length !== 6}
          className="h-12 text-base"
        >
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Verificando…" : configurar ? "Activar y entrar" : "Verificar y entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
