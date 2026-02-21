"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  metricas: {
    operacionesMes: number;
    operacionesMesAnterior: number;
    cerradasMes: number;
    totalComisionesGeneradas: number;
    totalPendientePago: number;
    agentesActivos: number;
  };
  topAgentes: { nombre: string; total: number }[];
  operacionesPendientes: Array<{
    id: string;
    numeroOperacion: string;
    estado: string;
    precioVenta: number;
    creador: { nombreCompleto: string };
    propiedad?: { direccion: string; tipo: string } | null;
  }>;
  ultimasOperaciones: Array<{
    id: string;
    numeroOperacion: string;
    estado: string;
    precioVenta: number;
    comisionTotalImporte: number;
    creador: { nombreCompleto: string };
    propiedad?: { direccion: string; tipo: string } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">Error cargando dashboard</p>;

  const m = data.metricas;
  const diffOps = m.operacionesMes - m.operacionesMesAnterior;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const now = new Date();
  const currentMonth = monthNames[now.getMonth()];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {currentMonth} {now.getFullYear()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Operaciones del mes"
          value={m.operacionesMes}
          trend={diffOps}
          subtitle="vs. mes anterior"
        />
        <StatCard
          title="Comisiones generadas"
          value={formatCurrency(m.totalComisionesGeneradas)}
        />
        <StatCard
          title="Pendiente de pago"
          value={formatCurrency(m.totalPendientePago)}
        />
        <StatCard title="Agentes activos" value={m.agentesActivos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {data.topAgentes.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Top Agentes ({currentMonth})
            </h2>
            <div className="space-y-3">
              {data.topAgentes.map((agente, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 w-6">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {agente.nombre}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(agente.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.operacionesPendientes.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Operaciones pendientes
            </h2>
            <div className="space-y-3">
              {data.operacionesPendientes.map((op) => (
                <div
                  key={op.id}
                  onClick={() => router.push(`/operaciones?id=${op.id}`)}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {op.numeroOperacion}
                    </p>
                    <p className="text-xs text-slate-400">
                      {op.propiedad?.direccion || "Sin propiedad"} -{" "}
                      {op.creador.nombreCompleto}
                    </p>
                  </div>
                  <Badge estado={op.estado} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Últimas operaciones
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Ref
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Agente
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Propiedad
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Precio
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Comisión
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.ultimasOperaciones.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => router.push(`/operaciones?id=${op.id}`)}
                  className="cursor-pointer hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {op.numeroOperacion}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {op.creador.nombreCompleto}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {op.propiedad?.direccion || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {formatCurrency(op.precioVenta)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(op.comisionTotalImporte)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge estado={op.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
