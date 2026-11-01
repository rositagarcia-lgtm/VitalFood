import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/ui";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { useAdminTheme } from "@/components/admin/hooks";
import { getCurrentUser, login } from "@/functions/auth";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    if (await getCurrentUser()) throw redirect({ to: "/admin" });
  },
  head: () => ({
    meta: [{ title: "Iniciar sesión | Vital Foods" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

const RECORDAR = "vf-admin-email";

function LoginPage() {
  useAdminTheme();
  const router = useRouter();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [mayus, setMayus] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Solo se recuerda el correo en este navegador, nunca la contraseña
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(RECORDAR);
      if (guardado) {
        setEmail(guardado);
        setRecordar(true);
        document.getElementById("password")?.focus();
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    setPending(true);
    try {
      await login({ data: { email: email.trim(), password } });
      try {
        if (recordar) localStorage.setItem(RECORDAR, email.trim());
        else localStorage.removeItem(RECORDAR);
      } catch {
        /* almacenamiento no disponible */
      }
      await router.invalidate();
      await navigate({ to: "/admin/verificacion" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
      setPassword("");
      setPending(false);
    }
  };

  const capsLock = (e: React.KeyboardEvent) => setMayus(e.getModifierState("CapsLock"));

  return (
    <AuthLayout
      paso={1}
      titulo="Bienvenido de nuevo"
      subtitulo="Ingresa con tu cuenta del equipo de Vital Foods."
      volver={{ to: "/", label: "Volver al sitio" }}
    >
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        <Field label="Correo" htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="tu@vitalfoods.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10"
              required
              autoFocus
            />
          </div>
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={ver ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={capsLock}
              onKeyDown={capsLock}
              className="h-12 pl-10 pr-12"
              aria-describedby={mayus ? "mayus" : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setVer(!ver)}
              aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={ver}
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mayus && (
            <p
              id="mayus"
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning"
            >
              <TriangleAlert className="size-3.5" /> Tienes activadas las mayúsculas.
            </p>
          )}
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="size-4 accent-[var(--brand-wine)]"
          />
          Recordar mi correo en este equipo
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <Button type="submit" variant="burgundy" disabled={pending} className="h-12 text-base">
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Ingresando…" : "Continuar"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          ¿Olvidaste tu contraseña? Pide a un administrador que la restablezca desde Usuarios.
        </p>
      </form>
    </AuthLayout>
  );
}
