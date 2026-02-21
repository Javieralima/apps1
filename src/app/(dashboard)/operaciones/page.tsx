"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate, getSplitRolLabel } from "@/lib/utils";

interface Operacion {
  id: string;
  numeroOperacion: string;
  estado: string;
  precioVenta: number;
  comisionTotalPorc: number;
  comisionTotalImporte: number;
  quienPagaComision: string;
  gastosOperacion: number;
  fechaReserva: string | null;
  fechaFirma: string | null;
  fechaCierre: string | null;
  observaciones: string | null;
  createdAt: string;
  propiedad?: { id: string; direccion: string; tipo: string } | null;
  comprador?: { id: string; nombreCompleto: string } | null;
  vendedorCliente?: { id: string; nombreCompleto: string } | null;
  creador: { id: string; nombreCompleto: string };
  comisiones: Array<{
    id: string;
    rolSplit: string;
    porcentajeSplit: number;
    importeBruto: number;
    retencionIrpf: number;
    igic: number;
    importeNeto: number;
    estadoPago: string;
    usuario: { id: string; nombreCompleto: string };
  }>;
}

interface Usuario {
  id: string;
  nombreCompleto: string;
  rol: string;
}

interface Propiedad {
  id: string;
  referencia: string;
  direccion: string;
  tipo: string;
  precioVentaObjetivo: number;
}

interface Cliente {
  id: string;
  nombreCompleto: string;
  tipo: string;
}

