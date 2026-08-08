import { notFound, redirect } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav/nav-items";

const BUILT = new Set([
  "comercial",
  "compras",
  "entregas",
  "clientes",
  "tesoreria",
  "proyectos",
  "licitaciones",
  "obra",
  "documentos",
  "configuracion",
]);

export default async function ModuleCatchAllPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (BUILT.has(module)) {
    redirect(`/app/${module}`);
  }
  if (NAV_ITEMS.some((n) => n.href === `/app/${module}`)) {
    redirect(`/app/${module}`);
  }
  notFound();
}
