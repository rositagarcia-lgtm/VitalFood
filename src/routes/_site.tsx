import { Outlet, createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { getSiteData } from "@/functions/public";

export const Route = createFileRoute("/_site")({
  loader: () => getSiteData(),
  staleTime: 60_000,
  component: SiteLayout,
});

function SiteLayout() {
  const site = Route.useLoaderData();
  return (
    <SiteShell site={site}>
      <Outlet />
    </SiteShell>
  );
}

const siteApi = getRouteApi("/_site");

/** Datos de la empresa y sedes para cualquier página pública. */
export const useSite = () => siteApi.useLoaderData();
