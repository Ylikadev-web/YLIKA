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
  { href: "/app/comercial", label: "Comercial", icon: Building2, soon: true },
  { href: "/app/compras", label: "Compras", icon: ShoppingCart, soon: true },
  { href: "/app/entregas", label: "Entregas", icon: Truck, soon: true },
  { href: "/app/clientes", label: "Clientes", icon: Users, soon: true },
  { href: "/app/tesoreria", label: "Tesorería", icon: Landmark, soon: true },
  { href: "/app/proyectos", label: "Proyectos", icon: FolderKanban, soon: true },
  { href: "/app/licitaciones", label: "Licitaciones", icon: Gavel, soon: true },
  { href: "/app/obra", label: "Obra Pública", icon: Package, soon: true },
  { href: "/app/documentos", label: "Documentos", icon: FileStack, soon: true },
  { href: "/app/configuracion", label: "Configuración", icon: Settings2 },
];
