"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

interface Propiedad {
  id: string;
  referencia: string;
  tipo: string;
  direccion: string;
  ciudad: string | null;
  codigoPostal: string | null;
  precioVentaObjetivo: number;
  metrosCuadrados: number | null;
  habitaciones: number | null;
  banos: number | null;
  estado: string;
  observaciones: string | null;
  captador?: { id: string; nombreCompleto: string } | null;
}

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const [form, setForm] = useState({
    tipo: "piso",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    precioVentaObjetivo: "",
    metrosCuadrados: "",
    habitaciones: "",
    banos: "",
    observaciones: "",
  });

  const fetchPropiedades = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroTipo) params.set("tipo", filtroTipo);
    fetch(`/api/propiedades?${params}`)
      .then((r) => r.json())
      .then((d) => setPropiedades(d.propiedades || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filtroTipo]);

  useEffect(() => {
    fetchPropiedades();
  }, [fetchPropiedades]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/propiedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precioVentaObjetivo: parseFloat(form.precioVentaObjetivo),
          metrosCuadrados: form.metrosCuadrados
            ? parseInt(form.metrosCuadrados)
            : undefined,
          habitaciones: form.habitaciones
            ? parseInt(form.habitaciones)
            : undefined,
          banos: form.banos ? parseInt(form.banos) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreate(false);
      setForm({
        tipo: "piso",
        direccion: "",
        ciudad: "",
        codigoPostal: "",
        precioVentaObjetivo: "",
        metrosCuadrados: "",
        habitaciones: "",
        banos: "",
        observaciones: "",
      });
      fetchPropiedades();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Propiedades</h1>
          <p className="text-slate-500 mt-1">
            Catálogo de propiedades de la agencia
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nueva propiedad
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "piso", "casa", "local", "terreno", "garaje"].map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filtroTipo === t
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t === "" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {propiedades.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay propiedades</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propiedades.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {p.referencia}
                </span>
                <Badge estado={p.estado} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {p.direccion}
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                {p.ciudad || ""}{" "}
                {p.codigoPostal ? `(${p.codigoPostal})` : ""}
              </p>
              <p className="text-xl font-bold text-slate-900 mb-3">
                {formatCurrency(p.precioVentaObjetivo)}
              </p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="capitalize">{p.tipo}</span>
                {p.metrosCuadrados && <span>{p.metrosCuadrados} m²</span>}
                {p.habitaciones && <span>{p.habitaciones} hab.</span>}
                {p.banos && <span>{p.banos} baños</span>}
              </div>
              {p.captador && (
                <p className="text-xs text-slate-400 mt-3">
                  Captador: {p.captador.nombreCompleto}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva propiedad"
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
                Tipo *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="piso">Piso</option>
                <option value="casa">Casa/Chalet</option>
                <option value="local">Local comercial</option>
                <option value="terreno">Terreno</option>
                <option value="garaje">Garaje</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Precio objetivo *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.precioVentaObjetivo}
                onChange={(e) =>
                  setForm({ ...form, precioVentaObjetivo: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) =>
                setForm({ ...form, direccion: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) =>
                  setForm({ ...form, ciudad: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Código postal
              </label>
              <input
                type="text"
                value={form.codigoPostal}
                onChange={(e) =>
                  setForm({ ...form, codigoPostal: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                m²
              </label>
              <input
                type="number"
                value={form.metrosCuadrados}
                onChange={(e) =>
                  setForm({ ...form, metrosCuadrados: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Habitaciones
              </label>
              <input
                type="number"
                value={form.habitaciones}
                onChange={(e) =>
                  setForm({ ...form, habitaciones: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Baños
              </label>
              <input
                type="number"
                value={form.banos}
                onChange={(e) =>
                  setForm({ ...form, banos: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
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
              {saving ? "Guardando..." : "Crear propiedad"}
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
