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
    const rol = searchParams.get("rol");
    const estado = searchParams.get("estado");

    const where: Record<string, unknown> = { agenciaId: user.agenciaId };
    if (rol) where.rol = rol;
    if (estado) where.estado = estado;

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        rol: true,
        telefono: true,
        nif: true,
        tipoFiscal: true,
        configFiscal: true,
        estado: true,
        fechaAlta: true,
      },
      orderBy: { nombreCompleto: "asc" },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error("GET usuarios error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
