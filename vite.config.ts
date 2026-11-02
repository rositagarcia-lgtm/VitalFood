import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
};

// Caché del servidor de producción:
// - páginas y datos: siempre se revalidan, así nadie ve precios desactualizados;
// - imágenes locales: 7 días (las de Cloudinary ya llegan desde su CDN con caché propia);
// - archivos con hash en el nombre: un año, porque cambian de nombre en cada versión.
const routeRules = {
  "/**": { headers: { ...securityHeaders, "cache-control": "no-cache" } },
  "/_serverFn/**": { headers: { ...securityHeaders, "cache-control": "private, no-store" } },
  "/admin/**": { headers: { ...securityHeaders, "cache-control": "private, no-store" } },
  "/images/**": {
    headers: {
      ...securityHeaders,
      "cache-control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  },
  "/assets/**": {
    headers: { ...securityHeaders, "cache-control": "public, max-age=31536000, immutable" },
  },
};

export default defineConfig(({ command, mode }) => {
  // Las server functions leen process.env; en desarrollo se cargan desde .env
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ""), ...process.env });

  return {
    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    // Sin index.html Vite descubre dependencias al navegar y re-optimiza a mitad de carga,
    // lo que duplica React en desarrollo; por eso se declaran por adelantado.
    optimizeDeps: {
      include: [
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-dialog",
        "@radix-ui/react-label",
        "@radix-ui/react-select",
        "@radix-ui/react-separator",
        "@radix-ui/react-slot",
        "@radix-ui/react-switch",
        "@radix-ui/react-tooltip",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "sonner",
        "tailwind-merge",
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    // En el navegador, agrupa el código del sitio público y los íconos en pocos archivos: antes la
    // portada pedía unos 24 scripts pequeños (cada ícono por separado) y en Render se encolaban.
    // Las librerías del panel quedan aparte para no cargarlas en la web pública.
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  { name: "icons", test: /lucide-react/, priority: 2 },
                  { name: "site", test: /src\/(components\/site|lib|routes\/_site)/, priority: 1 },
                ],
              },
            },
          },
        },
      },
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      ...(command === "build" ? [nitro({ routeRules })] : []),
      viteReact(),
    ],
  };
});
