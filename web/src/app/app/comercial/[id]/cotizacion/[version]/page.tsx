import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintBar } from "@/components/comercial/print-bar";
import { getCotizacionFinalPrint } from "@/lib/db/cotizacion-final";

export const dynamic = "force-dynamic";

function money(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

export default async function CotizacionFinalPrintPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version: versionRaw } = await params;
  const version = Number(versionRaw);
  if (!Number.isFinite(version) || version < 1) notFound();

  const data = await getCotizacionFinalPrint(id, version);
  if (!data) notFound();

  const { expediente: e, lineas } = data;
  const subtotal = lineas.reduce((a, l) => a + Number(l.importe || 0), 0);
  // Precios ya vienen con IVA incluido desde el motor
  const fecha = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="cotizacion-print min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <PrintBar
        backHref={`/app/comercial/${id}?tab=historial`}
        title={`${e.codigo} · Cot. v${data.version}`}
      />

      <article className="print-sheet mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--glass-border)] pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
              Cotización
            </p>
            <h1 className="display mt-1 text-2xl font-semibold tracking-tight">
              {e.empresaRazonSocial}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {e.empresaCodigo}
              {e.empresaRfc ? ` · RFC ${e.empresaRfc}` : ""}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{e.codigo}</p>
            <p className="text-[var(--text-muted)]">Versión {data.version}</p>
            <p className="text-[var(--text-muted)]">{fecha}</p>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Cliente
            </p>
            <p className="mt-1 font-medium">{e.clienteNombre ?? "—"}</p>
            {e.clienteDependencia ? (
              <p className="text-sm text-[var(--text-muted)]">
                {e.clienteDependencia}
              </p>
            ) : null}
            {e.clienteRfc ? (
              <p className="text-sm text-[var(--text-muted)]">RFC {e.clienteRfc}</p>
            ) : null}
            {e.clienteDireccion ? (
              <p className="text-sm text-[var(--text-muted)]">
                {e.clienteDireccion}
              </p>
            ) : null}
            {(e.clienteContacto || e.clienteEmail || e.clienteTel) && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {[e.clienteContacto, e.clienteEmail, e.clienteTel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Solicitud
            </p>
            <p className="mt-1 font-medium">{e.titulo}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {e.tipoNombre}
              {e.folioExterno ? ` · Folio ${e.folioExterno}` : ""}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Precios con IVA · MXN
            </p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] text-left text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Descripción</th>
              <th className="py-2 pr-2 text-right">Cant.</th>
              <th className="py-2 pr-2">Ud.</th>
              <th className="py-2 pr-2 text-right">P.U.</th>
              <th className="py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr
                key={l.numero}
                className="border-b border-[color-mix(in_srgb,var(--glass-border)_70%,transparent)]"
              >
                <td className="py-2.5 pr-2 align-top tabular-nums">
                  {l.numero}
                </td>
                <td className="py-2.5 pr-2 align-top">{l.descripcion}</td>
                <td className="py-2.5 pr-2 text-right align-top tabular-nums">
                  {Number(l.cantidad).toLocaleString("es-MX")}
                </td>
                <td className="py-2.5 pr-2 align-top">{l.unidad}</td>
                <td className="py-2.5 pr-2 text-right align-top tabular-nums">
                  {money(Number(l.precioUnitario))}
                </td>
                <td className="py-2.5 text-right align-top font-medium tabular-nums">
                  {money(Number(l.importe))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-4 text-right text-sm font-medium">
                Total (IVA incluido)
              </td>
              <td className="pt-4 text-right text-base font-semibold tabular-nums">
                {money(subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-10 border-t border-[var(--glass-border)] pt-4 text-xs text-[var(--text-muted)]">
          <p>
            Documento generado desde YLIKA Ops · {e.codigo} · v{data.version}.
            Vigencia sujeta a confirmación comercial.
          </p>
          <p className="mt-2 print:hidden">
            <Link
              href={`/app/comercial/${id}?tab=comparativo`}
              className="text-[var(--accent)]"
            >
              Volver al expediente
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
