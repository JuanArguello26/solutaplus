import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  CASOS_DEMO,
  SEMILLA,
} from "@/sistema-experto/base-conocimiento/semilla";
import {
  CODIGO_LANDING,
  TABLAS_LECTURA_EVALUACION,
  codigoNodoMotor,
  flujoEvaluacion,
  flujoLanding,
} from "@/sistema-experto/scripts/flujos-n8n";
import { compilarMotorParaN8n } from "@/sistema-experto/scripts/motor-n8n";

const MOTOR_JS = compilarMotorParaN8n();

type Json = Record<string, unknown>;
type Tablas = Record<string, Json[]>;

/** Imita `$("Nodo")` de n8n: all() y first() sobre las salidas simuladas. */
function simularN8n(salidas: Record<string, Json[]>) {
  return (nombre: string) => {
    const items = (salidas[nombre] ?? []).map((json) => ({ json }));
    return { all: () => items, first: () => items[0] };
  };
}

// 13-sep-2026 12:00 hora de Colombia: el mismo momento de la carga demo.
const AHORA_DEMO = Date.parse("2026-09-13T17:00:00Z");

/** Ejecuta el código de un nodo Code con el reloj congelado en AHORA_DEMO. */
function ejecutarNodo(codigo: string, dolar: ReturnType<typeof simularN8n>) {
  const funcion = vm.runInNewContext(`(function ($) {\n${codigo}\n})`, {
    Date: class extends Date {
      constructor(...args: [] | [string | number | Date]) {
        if (args.length === 0) super(AHORA_DEMO);
        else super(args[0]);
      }
    },
  });
  return funcion(dolar) as { json: Json }[];
}

const tablasDeLaSemilla = (): Tablas =>
  Object.fromEntries(
    TABLAS_LECTURA_EVALUACION.map((nombre) => [
      nombre,
      SEMILLA[nombre].map((fila) => ({ ...fila })),
    ]),
  );

function evaluarEnN8n(idSolicitud: string, tablas = tablasDeLaSemilla()) {
  const [salida] = ejecutarNodo(
    codigoNodoMotor(MOTOR_JS),
    simularN8n({
      ...tablas,
      Webhook: [{ body: { idSolicitud, origen: "n8n (prueba)" } }],
    }),
  );
  return salida.json as {
    idEvaluacion: string;
    evaluacion: Json;
    reglasActivadas: Json[];
    actualizacion: Json;
    historial: Json | null;
    resumen: string;
    errores: string[];
  };
}

describe("flujo n8n «Evaluar solicitud»: nodo Motor", () => {
  it.each(CASOS_DEMO.map((caso) => [caso.id, caso] as const))(
    "%s produce el resultado esperado",
    (id, caso) => {
      const salida = evaluarEnN8n(id);
      expect(salida.evaluacion.Nivel_Resultado).toBe(caso.esperado.nivel);
      expect(salida.reglasActivadas.map((r) => r.ID_Regla)).toEqual(
        caso.esperado.reglas,
      );
      expect(salida.actualizacion.Nivel_Resultado).toBe(caso.esperado.nivel);
      expect(salida.errores).toEqual([]);
    },
  );

  it("numera la evaluación a partir de la última existente", () => {
    const ultima = SEMILLA.Evaluaciones.length;
    const salida = evaluarEnN8n("SOL-0001");
    expect(salida.idEvaluacion).toBe(
      `EVA-${String(ultima + 1).padStart(4, "0")}`,
    );
    expect(salida.reglasActivadas[0].ID_Evaluacion).toBe(salida.idEvaluacion);
  });

  it("solo mueve el estado de solicitudes nuevas o en evaluación", () => {
    const tablas = tablasDeLaSemilla();
    const aprobada = tablas.Solicitudes.find(
      (f) => f.ID_Solicitud === "SOL-0001",
    )!;
    aprobada.Estado = "Aprobada";
    const sinCambio = evaluarEnN8n("SOL-0001", tablas);
    expect(sinCambio.actualizacion.Estado).toBe("Aprobada");
    expect(sinCambio.historial).toBeNull();

    aprobada.Estado = "Nueva";
    const conCambio = evaluarEnN8n("SOL-0001", tablas);
    expect(conCambio.actualizacion.Estado).toBe(
      conCambio.evaluacion.Estado_Sugerido,
    );
    expect(conCambio.historial).toMatchObject({
      ID_Solicitud: "SOL-0001",
      Estado_Anterior: "Nueva",
    });
  });

  it("falla con un mensaje claro si falta idSolicitud", () => {
    expect(() =>
      ejecutarNodo(
        codigoNodoMotor(MOTOR_JS),
        simularN8n({ ...tablasDeLaSemilla(), Webhook: [{ body: {} }] }),
      ),
    ).toThrow(/idSolicitud/);
  });
});

