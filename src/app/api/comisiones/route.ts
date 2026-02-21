import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estadoPago = searchParams.get("estado_pago");
    const periodo = searchParams.get("periodo");

    const where: Record<string, unknown> = {};

    // Agents only see their own commissions
    if (user.rol === "agente") {
      where.usuarioId = user.userId;
    }

    if (estadoPago) {
      where.estadoPago = estadoPago;
    }

    // Filter by agency through the operation
    where.operacion = { agenciaId: user.agenciaId };

    if (periodo) {
      const [year, month] = periodo.split("-").map(Number);
      where.createdAt = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const comisiones = await prisma.comisionSplit.findMany({
      where,
      include: {
        operacion: {
          include: {
            propiedad: { select: { id: true, direccion: true, tipo: true } },
          },
        },
        usuario: {
          select: {
            id: true,
            nombreCompleto: true,
            tipoFiscal: true,
            nif: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalBruto = comisiones.reduce((s, c) => s + c.importeBruto, 0);
    const totalRetenciones = comisiones.reduce(
      (s, c) => s + c.retencionIrpf,
      0,
    );
    const totalNeto = comisiones.reduce((s, c) => s + c.importeNeto, 0);
    const totalPendiente = comisiones
      .filter((c) => c.estadoPago === "pendiente")
      .reduce((s, c) => s + c.importeNeto, 0);

    return NextResponse.json({
      comisiones,
      totales: {
        bruto: Math.round(totalBruto * 100) / 100,
        retenciones: Math.round(totalRetenciones * 100) / 100,
        neto: Math.round(totalNeto * 100) / 100,
        pendiente: Math.round(totalPendiente * 100) / 100,
      },
    });
  } catch (error) {
    console.error("GET comisiones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!["admin", "contabilidad"].includes(user.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { ids, estadoPago, referenciaPago } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Se requieren IDs de comisiones" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      estadoPago: estadoPago || "pagado",
    };

    if (estadoPago === "pagado") {
      updateData.fechaPago = new Date();
    }
    if (referenciaPago) {
      updateData.referenciaPago = referenciaPago;
    }

    await prisma.comisionSplit.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (error) {
    console.error("PUT comisiones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
