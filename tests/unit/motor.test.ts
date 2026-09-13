import vm from "node:vm";
import { describe, it, expect } from "vitest";
import {
  fecha,
  type BaseDatos,
  type Fila,
} from "@/sistema-experto/base-conocimiento/esquema";
import {
  CASOS_DEMO,
  SEMILLA,
} from "@/sistema-experto/base-conocimiento/semilla";
import { validarBaseDatos } from "@/sistema-experto/base-conocimiento/validacion";
import * as motor from "@/sistema-experto/motor/motor";
import {
  NOMBRE_GLOBAL_MOTOR,
  compilarMotorParaN8n,
} from "@/sistema-experto/scripts/motor-n8n";
import { conCambio } from "./utilidades/semilla";

const OPCIONES: motor.OpcionesSolicitud = {
  ahora: fecha("2026-09-13T12:00:00"),
  zonaHorariaMinutos: 0,
};

const evaluarCaso = (
  id: string,
  tablas: motor.TablasSistema = SEMILLA,
  opciones: motor.OpcionesSolicitud = OPCIONES,
) => motor.evaluarSolicitud(id, tablas, opciones);

const idsActivadas = (resultado: motor.ResultadoEvaluacion) =>
  resultado.reglasActivadas.map((a) => a.idRegla);

const activada = (resultado: motor.ResultadoEvaluacion, id: string) =>
  resultado.reglasActivadas.find((a) => a.idRegla === id);

const BASE = motor.compilarBase(SEMILLA);

const CONTRATISTA = {
  id_solicitud: "SOL-PRUEBA",
  tipo_vinculacion: "Contratista",
  ingreso_mensual: 5_000_000,
  duracion_contrato_dias: 300,
  clase_riesgo: 1,
  tarifa_arl: 0.522,
  autoriza_datos: "SI",
  plan_solicitado: "integral",
  porcentaje_documentos: 100,
};

/** Simula lo que entrega n8n al leer Sheets sin formato: todo llega como texto. */
function comoTextoDeSheets(tablas: BaseDatos): motor.TablasSistema {
  const aTexto = (valor: Fila[string]) => {
    if (valor === null) return "";
    if (valor instanceof Date) return valor.toISOString();
    if (typeof valor === "boolean") return valor ? "TRUE" : "FALSE";
    return String(valor);
  };
  return Object.fromEntries(
    Object.entries(tablas).map(([nombre, filas]) => [
      nombre,
      filas.map((fila) =>
        Object.fromEntries(
          Object.entries(fila).map(([columna, valor]) => [
            columna,
            aTexto(valor),
          ]),
        ),
      ),
    ]),
  ) as unknown as motor.TablasSistema;
}

