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
  const total = lineas.reduce((a, l) => a + Number(l.importe || 0), 0);
  const fecha = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
  const vigencia = data.createdAt
    ? new Date(
        new Date(data.createdAt).getTime() + 15 * 86400_000,
      ).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "15 días naturales";

  const initial = (e.empresaCodigo || "YL").slice(0, 2);

  return (
    <div className="cotizacion-print min-h-screen bg-[#e8ecef] text-[#12161c]">
      <PrintBar
        backHref={`/app/comercial/${id}?tab=historial`}
        title={`${e.codigo} · Cot. v${data.version}`}
      />

      <article className="print-sheet quote-doc mx-auto my-6 max-w-[210mm] bg-white shadow-xl">
        {/* Franja marca */}
        <div className="quote-band h-2 w-full bg-[#0a8f94]" />

        <div className="px-8 py-7 sm:px-10 sm:py-9">
          {/* Letterhead */}
          <header className="flex items-start justify-between gap-6 border-b-2 border-[#0a8f94] pb-5">
            <div className="flex items-start gap-3">
              <div
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#0a8f94] text-lg font-bold tracking-wide text-white"
              >
                {initial}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0a8f94]">
                  Cotización comercial
                </p>
                <h1 className="mt-1 text-[1.35rem] font-semibold leading-tight tracking-tight text-[#0f172a]">
                  {e.empresaRazonSocial}
                </h1>
                <p className="mt-1 text-[12px] text-[#475569]">
                  {e.empresaCodigo}
                  {e.empresaRfc ? ` · RFC ${e.empresaRfc}` : ""}
                </p>
              </div>
            </div>
            <div className="min-w-[150px] rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-right text-[12px]">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b]">
                Folio
              </p>
              <p className="font-semibold text-[#0f172a]">{e.codigo}</p>
              <p className="mt-1 text-[#475569]">Versión {data.version}</p>
              <p className="text-[#475569]">{fecha}</p>
            </div>
          </header>

          {/* Cliente / solicitud */}
          <section className="mt-6 grid gap-0 border border-[#e2e8f0] sm:grid-cols-2">
            <div className="border-b border-[#e2e8f0] p-4 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0a8f94]">
                Cliente
              </p>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0f172a]">
                {e.clienteNombre ?? "—"}
              </p>
              {e.clienteDependencia ? (
                <p className="text-[12px] text-[#475569]">
                  {e.clienteDependencia}
                </p>
              ) : null}
              {e.clienteRfc ? (
                <p className="text-[12px] text-[#475569]">RFC {e.clienteRfc}</p>
              ) : null}
              {e.clienteDireccion ? (
                <p className="mt-1 text-[12px] text-[#475569]">
                  {e.clienteDireccion}
                </p>
              ) : null}
              {(e.clienteContacto || e.clienteEmail || e.clienteTel) && (
                <p className="mt-1 text-[12px] text-[#64748b]">
                  {[e.clienteContacto, e.clienteEmail, e.clienteTel]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0a8f94]">
                Solicitud / referencia
              </p>
              <p className="mt-1.5 text-[14px] font-semibold text-[#0f172a]">
                {e.titulo}
              </p>
              <p className="text-[12px] text-[#475569]">
                {e.tipoNombre}
                {e.folioExterno ? ` · Folio ${e.folioExterno}` : ""}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                <div>
                  <dt className="text-[#64748b]">Moneda</dt>
                  <dd className="font-medium text-[#0f172a]">MXN</dd>
                </div>
                <div>
                  <dt className="text-[#64748b]">Impuestos</dt>
                  <dd className="font-medium text-[#0f172a]">IVA incluido</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#64748b]">Vigencia</dt>
                  <dd className="font-medium text-[#0f172a]">{vigencia}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Tabla */}
          <table className="mt-7 w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#0a8f94] text-left text-[10px] uppercase tracking-[0.12em] text-white">
                <th className="px-2.5 py-2.5 font-semibold">#</th>
                <th className="px-2.5 py-2.5 font-semibold">Descripción</th>
                <th className="px-2.5 py-2.5 text-right font-semibold">Cant.</th>
                <th className="px-2.5 py-2.5 font-semibold">Ud.</th>
                <th className="px-2.5 py-2.5 text-right font-semibold">P.U.</th>
                <th className="px-2.5 py-2.5 text-right font-semibold">
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr
                  key={l.numero}
                  className={
                    i % 2 === 0
                      ? "bg-white text-[#0f172a]"
                      : "bg-[#f8fafc] text-[#0f172a]"
                  }
                >
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 align-top tabular-nums">
                    {l.numero}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 align-top">
                    {l.descripcion}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right align-top tabular-nums">
                    {Number(l.cantidad).toLocaleString("es-MX")}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 align-top">
                    {l.unidad}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right align-top tabular-nums">
                    {money(Number(l.precioUnitario))}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right align-top font-medium tabular-nums">
                    {money(Number(l.importe))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs border border-[#e2e8f0]">
              <div className="flex items-center justify-between bg-[#f1f5f9] px-3 py-2 text-[12px]">
                <span className="text-[#475569]">Partidas</span>
                <span className="font-medium tabular-nums text-[#0f172a]">
                  {lineas.length}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#0a8f94] px-3 py-3 text-white">
                <span className="text-[12px] font-semibold uppercase tracking-wide">
                  Total (IVA incluido)
                </span>
                <span className="text-[1.15rem] font-bold tabular-nums">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Condiciones + firma */}
          <section className="mt-8 grid gap-6 border-t border-[#e2e8f0] pt-5 text-[11.5px] text-[#475569] sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a8f94]">
                Condiciones
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Precios en pesos mexicanos (MXN) con IVA incluido.</li>
                <li>Vigencia de la cotización: hasta {vigencia}.</li>
                <li>
                  Tiempo de entrega y forma de pago sujetos a confirmación al
                  emitir orden de compra.
                </li>
                <li>
                  Esta cotización no constituye compromiso de suministro hasta
                  aceptación formal.
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a8f94]">
                Aceptación
              </p>
              <div className="mt-8 border-t border-[#94a3b8] pt-2">
                <p className="font-medium text-[#0f172a]">
                  Nombre y firma del cliente
                </p>
                <p className="mt-1 text-[#64748b]">Cargo / Fecha</p>
              </div>
              <div className="mt-8 border-t border-[#94a3b8] pt-2">
                <p className="font-medium text-[#0f172a]">
                  {e.empresaRazonSocial}
                </p>
                <p className="mt-1 text-[#64748b]">Área comercial</p>
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t border-[#e2e8f0] pt-3 text-[10px] text-[#94a3b8]">
            Documento generado con YLIKA Ops · {e.codigo} · v{data.version} ·{" "}
            {fecha}. Sin información de margen interno.
            <span className="mt-2 block print:hidden">
              <Link
                href={`/app/comercial/${id}?tab=comparativo`}
                className="text-[#0a8f94]"
              >
                Volver al expediente
              </Link>
            </span>
          </footer>
        </div>
      </article>
    </div>
  );
}
