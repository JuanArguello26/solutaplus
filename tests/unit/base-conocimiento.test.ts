import { describe, it, expect } from "vitest";
import {
  NIVELES_IMPACTO,
  NOMBRES_TABLAS,
  TABLAS,
} from "@/sistema-experto/base-conocimiento/esquema";
import { SEMILLA } from "@/sistema-experto/base-conocimiento/semilla";
import { validarBaseDatos } from "@/sistema-experto/base-conocimiento/validacion";
import { conCambio } from "./utilidades/semilla";

describe("base de datos semilla", () => {
  it("no tiene errores de integridad", () => {
    expect(validarBaseDatos(SEMILLA)).toEqual([]);
  });

  it("define todas las tablas declaradas", () => {
    expect(TABLAS.map((t) => t.nombre)).toEqual([...NOMBRES_TABLAS]);
  });
});

describe("requisitos del proyecto final", () => {
  it("tiene al menos 5 tablas relacionadas entre sí", () => {
    const relacionadas = TABLAS.filter((t) => t.columnas.some((c) => c.ref));
    expect(relacionadas.length).toBeGreaterThanOrEqual(5);
  });

  it("la tabla Usuarios tiene correo, nombre, rol y estado", () => {
    const usuarios = TABLAS.find((t) => t.nombre === "Usuarios");
    const columnas = usuarios?.columnas.map((c) => c.nombre);
    expect(columnas).toEqual(
      expect.arrayContaining(["Correo", "Nombre", "ID_Rol", "Estado"]),
    );
  });

  it("define al menos 3 roles con permisos diferentes", () => {
    const permisos = SEMILLA.Roles.map((rol) =>
      JSON.stringify({ ...rol, ID_Rol: null, Nombre: null, Descripcion: null }),
    );
    expect(SEMILLA.Roles.length).toBeGreaterThanOrEqual(3);
    expect(new Set(permisos).size).toBe(SEMILLA.Roles.length);
  });

  it("tiene al menos 10 reglas SI-ENTONCES activas", () => {
    const activas = SEMILLA.Reglas.filter((regla) => regla.Activa === true);
    expect(activas.length).toBeGreaterThanOrEqual(10);
  });

  it("usa los 3 niveles de clasificación", () => {
    const niveles = new Set(SEMILLA.Reglas.map((regla) => regla.Nivel_Impacto));
    expect([...niveles].sort()).toEqual([...NIVELES_IMPACTO].sort());
  });
});

describe("validarBaseDatos detecta errores", () => {
  it("una referencia a una fila que no existe", () => {
    const datos = conCambio(
      "Solicitudes",
      (f) => f.ID_Solicitud === "SOL-0001",
      { ID_Solicitante: "CLI-9999" },
    );
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining('referencia rota a Solicitantes: "CLI-9999"'),
    ]);
  });

  it("un valor fuera de un Enum", () => {
    const datos = conCambio("Usuarios", () => true, { Estado: "Suspendido" });
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining(
        '"Suspendido" no está entre los valores permitidos',
      ),
    ]);
  });

  it("una expresión con un parámetro que no existe", () => {
    const datos = conCambio(
      "Condiciones_Regla",
      (f) => f.ID_Condicion === "R06-C1",
      { Valor: "SALARIO_MINIMO" },
    );
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining('el parámetro "SALARIO_MINIMO" no existe'),
    ]);
  });

  it("un literal fuera del dominio del hecho", () => {
    const datos = conCambio(
      "Condiciones_Regla",
      (f) => f.ID_Condicion === "R03-C1",
      { Valor: "Pensionado" },
    );
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining(
        '"Pensionado" no está en el dominio de tipo_vinculacion',
      ),
    ]);
  });

  it("una acción que sobrescribe un hecho de entrada", () => {
    const datos = conCambio("Acciones_Regla", (f) => f.ID_Accion === "R03-A1", {
      ID_Hecho_Destino: "ingreso_mensual",
    });
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining("solo se pueden escribir hechos derivados"),
    ]);
  });

  it("un marcador de plantilla mal escrito", () => {
    const datos = conCambio("Reglas", (f) => f.ID_Regla === "R16", {
      Explicacion: "Sobre un IBC de {ibc|moneda: salud {aporte_salud}.",
    });
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining("llaves sueltas"),
    ]);
  });

  it("dos reglas con la misma prioridad", () => {
    const datos = conCambio("Reglas", (f) => f.ID_Regla === "R04", {
      Prioridad: 20,
    });
    expect(validarBaseDatos(datos)).toEqual([
      expect.stringContaining("la prioridad 20 ya la usa R03"),
    ]);
  });

  it("un parámetro que ninguna regla usa", () => {
    const datos = conCambio("Parametros", () => false, {
      ID_Parametro: "TARIFA_CAJA_COMPENSACION",
      Nombre: "Aporte voluntario a caja de compensación",
      Valor: 2,
      Unidad: "%",
      Vigencia_Desde: new Date("2026-01-01T00:00:00Z"),
      Fuente: "Prueba",
      Estado_Verificacion: "Por validar",
    });
    expect(validarBaseDatos(datos)).toEqual([
      "Parametros TARIFA_CAJA_COMPENSACION: ninguna regla lo usa",
    ]);
  });
});
