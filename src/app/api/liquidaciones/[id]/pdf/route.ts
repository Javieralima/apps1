import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id },
      include: {
        agencia: true,
        usuario: true,
      },
    });

    if (!liquidacion) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 },
      );
    }

    // Get the commissions for this period and user
    const [year, month] = liquidacion.periodo.split("-").map(Number);
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 1);

    const comisiones = await prisma.comisionSplit.findMany({
      where: {
        usuarioId: liquidacion.usuarioId,
        operacion: {
          agenciaId: liquidacion.agenciaId,
          estado: "cerrada",
          fechaCierre: { gte: inicio, lt: fin },
        },
        rolSplit: { not: "agencia" },
      },
      include: {
        operacion: {
          include: {
            propiedad: { select: { direccion: true } },
          },
        },
      },
    });

    const configFiscal = JSON.parse(liquidacion.usuario.configFiscal);

    // Generate HTML for the PDF
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Liquidación ${formatPeriodo(liquidacion.periodo)} - ${escapeHtml(liquidacion.usuario.nombreCompleto)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; font-size: 12px; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #1e40af; }
    .logo-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 18px; color: #1e293b; }
    .doc-title p { font-size: 11px; color: #64748b; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .info-box h3 { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-label { color: #64748b; font-size: 11px; }
    .info-value { font-weight: 600; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1e40af; color: white; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-red { color: #dc2626; }
    .text-green { color: #16a34a; }
    .text-bold { font-weight: 700; }
    .totals { background: #f0f9ff; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .total-item { text-align: center; }
    .total-item .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .total-item .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
    .total-item .value.primary { color: #1e40af; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    .stamp-area { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; text-align: center; margin-top: 30px; }
    .stamp-area p { color: #94a3b8; font-size: 10px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">echo inmo</div>
      <div class="logo-sub">${escapeHtml(liquidacion.agencia.nombre)}</div>
      ${liquidacion.agencia.direccion ? `<div class="logo-sub">${escapeHtml(liquidacion.agencia.direccion)}</div>` : ""}
      ${liquidacion.agencia.nif ? `<div class="logo-sub">NIF: ${escapeHtml(liquidacion.agencia.nif)}</div>` : ""}
    </div>
    <div class="doc-title">
      <h2>LIQUIDACIÓN DE COMISIONES</h2>
      <p>Periodo: ${formatPeriodo(liquidacion.periodo)}</p>
      <p>Fecha generación: ${formatDate(new Date())}</p>
      <p>Ref: LIQ-${liquidacion.periodo}-${liquidacion.id.substring(0, 8).toUpperCase()}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Datos del agente</h3>
      <div class="info-row">
        <span class="info-label">Nombre:</span>
        <span class="info-value">${escapeHtml(liquidacion.usuario.nombreCompleto)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">NIF:</span>
        <span class="info-value">${escapeHtml(liquidacion.usuario.nif || "N/A")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tipo fiscal:</span>
        <span class="info-value" style="text-transform:capitalize">${escapeHtml(liquidacion.usuario.tipoFiscal)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IBAN:</span>
        <span class="info-value">${escapeHtml(configFiscal.iban || "No configurado")}</span>
      </div>
    </div>
    <div class="info-box">
      <h3>Resumen del periodo</h3>
      <div class="info-row">
        <span class="info-label">Operaciones cerradas:</span>
        <span class="info-value">${liquidacion.totalOperaciones}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IRPF aplicado:</span>
        <span class="info-value">${configFiscal.aplica_irpf ? configFiscal.porcentaje_irpf + "%" : "No aplica"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IGIC aplicado:</span>
        <span class="info-value">${configFiscal.aplica_igic ? configFiscal.porcentaje_igic + "% (" + configFiscal.modelo_igic + ")" : "No aplica"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Estado:</span>
        <span class="info-value" style="text-transform:capitalize">${escapeHtml(liquidacion.estado)}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Operación</th>
        <th>Propiedad</th>
        <th>Rol</th>
        <th class="text-right">% Split</th>
        <th class="text-right">Bruto</th>
        <th class="text-right">IRPF</th>
        <th class="text-right">IGIC</th>
        <th class="text-right">Neto</th>
      </tr>
    </thead>
    <tbody>
      ${comisiones
        .map(
          (c) => `
      <tr>
        <td class="text-bold">${escapeHtml(c.operacion.numeroOperacion)}</td>
        <td>${escapeHtml(c.operacion.propiedad?.direccion || "-")}</td>
        <td style="text-transform:capitalize">${escapeHtml(c.rolSplit)}</td>
        <td class="text-right">${c.porcentajeSplit}%</td>
        <td class="text-right">${formatCurrency(c.importeBruto)}</td>
        <td class="text-right text-red">${c.retencionIrpf > 0 ? "-" + formatCurrency(c.retencionIrpf) : "-"}</td>
        <td class="text-right text-green">${c.igic > 0 ? "+" + formatCurrency(c.igic) : "-"}</td>
        <td class="text-right text-bold">${formatCurrency(c.importeNeto)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-grid">
      <div class="total-item">
        <div class="label">Total bruto</div>
        <div class="value">${formatCurrency(liquidacion.totalBruto)}</div>
      </div>
      <div class="total-item">
        <div class="label">Retenciones IRPF</div>
        <div class="value text-red">-${formatCurrency(liquidacion.totalRetenciones)}</div>
      </div>
      <div class="total-item">
        <div class="label">IGIC</div>
        <div class="value text-green">+${formatCurrency(comisiones.reduce((s, c) => s + c.igic, 0))}</div>
      </div>
      <div class="total-item">
        <div class="label">Total neto a percibir</div>
        <div class="value primary">${formatCurrency(liquidacion.totalNeto)}</div>
      </div>
    </div>
  </div>

  <div class="stamp-area">
    <p>Firma y sello de la agencia</p>
    <br/><br/><br/>
    <p>${escapeHtml(liquidacion.agencia.nombre)}</p>
  </div>

  <div class="footer">
    <span>Documento generado por echo inmo - ${formatDate(new Date())}</span>
    <span>Este documento es informativo y no constituye una factura</span>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="liquidacion_${liquidacion.periodo}_${liquidacion.usuario.nombreCompleto.replace(/ /g, "_")}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
