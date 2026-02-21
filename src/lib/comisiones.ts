import Decimal from "decimal.js";

Decimal.set({ rounding: Decimal.ROUND_HALF_UP, precision: 20 });

export interface ConfigFiscal {
  aplica_irpf: boolean;
  porcentaje_irpf: number;
  aplica_igic: boolean;
  porcentaje_igic: number;
  modelo_igic: "adicional" | "incluido";
}

export interface SplitConfig {
  captador: number;
  vendedor: number;
  agencia: number;
  coordinador?: number;
  referral?: number;
}

export interface SplitParticipante {
  usuarioId: string;
  rolSplit: string;
  porcentajeSplit: number;
}

export interface ResultadoComision {
  usuarioId: string;
  rolSplit: string;
  porcentajeSplit: number;
  importeBruto: number;
  retencionIrpf: number;
  igic: number;
  importeNeto: number;
}

export function calcularComisionTotal(
  precioVenta: number,
  porcentajeComision: number,
): number {
  const precio = new Decimal(precioVenta);
  const porcentaje = new Decimal(porcentajeComision).div(100);
  return precio.mul(porcentaje).toDecimalPlaces(2).toNumber();
}

export function calcularComisionNeta(
  importeBruto: number,
  configFiscal: ConfigFiscal,
): {
  importeBruto: number;
  retencionIrpf: number;
  igic: number;
  importeNeto: number;
} {
  const bruto = new Decimal(importeBruto);
  let retencionIrpf = new Decimal(0);
  let igic = new Decimal(0);

  // IRPF retention
  if (configFiscal.aplica_irpf) {
    retencionIrpf = bruto
      .mul(new Decimal(configFiscal.porcentaje_irpf).div(100))
      .toDecimalPlaces(2);
  }

  // IGIC calculation
  if (configFiscal.aplica_igic && configFiscal.porcentaje_igic > 0) {
    if (configFiscal.modelo_igic === "adicional") {
      igic = bruto
        .mul(new Decimal(configFiscal.porcentaje_igic).div(100))
        .toDecimalPlaces(2);
    } else {
      // Included model - IGIC is already in the gross
      const baseSinIgic = bruto.div(
        new Decimal(1).plus(
          new Decimal(configFiscal.porcentaje_igic).div(100),
        ),
      );
      igic = bruto.minus(baseSinIgic).toDecimalPlaces(2);
    }
  }

  // Net calculation
  let importeNeto: Decimal;
  if (configFiscal.modelo_igic === "adicional" && configFiscal.aplica_igic) {
    importeNeto = bruto.minus(retencionIrpf).plus(igic);
  } else {
    importeNeto = bruto.minus(retencionIrpf);
  }

  return {
    importeBruto: bruto.toDecimalPlaces(2).toNumber(),
    retencionIrpf: retencionIrpf.toNumber(),
    igic: igic.toNumber(),
    importeNeto: importeNeto.toDecimalPlaces(2).toNumber(),
  };
}

export function calcularSplits(
  comisionTotal: number,
  participantes: SplitParticipante[],
  configsFiscales: Map<string, ConfigFiscal>,
): ResultadoComision[] {
  const total = new Decimal(comisionTotal);
  const resultados: ResultadoComision[] = [];

  // Validate splits sum to 100
  const sumaPorcentajes = participantes.reduce(
    (sum, p) => sum + p.porcentajeSplit,
    0,
  );
  if (Math.abs(sumaPorcentajes - 100) > 0.01) {
    throw new Error(
      `La suma de splits es ${sumaPorcentajes}%, debe ser 100%`,
    );
  }

  let sumaCalculada = new Decimal(0);

  for (let i = 0; i < participantes.length; i++) {
    const p = participantes[i];
    const isLast = i === participantes.length - 1;

    // For the last participant, assign the remainder to avoid rounding issues
    let importeBruto: Decimal;
    if (isLast) {
      importeBruto = total.minus(sumaCalculada);
    } else {
      importeBruto = total
        .mul(new Decimal(p.porcentajeSplit).div(100))
        .toDecimalPlaces(2);
      sumaCalculada = sumaCalculada.plus(importeBruto);
    }

    const configFiscal = configsFiscales.get(p.usuarioId);

    if (configFiscal) {
      const resultado = calcularComisionNeta(
        importeBruto.toNumber(),
        configFiscal,
      );
      resultados.push({
        usuarioId: p.usuarioId,
        rolSplit: p.rolSplit,
        porcentajeSplit: p.porcentajeSplit,
        ...resultado,
      });
    } else {
      // For agency split or participants without fiscal config
      resultados.push({
        usuarioId: p.usuarioId,
        rolSplit: p.rolSplit,
        porcentajeSplit: p.porcentajeSplit,
        importeBruto: importeBruto.toDecimalPlaces(2).toNumber(),
        retencionIrpf: 0,
        igic: 0,
        importeNeto: importeBruto.toDecimalPlaces(2).toNumber(),
      });
    }
  }

  return resultados;
}

export function generarNumeroOperacion(count: number): string {
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, "0");
  return `OP-${year}-${num}`;
}

export function generarReferencia(tipo: string, count: number): string {
  const year = new Date().getFullYear();
  const prefix = tipo.substring(0, 2).toUpperCase();
  const num = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
}
