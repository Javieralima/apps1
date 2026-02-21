import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generarReferencia } from "@/lib/comisiones";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const tipo = searchParams.get("tipo");

    const where: Record<string, unknown> = { agenciaId: user.agenciaId };
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const propiedades = await prisma.propiedad.findMany({
      where,
      include: {
        captador: { select: { id: true, nombreCompleto: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ propiedades });
  } catch (error) {
    console.error("GET propiedades error:", error);
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
      tipo,
      direccion,
      ciudad,
      codigoPostal,
      precioVentaObjetivo,
      metrosCuadrados,
      habitaciones,
      banos,
      captadorId,
      observaciones,
    } = body;

    if (!direccion || !precioVentaObjetivo) {
      return NextResponse.json(
        { error: "Dirección y precio objetivo son obligatorios" },
        { status: 400 },
      );
    }

    const count = await prisma.propiedad.count({
      where: { agenciaId: user.agenciaId },
    });

    const propiedad = await prisma.propiedad.create({
      data: {
        agenciaId: user.agenciaId,
        referencia: generarReferencia(tipo || "piso", count),
        tipo: tipo || "piso",
        direccion,
        ciudad: ciudad || null,
        codigoPostal: codigoPostal || null,
        precioVentaObjetivo,
        metrosCuadrados: metrosCuadrados || null,
        habitaciones: habitaciones || null,
        banos: banos || null,
        captadorId: captadorId || user.userId,
        observaciones: observaciones || null,
      },
      include: {
        captador: { select: { id: true, nombreCompleto: true } },
      },
    });

    return NextResponse.json({ propiedad }, { status: 201 });
  } catch (error) {
    console.error("POST propiedad error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