describe("casos de demostración", () => {
  it.each(CASOS_DEMO)("$id → $esperado.nivel / $esperado.estado", (caso) => {
    const resultado = evaluarCaso(caso.id);
    expect(idsActivadas(resultado)).toEqual(caso.esperado.reglas);
    expect(resultado.nivel).toBe(caso.esperado.nivel);
    expect(resultado.estadoSugerido).toBe(caso.esperado.estado);
    expect(resultado.errores).toEqual([]);
  });

  it("todas las explicaciones quedan completas", () => {
    for (const caso of CASOS_DEMO) {
      for (const regla of evaluarCaso(caso.id).reglasActivadas) {
        expect(regla.explicacion).not.toMatch(/[{}]|\(sin dato\)/);
      }
    }
  });

  it("cada regla se dispara una sola vez", () => {
    for (const caso of CASOS_DEMO) {
      const ids = idsActivadas(evaluarCaso(caso.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("liquidación y explicación", () => {
  it("SOL-0001 coincide con el ejemplo oficial de la UGPP", () => {
    const { hechos } = evaluarCaso("SOL-0001");
    expect(hechos.ibc).toBe(2_000_000);
    expect(hechos.aporte_salud).toBe(250_000);
    expect(hechos.aporte_pension).toBe(320_000);
    expect(hechos.aporte_arl).toBeCloseTo(10_440, 6);
    expect(hechos.total_aportes_cliente).toBeCloseTo(580_440, 6);
  });

  it("explica el cálculo del IBC con los valores reales", () => {
    const regla = activada(evaluarCaso("SOL-0001"), "R08");
    expect(regla?.explicacion).toBe(
      "El IBC de un independiente es el 40 % del ingreso neto: $5.000.000 × 40 % = $2.000.000.",
    );
  });

  it("guarda los valores que hicieron cumplir cada regla", () => {
    const regla = activada(evaluarCaso("SOL-0001"), "R06");
    expect(regla?.hechosUsados).toEqual({
      ingreso_neto: 5_000_000,
      SMMLV: 1_750_905,
    });
  });

  it("SOL-0002 ajusta el IBC al mínimo y sugiere el Plan Integral", () => {
    const resultado = evaluarCaso("SOL-0002");
    expect(resultado.hechos.ibc).toBe(1_750_905);
    expect(resultado.hechos.plan_sugerido).toBe("integral");
    expect(activada(resultado, "R09")?.explicacion).toContain("$800.000");
  });

  it("SOL-0005: la ARL la paga el contratante y no suma al total", () => {
    const resultado = evaluarCaso("SOL-0005");
    expect(resultado.hechos.arl_pagador).toBe("Contratante");
    expect(resultado.hechos.aporte_arl).toBeCloseTo(1_750_905 * 0.0435, 6);
    expect(resultado.hechos.total_aportes_cliente).toBeCloseTo(
      1_750_905 * 0.285,
      6,
    );
    expect(resultado.conclusiones).toContain(
      "Aporte de ARL a cargo del contratante: $76.164.",
    );
  });

  it("SOL-0003 explica el bloqueo contando las críticas que lo provocaron", () => {
    const resultado = evaluarCaso("SOL-0003");
    expect(activada(resultado, "R25")?.explicacion).toContain(
      "Se activaron 2 reglas críticas",
    );
    expect(resultado.numCriticas).toBe(3);
    expect(resultado.alertas).toHaveLength(3);
  });
});

describe("escalamiento por tiempo sin gestión", () => {
  it("no escala antes del límite de horas", () => {
    const resultado = evaluarCaso("SOL-0003", SEMILLA, {
      ahora: fecha("2026-09-03T20:00:00"),
      zonaHorariaMinutos: 0,
    });
    expect(resultado.hechos.horas_sin_gestion).toBe(11.9);
    expect(idsActivadas(resultado)).not.toContain("R26");
  });

  it("convierte la hora real a la hora de Colombia por defecto", () => {
    // 14:05 UTC = 09:05 en Colombia: 25 h después de la última gestión (08:05).
    const resultado = motor.evaluarSolicitud("SOL-0003", SEMILLA, {
      ahora: new Date("2026-09-04T14:05:00Z"),
    });
    expect(resultado.hechos.horas_sin_gestion).toBe(25);
    expect(resultado.hechos.escalar_supervisor).toBe("SI");
  });
});

describe("hechos de entrada desde las tablas", () => {
  it("calcula el porcentaje de documentos según el tipo de vinculación", () => {
    expect(
      motor.hechosDesdeTablas("SOL-0006", SEMILLA, OPCIONES)
        .porcentaje_documentos,
    ).toBe(75);
    expect(
      motor.hechosDesdeTablas("SOL-0003", SEMILLA, OPCIONES)
        .porcentaje_documentos,
    ).toBe(25);
  });

  it("toma la clase y la tarifa de ARL de la actividad económica", () => {
    const hechos = motor.hechosDesdeTablas("SOL-0005", SEMILLA, OPCIONES);
    expect(hechos.clase_riesgo).toBe(4);
    expect(hechos.tarifa_arl).toBe(4.35);
  });

  it("deja sin clase de riesgo a quien no tiene actividad", () => {
    const hechos = motor.hechosDesdeTablas("SOL-0004", SEMILLA, OPCIONES);
    expect(hechos.clase_riesgo).toBeUndefined();
  });

  it("falla si la solicitud no existe", () => {
    expect(() =>
      motor.hechosDesdeTablas("SOL-9999", SEMILLA, OPCIONES),
    ).toThrow("La solicitud SOL-9999 no existe");
  });

  it("avisa si no puede leer la fecha de última gestión", () => {
    const datos = conCambio(
      "Solicitudes",
      (f) => f.ID_Solicitud === "SOL-0003",
      { Fecha_Ultima_Gestion: "13/09/2026" },
    );
    const resultado = evaluarCaso("SOL-0003", datos);
    expect(resultado.hechos.horas_sin_gestion).toBeUndefined();
    expect(resultado.errores).toEqual([
      expect.stringContaining("no se pudo leer Fecha_Ultima_Gestion"),
    ]);
  });
});

describe("inferencia sobre hechos sintéticos", () => {
  it("limita el IBC al tope de 25 SMMLV", () => {
    const resultado = motor.evaluar(BASE, {
      ...CONTRATISTA,
      ingreso_mensual: 200_000_000,
    });
    expect(resultado.hechos.ibc).toBe(25 * 1_750_905);
    expect(idsActivadas(resultado)).toContain("R10");
    expect(resultado.nivel).toBe("Requiere revisión");
  });

  it("deja la ARL como voluntaria en un contrato corto de bajo riesgo", () => {
    const resultado = motor.evaluar(BASE, {
      ...CONTRATISTA,
      duracion_contrato_dias: 20,
    });
    expect(idsActivadas(resultado)).toContain("R14");
    expect(resultado.hechos.arl_obligatoria).toBe("NO");
    expect(resultado.hechos.aporte_arl).toBeUndefined();
  });

  it("advierte si un contratista no reporta la duración del contrato", () => {
    const { duracion_contrato_dias: _omitida, ...sinDuracion } = CONTRATISTA;
    const resultado = motor.evaluar(BASE, sinDuracion);
    expect(idsActivadas(resultado)).toContain("R16");
    expect(resultado.hechos.arl_obligatoria).toBeUndefined();
  });

  it("advierte a un empleador por debajo del umbral empresarial", () => {
    const resultado = motor.evaluar(BASE, {
      id_solicitud: "SOL-PRUEBA",
      tipo_vinculacion: "Empleador",
      numero_trabajadores: 3,
      autoriza_datos: "SI",
      porcentaje_documentos: 100,
    });
    expect(idsActivadas(resultado)).toEqual(["R23", "R29"]);
    expect(resultado.nivel).toBe("Requiere revisión");
  });

  it("aplica los valores por defecto de la tabla Hechos", () => {
    const resultado = motor.evaluar(BASE, {
      ...CONTRATISTA,
      autoriza_datos: undefined,
    });
    expect(resultado.hechos.autoriza_datos).toBe("NO");
    expect(resultado.hechos.costos_deducibles).toBe(0);
    expect(idsActivadas(resultado)).toContain("R02");
    expect(resultado.nivel).toBe("Crítica");
  });

  it("entiende los valores tal como llegan de Google Sheets (texto)", () => {
    const tablasComoTexto = comoTextoDeSheets(SEMILLA);
    for (const caso of CASOS_DEMO) {
      expect(evaluarCaso(caso.id, tablasComoTexto)).toEqual(
        evaluarCaso(caso.id),
      );
    }
  });

  it("ignora una regla desactivada", () => {
    const datos = conCambio("Reglas", (f) => f.ID_Regla === "R20", {
      Activa: false,
    });
    const resultado = evaluarCaso("SOL-0002", datos);
    expect(idsActivadas(resultado)).not.toContain("R20");
    expect(resultado.nivel).toBe("Viable");
    expect(resultado.estadoSugerido).toBe("Aprobada");
  });

  it("cambiar un parámetro cambia la conclusión sin tocar las reglas", () => {
    const datos = conCambio("Parametros", (f) => f.ID_Parametro === "SMMLV", {
      Valor: 2_000_000,
    });
    expect(evaluarCaso("SOL-0002", datos).hechos.ibc).toBe(2_000_000);
  });

  it("descarta una regla mal configurada y el resto sigue funcionando", () => {
    const datos = conCambio(
      "Condiciones_Regla",
      (f) => f.ID_Condicion === "R20-C1",
      { ID_Hecho: "hecho_inventado" },
    );
    expect(motor.compilarBase(datos).errores).toEqual([
      expect.stringContaining("Regla R20: se ignora"),
    ]);
    const resultado = evaluarCaso("SOL-0002", datos);
    expect(idsActivadas(resultado)).not.toContain("R20");
    expect(idsActivadas(resultado)).toContain("R09");
  });

  it("un error de cálculo no detiene la inferencia", () => {
    const datos = conCambio("Acciones_Regla", (f) => f.ID_Accion === "R03-A1", {
      Valor: "ingreso_mensual / 0",
    });
    const resultado = evaluarCaso("SOL-0001", datos);
    expect(resultado.errores).toEqual([
      expect.stringContaining("Regla R03: no se pudo ejecutar"),
    ]);
    expect(idsActivadas(resultado)).not.toContain("R03");
    expect(idsActivadas(resultado)).toContain("R13");
  });
});

describe("expresiones", () => {
  it.each([
    ["2 + 3 * 4", 14],
    ["(2 + 3) * 4", 20],
    ["-3 + 5", 2],
    ["10 / 4", 2.5],
    ["MAX(1, 7, 3)", 7],
    ["MIN(4, 2)", 2],
    ["ROUND(1234.5678, 2)", 1234.57],
    ["ROUND(2.5)", 3],
  ])("%s = %s", (texto, esperado) => {
    expect(motor.calcularExpresion(texto)).toBeCloseTo(esperado, 9);
  });

  it("usa hechos y parámetros", () => {
    expect(
      motor.calcularExpresion("MAX(ingreso - costos, 0) * PCT / 100", {
        ingreso: 2_500_000,
        costos: 1_000_000,
        PCT: 40,
      }),
    ).toBe(600_000);
  });

  it.each([
    "",
    "2 +",
    "MAX(1",
    "(2 + 3",
    "ingreso neto",
    "2 $ 3",
    "EVAL(1)",
    "ROUND()",
  ])("rechaza «%s»", (texto) => {
    expect(() => motor.analizarExpresion(texto)).toThrow(motor.ErrorExpresion);
  });

  it("no calcula con un hecho que no tiene valor", () => {
    expect(() => motor.calcularExpresion("ingreso_neto * 2")).toThrow(
      'falta el hecho "ingreso_neto"',
    );
  });

  it("lista los hechos y parámetros que usa", () => {
    expect(
      motor.referenciasExpresion(
        "MAX(ingreso_mensual - costos_deducibles, 0) * SMMLV",
      ),
    ).toEqual({
      hechos: ["ingreso_mensual", "costos_deducibles"],
      parametros: ["SMMLV"],
    });
  });
});

describe("formato de números", () => {
  it.each([
    [motor.formatearMoneda(580_440.4), "$580.440"],
    [motor.formatearNumero(1_750_905), "1.750.905"],
    [motor.formatearNumero(0.522), "0,522"],
    [motor.formatearNumero(12.5), "12,5"],
    [motor.formatearNumero(-2.5), "-2,5"],
  ])("%s", (obtenido, esperado) => {
    expect(obtenido).toBe(esperado);
  });
});

describe("salidas", () => {
  it("genera filas válidas para Evaluaciones y Reglas_Activadas", () => {
    const { evaluacion, reglasActivadas } = motor.filasResultado(
      evaluarCaso("SOL-0003"),
      {
        idEvaluacion: "EVA-0001",
        fecha: fecha("2026-09-13T12:00:00"),
        origen: "Automática (n8n)",
      },
    );
    const datos: BaseDatos = {
      ...SEMILLA,
      Evaluaciones: [evaluacion],
      Reglas_Activadas: reglasActivadas,
    };
    expect(validarBaseDatos(datos)).toEqual([]);
    expect(evaluacion.Nivel_Resultado).toBe("Crítica");
    expect(reglasActivadas[0].Hechos_Usados).toBe(
      "tipo_vinculacion = Cuenta propia; ingreso_mensual = (sin valor)",
    );
  });

  it("resume la evaluación en texto", () => {
    const texto = motor.resumenTexto(evaluarCaso("SOL-0003"));
    expect(texto).toContain("Clasificación: Crítica");
    expect(texto).toContain("1. R01 · Ingreso mensual no reportado [Crítico]");
    expect(texto).toContain("Alertas:");
  });
});

describe("versión para n8n", () => {
  const codigo = compilarMotorParaN8n();

  it("es un script autónomo, sin import, export ni require", () => {
    expect(codigo).not.toMatch(/^\s*(import|export)\s/m);
    expect(codigo).not.toMatch(/\brequire\(/);
  });

  it("da el mismo resultado que el motor en un contexto aislado", () => {
    const aislado = vm.runInContext(
      `${codigo}\n${NOMBRE_GLOBAL_MOTOR};`,
      vm.createContext({}),
    ) as typeof motor;
    for (const caso of CASOS_DEMO) {
      const enN8n = aislado.evaluarSolicitud(caso.id, SEMILLA, OPCIONES);
      expect(JSON.parse(JSON.stringify(enN8n))).toEqual(
        JSON.parse(JSON.stringify(evaluarCaso(caso.id))),
      );
    }
  });
});
