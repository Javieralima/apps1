import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      include: { agencia: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombreCompleto,
        rol: user.rol,
        telefono: user.telefono,
        nif: user.nif,
        tipoFiscal: user.tipoFiscal,
        configFiscal: JSON.parse(user.configFiscal),
        agencia: {
          id: user.agencia.id,
          nombre: user.agencia.nombre,
        },
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Logout
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("token");
  return response;
}