describe("flujo n8n «Landing a Sheets»", () => {
  const solicitudValida = {
    fullName: "Ana Prueba",
    phone: "3001112233",
    email: "ana@example.com",
    city: "Pereira",
    serviceSlug: "salud",
    planId: "basico",
    observations: "Quiero afiliarme",
    consentAccepted: true,
  };
  const ejecutar = (body: Json) =>
    ejecutarNodo(
      CODIGO_LANDING,
      simularN8n({
        Webhook: [{ body }],
        Solicitantes: SEMILLA.Solicitantes.map((f) => ({ ...f })),
        Solicitudes: SEMILLA.Solicitudes.map((f) => ({ ...f })),
      }),
    )[0].json as {
      idSolicitud: string;
      solicitante: Json;
      solicitud: Json;
    };

  it("radica Solicitante y Solicitud con los siguientes IDs", () => {
    const siguiente = String(SEMILLA.Solicitudes.length + 1).padStart(4, "0");
    const salida = ejecutar(solicitudValida);
    expect(salida.idSolicitud).toBe(`SOL-${siguiente}`);
    expect(salida.solicitud).toMatchObject({
      ID_Solicitante: salida.solicitante.ID_Solicitante,
      ID_Servicio: "salud",
      Estado: "Nueva",
    });
    expect(salida.solicitante).toMatchObject({
      Origen: "Landing",
      Autoriza_Datos: "Y",
    });
  });

  it("rechaza una solicitud sin consentimiento o sin datos obligatorios", () => {
    expect(() =>
      ejecutar({ ...solicitudValida, consentAccepted: false }),
    ).toThrow(/aceptó/);
    expect(() => ejecutar({ ...solicitudValida, phone: " " })).toThrow(
      /obligatorios/,
    );
  });
});

describe("estructura de los flujos generados", () => {
  const flujos = [flujoEvaluacion(MOTOR_JS), flujoLanding()];

  it.each(flujos.map((flujo) => [flujo.name, flujo] as const))(
    "%s tiene nodos únicos y conexiones válidas",
    (_nombre, flujo) => {
      const nombres = flujo.nodes.map((nodo) => String(nodo.name));
      expect(new Set(nombres).size).toBe(nombres.length);
      for (const [origen, salidas] of Object.entries(flujo.connections)) {
        expect(nombres).toContain(origen);
        const destinos = (
          salidas as { main: { node: string }[][] }
        ).main.flat();
        for (const destino of destinos) expect(nombres).toContain(destino.node);
      }
    },
  );

  it("no incluye credenciales reales (solo marcadores vacíos)", () => {
    const texto = JSON.stringify(flujos);
    expect(texto).not.toMatch(/"id":"[^"]+","name":"(Google|Clave)/);
    expect(JSON.parse(texto)).toHaveLength(2);
  });

  it("cada lectura de hoja corre una sola vez", () => {
    const lecturas = flujoEvaluacion(MOTOR_JS).nodes.filter(
      (n) => (n.parameters as Json).operation === "read",
    );
    expect(lecturas).toHaveLength(TABLAS_LECTURA_EVALUACION.length);
    for (const lectura of lecturas) expect(lectura.executeOnce).toBe(true);
  });
});
