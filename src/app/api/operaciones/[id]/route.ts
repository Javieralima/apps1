import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

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

    const operacion = await prisma.operacion.findUnique({
      where: { id, agenciaId: user.agenciaId },
      include: {
        propiedad: true,
        comprador: true,
        vendedorCliente: true,
        creador: { select: { id: true, nombreCompleto: true, rol: true } },
        validador: { select: { id: true, nombreCompleto: true } },
        comisiones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombreCompleto: true,
                configFiscal: true,
                tipoFiscal: true,
              },
            },
          },
        },
        documentos: {
          include: {
            usuario: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });

    if (!operacion) {
      return NextResponse.json(
        { error: "Operación no encontrada" },
        { status: 404 },
      );
    }

    // Agents can only see their own operations
    if (user.rol === "agente" && operacion.createdBy !== user.userId) {
      const isParticipant = operacion.comisiones.some(
        (c) => c.usuarioId === user.userId,
      );
      if (!isParticipant) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({ operacion });
  } catch (error) {
    console.error("GET operacion error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.operacion.findUnique({
      where: { id, agenciaId: user.agenciaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Operación no encontrada" },
        { status: 404 },
      );
    }

    // Only admin can edit closed operations
    if (
      ["cerrada", "cancelada"].includes(existing.estado) &&
      user.rol !== "admin"
    ) {
      return NextResponse.json(
        { error: "No se puede editar una operación cerrada" },
        { status: 403 },
      );
    }

    // Agents can only edit their own leads/reservas
    if (
      user.rol === "agente" &&
      existing.createdBy !== user.userId
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "propiedadId",
      "compradorId",
      "vendedorClienteId",
      "precioVenta",
      "comisionTotalPorc",
      "quienPagaComision",
      "gastosOperacion",
      "fechaReserva",
      "fechaFirma",
      "fechaCierre",
      "observaciones",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field.startsWith("fecha") && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Recalculate commission amount if price or percentage changed
    if (updateData.precioVenta || updateData.comisionTotalPorc) {
      const precio =
        (updateData.precioVenta as number) || existing.precioVenta;
      const porc =
        (updateData.comisionTotalPorc as number) || existing.comisionTotalPorc;
      updateData.comisionTotalImporte = Math.round(precio * (porc / 100) * 100) / 100;
    }

    const operacion = await prisma.operacion.update({
      where: { id },
      data: updateData,
      include: {
        propiedad: true,
        comprador: true,
        creador: { select: { id: true, nombreCompleto: true } },
      },
    });

    return NextResponse.json({ operacion });
  } catch (error) {
    console.error("PUT operacion error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
