import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authUser = getUserFromRequest(request);

    // Only admins can register new users (except first user)
    const userCount = await prisma.usuario.count();
    if (userCount > 0 && (!authUser || authUser.rol !== "admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, nombreCompleto, rol, telefono, nif, tipoFiscal } =
      body;

    if (!email || !password || !nombreCompleto) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son obligatorios" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      );
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    // Get or create agency
    let agenciaId: string;
    if (authUser) {
      agenciaId = authUser.agenciaId;
    } else {
      // First user - create default agency
      const agencia = await prisma.agencia.create({
        data: {
          nombre: body.nombreAgencia || "Mi Agencia Inmobiliaria",
          nif: body.nifAgencia || "",
        },
      });
      agenciaId = agencia.id;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.usuario.create({
      data: {
        agenciaId,
        email,
        passwordHash,
        nombreCompleto,
        rol: userCount === 0 ? "admin" : rol || "agente",
        telefono: telefono || null,
        nif: nif || null,
        tipoFiscal: tipoFiscal || "autonomo",
      },
      include: { agencia: true },
    });

    // Auto-login on first registration
    if (userCount === 0) {
      const token = generateToken({
        userId: user.id,
        agenciaId: user.agenciaId,
        email: user.email,
        rol: user.rol,
        nombre: user.nombreCompleto,
      });

      const response = NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombreCompleto,
            rol: user.rol,
            agencia: user.agencia.nombre,
          },
        },
        { status: 201 },
      );

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombreCompleto,
          rol: user.rol,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
