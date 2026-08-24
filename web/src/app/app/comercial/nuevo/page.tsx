import { AppShell } from "@/components/layout/app-shell";
import { NuevaSolicitudWizard } from "@/components/comercial/nueva-solicitud-wizard";
import { listEmpresas, listTiposSolicitud } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function NuevaSolicitudPage() {
  const [empresas, tiposGob, tiposPriv] = await Promise.all([
    listEmpresas(),
    listTiposSolicitud("GOBIERNO"),
    listTiposSolicitud("PRIVADO"),
  ]);

  return (
    <AppShell
      title="Nueva solicitud"
      subtitle="Paso 1: partidas · Paso 2: cliente (opcional)"
      density="compact"
    >
      <NuevaSolicitudWizard
        empresas={empresas}
        tiposGob={tiposGob}
        tiposPriv={tiposPriv}
        defaultEmpresaId={empresas.find((e) => e.codigo === "MONE")?.id}
      />
    </AppShell>
  );
}
