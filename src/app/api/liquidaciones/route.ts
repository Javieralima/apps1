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
    const periodo = searchParams.get("periodo");

    const where: Record<string, unknown> = { agenciaId: user.agenciaId };

    if (user.rol === "agente") {
      where.usuarioId = user.userId;
    }

    if (periodo) {
      where.periodo = periodo;
    }

    const liquidaciones = await prisma.liquidacion.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombreCompleto: true, nif: true, tipoFiscal: true },
        },
      },
      orderBy: { generadaAt: "desc" },
    });

    return NextResponse.json({ liquidaciones });
  } catch (error) {
    console.error("GET liquidaciones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!["admin", "contabilidad"].includes(user.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { periodo } = await request.json();
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      return NextResponse.json(
        { error: "Periodo inválido. Formato: YYYY-MM" },
        { status: 400 },
      );
    }

    const [year, month] = periodo.split("-").map(Number);
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 1);

    // Get all commissions for the period
    const comisiones = await prisma.comisionSplit.findMany({
      where: {
        operacion: {
          agenciaId: user.agenciaId,
          estado: "cerrada",
          fechaCierre: { gte: inicio, lt: fin },
        },
        rolSplit: { not: "agencia" },
      },
      include: {
        usuario: true,
        operacion: true,
      },
    });

    // Group by user
    const byUser = new Map<
      string,
      { bruto: number; retenciones: number; neto: number; count: number }
    >();

    for (const c of comisiones) {
      const current = byUser.get(c.usuarioId) || {
        bruto: 0,
        retenciones: 0,
        neto: 0,
        count: 0,
      };
      current.bruto += c.importeBruto;
      current.retenciones += c.retencionIrpf;
      current.neto += c.importeNeto;
      current.count += 1;
      byUser.set(c.usuarioId, current);
    }

    // Delete existing liquidations for the period
    await prisma.liquidacion.deleteMany({
      where: { agenciaId: user.agenciaId, periodo },
    });

    // Create new liquidations
    const liquidaciones = [];
    for (const [usuarioId, data] of byUser) {
      const liquidacion = await prisma.liquidacion.create({
        data: {
          agenciaId: user.agenciaId,
          usuarioId,
          periodo,
          totalOperaciones: data.count,
          totalBruto: Math.round(data.bruto * 100) / 100,
          totalRetenciones: Math.round(data.retenciones * 100) / 100,
          totalNeto: Math.round(data.neto * 100) / 100,
        },
        include: {
          usuario: {
            select: { id: true, nombreCompleto: true, nif: true },
          },
        },
      });
      liquidaciones.push(liquidacion);
    }

    return NextResponse.json({ liquidaciones }, { status: 201 });
  } catch (error) {
    console.error("POST liquidaciones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
