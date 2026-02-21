import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.auditoria.deleteMany();
  await prisma.liquidacion.deleteMany();
  await prisma.comisionSplit.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.operacion.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.reglaComision.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.agencia.deleteMany();

  console.log("Creando agencia...");
  const agencia = await prisma.agencia.create({
    data: {
      nombre: "InmoCanarias Pro",
      nif: "B76543210",
      direccion: "C/ Triana 45, 2ºA, 35002 Las Palmas de Gran Canaria",
      email: "info@inmocanarias.com",
      telefono: "+34 928 123 456",
      configFiscal: JSON.stringify({
        igic_por_defecto: 7.0,
        irpf_por_defecto: 15.0,
        redondeo: "centimo",
        moneda: "EUR",
        comision_agencia_defecto: 40.0,
      }),
    },
  });

  console.log("Creando usuarios...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "admin@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Carlos Rodríguez Méndez",
      rol: "admin",
      telefono: "+34 666 111 222",
      nif: "43210987A",
      tipoFiscal: "autonomo",
      configFiscal: JSON.stringify({
        aplica_irpf: true,
        porcentaje_irpf: 15.0,
        aplica_igic: true,
        porcentaje_igic: 7.0,
        modelo_igic: "adicional",
        iban: "ES6621000418401234567891",
        observaciones: "Gerente y propietario",
      }),
    },
  });

  const manager = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "laura@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Laura Santana Vega",
      rol: "manager",
      telefono: "+34 666 333 444",
      nif: "54321098B",
      tipoFiscal: "empleado",
      configFiscal: JSON.stringify({
        aplica_irpf: true,
        porcentaje_irpf: 18.0,
        aplica_igic: false,
        porcentaje_igic: 0,
        modelo_igic: "adicional",
        iban: "ES7630046721583456789012",
        observaciones: "Directora comercial - nómina",
      }),
    },
  });

  const agente1 = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "pedro@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Pedro Alonso García",
      rol: "agente",
      telefono: "+34 666 555 666",
      nif: "12345678C",
      tipoFiscal: "autonomo",
      configFiscal: JSON.stringify({
        aplica_irpf: true,
        porcentaje_irpf: 15.0,
        aplica_igic: true,
        porcentaje_igic: 7.0,
        modelo_igic: "adicional",
        iban: "ES1234567890123456789012",
        observaciones: "",
      }),
      objetivos: JSON.stringify({
        ventas_mes: 3,
        facturacion_mes: 12000,
        bonus_por_objetivo: 500,
      }),
    },
  });

  const agente2 = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "ana@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Ana María López Díaz",
      rol: "agente",
      telefono: "+34 666 777 888",
      nif: "87654321D",
      tipoFiscal: "autonomo",
      configFiscal: JSON.stringify({
        aplica_irpf: true,
        porcentaje_irpf: 15.0,
        aplica_igic: true,
        porcentaje_igic: 7.0,
        modelo_igic: "adicional",
        iban: "ES9876543210987654321098",
        observaciones: "",
      }),
      objetivos: JSON.stringify({
        ventas_mes: 4,
        facturacion_mes: 15000,
        bonus_por_objetivo: 750,
      }),
    },
  });

  const agente3 = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "marcos@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Marcos Hernández Ruiz",
      rol: "agente",
      telefono: "+34 666 999 000",
      nif: "11223344E",
      tipoFiscal: "sociedad",
      configFiscal: JSON.stringify({
        aplica_irpf: false,
        porcentaje_irpf: 0,
        aplica_igic: true,
        porcentaje_igic: 7.0,
        modelo_igic: "adicional",
        iban: "ES5544332211009988776655",
        observaciones: "Factura a través de Marcos Inmobiliaria SL (B11223344)",
      }),
      objetivos: JSON.stringify({
        ventas_mes: 2,
        facturacion_mes: 10000,
        bonus_por_objetivo: 400,
      }),
    },
  });

  const contable = await prisma.usuario.create({
    data: {
      agenciaId: agencia.id,
      email: "contabilidad@inmocanarias.com",
      passwordHash,
      nombreCompleto: "Isabel Torres Marrero",
      rol: "contabilidad",
      telefono: "+34 666 222 333",
      nif: "99887766F",
      tipoFiscal: "empleado",
      configFiscal: JSON.stringify({
        aplica_irpf: true,
        porcentaje_irpf: 18.0,
        aplica_igic: false,
        porcentaje_igic: 0,
        modelo_igic: "adicional",
        iban: "",
        observaciones: "Departamento contabilidad",
      }),
    },
  });

  console.log("Creando propiedades...");
  const prop1 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "PI-2025-0001",
      tipo: "piso",
      direccion: "C/ Triana 78, 4ºB",
      ciudad: "Las Palmas de Gran Canaria",
      codigoPostal: "35002",
      precioVentaObjetivo: 250000,
      metrosCuadrados: 95,
      habitaciones: 3,
      banos: 2,
      captadorId: agente1.id,
      estado: "vendida",
      observaciones: "Piso reformado, zona prime",
    },
  });

  const prop2 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "CA-2025-0002",
      tipo: "casa",
      direccion: "Urb. Monte Lentiscal, Parcela 12",
      ciudad: "Santa Brígida",
      codigoPostal: "35310",
      precioVentaObjetivo: 420000,
      metrosCuadrados: 220,
      habitaciones: 4,
      banos: 3,
      captadorId: agente2.id,
      estado: "vendida",
      observaciones: "Villa con piscina y jardín",
    },
  });

  const prop3 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "PI-2025-0003",
      tipo: "piso",
      direccion: "Av. Mesa y López 32, 6ºA",
      ciudad: "Las Palmas de Gran Canaria",
      codigoPostal: "35010",
      precioVentaObjetivo: 185000,
      metrosCuadrados: 75,
      habitaciones: 2,
      banos: 1,
      captadorId: agente1.id,
      estado: "vendida",
    },
  });

  const prop4 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "LO-2025-0004",
      tipo: "local",
      direccion: "C/ León y Castillo 112, bajo",
      ciudad: "Las Palmas de Gran Canaria",
      codigoPostal: "35004",
      precioVentaObjetivo: 135000,
      metrosCuadrados: 60,
      captadorId: agente3.id,
      estado: "reservada",
      observaciones: "Local esquinero con escaparate",
    },
  });

  const prop5 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "PI-2026-0005",
      tipo: "piso",
      direccion: "C/ Venegas 15, 2ºC",
      ciudad: "Las Palmas de Gran Canaria",
      codigoPostal: "35003",
      precioVentaObjetivo: 195000,
      metrosCuadrados: 80,
      habitaciones: 3,
      banos: 1,
      captadorId: agente2.id,
      estado: "disponible",
    },
  });

  const prop6 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "CA-2026-0006",
      tipo: "casa",
      direccion: "C/ Real de San Roque 8",
      ciudad: "Telde",
      codigoPostal: "35200",
      precioVentaObjetivo: 310000,
      metrosCuadrados: 180,
      habitaciones: 5,
      banos: 3,
      captadorId: agente1.id,
      estado: "disponible",
      observaciones: "Casa canaria rehabilitada",
    },
  });

  const prop7 = await prisma.propiedad.create({
    data: {
      agenciaId: agencia.id,
      referencia: "TE-2026-0007",
      tipo: "terreno",
      direccion: "Parcela 45, Polígono Industrial Arinaga",
      ciudad: "Agüimes",
      codigoPostal: "35118",
      precioVentaObjetivo: 95000,
      metrosCuadrados: 500,
      captadorId: agente3.id,
      estado: "disponible",
    },
  });

  console.log("Creando clientes...");
  const comprador1 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "comprador",
      nombreCompleto: "María del Carmen Suárez Pérez",
      email: "mcarmen@gmail.com",
      telefono: "+34 666 444 555",
      nif: "44556677G",
    },
  });

  const comprador2 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "comprador",
      nombreCompleto: "Roberto Jiménez Navarro",
      email: "roberto.jn@outlook.com",
      telefono: "+34 666 666 777",
      nif: "55667788H",
    },
  });

  const comprador3 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "comprador",
      nombreCompleto: "Familia González-Martín",
      email: "gonzalezmartin@gmail.com",
      telefono: "+34 666 888 999",
      nif: "66778899I",
    },
  });

  const vendedor1 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "vendedor",
      nombreCompleto: "Fernando Cabrera Domínguez",
      email: "fcabrera@hotmail.com",
      telefono: "+34 666 111 333",
      nif: "77889900J",
      observaciones: "Herencia familiar, quiere venta rápida",
    },
  });

  const vendedor2 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "vendedor",
      nombreCompleto: "Inversiones Atlántico SL",
      email: "admin@inversionesatlantico.es",
      telefono: "+34 928 987 654",
      nif: "B87654321",
      observaciones: "Empresa promotora, varios inmuebles",
    },
  });

  const vendedor3 = await prisma.cliente.create({
    data: {
      agenciaId: agencia.id,
      tipo: "vendedor",
      nombreCompleto: "Dolores Betancor Armas",
      email: "lola.betancor@gmail.com",
      telefono: "+34 666 555 444",
      nif: "33445566K",
    },
  });

  console.log("Creando reglas de comisión...");
  await prisma.reglaComision.create({
    data: {
      agenciaId: agencia.id,
      nombreRegla: "Piso estándar",
      tipoPropiedad: "piso",
      prioridad: 1,
      splitsConfig: JSON.stringify({
        captador: 30,
        vendedor: 30,
        agencia: 40,
      }),
      condiciones: JSON.stringify({ precio_max: 300000 }),
    },
  });

  await prisma.reglaComision.create({
    data: {
      agenciaId: agencia.id,
      nombreRegla: "Villa / Chalet premium",
      tipoPropiedad: "casa",
      prioridad: 2,
      splitsConfig: JSON.stringify({
        captador: 35,
        vendedor: 35,
        coordinador: 5,
        agencia: 25,
      }),
      condiciones: JSON.stringify({ precio_min: 300000 }),
    },
  });

  await prisma.reglaComision.create({
    data: {
      agenciaId: agencia.id,
      nombreRegla: "Local comercial",
      tipoPropiedad: "local",
      prioridad: 3,
      splitsConfig: JSON.stringify({
        captador: 25,
        vendedor: 35,
        agencia: 40,
      }),
      condiciones: JSON.stringify({}),
    },
  });

  console.log("Creando operaciones...");

  // OP cerrada 1: Piso Triana (Pedro captó, Ana vendió)
  const op1 = await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop1.id,
      compradorId: comprador1.id,
      vendedorClienteId: vendedor1.id,
      numeroOperacion: "OP-2026-0001",
      estado: "cerrada",
      precioVenta: 245000,
      comisionTotalPorc: 3.5,
      comisionTotalImporte: 8575,
      quienPagaComision: "vendedor",
      fechaReserva: new Date("2026-01-10"),
      fechaFirma: new Date("2026-02-05"),
      fechaCierre: new Date("2026-02-05"),
      createdBy: agente1.id,
      validadoPor: manager.id,
      validadoAt: new Date("2026-02-06"),
      observaciones: "Comprador con hipoteca Santander aprobada",
      createdAt: new Date("2025-12-15"),
    },
  });

  // Splits for OP1
  await prisma.comisionSplit.createMany({
    data: [
      {
        operacionId: op1.id,
        usuarioId: agente1.id,
        rolSplit: "captador",
        porcentajeSplit: 30,
        importeBruto: 2572.5,
        retencionIrpf: 385.88,
        igic: 180.08,
        importeNeto: 2366.7,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-15"),
        referenciaPago: "TR-2026-001",
      },
      {
        operacionId: op1.id,
        usuarioId: agente2.id,
        rolSplit: "vendedor",
        porcentajeSplit: 30,
        importeBruto: 2572.5,
        retencionIrpf: 385.88,
        igic: 180.08,
        importeNeto: 2366.7,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-15"),
        referenciaPago: "TR-2026-002",
      },
      {
        operacionId: op1.id,
        usuarioId: admin.id,
        rolSplit: "agencia",
        porcentajeSplit: 40,
        importeBruto: 3430,
        retencionIrpf: 0,
        igic: 0,
        importeNeto: 3430,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-15"),
      },
    ],
  });

  // OP cerrada 2: Villa Santa Brígida (Ana captó y vendió, con coordinador Laura)
  const op2 = await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop2.id,
      compradorId: comprador3.id,
      vendedorClienteId: vendedor2.id,
      numeroOperacion: "OP-2026-0002",
      estado: "cerrada",
      precioVenta: 395000,
      comisionTotalPorc: 3.0,
      comisionTotalImporte: 11850,
      quienPagaComision: "vendedor",
      fechaReserva: new Date("2026-01-20"),
      fechaFirma: new Date("2026-02-10"),
      fechaCierre: new Date("2026-02-10"),
      createdBy: agente2.id,
      validadoPor: manager.id,
      validadoAt: new Date("2026-02-11"),
      observaciones: "Villa premium - comisión especial",
      createdAt: new Date("2026-01-05"),
    },
  });

  await prisma.comisionSplit.createMany({
    data: [
      {
        operacionId: op2.id,
        usuarioId: agente2.id,
        rolSplit: "captador",
        porcentajeSplit: 35,
        importeBruto: 4147.5,
        retencionIrpf: 622.13,
        igic: 290.33,
        importeNeto: 3815.7,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-20"),
        referenciaPago: "TR-2026-003",
      },
      {
        operacionId: op2.id,
        usuarioId: agente2.id,
        rolSplit: "vendedor",
        porcentajeSplit: 35,
        importeBruto: 4147.5,
        retencionIrpf: 622.13,
        igic: 290.33,
        importeNeto: 3815.7,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-20"),
        referenciaPago: "TR-2026-004",
      },
      {
        operacionId: op2.id,
        usuarioId: manager.id,
        rolSplit: "coordinador",
        porcentajeSplit: 5,
        importeBruto: 592.5,
        retencionIrpf: 106.65,
        igic: 0,
        importeNeto: 485.85,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-20"),
        referenciaPago: "TR-2026-005",
      },
      {
        operacionId: op2.id,
        usuarioId: admin.id,
        rolSplit: "agencia",
        porcentajeSplit: 25,
        importeBruto: 2962.5,
        retencionIrpf: 0,
        igic: 0,
        importeNeto: 2962.5,
        estadoPago: "pagado",
        fechaPago: new Date("2026-02-20"),
      },
    ],
  });

  // OP cerrada 3: Piso Mesa y López (Pedro captó y vendió - doble rol)
  const op3 = await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop3.id,
      compradorId: comprador2.id,
      vendedorClienteId: vendedor3.id,
      numeroOperacion: "OP-2026-0003",
      estado: "cerrada",
      precioVenta: 180000,
      comisionTotalPorc: 4.0,
      comisionTotalImporte: 7200,
      quienPagaComision: "vendedor",
      fechaReserva: new Date("2026-01-25"),
      fechaFirma: new Date("2026-02-15"),
      fechaCierre: new Date("2026-02-15"),
      createdBy: agente1.id,
      validadoPor: admin.id,
      validadoAt: new Date("2026-02-16"),
      createdAt: new Date("2026-01-15"),
    },
  });

  await prisma.comisionSplit.createMany({
    data: [
      {
        operacionId: op3.id,
        usuarioId: agente1.id,
        rolSplit: "captador",
        porcentajeSplit: 30,
        importeBruto: 2160,
        retencionIrpf: 324,
        igic: 151.2,
        importeNeto: 1987.2,
        estadoPago: "pendiente",
      },
      {
        operacionId: op3.id,
        usuarioId: agente1.id,
        rolSplit: "vendedor",
        porcentajeSplit: 30,
        importeBruto: 2160,
        retencionIrpf: 324,
        igic: 151.2,
        importeNeto: 1987.2,
        estadoPago: "pendiente",
      },
      {
        operacionId: op3.id,
        usuarioId: admin.id,
        rolSplit: "agencia",
        porcentajeSplit: 40,
        importeBruto: 2880,
        retencionIrpf: 0,
        igic: 0,
        importeNeto: 2880,
        estadoPago: "pendiente",
      },
    ],
  });

  // OP en reserva: Local comercial
  const op4 = await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop4.id,
      compradorId: comprador2.id,
      vendedorClienteId: vendedor2.id,
      numeroOperacion: "OP-2026-0004",
      estado: "reserva",
      precioVenta: 128000,
      comisionTotalPorc: 4.5,
      comisionTotalImporte: 5760,
      quienPagaComision: "comprador",
      fechaReserva: new Date("2026-02-12"),
      createdBy: agente3.id,
      observaciones: "Local para clínica dental, comprador financiado",
      createdAt: new Date("2026-02-01"),
    },
  });

  // OP lead
  await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop5.id,
      numeroOperacion: "OP-2026-0005",
      estado: "lead",
      precioVenta: 190000,
      comisionTotalPorc: 3.5,
      comisionTotalImporte: 6650,
      quienPagaComision: "vendedor",
      createdBy: agente2.id,
      observaciones: "Cliente interesado vía Idealista, pendiente de visita",
      createdAt: new Date("2026-02-18"),
    },
  });

  // OP firma pendiente
  await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      propiedadId: prop6.id,
      compradorId: comprador3.id,
      vendedorClienteId: vendedor1.id,
      numeroOperacion: "OP-2026-0006",
      estado: "firma_pendiente",
      precioVenta: 295000,
      comisionTotalPorc: 3.0,
      comisionTotalImporte: 8850,
      quienPagaComision: "vendedor",
      fechaReserva: new Date("2026-02-05"),
      createdBy: agente1.id,
      observaciones: "Escritura programada para 28/02 en notaría López",
      createdAt: new Date("2026-01-28"),
    },
  });

  // OP cancelada
  await prisma.operacion.create({
    data: {
      agenciaId: agencia.id,
      numeroOperacion: "OP-2026-0007",
      estado: "cancelada",
      precioVenta: 160000,
      comisionTotalPorc: 3.5,
      comisionTotalImporte: 5600,
      quienPagaComision: "vendedor",
      createdBy: agente3.id,
      observaciones: "Comprador no obtuvo financiación - cancelada",
      createdAt: new Date("2026-01-10"),
    },
  });

  // Generate liquidation for February
  await prisma.liquidacion.createMany({
    data: [
      {
        agenciaId: agencia.id,
        usuarioId: agente1.id,
        periodo: "2026-02",
        totalOperaciones: 3,
        totalBruto: 6892.5,
        totalRetenciones: 1033.88,
        totalNeto: 6341.1,
        estado: "aprobada",
      },
      {
        agenciaId: agencia.id,
        usuarioId: agente2.id,
        periodo: "2026-02",
        totalOperaciones: 3,
        totalBruto: 10867.5,
        totalRetenciones: 1630.14,
        totalNeto: 9998.1,
        estado: "aprobada",
      },
      {
        agenciaId: agencia.id,
        usuarioId: manager.id,
        periodo: "2026-02",
        totalOperaciones: 1,
        totalBruto: 592.5,
        totalRetenciones: 106.65,
        totalNeto: 485.85,
        estado: "borrador",
      },
    ],
  });

  console.log("");
  console.log("=== SEED COMPLETADO ===");
  console.log("");
  console.log("Cuentas de acceso (password: password123):");
  console.log("  Admin:        admin@inmocanarias.com");
  console.log("  Manager:      laura@inmocanarias.com");
  console.log("  Agente 1:     pedro@inmocanarias.com");
  console.log("  Agente 2:     ana@inmocanarias.com");
  console.log("  Agente 3:     marcos@inmocanarias.com");
  console.log("  Contabilidad: contabilidad@inmocanarias.com");
  console.log("");
  console.log("Datos creados:");
  console.log("  - 1 agencia (InmoCanarias Pro)");
  console.log("  - 6 usuarios (admin, manager, 3 agentes, contable)");
  console.log("  - 7 propiedades (3 vendidas, 1 reservada, 3 disponibles)");
  console.log("  - 6 clientes (3 compradores, 3 vendedores)");
  console.log("  - 3 reglas de comisión");
  console.log("  - 7 operaciones (3 cerradas, 1 reserva, 1 lead, 1 firma pend., 1 cancelada)");
  console.log("  - 9 splits de comisión (6 pagados, 3 pendientes)");
  console.log("  - 3 liquidaciones de febrero");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
