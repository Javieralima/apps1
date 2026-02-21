"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatDate, getSplitRolLabel } from "@/lib/utils";

interface Comision {
  id: string;
  rolSplit: string;
  porcentajeSplit: number;
  importeBruto: number;
  retencionIrpf: number;
  igic: number;
  importeNeto: number;
  estadoPago: string;
  fechaPago: string | null;
  createdAt: string;
  operacion: {
    id: string;
    numeroOperacion: string;
    precioVenta: number;
    propiedad?: { direccion: string; tipo: string } | null;
  };
  usuario: {
    id: string;
    nombreCompleto: string;
    tipoFiscal: string;
    nif: string | null;
  };
}

interface Totales {
  bruto: number;
  retenciones: number;
  neto: number;
  pendiente: number;
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [totales, setTotales] = useState<Totales>({
    bruto: 0,
    retenciones: 0,
    neto: 0,
    pendiente: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado_pago", filtroEstado);
    fetch(`/api/comisiones?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setComisiones(d.comisiones || []);
        setTotales(
          d.totales || { bruto: 0, retenciones: 0, neto: 0, pendiente: 0 },
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filtroEstado]);

  const handleMarcarPagado = async () => {
    if (selectedIds.size === 0) return;
    const referencia = prompt("Referencia de pago (opcional):");
    try {
      const res = await fetch("/api/comisiones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          estadoPago: "pagado",
          referenciaPago: referencia || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      setSelectedIds(new Set());
      // Refresh
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado_pago", filtroEstado);
      const refreshRes = await fetch(`/api/comisiones?${params}`);
      const refreshData = await refreshRes.json();
      setComisiones(refreshData.comisiones || []);
      setTotales(refreshData.totales);
    } catch {
      alert("Error de conexión");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Operación",
      "Agente",
      "NIF",
      "Tipo Fiscal",
      "Rol",
      "Bruto",
      "IRPF",
      "IGIC",
      "Neto",
      "Estado Pago",
      "Fecha",
    ];
    const rows = comisiones.map((c) => [
      c.operacion.numeroOperacion,
      c.usuario.nombreCompleto,
      c.usuario.nif || "",
      c.usuario.tipoFiscal,
      c.rolSplit,
      c.importeBruto.toFixed(2),
      c.retencionIrpf.toFixed(2),
      c.igic.toFixed(2),
      c.importeNeto.toFixed(2),
      c.estadoPago,
      new Date(c.createdAt).toLocaleDateString("es-ES"),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comisiones_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <h1 className="text-2xl font-bold text-slate-900">Comisiones</h1>
          <p className="text-slate-500 mt-1">
            Distribución y estado de pago de comisiones
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Exportar CSV
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleMarcarPagado}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Marcar pagado ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total bruto" value={formatCurrency(totales.bruto)} />
        <StatCard
          title="Retenciones"
          value={formatCurrency(totales.retenciones)}
        />
        <StatCard title="Total neto" value={formatCurrency(totales.neto)} />
        <StatCard
          title="Pendiente de pago"
          value={formatCurrency(totales.pendiente)}
        />
      </div>

      <div className="flex gap-2 mb-6">
        {["", "pendiente", "pagado"].map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filtroEstado === e
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {e === "" ? "Todas" : e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      {comisiones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay comisiones</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            new Set(
                              comisiones
                                .filter((c) => c.estadoPago === "pendiente")
                                .map((c) => c.id),
                            ),
                          );
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Operación
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Agente
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Rol
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Bruto
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    IRPF
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Neto
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comisiones.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-4">
                      {c.estadoPago === "pendiente" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={(e) => {
                            const newIds = new Set(selectedIds);
                            if (e.target.checked) {
                              newIds.add(c.id);
                            } else {
                              newIds.delete(c.id);
                            }
                            setSelectedIds(newIds);
                          }}
                          className="rounded border-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-blue-600">
                        {c.operacion.numeroOperacion}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.operacion.propiedad?.direccion || ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {c.usuario.nombreCompleto}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {getSplitRolLabel(c.rolSplit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatCurrency(c.importeBruto)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">
                      {c.retencionIrpf > 0
                        ? `-${formatCurrency(c.retencionIrpf)}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      {formatCurrency(c.importeNeto)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge estado={c.estadoPago} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
