import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no painel — Agropet Vira Lata" },
      {
        name: "description",
        content: "Acesso restrito à equipe da Agropet Vira Lata para gerenciar o catálogo digital.",
      },
      { property: "og:title", content: "Entrar no painel — Agropet Vira Lata" },
      { property: "og:description", content: "Acesso restrito à equipe da Agropet Vira Lata." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("rate limit") || normalized.includes("too many"))
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      setCheckingSession(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(friendlyAuthError(signInError.message));
      return;
    }
    await router.invalidate();
    navigate({ to: "/admin", replace: true });
  }

  async function handleRecover(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (resetError) {
      setError("Não foi possível enviar o e-mail de recuperação. Tente novamente.");
      return;
    }
    toast.success("Se o e-mail existir, enviamos um link para redefinir a senha.");
    setMode("login");
  }

  if (checkingSession) {
    return (
      <div
        className="container-page grid min-h-[60vh] place-items-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Carregando sessão…</span>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="surface-card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? "Entrar no painel" : "Recuperar senha"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Área restrita à equipe da Agropet Vira Lata."
            : "Informe seu e-mail e enviaremos um link para criar uma nova senha."}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={mode === "login" ? handleLogin : handleRecover}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>

          {mode === "login" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <LogIn aria-hidden />
            )}
            {mode === "login" ? "Entrar" : "Enviar link de recuperação"}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            className="rounded-md font-medium text-info underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "recover" : "login");
            }}
          >
            {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>
          <Link to="/" className="text-muted-foreground underline-offset-4 hover:underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}