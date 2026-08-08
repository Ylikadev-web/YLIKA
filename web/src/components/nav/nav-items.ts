import {
  Building2,
  FileStack,
  FolderKanban,
  Gavel,
  Home,
  Landmark,
  Package,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/comercial", label: "Comercial", icon: Building2 },
  { href: "/app/compras", label: "Compras", icon: ShoppingCart },
  { href: "/app/entregas", label: "Entregas", icon: Truck },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/tesoreria", label: "Tesorería", icon: Landmark },
  { href: "/app/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/app/licitaciones", label: "Licitaciones", icon: Gavel },
  { href: "/app/obra", label: "Obra Pública", icon: Package },
  { href: "/app/documentos", label: "Documentos", icon: FileStack },
  { href: "/app/configuracion", label: "Configuración", icon: Settings2 },
];
