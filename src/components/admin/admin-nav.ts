import {
  BadgePercent,
  Boxes,
  CalendarDays,
  ChartNoAxesColumn,
  Image,
  LayoutDashboard,
  Package,
  ScissorsLineDashed,
  Settings,
  ShoppingBag,
  Tags,
  Ticket,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  /** Segmento após "/admin" — vazio significa o dashboard. */
  slug: string;
  label: string;
  icon: LucideIcon;
  group: "Visão geral" | "Catálogo" | "Operação" | "Sistema";
  /** Módulos ainda não implementados exibem estado de "próximas etapas". */
  ready: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { slug: "", label: "Dashboard", icon: LayoutDashboard, group: "Visão geral", ready: true },
  { slug: "produtos", label: "Produtos", icon: Package, group: "Catálogo", ready: true },
  { slug: "categorias", label: "Categorias", icon: Tags, group: "Catálogo", ready: true },
  { slug: "marcas", label: "Marcas", icon: Boxes, group: "Catálogo", ready: true },
  { slug: "estoque", label: "Estoque", icon: Warehouse, group: "Catálogo", ready: false },
  { slug: "promocoes", label: "Promoções", icon: BadgePercent, group: "Catálogo", ready: false },
  { slug: "cupons", label: "Cupons", icon: Ticket, group: "Catálogo", ready: false },
  { slug: "banners", label: "Banners", icon: Image, group: "Catálogo", ready: false },
  { slug: "pedidos", label: "Pedidos", icon: ShoppingBag, group: "Operação", ready: false },
  { slug: "clientes", label: "Clientes", icon: Users, group: "Operação", ready: false },
  { slug: "servicos", label: "Serviços", icon: Settings, group: "Operação", ready: false },
  {
    slug: "banho-tosa",
    label: "Banho e tosa",
    icon: ScissorsLineDashed,
    group: "Operação",
    ready: false,
  },
  { slug: "relatorios", label: "Relatórios", icon: ChartNoAxesColumn, group: "Operação", ready: false },
  { slug: "configuracoes", label: "Configurações", icon: Settings, group: "Sistema", ready: true },
  { slug: "administradores", label: "Administradores", icon: UserCog, group: "Sistema", ready: false },
  { slug: "perfil", label: "Meu perfil", icon: CalendarDays, group: "Sistema", ready: true },
];

export const ADMIN_GROUPS = ["Visão geral", "Catálogo", "Operação", "Sistema"] as const;

export function adminNavLabel(slug: string): string | null {
  return ADMIN_NAV.find((item) => item.slug === slug)?.label ?? null;
}