import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generarNumeroOperacion } from "@/lib/comisiones";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const agente = searchParams.get("agente");
    const mes = searchParams.get("mes");

    const where: Record<string, unknown> = { agenciaId: user.agenciaId };

    if (estado) where.estado = estado;

    // Agents can only see their own operations
    if (user.rol === "agente") {
      where.createdBy = user.userId;
    } else if (agente) {
      where.createdBy = agente;
    }

    if (mes) {
      const [year, month] = mes.split("-").map(Number);
      where.createdAt = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const operaciones = await prisma.operacion.findMany({
      where,
      include: {
        propiedad: true,
        comprador: true,
        vendedorCliente: true,
        creador: { select: { id: true, nombreCompleto: true } },
        comisiones: {
          include: {
            usuario: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ operaciones });
  } catch (error) {
    console.error("GET operaciones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (user.rol === "contabilidad") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      propiedadId,
      compradorId,
      vendedorClienteId,
      precioVenta,
      comisionTotalPorc,
      quienPagaComision,
      observaciones,
    } = body;

    if (!precioVenta || precioVenta <= 0) {
      return NextResponse.json(
        { error: "El precio de venta debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (
      !comisionTotalPorc ||
      comisionTotalPorc < 0.5 ||
      comisionTotalPorc > 10
    ) {
      return NextResponse.json(
        { error: "El % de comisión debe estar entre 0.5% y 10%" },
        { status: 400 },
      );
    }

    const count = await prisma.operacion.count({
      where: { agenciaId: user.agenciaId },
    });

    const comisionTotalImporte = precioVenta * (comisionTotalPorc / 100);

    const operacion = await prisma.operacion.create({
      data: {
        agenciaId: user.agenciaId,
        propiedadId: propiedadId || null,
        compradorId: compradorId || null,
        vendedorClienteId: vendedorClienteId || null,
        numeroOperacion: generarNumeroOperacion(count),
        precioVenta,
        comisionTotalPorc,
        comisionTotalImporte: Math.round(comisionTotalImporte * 100) / 100,
        quienPagaComision: quienPagaComision || "vendedor",
        observaciones: observaciones || null,
        createdBy: user.userId,
      },
      include: {
        propiedad: true,
        comprador: true,
        creador: { select: { id: true, nombreCompleto: true } },
      },
    });

    return NextResponse.json({ operacion }, { status: 201 });
  } catch (error) {
    console.error("POST operacion error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
