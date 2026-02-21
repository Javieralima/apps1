"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { getRolLabel, parseFiscalConfig } from "@/lib/utils";

interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  telefono: string | null;
  nif: string | null;
  tipoFiscal: string;
  configFiscal: string;
  estado: string;
  fechaAlta: string;
}

export default function AgentesPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Usuario | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombreCompleto: "",
    rol: "agente",
    telefono: "",
    nif: "",
    tipoFiscal: "autonomo",
  });

  const fetchUsuarios = () => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((d) => setUsuarios(d.usuarios || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreate(false);
      setForm({
        email: "",
        password: "",
        nombreCompleto: "",
        rol: "agente",
        telefono: "",
        nif: "",
        tipoFiscal: "autonomo",
      });
      fetchUsuarios();
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
          <h1 className="text-2xl font-bold text-slate-900">
            Equipo de agentes
          </h1>
          <p className="text-slate-500 mt-1">
            Gestión de usuarios y configuración fiscal
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nuevo agente
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay agentes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((u) => (
            <div
              key={u.id}
              onClick={() => setShowDetail(u)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                  {u.nombreCompleto
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {u.nombreCompleto}
                  </h3>
                  <p className="text-sm text-slate-500">{getRolLabel(u.rol)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{u.email}</p>
                {u.telefono && <p>{u.telefono}</p>}
                <div className="flex items-center gap-2">
                  <span className="capitalize text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {u.tipoFiscal}
                  </span>
                  {u.nif && (
                    <span className="text-xs text-slate-400">{u.nif}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo agente"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              minLength={8}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rol
              </label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="agente">Agente comercial</option>
                <option value="manager">Director comercial</option>
                <option value="contabilidad">Contabilidad</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo fiscal
              </label>
              <select
                value={form.tipoFiscal}
                onChange={(e) =>
                  setForm({ ...form, tipoFiscal: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="autonomo">Autónomo</option>
                <option value="empleado">Empleado</option>
                <option value="sociedad">Sociedad</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear agente"}
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
        onClose={() => setShowDetail(null)}
        title={showDetail?.nombreCompleto || ""}
      >
        {showDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium">{showDetail.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rol</p>
                <p className="text-sm font-medium">
                  {getRolLabel(showDetail.rol)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Teléfono</p>
                <p className="text-sm">{showDetail.telefono || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">NIF</p>
                <p className="text-sm">{showDetail.nif || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo fiscal</p>
                <p className="text-sm capitalize">{showDetail.tipoFiscal}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estado</p>
                <Badge estado={showDetail.estado} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Configuración fiscal
              </h3>
              {(() => {
                const config = parseFiscalConfig(showDetail.configFiscal);
                return (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">IRPF</p>
                      <p>
                        {config.aplica_irpf
                          ? `${config.porcentaje_irpf}%`
                          : "No aplica"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IGIC</p>
                      <p>
                        {config.aplica_igic
                          ? `${config.porcentaje_igic}% (${config.modelo_igic})`
                          : "No aplica"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IBAN</p>
                      <p>{config.iban || "No configurado"}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