export default function OperacionesPage() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Operacion | null>(null);
  const [showSplits, setShowSplits] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    propiedadId: "",
    compradorId: "",
    vendedorClienteId: "",
    precioVenta: "",
    comisionTotalPorc: "3.5",
    quienPagaComision: "vendedor",
    observaciones: "",
  });

  const [splitForm, setSplitForm] = useState<
    Array<{ usuarioId: string; rolSplit: string; porcentajeSplit: string }>
  >([
    { usuarioId: "", rolSplit: "captador", porcentajeSplit: "30" },
    { usuarioId: "", rolSplit: "vendedor", porcentajeSplit: "30" },
    { usuarioId: "", rolSplit: "agencia", porcentajeSplit: "40" },
  ]);

  const fetchOperaciones = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    fetch(`/api/operaciones?${params}`)
      .then((r) => r.json())
      .then((d) => setOperaciones(d.operaciones || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filtroEstado]);

  useEffect(() => {
    fetchOperaciones();
  }, [fetchOperaciones]);

  useEffect(() => {
    Promise.all([
      fetch("/api/usuarios").then((r) => r.json()),
      fetch("/api/propiedades?estado=disponible").then((r) => r.json()),
      fetch("/api/clientes").then((r) => r.json()),
    ]).then(([u, p, c]) => {
      setUsuarios(u.usuarios || []);
      setPropiedades(p.propiedades || []);
      setClientes(c.clientes || []);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/operaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          precioVenta: parseFloat(createForm.precioVenta),
          comisionTotalPorc: parseFloat(createForm.comisionTotalPorc),
          propiedadId: createForm.propiedadId || undefined,
          compradorId: createForm.compradorId || undefined,
          vendedorClienteId: createForm.vendedorClienteId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreate(false);
      setCreateForm({
        propiedadId: "",
        compradorId: "",
        vendedorClienteId: "",
        precioVenta: "",
        comisionTotalPorc: "3.5",
        quienPagaComision: "vendedor",
        observaciones: "",
      });
      fetchOperaciones();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleEstadoChange = async (
    operacionId: string,
    nuevoEstado: string,
  ) => {
    try {
      const res = await fetch(`/api/operaciones/${operacionId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      fetchOperaciones();
      if (showDetail?.id === operacionId) {
        setShowDetail(data.operacion);
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleSaveSplits = async () => {
    if (!showDetail) return;
    setSaving(true);
    setError("");

    const agentes = usuarios.filter((u) => u.rol === "agente" || u.rol === "admin" || u.rol === "manager");
    // For "agencia" split, use first admin user as placeholder
    const adminUser = usuarios.find((u) => u.rol === "admin");

    const participantes = splitForm.map((s) => ({
      usuarioId: s.rolSplit === "agencia" ? (adminUser?.id || s.usuarioId) : s.usuarioId,
      rolSplit: s.rolSplit,
      porcentajeSplit: parseFloat(s.porcentajeSplit),
    }));

    try {
      const res = await fetch(
        `/api/operaciones/${showDetail.id}/comisiones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantes }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowSplits(false);
      // Refresh detail
      const detailRes = await fetch(`/api/operaciones/${showDetail.id}`);
      const detailData = await detailRes.json();
      setShowDetail(detailData.operacion);
      fetchOperaciones();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const getNextStates = (estado: string) => {
    const transitions: Record<string, string[]> = {
      lead: ["reserva", "cancelada"],
      reserva: ["firma_pendiente", "cancelada"],
      firma_pendiente: ["cerrada", "cancelada"],
    };
    return transitions[estado] || [];
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
          <h1 className="text-2xl font-bold text-slate-900">Operaciones</h1>
          <p className="text-slate-500 mt-1">
            Gestión de operaciones inmobiliarias
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nueva operación
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "lead", "reserva", "firma_pendiente", "cerrada", "cancelada"].map(
          (e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filtroEstado === e
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {e === "" ? "Todas" : e.charAt(0).toUpperCase() + e.slice(1).replace("_", " ")}
            </button>
          ),
        )}
      </div>

      {operaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay operaciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operaciones.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setShowDetail(op)}
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
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(op.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva operación"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Precio de venta *
              </label>
              <input
                type="number"
                step="0.01"
                value={createForm.precioVenta}
                onChange={(e) =>
                  setCreateForm({ ...createForm, precioVenta: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                % Comisión *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="10"
                value={createForm.comisionTotalPorc}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    comisionTotalPorc: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Propiedad
            </label>
            <select
              value={createForm.propiedadId}
              onChange={(e) =>
                setCreateForm({ ...createForm, propiedadId: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Sin propiedad asignada</option>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.referencia} - {p.direccion} ({formatCurrency(p.precioVentaObjetivo)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comprador
              </label>
              <select
                value={createForm.compradorId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, compradorId: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Seleccionar...</option>
                {clientes
                  .filter((c) => c.tipo === "comprador")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompleto}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vendedor (cliente)
              </label>
              <select
                value={createForm.vendedorClienteId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    vendedorClienteId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Seleccionar...</option>
                {clientes
                  .filter((c) => c.tipo === "vendedor")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompleto}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quien paga comisión
            </label>
            <select
              value={createForm.quienPagaComision}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  quienPagaComision: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="vendedor">Vendedor</option>
              <option value="comprador">Comprador</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={createForm.observaciones}
              onChange={(e) =>
                setCreateForm({ ...createForm, observaciones: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear operación"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => {
          setShowDetail(null);
          setShowSplits(false);
        }}
        title={showDetail ? `Operación ${showDetail.numeroOperacion}` : ""}
        size="xl"
      >
        {showDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge estado={showDetail.estado} />
              <span className="text-sm text-slate-500">
                Creada: {formatDate(showDetail.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Precio venta</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(showDetail.precioVenta)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Comisión</p>
                <p className="text-lg font-semibold">
                  {showDetail.comisionTotalPorc}% ={" "}
                  {formatCurrency(showDetail.comisionTotalImporte)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paga</p>
                <p className="text-sm font-medium capitalize">
                  {showDetail.quienPagaComision}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Agente</p>
                <p className="text-sm font-medium">
                  {showDetail.creador.nombreCompleto}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Propiedad</p>
                <p className="text-sm">
                  {showDetail.propiedad?.direccion || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Comprador</p>
                <p className="text-sm">
                  {showDetail.comprador?.nombreCompleto || "-"}
                </p>
              </div>
            </div>

            {showDetail.observaciones && (
              <div>
                <p className="text-xs text-slate-500">Observaciones</p>
                <p className="text-sm text-slate-700 mt-1">
                  {showDetail.observaciones}
                </p>
              </div>
            )}

            {/* Commission splits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Distribución de comisiones
                </h3>
                {!["cerrada", "cancelada"].includes(showDetail.estado) && (
                  <button
                    onClick={() => setShowSplits(!showSplits)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showSplits ? "Cancelar" : "Configurar splits"}
                  </button>
                )}
              </div>

              {showSplits ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                  {error && (
                    <div className="p-2 bg-red-50 text-red-700 rounded text-sm">
                      {error}
                    </div>
                  )}
                  {splitForm.map((split, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1">
                          Rol
                        </label>
                        <select
                          value={split.rolSplit}
                          onChange={(e) => {
                            const newSplits = [...splitForm];
                            newSplits[i].rolSplit = e.target.value;
                            setSplitForm(newSplits);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        >
                          <option value="captador">Captador</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="coordinador">Coordinador</option>
                          <option value="agencia">Agencia</option>
                          <option value="referral">Referral</option>
                        </select>
                      </div>
                      {split.rolSplit !== "agencia" && (
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">
                            Agente
                          </label>
                          <select
                            value={split.usuarioId}
                            onChange={(e) => {
                              const newSplits = [...splitForm];
                              newSplits[i].usuarioId = e.target.value;
                              setSplitForm(newSplits);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                          >
                            <option value="">Seleccionar...</option>
                            {usuarios.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nombreCompleto}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="w-20">
                        <label className="block text-xs text-slate-500 mb-1">
                          %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={split.porcentajeSplit}
                          onChange={(e) => {
                            const newSplits = [...splitForm];
                            newSplits[i].porcentajeSplit = e.target.value;
                            setSplitForm(newSplits);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                      {splitForm.length > 1 && (
                        <button
                          onClick={() => {
                            setSplitForm(splitForm.filter((_, j) => j !== i));
                          }}
                          className="text-red-500 hover:text-red-700 pb-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() =>
                        setSplitForm([
                          ...splitForm,
                          {
                            usuarioId: "",
                            rolSplit: "vendedor",
                            porcentajeSplit: "0",
                          },
                        ])
                      }
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir participante
                    </button>
                    <div className="text-sm">
                      Total:{" "}
                      <span
                        className={`font-semibold ${
                          Math.abs(
                            splitForm.reduce(
                              (s, f) =>
                                s + (parseFloat(f.porcentajeSplit) || 0),
                              0,
                            ) - 100,
                          ) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {splitForm
                          .reduce(
                            (s, f) =>
                              s + (parseFloat(f.porcentajeSplit) || 0),
                            0,
                          )
                          .toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSplits}
                    disabled={saving}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 mt-2"
                  >
                    {saving ? "Calculando..." : "Calcular y guardar comisiones"}
                  </button>
                </div>
              ) : showDetail.comisiones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-xs text-slate-500">
                          Rol
                        </th>
                        <th className="text-left py-2 text-xs text-slate-500">
                          Agente
                        </th>
                        <th className="text-right py-2 text-xs text-slate-500">
                          %
                        </th>
                        <th className="text-right py-2 text-xs text-slate-500">
                          Bruto
                        </th>
                        <th className="text-right py-2 text-xs text-slate-500">
                          IRPF
                        </th>
                        <th className="text-right py-2 text-xs text-slate-500">
                          IGIC
                        </th>
                        <th className="text-right py-2 text-xs text-slate-500">
                          Neto
                        </th>
                        <th className="text-center py-2 text-xs text-slate-500">
                          Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetail.comisiones.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100">
                          <td className="py-2">
                            {getSplitRolLabel(c.rolSplit)}
                          </td>
                          <td className="py-2">
                            {c.usuario.nombreCompleto}
                          </td>
                          <td className="py-2 text-right">
                            {c.porcentajeSplit}%
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(c.importeBruto)}
                          </td>
                          <td className="py-2 text-right text-red-600">
                            {c.retencionIrpf > 0
                              ? `-${formatCurrency(c.retencionIrpf)}`
                              : "-"}
                          </td>
                          <td className="py-2 text-right text-green-600">
                            {c.igic > 0
                              ? `+${formatCurrency(c.igic)}`
                              : "-"}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {formatCurrency(c.importeNeto)}
                          </td>
                          <td className="py-2 text-center">
                            <Badge estado={c.estadoPago} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Sin splits configurados
                </p>
              )}
            </div>

            {/* Action buttons */}
            {getNextStates(showDetail.estado).length > 0 && (
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {getNextStates(showDetail.estado).map((nextState) => (
                  <button
                    key={nextState}
                    onClick={() =>
                      handleEstadoChange(showDetail.id, nextState)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      nextState === "cancelada"
                        ? "border border-red-300 text-red-600 hover:bg-red-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Cambiar a {nextState.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
