import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, LogOut, Menu, ShieldAlert, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getAdminSummary } from "@/lib/admin.functions";
import { ADMIN_GROUPS, ADMIN_NAV, adminNavLabel } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Agropet Vira Lata" },
      {
        name: "description",
        content: "Painel de gestão do catálogo digital da Agropet Vira Lata.",
      },
      { property: "og:title", content: "Painel administrativo — Agropet Vira Lata" },
      { property: "og:description", content: "Gestão do catálogo digital." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

export function useAdminSummary() {
  const fetchSummary = useServerFn(getAdminSummary);
  return useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => fetchSummary(),
    staleTime: 60_000,
    retry: false,
  });
}

function AdminLayout() {
  const { data, isPending, isError } = useAdminSummary();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentSlug = pathname.replace(/^\/admin\/?/, "").split("/")[0] ?? "";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (isPending) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Carregando painel…</span>
      </div>
    );
  }

  if (isError || !data?.isAdmin) {
    return (
      <div className="container-page py-16">
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-destructive" aria-hidden />
          <h1 className="mt-3 font-display text-xl font-bold">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isError
              ? "Sua sessão expirou ou não foi possível validar suas permissões. Entre novamente."
              : "Sua conta não possui o papel de administrador. Solicite acesso a um administrador da loja."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut aria-hidden />
              Sair
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Voltar ao catálogo</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <nav aria-label="Painel administrativo" className="space-y-5">
      {ADMIN_GROUPS.map((group) => {
        const items = ADMIN_NAV.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = currentSlug === item.slug;
                const className = cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                );
                return (
                  <li key={item.slug || "dashboard"}>
                    {item.slug === "" ? (
                      <Link to="/admin" className={className} onClick={() => setMobileOpen(false)}>
                        <Icon className="size-4" aria-hidden />
                        {item.label}
                      </Link>
                    ) : item.slug === "perfil" ? (
                      <Link
                        to="/admin/perfil"
                        className={className}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="size-4" aria-hidden />
                        {item.label}
                      </Link>
                    ) : (
                      <Link
                        to="/admin/$"
                        params={{ _splat: item.slug }}
                        className={className}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="size-4" aria-hidden />
                        {item.label}
                        {!item.ready && (
                          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            em breve
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const currentLabel = adminNavLabel(currentSlug);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/40">
      <div className="container-page flex gap-6 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="surface-card sticky top-20 p-3">{nav}</div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="surface-card mb-4 flex flex-wrap items-center gap-3 p-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu do painel">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <SheetTitle className="mb-3 font-display text-base">Painel administrativo</SheetTitle>
                {nav}
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Painel administrativo{currentLabel ? ` · ${currentLabel}` : ""}
              </p>
              <p className="truncate text-sm font-semibold">{data.email ?? "Administrador"}</p>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/">
                  <Store aria-hidden />
                  Ver catálogo
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut aria-hidden />
                Sair
              </Button>
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
