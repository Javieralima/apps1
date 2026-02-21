"use client";

import { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface Participante {
  nombre: string;
  rol: string;
  porcentaje: number;
  tipoFiscal: "autonomo" | "empleado" | "sociedad";
  aplicaIrpf: boolean;
  porcentajeIrpf: number;
  aplicaIgic: boolean;
  porcentajeIgic: number;
  modeloIgic: "adicional" | "incluido";
}

interface ResultadoParticipante extends Participante {
  importeBruto: number;
  retencionIrpf: number;
  igic: number;
  importeNeto: number;
}

const defaultParticipantes: Participante[] = [
  {
    nombre: "Captador",
    rol: "captador",
    porcentaje: 30,
    tipoFiscal: "autonomo",
    aplicaIrpf: true,
    porcentajeIrpf: 15,
    aplicaIgic: true,
    porcentajeIgic: 7,
    modeloIgic: "adicional",
  },
  {
    nombre: "Vendedor",
    rol: "vendedor",
    porcentaje: 30,
    tipoFiscal: "autonomo",
    aplicaIrpf: true,
    porcentajeIrpf: 15,
    aplicaIgic: true,
    porcentajeIgic: 7,
    modeloIgic: "adicional",
  },
  {
    nombre: "Agencia",
    rol: "agencia",
    porcentaje: 40,
    tipoFiscal: "sociedad",
    aplicaIrpf: false,
    porcentajeIrpf: 0,
    aplicaIgic: false,
    porcentajeIgic: 0,
    modeloIgic: "adicional",
  },
];

export default function SimuladorPage() {
  const [precioVenta, setPrecioVenta] = useState(250000);
  const [porcentajeComision, setPorcentajeComision] = useState(3.5);
  const [participantes, setParticipantes] = useState<Participante[]>(defaultParticipantes);
  const [showConfigIndex, setShowConfigIndex] = useState<number | null>(null);

  const comisionTotal = useMemo(() => {
    return Math.round(precioVenta * (porcentajeComision / 100) * 100) / 100;
  }, [precioVenta, porcentajeComision]);

  const sumaPorcentajes = useMemo(() => {
    return participantes.reduce((s, p) => s + p.porcentaje, 0);
  }, [participantes]);

  const resultados: ResultadoParticipante[] = useMemo(() => {
    if (Math.abs(sumaPorcentajes - 100) > 0.01) return [];

    let acumulado = 0;
    return participantes.map((p, i) => {
      const isLast = i === participantes.length - 1;
      let importeBruto: number;

      if (isLast) {
        importeBruto = Math.round((comisionTotal - acumulado) * 100) / 100;
      } else {
        importeBruto = Math.round(comisionTotal * (p.porcentaje / 100) * 100) / 100;
        acumulado += importeBruto;
      }

      let retencionIrpf = 0;
      let igic = 0;

      if (p.aplicaIrpf) {
        retencionIrpf = Math.round(importeBruto * (p.porcentajeIrpf / 100) * 100) / 100;
      }

      if (p.aplicaIgic && p.porcentajeIgic > 0) {
        if (p.modeloIgic === "adicional") {
          igic = Math.round(importeBruto * (p.porcentajeIgic / 100) * 100) / 100;
        } else {
          const baseSinIgic = importeBruto / (1 + p.porcentajeIgic / 100);
          igic = Math.round((importeBruto - baseSinIgic) * 100) / 100;
        }
      }

      let importeNeto: number;
      if (p.modeloIgic === "adicional" && p.aplicaIgic) {
        importeNeto = Math.round((importeBruto - retencionIrpf + igic) * 100) / 100;
      } else {
        importeNeto = Math.round((importeBruto - retencionIrpf) * 100) / 100;
      }

      return { ...p, importeBruto, retencionIrpf, igic, importeNeto };
    });
  }, [participantes, comisionTotal, sumaPorcentajes]);

  const totalBruto = resultados.reduce((s, r) => s + r.importeBruto, 0);
  const totalRetenciones = resultados.reduce((s, r) => s + r.retencionIrpf, 0);
  const totalIgic = resultados.reduce((s, r) => s + r.igic, 0);
  const totalNeto = resultados.reduce((s, r) => s + r.importeNeto, 0);

  const updateParticipante = (index: number, updates: Partial<Participante>) => {
    const newList = [...participantes];
    newList[index] = { ...newList[index], ...updates };
    setParticipantes(newList);
  };

  const addParticipante = () => {
    setParticipantes([
      ...participantes,
      {
        nombre: "Nuevo participante",
        rol: "vendedor",
        porcentaje: 0,
        tipoFiscal: "autonomo",
        aplicaIrpf: true,
        porcentajeIrpf: 15,
        aplicaIgic: true,
        porcentajeIgic: 7,
        modeloIgic: "adicional",
      },
    ]);
  };

  const removeParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Simulador de comisiones</h1>
        <p className="text-slate-500 mt-1">
          Calcula en tiempo real la distribución de comisiones antes de crear una operación
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Operation data */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Datos de la operación</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Precio de venta</label>
                <div className="relative">
                  <input
                    type="number"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">EUR</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="5000"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(parseInt(e.target.value))}
                  className="w-full mt-2 accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">% Comisión</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={porcentajeComision}
                    onChange={(e) => setPorcentajeComision(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={porcentajeComision}
                  onChange={(e) => setPorcentajeComision(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-blue-600"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Comisión total</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(comisionTotal)}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {porcentajeComision}% de {formatCurrency(precioVenta)}
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Participantes</h2>
              <button
                onClick={addParticipante}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Añadir
              </button>
            </div>

            <div className="space-y-3">
              {participantes.map((p, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={p.nombre}
                      onChange={(e) => updateParticipante(i, { nombre: e.target.value })}
                      className="flex-1 text-sm font-medium border-0 p-0 focus:ring-0 outline-none bg-transparent"
                    />
                    <button
                      onClick={() => setShowConfigIndex(showConfigIndex === i ? null : i)}
                      className="text-slate-400 hover:text-slate-600"
                      title="Configurar fiscal"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {participantes.length > 1 && (
                      <button
                        onClick={() => removeParticipante(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={p.rol}
                      onChange={(e) => updateParticipante(i, { rol: e.target.value })}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    >
                      <option value="captador">Captador</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="coordinador">Coordinador</option>
                      <option value="agencia">Agencia</option>
                      <option value="referral">Referral</option>
                    </select>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={p.porcentaje}
                        onChange={(e) =>
                          updateParticipante(i, { porcentaje: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 text-sm text-center border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 min-w-[80px] text-right">
                      {formatCurrency(comisionTotal * (p.porcentaje / 100))}
                    </span>
                  </div>

                  {/* Fiscal config expanded */}
                  {showConfigIndex === i && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400">Tipo fiscal</label>
                          <select
                            value={p.tipoFiscal}
                            onChange={(e) => {
                              const val = e.target.value as Participante["tipoFiscal"];
                              const updates: Partial<Participante> = { tipoFiscal: val };
                              if (val === "sociedad") {
                                updates.aplicaIrpf = false;
                                updates.porcentajeIrpf = 0;
                              } else {
                                updates.aplicaIrpf = true;
                                updates.porcentajeIrpf = val === "empleado" ? 18 : 15;
                              }
                              updateParticipante(i, updates);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                          >
                            <option value="autonomo">Autónomo</option>
                            <option value="empleado">Empleado</option>
                            <option value="sociedad">Sociedad</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400">IGIC modelo</label>
                          <select
                            value={p.modeloIgic}
                            onChange={(e) =>
                              updateParticipante(i, {
                                modeloIgic: e.target.value as "adicional" | "incluido",
                              })
                            }
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                          >
                            <option value="adicional">Adicional</option>
                            <option value="incluido">Incluido</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={p.aplicaIrpf}
                            onChange={(e) =>
                              updateParticipante(i, { aplicaIrpf: e.target.checked })
                            }
                            className="rounded border-slate-300"
                          />
                          <label className="text-[10px] text-slate-500">IRPF</label>
                          {p.aplicaIrpf && (
                            <input
                              type="number"
                              step="0.5"
                              value={p.porcentajeIrpf}
                              onChange={(e) =>
                                updateParticipante(i, {
                                  porcentajeIrpf: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-12 text-xs text-center border border-slate-200 rounded px-1 py-0.5"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={p.aplicaIgic}
                            onChange={(e) =>
                              updateParticipante(i, { aplicaIgic: e.target.checked })
                            }
                            className="rounded border-slate-300"
                          />
                          <label className="text-[10px] text-slate-500">IGIC</label>
                          {p.aplicaIgic && (
                            <input
                              type="number"
                              step="0.5"
                              value={p.porcentajeIgic}
                              onChange={(e) =>
                                updateParticipante(i, {
                                  porcentajeIgic: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-12 text-xs text-center border border-slate-200 rounded px-1 py-0.5"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 text-right">
              <span
                className={`text-sm font-semibold ${
                  Math.abs(sumaPorcentajes - 100) < 0.01
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Total: {sumaPorcentajes.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Total bruto</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalBruto)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Retenciones IRPF</p>
              <p className="text-lg font-bold text-red-600">-{formatCurrency(totalRetenciones)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">IGIC</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(totalIgic)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Total a pagar</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalNeto)}</p>
            </div>
          </div>

          {/* Results table */}
          {Math.abs(sumaPorcentajes - 100) > 0.01 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium">
                Los porcentajes deben sumar 100%
              </p>
              <p className="text-sm text-red-500 mt-1">
                Actualmente suman {sumaPorcentajes.toFixed(1)}% (faltan{" "}
                {(100 - sumaPorcentajes).toFixed(1)}%)
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900">Desglose por participante</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Participante
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                        Rol
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                        %
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                        Bruto
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                        IRPF
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                        IGIC
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Neto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultados.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{r.nombre}</p>
                          <p className="text-xs text-slate-400 capitalize">{r.tipoFiscal}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs capitalize bg-slate-100 px-2 py-0.5 rounded">
                            {r.rol}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">{r.porcentaje}%</td>
                        <td className="px-4 py-4 text-sm text-right font-medium">
                          {formatCurrency(r.importeBruto)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-red-600">
                          {r.retencionIrpf > 0 ? (
                            <>
                              -{formatCurrency(r.retencionIrpf)}
                              <span className="block text-[10px] text-red-400">
                                ({r.porcentajeIrpf}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-green-600">
                          {r.igic > 0 ? (
                            <>
                              +{formatCurrency(r.igic)}
                              <span className="block text-[10px] text-green-400">
                                ({r.porcentajeIgic}% {r.modeloIgic})
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">
                          {formatCurrency(r.importeNeto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <td className="px-6 py-3 text-sm" colSpan={3}>
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(totalBruto)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        -{formatCurrency(totalRetenciones)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        +{formatCurrency(totalIgic)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-blue-700">
                        {formatCurrency(totalNeto)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Visual bar chart */}
          {resultados.length > 0 && Math.abs(sumaPorcentajes - 100) < 0.01 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Distribución visual
              </h2>
              <div className="space-y-3">
                {resultados.map((r, i) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-purple-500",
                    "bg-rose-500",
                  ];
                  const maxNeto = Math.max(...resultados.map((x) => x.importeNeto));
                  const barWidth = maxNeto > 0 ? (r.importeNeto / maxNeto) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-slate-700 truncate">{r.nombre}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full ${colors[i % colors.length]} rounded-full flex items-center transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-[10px] text-white font-medium pl-2 whitespace-nowrap">
                            {formatCurrency(r.importeNeto)}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs text-slate-500">
                        {r.porcentaje}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full commission bar */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Distribución de la comisión total</p>
                <div className="flex rounded-full h-8 overflow-hidden">
                  {resultados.map((r, i) => {
                    const colors = [
                      "bg-blue-500",
                      "bg-emerald-500",
                      "bg-amber-500",
                      "bg-purple-500",
                      "bg-rose-500",
                    ];
                    return (
                      <div
                        key={i}
                        className={`${colors[i % colors.length]} flex items-center justify-center transition-all duration-500`}
                        style={{ width: `${r.porcentaje}%` }}
                        title={`${r.nombre}: ${r.porcentaje}%`}
                      >
                        {r.porcentaje >= 15 && (
                          <span className="text-[10px] text-white font-medium">
                            {r.porcentaje}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {resultados.map((r, i) => {
                    const colors = [
                      "bg-blue-500",
                      "bg-emerald-500",
                      "bg-amber-500",
                      "bg-purple-500",
                      "bg-rose-500",
                    ];
                    return (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                        <span className="text-[10px] text-slate-500">{r.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
