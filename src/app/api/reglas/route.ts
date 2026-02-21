import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const reglas = await prisma.reglaComision.findMany({
      where: { agenciaId: user.agenciaId },
      orderBy: { prioridad: "asc" },
    });

    return NextResponse.json({ reglas });
  } catch (error) {
    console.error("GET reglas error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (user.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombreRegla,
      tipoPropiedad,
      prioridad,
      splitsConfig,
      condiciones,
    } = body;

    if (!nombreRegla) {
      return NextResponse.json(
        { error: "El nombre de regla es obligatorio" },
        { status: 400 },
      );
    }

    // Validate splits sum to 100
    if (splitsConfig) {
      const suma = Object.values(splitsConfig as Record<string, number>).reduce(
        (s: number, v: number) => s + v,
        0,
      );
      if (Math.abs(suma - 100) > 0.01) {
        return NextResponse.json(
          { error: `Los splits suman ${suma}%, deben sumar 100%` },
          { status: 400 },
        );
      }
    }

    const regla = await prisma.reglaComision.create({
      data: {
        agenciaId: user.agenciaId,
        nombreRegla,
        tipoPropiedad: tipoPropiedad || null,
        prioridad: prioridad || 1,
        splitsConfig: splitsConfig
          ? JSON.stringify(splitsConfig)
          : '{"captador":30,"vendedor":30,"agencia":40}',
        condiciones: condiciones ? JSON.stringify(condiciones) : "{}",
      },
    });

    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    console.error("POST regla error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
