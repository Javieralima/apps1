import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { agencia: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      );
    }

    if (user.estado !== "activo") {
      return NextResponse.json(
        { error: "Usuario desactivado" },
        { status: 403 },
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      );
    }

    const token = generateToken({
      userId: user.id,
      agenciaId: user.agenciaId,
      email: user.email,
      rol: user.rol,
      nombre: user.nombreCompleto,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombreCompleto,
        rol: user.rol,
        agencia: user.agencia.nombre,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
