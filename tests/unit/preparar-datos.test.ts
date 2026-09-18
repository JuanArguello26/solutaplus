import { describe, it, expect } from "vitest";
import {
  CASOS_DEMO,
  SEMILLA,
} from "@/sistema-experto/base-conocimiento/semilla";
import { validarBaseDatos } from "@/sistema-experto/base-conocimiento/validacion";
import {
  conEvaluacionesDemo,
  conUsuariosLocales,
  type UsuarioLocal,
} from "@/sistema-experto/scripts/preparar-datos";

const ALTA = new Date("2026-09-13T15:00:00Z");

const EQUIPO: UsuarioLocal[] = [
  { nombre: "Admin Prueba", correo: " Admin@Ejemplo.com ", rol: "ADMIN" },
  {
    nombre: "Supervisor Prueba",
    correo: "supervisor@ejemplo.com",
    rol: "SUPERVISOR",
  },
  { nombre: "Asesor Prueba", correo: "asesor@ejemplo.com", rol: "ASESOR" },
  {
    nombre: "Retirado",
    correo: "retirado@ejemplo.com",
    rol: "ASESOR",
    estado: "Inactivo",
  },
];

describe("conEvaluacionesDemo", () => {
  const datos = conEvaluacionesDemo(SEMILLA);

  it("produce datos íntegros", () => {
    expect(validarBaseDatos(datos)).toEqual([]);
  });

  it("guarda la salida real del motor para cada solicitud", () => {
    expect(datos.Evaluaciones).toHaveLength(CASOS_DEMO.length);
    for (const caso of CASOS_DEMO) {
      const solicitud = datos.Solicitudes.find(
        (s) => s.ID_Solicitud === caso.id,
      );
      expect(solicitud?.Nivel_Resultado).toBe(caso.esperado.nivel);
      expect(solicitud?.Estado).toBe(caso.esperado.estado);

      const evaluacion = datos.Evaluaciones.find(
        (e) => e.ID_Solicitud === caso.id,
      );
      const reglas = datos.Reglas_Activadas.filter(
        (r) => r.ID_Evaluacion === evaluacion?.ID_Evaluacion,
      ).map((r) => r.ID_Regla);
      expect(reglas).toEqual(caso.esperado.reglas);
    }
  });

  it("registra en el historial el cambio de estado sugerido", () => {
    expect(datos.Historial_Estados).toHaveLength(
      SEMILLA.Historial_Estados.length + CASOS_DEMO.length,
    );
    expect(datos.Historial_Estados.at(-1)).toMatchObject({
      Estado_Anterior: "Nueva",
      Usuario: null,
    });
  });

  it("no modifica la semilla", () => {
    expect(SEMILLA.Evaluaciones).toEqual([]);
    expect(SEMILLA.Solicitudes.every((s) => s.Estado === "Nueva")).toBe(true);
  });
});

describe("conUsuariosLocales", () => {
  it("reemplaza los usuarios y asigna las solicitudes al asesor activo", () => {
    const datos = conUsuariosLocales(
      conEvaluacionesDemo(SEMILLA),
      EQUIPO,
      ALTA,
    );
    expect(validarBaseDatos(datos)).toEqual([]);
    expect(datos.Usuarios.map((u) => u.Correo)).toEqual([
      "admin@ejemplo.com",
      "supervisor@ejemplo.com",
      "asesor@ejemplo.com",
      "retirado@ejemplo.com",
    ]);
    expect(datos.Usuarios[3].Estado).toBe("Inactivo");
    expect(new Set(datos.Solicitudes.map((s) => s.Asesor))).toEqual(
      new Set(["asesor@ejemplo.com"]),
    );
  });

  it("usa la fecha de alta de Colombia aunque en UTC ya sea el día siguiente", () => {
    // 03:00 UTC del 14 = 22:00 del 13 en Colombia.
    const datos = conUsuariosLocales(
      SEMILLA,
      EQUIPO,
      new Date("2026-09-14T03:00:00Z"),
    );
    expect(datos.Usuarios[0].Fecha_Alta).toEqual(
      new Date("2026-09-13T00:00:00Z"),
    );
  });

  it("exige un usuario activo por cada rol", () => {
    const sinSupervisor = EQUIPO.filter((u) => u.rol !== "SUPERVISOR");
    expect(() => conUsuariosLocales(SEMILLA, sinSupervisor, ALTA)).toThrow(
      "falta un usuario activo con rol SUPERVISOR",
    );
  });

  it("rechaza un correo inválido", () => {
    const conCorreoMalo = [
      { ...EQUIPO[0], correo: "sin-arroba" },
      ...EQUIPO.slice(1),
    ];
    expect(() => conUsuariosLocales(SEMILLA, conCorreoMalo, ALTA)).toThrow(
      "usuarios.local.json no es válido",
    );
  });

  it("deja que la validación detecte correos repetidos", () => {
    const repetido = [...EQUIPO, { ...EQUIPO[2], nombre: "Copia" }];
    const datos = conUsuariosLocales(SEMILLA, repetido, ALTA);
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining('clave duplicada "asesor@ejemplo.com"'),
    ]);
  });
});
