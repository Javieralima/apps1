import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import {
  calcularComisionTotal,
  calcularSplits,
  ConfigFiscal,
  SplitParticipante,
} from "@/lib/comisiones";
import { parseFiscalConfig } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!["admin", "manager"].includes(user.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const { participantes } = (await request.json()) as {
      participantes: SplitParticipante[];
    };

    if (!participantes || participantes.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un participante" },
        { status: 400 },
      );
    }

    const sumaPorcentajes = participantes.reduce(
      (s, p) => s + p.porcentajeSplit,
      0,
    );
    if (Math.abs(sumaPorcentajes - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `La suma de porcentajes es ${sumaPorcentajes}%, debe ser 100%`,
        },
        { status: 400 },
      );
    }

    const operacion = await prisma.operacion.findUnique({
      where: { id, agenciaId: user.agenciaId },
    });

    if (!operacion) {
      return NextResponse.json(
        { error: "Operación no encontrada" },
        { status: 404 },
      );
    }

    const comisionTotal = calcularComisionTotal(
      operacion.precioVenta,
      operacion.comisionTotalPorc,
    );

    // Fetch fiscal configs for all participants
    const configsFiscales = new Map<string, ConfigFiscal>();
    for (const p of participantes) {
      if (p.rolSplit === "agencia") continue;
      const usuario = await prisma.usuario.findUnique({
        where: { id: p.usuarioId },
      });
      if (usuario) {
        const config = parseFiscalConfig(usuario.configFiscal);
        configsFiscales.set(p.usuarioId, config as ConfigFiscal);
      }
    }

    const resultados = calcularSplits(
      comisionTotal,
      participantes,
      configsFiscales,
    );

    // Delete existing splits and create new ones
    await prisma.comisionSplit.deleteMany({
      where: { operacionId: id },
    });

    const comisiones = [];
    for (const r of resultados) {
      const comision = await prisma.comisionSplit.create({
        data: {
          operacionId: id,
          usuarioId: r.usuarioId,
          rolSplit: r.rolSplit,
          porcentajeSplit: r.porcentajeSplit,
          importeBruto: r.importeBruto,
          retencionIrpf: r.retencionIrpf,
          igic: r.igic,
          importeNeto: r.importeNeto,
        },
        include: {
          usuario: { select: { id: true, nombreCompleto: true } },
        },
      });
      comisiones.push(comision);
    }

    return NextResponse.json({ comisiones, comisionTotal }, { status: 201 });
  } catch (error) {
    console.error("POST comisiones error:", error);
    const message =
      error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
