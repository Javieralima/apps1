import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const isAgente = user.rol === "agente";
    const agenciaFilter = { agenciaId: user.agenciaId };

    const notifications: Array<{
      id: string;
      tipo: string;
      titulo: string;
      descripcion: string;
      enlace: string;
      fecha: Date;
    }> = [];

    // Commissions pending payment (for agents: their own, for admin: all)
    const comisionesPendientes = await prisma.comisionSplit.findMany({
      where: {
        ...(isAgente ? { usuarioId: user.userId } : {}),
        operacion: agenciaFilter,
        estadoPago: "pendiente",
      },
      include: {
        operacion: { select: { numeroOperacion: true } },
        usuario: { select: { nombreCompleto: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const c of comisionesPendientes) {
      notifications.push({
        id: `com-${c.id}`,
        tipo: "comision",
        titulo: "Comisión pendiente de pago",
        descripcion: `${c.operacion.numeroOperacion} - ${c.usuario.nombreCompleto} (${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(c.importeNeto)})`,
        enlace: "/comisiones",
        fecha: c.createdAt,
      });
    }

    // Operations pending validation (for admin/manager)
    if (["admin", "manager"].includes(user.rol)) {
      const opsPendientes = await prisma.operacion.findMany({
        where: {
          ...agenciaFilter,
          estado: "firma_pendiente",
        },
        include: {
          creador: { select: { nombreCompleto: true } },
          propiedad: { select: { direccion: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      for (const op of opsPendientes) {
        notifications.push({
          id: `op-${op.id}`,
          tipo: "operacion",
          titulo: "Firma pendiente",
          descripcion: `${op.numeroOperacion} - ${op.propiedad?.direccion || "Sin propiedad"} (${op.creador.nombreCompleto})`,
          enlace: "/operaciones",
          fecha: op.updatedAt,
        });
      }

      // Operations without splits configured
      const opsSinSplits = await prisma.operacion.findMany({
        where: {
          ...agenciaFilter,
          estado: { in: ["reserva", "firma_pendiente"] },
          comisiones: { none: {} },
        },
        include: {
          creador: { select: { nombreCompleto: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      for (const op of opsSinSplits) {
        notifications.push({
          id: `split-${op.id}`,
          tipo: "alerta",
          titulo: "Splits sin configurar",
          descripcion: `${op.numeroOperacion} necesita configurar distribución de comisiones`,
          enlace: "/operaciones",
          fecha: op.updatedAt,
        });
      }
    }

    // Recent closed operations (for agents involved)
    if (isAgente) {
      const recentClosed = await prisma.comisionSplit.findMany({
        where: {
          usuarioId: user.userId,
          operacion: {
            ...agenciaFilter,
            estado: "cerrada",
          },
          estadoPago: "pagado",
        },
        include: {
          operacion: { select: { numeroOperacion: true, fechaCierre: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      for (const c of recentClosed) {
        if (c.fechaPago) {
          notifications.push({
            id: `paid-${c.id}`,
            tipo: "pago",
            titulo: "Comisión pagada",
            descripcion: `${c.operacion.numeroOperacion} - ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(c.importeNeto)} transferido`,
            enlace: "/comisiones",
            fecha: c.fechaPago,
          });
        }
      }
    }

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 10),
      count: notifications.length,
    });
  } catch (error) {
    console.error("GET notificaciones error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
