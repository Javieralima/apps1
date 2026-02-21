"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatPeriodo } from "@/lib/utils";

interface Liquidacion {
  id: string;
  periodo: string;
  totalOperaciones: number;
  totalBruto: number;
  totalRetenciones: number;
  totalNeto: number;
  estado: string;
  generadaAt: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    nif: string | null;
    tipoFiscal: string;
  };
}

export default function LiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerar, setShowGenerar] = useState(false);
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const fetchLiquidaciones = () => {
    fetch("/api/liquidaciones")
      .then((r) => r.json())
      .then((d) => setLiquidaciones(d.liquidaciones || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLiquidaciones();
  }, []);

  const handleGenerar = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowGenerar(false);
      fetchLiquidaciones();
    } catch {
      setError("Error de conexión");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Periodo",
      "Agente",
      "NIF",
      "Tipo Fiscal",
      "Operaciones",
      "Total Bruto",
      "Retenciones",
      "Total Neto",
      "Estado",
    ];
    const rows = liquidaciones.map((l) => [
      l.periodo,
      l.usuario.nombreCompleto,
      l.usuario.nif || "",
      l.usuario.tipoFiscal,
      l.totalOperaciones,
      l.totalBruto.toFixed(2),
      l.totalRetenciones.toFixed(2),
      l.totalNeto.toFixed(2),
      l.estado,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liquidaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Liquidaciones</h1>
          <p className="text-slate-500 mt-1">
            Resumen mensual de comisiones por agente
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setShowGenerar(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Generar liquidación
          </button>
        </div>
      </div>

      {liquidaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay liquidaciones generadas</p>
          <button
            onClick={() => setShowGenerar(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Generar primera liquidación
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Periodo
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Agente
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    NIF
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Ops.
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Bruto
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Retenciones
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Neto
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatPeriodo(l.periodo)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {l.usuario.nombreCompleto}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {l.usuario.nif || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {l.totalOperaciones}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatCurrency(l.totalBruto)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">
                      {l.totalRetenciones > 0
                        ? `-${formatCurrency(l.totalRetenciones)}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      {formatCurrency(l.totalNeto)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge estado={l.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showGenerar}
        onClose={() => setShowGenerar(false)}
        title="Generar liquidación mensual"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Se generarán las liquidaciones para todas las operaciones cerradas en
            el periodo seleccionado. Las liquidaciones existentes para el mismo
            periodo serán reemplazadas.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Periodo (YYYY-MM)
            </label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerar}
              disabled={generating}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {generating ? "Generando..." : "Generar liquidaciones"}
            </button>
            <button
              onClick={() => setShowGenerar(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
