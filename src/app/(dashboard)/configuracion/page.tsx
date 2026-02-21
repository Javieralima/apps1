"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { parseSplitsConfig } from "@/lib/utils";

interface Regla {
  id: string;
  nombreRegla: string;
  tipoPropiedad: string | null;
  activa: boolean;
  prioridad: number;
  splitsConfig: string;
  condiciones: string;
}

export default function ConfiguracionPage() {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombreRegla: "",
    tipoPropiedad: "",
    prioridad: "1",
    captador: "30",
    vendedor: "30",
    agencia: "40",
    coordinador: "0",
    referral: "0",
  });

  const fetchReglas = () => {
    fetch("/api/reglas")
      .then((r) => r.json())
      .then((d) => setReglas(d.reglas || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReglas();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const splitsConfig: Record<string, number> = {};
    if (parseFloat(form.captador) > 0)
      splitsConfig.captador = parseFloat(form.captador);
    if (parseFloat(form.vendedor) > 0)
      splitsConfig.vendedor = parseFloat(form.vendedor);
    if (parseFloat(form.agencia) > 0)
      splitsConfig.agencia = parseFloat(form.agencia);
    if (parseFloat(form.coordinador) > 0)
      splitsConfig.coordinador = parseFloat(form.coordinador);
    if (parseFloat(form.referral) > 0)
      splitsConfig.referral = parseFloat(form.referral);

    try {
      const res = await fetch("/api/reglas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreRegla: form.nombreRegla,
          tipoPropiedad: form.tipoPropiedad || null,
          prioridad: parseInt(form.prioridad),
          splitsConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreate(false);
      setForm({
        nombreRegla: "",
        tipoPropiedad: "",
        prioridad: "1",
        captador: "30",
        vendedor: "30",
        agencia: "40",
        coordinador: "0",
        referral: "0",
      });
      fetchReglas();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const splitTotal =
    parseFloat(form.captador || "0") +
    parseFloat(form.vendedor || "0") +
    parseFloat(form.agencia || "0") +
    parseFloat(form.coordinador || "0") +
    parseFloat(form.referral || "0");

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
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-500 mt-1">
            Reglas de comisiones y configuración de la agencia
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nueva regla
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Reglas de comisión
        </h2>
        {reglas.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400">No hay reglas configuradas</p>
            <p className="text-sm text-slate-400 mt-1">
              Las reglas definen cómo se distribuyen las comisiones
              automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reglas.map((regla) => {
              const splits = parseSplitsConfig(regla.splitsConfig);
              return (
                <div
                  key={regla.id}
                  className="bg-white rounded-xl border border-slate-200 p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">
                        {regla.nombreRegla}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          regla.activa
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {regla.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Prioridad: {regla.prioridad}
                    </span>
                  </div>
                  {regla.tipoPropiedad && (
                    <p className="text-sm text-slate-500 mb-3 capitalize">
                      Tipo: {regla.tipoPropiedad}
                    </p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(splits).map(([rol, pct]) => (
                      <div
                        key={rol}
                        className="bg-slate-50 px-3 py-2 rounded-lg"
                      >
                        <p className="text-xs text-slate-500 capitalize">
                          {rol}
                        </p>
                        <p className="text-sm font-semibold">{pct as number}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva regla de comisión"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de la regla *
            </label>
            <input
              type="text"
              value={form.nombreRegla}
              onChange={(e) =>
                setForm({ ...form, nombreRegla: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              placeholder="Ej: Regla estándar piso"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de propiedad
              </label>
              <select
                value={form.tipoPropiedad}
                onChange={(e) =>
                  setForm({ ...form, tipoPropiedad: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todas</option>
                <option value="piso">Piso</option>
                <option value="casa">Casa/Chalet</option>
                <option value="local">Local</option>
                <option value="terreno">Terreno</option>
                <option value="garaje">Garaje</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prioridad
              </label>
              <input
                type="number"
                min="1"
                value={form.prioridad}
                onChange={(e) =>
                  setForm({ ...form, prioridad: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Distribución de splits
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { key: "captador", label: "Captador" },
                { key: "vendedor", label: "Vendedor" },
                { key: "agencia", label: "Agencia" },
                { key: "coordinador", label: "Coordinador" },
                { key: "referral", label: "Referral" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-500 mb-1">
                    {label} %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <p
              className={`text-sm mt-2 ${
                Math.abs(splitTotal - 100) < 0.01
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Total: {splitTotal.toFixed(2)}%{" "}
              {Math.abs(splitTotal - 100) < 0.01 ? "" : "(debe ser 100%)"}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || Math.abs(splitTotal - 100) > 0.01}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear regla"}
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
