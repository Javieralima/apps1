import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const now = new Date();
    const mesActual = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesSiguiente = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const agenciaFilter = { agenciaId: user.agenciaId };
    const isAgente = user.rol === "agente";

    // Operations this month
    const operacionesMes = await prisma.operacion.count({
      where: {
        ...agenciaFilter,
        ...(isAgente ? { createdBy: user.userId } : {}),
        createdAt: { gte: mesActual, lt: mesSiguiente },
      },
    });

    // Operations last month (for comparison)
    const operacionesMesAnterior = await prisma.operacion.count({
      where: {
        ...agenciaFilter,
        ...(isAgente ? { createdBy: user.userId } : {}),
        createdAt: { gte: mesAnterior, lt: mesActual },
      },
    });

    // Closed operations this month
    const cerradasMes = await prisma.operacion.count({
      where: {
        ...agenciaFilter,
        ...(isAgente ? { createdBy: user.userId } : {}),
        estado: "cerrada",
        fechaCierre: { gte: mesActual, lt: mesSiguiente },
      },
    });

    // Commission totals this month
    const comisionesMes = await prisma.comisionSplit.findMany({
      where: {
        ...(isAgente ? { usuarioId: user.userId } : {}),
        operacion: agenciaFilter,
        createdAt: { gte: mesActual, lt: mesSiguiente },
      },
    });

    const totalComisionesGeneradas = comisionesMes.reduce(
      (s, c) => s + c.importeBruto,
      0,
    );

    // Pending payments
    const pendientesPago = await prisma.comisionSplit.findMany({
      where: {
        ...(isAgente ? { usuarioId: user.userId } : {}),
        operacion: agenciaFilter,
        estadoPago: "pendiente",
      },
    });

    const totalPendientePago = pendientesPago.reduce(
      (s, c) => s + c.importeNeto,
      0,
    );

    // Active agents count
    const agentesActivos = await prisma.usuario.count({
      where: { ...agenciaFilter, estado: "activo", rol: "agente" },
    });

    // Top agents (only for admin/manager)
    let topAgentes: { nombre: string; total: number }[] = [];
    if (!isAgente) {
      const agentes = await prisma.usuario.findMany({
        where: { ...agenciaFilter, estado: "activo", rol: "agente" },
        include: {
          comisiones: {
            where: {
              createdAt: { gte: mesActual, lt: mesSiguiente },
            },
          },
        },
      });

      topAgentes = agentes
        .map((a) => ({
          nombre: a.nombreCompleto,
          total: a.comisiones.reduce((s, c) => s + c.importeBruto, 0),
        }))
        .filter((a) => a.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }

    // Pending operations
    const operacionesPendientes = await prisma.operacion.findMany({
      where: {
        ...agenciaFilter,
        ...(isAgente ? { createdBy: user.userId } : {}),
        estado: { in: ["lead", "reserva", "firma_pendiente"] },
      },
      include: {
        creador: { select: { nombreCompleto: true } },
        propiedad: { select: { direccion: true, tipo: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // Recent closed operations
    const ultimasOperaciones = await prisma.operacion.findMany({
      where: {
        ...agenciaFilter,
        ...(isAgente ? { createdBy: user.userId } : {}),
      },
      include: {
        creador: { select: { nombreCompleto: true } },
        propiedad: { select: { direccion: true, tipo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      metricas: {
        operacionesMes,
        operacionesMesAnterior,
        cerradasMes,
        totalComisionesGeneradas:
          Math.round(totalComisionesGeneradas * 100) / 100,
        totalPendientePago: Math.round(totalPendientePago * 100) / 100,
        agentesActivos,
      },
      topAgentes,
      operacionesPendientes,
      ultimasOperaciones,
    });
  } catch (error) {
    console.error("GET dashboard error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
