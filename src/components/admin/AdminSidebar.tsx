import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ChevronLeft,
  ExternalLink,
  History,
  LayoutGrid,
  Leaf,
  LogOut,
  MapPin,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Modulo, SessionUser } from "@/lib/types";
import { canAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Item = { label: string; to: string; icon: LucideIcon; badge?: number };
type Group = { label: string; items: Item[] };

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const ROLE_LABEL = { admin: "Administrador", editor: "Editor" } as const;

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md bg-brand-wine text-xs font-bold text-brand-wine-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AdminSidebar({
  user,
  alertCount,
  onLogout,
}: {
  user: SessionUser;
  alertCount: number;
  onLogout: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { toggleSidebar, state } = useSidebar();

  const mod = (modulo: Modulo, item: Item) => (canAccess(user, modulo) ? [item] : []);
  const groups: Group[] = [
    {
      label: "General",
      items: [
        {
          label: "Inicio del panel",
          to: "/admin",
          icon: LayoutGrid,
          ...(alertCount > 0 && { badge: alertCount }),
        },
      ],
    },
    {
      label: "Menú",
      items: [
        ...mod("platillos", {
          label: "Platillos y precios",
          to: "/admin/platillos",
          icon: UtensilsCrossed,
        }),
        ...mod("categorias", { label: "Categorías", to: "/admin/categorias", icon: Tags }),
        ...mod("platillos", {
          label: "Opciones para personalizar",
          to: "/admin/opciones",
          icon: SlidersHorizontal,
        }),
      ],
    },
    {
      label: "Negocio",
      items: [
        ...mod("sedes", { label: "Sedes", to: "/admin/sedes", icon: MapPin }),
        ...mod("promociones", {
          label: "Banners de portada",
          to: "/admin/promociones",
          icon: Megaphone,
        }),
        ...mod("empresa", {
          label: "Información de la empresa",
          to: "/admin/empresa",
          icon: Building2,
        }),
        ...mod("empresa", {
          label: "Contenido de Nosotros",
          to: "/admin/nosotros",
          icon: Sparkles,
        }),
      ],
    },
  ];
  if (user.rol === "admin") {
    groups.push({
      label: "Accesos",
      items: [
        { label: "Usuarios y permisos", to: "/admin/usuarios", icon: UsersRound },
        { label: "Historial de cambios", to: "/admin/historial", icon: History },
      ],
    });
  }
  const visibleGroups = groups.filter((g) => g.items.length > 0);

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(to);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-1" title="Ver sitio público">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" strokeWidth={2.5} />
          </span>
          <span className="truncate text-base font-extrabold text-brand-wine group-data-[collapsible=icon]:hidden">
            vital<span className="text-primary">foods</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to)}
                      tooltip={item.label}
                      className="h-9 data-[active=true]:border data-[active=true]:border-sidebar-border data-[active=true]:shadow-sm"
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge !== undefined && (
                      <SidebarMenuBadge className="rounded-md border border-sidebar-border">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <UserAvatar name={user.nombre} />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">{user.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.rol]}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver la web pública">
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink />
                <span>Ver la web pública</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/cuenta")}
              tooltip="Seguridad de cuenta"
            >
              <Link to="/admin/cuenta">
                <ShieldCheck />
                <span>Seguridad de cuenta</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Cerrar sesión">
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="mx-0" />
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft
            className={cn("size-3.5 transition-transform", state === "collapsed" && "rotate-180")}
          />
          <span className="group-data-[collapsible=icon]:hidden">Colapsar</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
