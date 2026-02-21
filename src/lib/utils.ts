export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function getEstadoColor(estado: string): string {
  const colores: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    reserva: "bg-yellow-100 text-yellow-800",
    firma_pendiente: "bg-orange-100 text-orange-800",
    cerrada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
    pendiente: "bg-yellow-100 text-yellow-800",
    pagado: "bg-green-100 text-green-800",
    parcial: "bg-orange-100 text-orange-800",
    borrador: "bg-gray-100 text-gray-800",
    aprobada: "bg-blue-100 text-blue-800",
    pagada: "bg-green-100 text-green-800",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
}

export function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    lead: "Lead",
    reserva: "Reserva",
    firma_pendiente: "Firma Pendiente",
    cerrada: "Cerrada",
    cancelada: "Cancelada",
    pendiente: "Pendiente",
    pagado: "Pagado",
    parcial: "Parcial",
    borrador: "Borrador",
    aprobada: "Aprobada",
    pagada: "Pagada",
  };
  return labels[estado] || estado;
}

export function getRolLabel(rol: string): string {
  const labels: Record<string, string> = {
    admin: "Administrador",
    manager: "Director Comercial",
    agente: "Agente Comercial",
    contabilidad: "Contabilidad",
  };
  return labels[rol] || rol;
}

export function getSplitRolLabel(rol: string): string {
  const labels: Record<string, string> = {
    captador: "Captador",
    vendedor: "Vendedor",
    coordinador: "Coordinador",
    agencia: "Agencia",
    referral: "Referral",
    bonus_objetivo: "Bonus Objetivo",
  };
  return labels[rol] || rol;
}

export function parseFiscalConfig(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return {
      aplica_irpf: true,
      porcentaje_irpf: 15,
      aplica_igic: false,
      porcentaje_igic: 0,
      modelo_igic: "adicional",
      iban: "",
      observaciones: "",
    };
  }
}

export function parseSplitsConfig(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return { captador: 30, vendedor: 30, agencia: 40 };
  }
}

export function parseObjetivos(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return { ventas_mes: 3, facturacion_mes: 15000, bonus_por_objetivo: 500 };
  }
}
