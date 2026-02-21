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
    const tipo = searchParams.get("tipo");

    const where: Record<string, unknown> = { agenciaId: user.agenciaId };
    if (tipo) where.tipo = tipo;

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clientes });
  } catch (error) {
    console.error("GET clientes error:", error);
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
    const { tipo, nombreCompleto, email, telefono, nif, observaciones } = body;

    if (!nombreCompleto) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        agenciaId: user.agenciaId,
        tipo: tipo || "comprador",
        nombreCompleto,
        email: email || null,
        telefono: telefono || null,
        nif: nif || null,
        observaciones: observaciones || null,
      },
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    console.error("POST cliente error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
