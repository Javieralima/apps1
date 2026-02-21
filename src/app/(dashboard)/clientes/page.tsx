"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";

interface Cliente {
  id: string;
  tipo: string;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  nif: string | null;
  observaciones: string | null;
  createdAt: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const [form, setForm] = useState({
    tipo: "comprador",
    nombreCompleto: "",
    email: "",
    telefono: "",
    nif: "",
    observaciones: "",
  });

  const fetchClientes = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroTipo) params.set("tipo", filtroTipo);
    fetch(`/api/clientes?${params}`)
      .then((r) => r.json())
      .then((d) => setClientes(d.clientes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filtroTipo]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || undefined,
          telefono: form.telefono || undefined,
          nif: form.nif || undefined,
          observaciones: form.observaciones || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreate(false);
      setForm({
        tipo: "comprador",
        nombreCompleto: "",
        email: "",
        telefono: "",
        nif: "",
        observaciones: "",
      });
      fetchClientes();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const compradores = clientes.filter(
    (c) => c.tipo === "comprador" || (!filtroTipo && c.tipo === "comprador"),
  );
  const vendedores = clientes.filter(
    (c) => c.tipo === "vendedor" || (!filtroTipo && c.tipo === "vendedor"),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">
            Compradores y vendedores de la agencia
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "comprador", "vendedor"].map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filtroTipo === t
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t === ""
              ? "Todos"
              : t === "comprador"
                ? "Compradores"
                : "Vendedores"}
          </button>
        ))}
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Teléfono
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    NIF
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            c.tipo === "comprador"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {c.nombreCompleto
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {c.nombreCompleto}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded capitalize ${
                          c.tipo === "comprador"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {c.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {c.telefono || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {c.nif || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">
                      {c.observaciones || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo cliente"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo *
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={form.nombreCompleto}
              onChange={(e) =>
                setForm({ ...form, nombreCompleto: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) =>
                  setForm({ ...form, telefono: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              NIF
            </label>
            <input
              type="text"
              value={form.nif}
              onChange={(e) => setForm({ ...form, nif: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
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
              {saving ? "Creando..." : "Crear cliente"}
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
    </div>
  );
}
