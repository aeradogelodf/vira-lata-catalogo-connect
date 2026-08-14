import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSummary } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/perfil")({
  component: AdminProfile,
});

function AdminProfile() {
  const { data } = useAdminSummary();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("Não foi possível alterar a senha. Tente novamente.");
      return;
    }
    setPassword("");
    setConfirmation("");
    toast.success("Senha alterada com sucesso.");
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const lastSignIn = data?.lastSignInAt
    ? new Date(data.lastSignInAt).toLocaleString("pt-BR")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Dados da sua conta administrativa.</p>
      </div>

      <div className="surface-card space-y-3 p-4 text-sm">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">E-mail</p>
          <p>{data?.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Papel</p>
          <p>Administrador</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Último acesso</p>
          <p>{lastSignIn ?? "Sem dados ainda"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Nome e avatar</p>
          <p className="text-muted-foreground">
            Este módulo será configurado nas próximas etapas.
          </p>
        </div>
      </div>

      <form className="surface-card space-y-4 p-4" onSubmit={handleChangePassword} noValidate>
        <h2 className="font-display text-lg font-bold">Alterar senha</h2>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-password">Nova senha</Label>
          <Input
            id="perfil-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-password-confirm">Confirmar nova senha</Label>
          <Input
            id="perfil-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
            Salvar senha
          </Button>
          <Button type="button" variant="outline" onClick={handleSignOut}>
            <LogOut aria-hidden />
            Sair da conta
          </Button>
        </div>
      </form>
    </div>
  );
}
