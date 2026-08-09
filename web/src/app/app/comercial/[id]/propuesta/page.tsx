import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintBar } from "@/components/comercial/print-bar";
import { getCotizacionFinalPrint } from "@/lib/db/cotizacion-final";
import { getLatestCotizacionFinalVersion } from "@/lib/db/cotizacion-final";
import { getExpedienteById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function money(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

/** Propuesta económica Itza — misma base de precios, sin markup visible */
export default async function PropuestaPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exp = await getExpedienteById(id);
  if (!exp) notFound();

  const version = await getLatestCotizacionFinalVersion(id);
  if (!version) {
    return (
      <div className="cotizacion-print min-h-screen bg-[#e8ecef] p-6 text-[#12161c]">
        <PrintBar
          backHref={`/app/comercial/${id}?tab=resumen`}
          title={`${exp.codigo} · Propuesta`}
        />
        <div className="quote-doc mx-auto mt-8 max-w-lg bg-white p-8 text-center shadow">
          <p className="font-medium">Aún no hay cotización final.</p>
          <p className="mt-2 text-sm text-[#64748b]">
            Genera la cotización en Comparativo antes de armar la propuesta.
          </p>
          <Link
            href={`/app/comercial/${id}?tab=comparativo`}
            className="mt-4 inline-block text-[#0a8f94]"
          >
            Ir a Comparativo
          </Link>
        </div>
      </div>
    );
  }

  const data = await getCotizacionFinalPrint(id, version);
  if (!data) notFound();

  const { expediente: e, lineas } = data;
  const total = lineas.reduce((a, l) => a + Number(l.importe || 0), 0);
  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="cotizacion-print min-h-screen bg-[#e8ecef] text-[#12161c]">
      <PrintBar
        backHref="/app/propuestas"
        title={`${e.codigo} · Propuesta económica`}
      />

      <article className="print-sheet quote-doc mx-auto my-6 max-w-[210mm] bg-white shadow-xl">
        <div className="quote-band h-2 w-full bg-[#0a8f94]" />
        <div className="px-8 py-7 sm:px-10 sm:py-9">
          <header className="border-b-2 border-[#0a8f94] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0a8f94]">
              Propuesta económica
            </p>
            <h1 className="mt-1 text-[1.35rem] font-semibold text-[#0f172a]">
              {e.empresaRazonSocial}
            </h1>
            <p className="mt-1 text-[12px] text-[#475569]">
              {e.codigo} · {fecha} · Para: {e.clienteNombre ?? "Cliente"}
            </p>
          </header>

          <p className="mt-5 text-[13px] leading-relaxed text-[#334155]">
            Por medio de la presente, {e.empresaRazonSocial} presenta su
            propuesta económica referente a{" "}
            <strong className="text-[#0f172a]">{e.titulo}</strong>
            {e.folioExterno ? ` (folio ${e.folioExterno})` : ""}, conforme a las
            partidas y precios siguientes (IVA incluido).
          </p>

          <table className="mt-6 w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#0a8f94] text-left text-[10px] uppercase tracking-[0.12em] text-white">
                <th className="px-2.5 py-2.5">#</th>
                <th className="px-2.5 py-2.5">Descripción</th>
                <th className="px-2.5 py-2.5 text-right">Cant.</th>
                <th className="px-2.5 py-2.5">Ud.</th>
                <th className="px-2.5 py-2.5 text-right">P.U.</th>
                <th className="px-2.5 py-2.5 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr
                  key={l.numero}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}
                >
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2">
                    {l.numero}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2">
                    {l.descripcion}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right tabular-nums">
                    {Number(l.cantidad).toLocaleString("es-MX")}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2">
                    {l.unidad}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right tabular-nums">
                    {money(Number(l.precioUnitario))}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-2.5 py-2 text-right font-medium tabular-nums">
                    {money(Number(l.importe))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="flex min-w-[240px] items-center justify-between bg-[#0a8f94] px-3 py-3 text-white">
              <span className="text-[12px] font-semibold uppercase">
                Total propuesta
              </span>
              <span className="text-[1.15rem] font-bold tabular-nums">
                {money(total)}
              </span>
            </div>
          </div>

          <section className="mt-8 grid gap-6 border-t border-[#e2e8f0] pt-5 text-[11.5px] text-[#475569] sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a8f94]">
                Condiciones
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Precios en MXN con IVA incluido.</li>
                <li>Vigencia: 15 días naturales a partir de esta fecha.</li>
                <li>
                  Entrega y forma de pago según bases / acuerdo posterior.
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a8f94]">
                Atentamente
              </p>
              <div className="mt-10 border-t border-[#94a3b8] pt-2">
                <p className="font-medium text-[#0f172a]">
                  Administración / Finanzas
                </p>
                <p>{e.empresaRazonSocial}</p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
