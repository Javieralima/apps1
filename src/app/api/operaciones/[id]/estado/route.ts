import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  lead: ["reserva", "cancelada"],
  reserva: ["firma_pendiente", "cancelada"],
  firma_pendiente: ["cerrada", "cancelada"],
  cerrada: [],
  cancelada: [],
};

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
    const { estado } = await request.json();

    const operacion = await prisma.operacion.findUnique({
      where: { id, agenciaId: user.agenciaId },
      include: { comisiones: true },
    });

    if (!operacion) {
      return NextResponse.json(
        { error: "Operación no encontrada" },
        { status: 404 },
      );
    }

    // Validate state transition
    const transicionesPermitidas = TRANSICIONES_VALIDAS[operacion.estado] || [];
    if (!transicionesPermitidas.includes(estado)) {
      return NextResponse.json(
        {
          error: `No se puede cambiar de '${operacion.estado}' a '${estado}'`,
        },
        { status: 400 },
      );
    }

    // Role-based permissions for state changes
    if (estado === "cerrada" && !["admin", "manager"].includes(user.rol)) {
      return NextResponse.json(
        { error: "Solo admin o manager pueden cerrar operaciones" },
        { status: 403 },
      );
    }

    // Validate requirements for closing
    if (estado === "cerrada") {
      if (operacion.comisiones.length === 0) {
        return NextResponse.json(
          { error: "No se puede cerrar sin definir splits de comisión" },
          { status: 400 },
        );
      }

      const sumaSplits = operacion.comisiones.reduce(
        (sum, c) => sum + c.porcentajeSplit,
        0,
      );
      if (Math.abs(sumaSplits - 100) > 0.01) {
        return NextResponse.json(
          {
            error: `La suma de splits es ${sumaSplits}%, debe ser 100%`,
          },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = { estado };

    if (estado === "cerrada") {
      updateData.fechaCierre = new Date();
      updateData.validadoPor = user.userId;
      updateData.validadoAt = new Date();
    }

    const updated = await prisma.operacion.update({
      where: { id },
      data: updateData,
      include: {
        propiedad: true,
        comisiones: {
          include: {
            usuario: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });

    return NextResponse.json({ operacion: updated });
  } catch (error) {
    console.error("PUT estado error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
