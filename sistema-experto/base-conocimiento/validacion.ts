// Validación de integridad de la base de datos del sistema experto.
//
// Dos niveles:
// 1. Estructura (cualquier tabla): claves únicas, obligatorias, tipos,
//    valores de Enum y referencias Ref que apunten a filas existentes.
// 2. Base de conocimiento: que cada regla tenga SI y ENTONCES, que las
//    expresiones y plantillas solo usen hechos y parámetros declarados,
//    que los literales respeten el dominio de su hecho, que ninguna regla
//    escriba hechos de entrada o del motor y que existan los hechos que el
//    motor necesita.
//
// Las expresiones y plantillas se analizan con las MISMAS funciones del
// motor: lo que aquí se da por válido es exactamente lo que el motor puede
// ejecutar. Se ejecuta antes de generar el .xlsx (el script falla si hay
// errores) y en los tests. Devuelve mensajes legibles en vez de lanzar,
// para mostrar todos los problemas de una vez.

import {
  ErrorExpresion,
  FORMATOS_PLANTILLA,
  HECHOS_DEL_MOTOR,
  SEPARADOR_LISTA,
  analizarPlantilla,
  referenciasExpresion,
} from "@/sistema-experto/motor/motor";
import {
  NOMBRES_TABLAS,
  SEPARADOR_ENUMLIST,
  TABLAS,
  type BaseDatos,
  type Columna,
  type Fila,
  type ValorCelda,
} from "./esquema";

const esVacio = (
  valor: ValorCelda | undefined,
): valor is null | undefined | "" =>
  valor === null || valor === undefined || valor === "";

export function validarBaseDatos(datos: BaseDatos): string[] {
  return [...validarEstructura(datos), ...validarBaseConocimiento(datos)];
}

// ---------------------------------------------------------------------------
// 1. Estructura
// ---------------------------------------------------------------------------

function validarEstructura(datos: BaseDatos): string[] {
  const errores: string[] = [];
  const nombresDefinidos = TABLAS.map((tabla) => tabla.nombre);
  for (const nombre of NOMBRES_TABLAS) {
    if (!nombresDefinidos.includes(nombre)) {
      errores.push(`Esquema: la tabla ${nombre} no está definida en TABLAS`);
    }
  }

  // Primera pasada: claves de cada tabla (las necesitan las referencias).
  const clavesPorTabla = new Map<string, Set<string>>();
  for (const tabla of TABLAS) {
    const columnasClave = tabla.columnas.filter((columna) => columna.clave);
    if (columnasClave.length !== 1) {
      errores.push(`Esquema: ${tabla.nombre} debe tener exactamente una clave`);
      continue;
    }
    const [clave] = columnasClave;
    const columnasValidas = new Set(tabla.columnas.map((c) => c.nombre));
    const claves = new Set<string>();

    datos[tabla.nombre].forEach((fila, i) => {
      const ubicacion = `${tabla.nombre} fila ${i + 2}`; // fila 1 = encabezados
      const valorClave = fila[clave.nombre];
      if (esVacio(valorClave)) {
        errores.push(`${ubicacion}: la clave ${clave.nombre} está vacía`);
      } else if (claves.has(String(valorClave))) {
        errores.push(`${ubicacion}: clave duplicada "${valorClave}"`);
      } else {
        claves.add(String(valorClave));
      }
      for (const nombre of Object.keys(fila)) {
        if (!columnasValidas.has(nombre)) {
          errores.push(`${ubicacion}: la columna "${nombre}" no existe`);
        }
      }
    });
    clavesPorTabla.set(tabla.nombre, claves);
  }

  // Segunda pasada: cada celda contra su columna.
  for (const tabla of TABLAS) {
    datos[tabla.nombre].forEach((fila, i) => {
      for (const columna of tabla.columnas) {
        const error = validarCelda(
          columna,
          fila[columna.nombre],
          clavesPorTabla,
        );
        if (error) {
          errores.push(
            `${tabla.nombre} fila ${i + 2}, ${columna.nombre}: ${error}`,
          );
        }
      }
    });
  }
  return errores;
}

function validarCelda(
  columna: Columna,
  valor: ValorCelda | undefined,
  clavesPorTabla: Map<string, Set<string>>,
): string | null {
  if (esVacio(valor)) return columna.requerida ? "es obligatoria" : null;

  switch (columna.tipo) {
    case "Number":
    case "Decimal":
    case "Price":
      return typeof valor === "number" && Number.isFinite(valor)
        ? null
        : `se esperaba un número y llegó "${valor}"`;
    case "Yes/No":
      return typeof valor === "boolean" ? null : "se esperaba TRUE o FALSE";
    case "Date":
    case "DateTime":
      return valor instanceof Date && !Number.isNaN(valor.getTime())
        ? null
        : "se esperaba una fecha";
    case "Email":
      return typeof valor === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
        ? null
        : `correo inválido "${valor}"`;
    case "Enum":
      return columna.valores?.includes(String(valor))
        ? null
        : `"${valor}" no está entre los valores permitidos`;
    case "EnumList": {
      const fuera = String(valor)
        .split(SEPARADOR_ENUMLIST)
        .filter((v) => !columna.valores?.includes(v));
      return fuera.length === 0
        ? null
        : `valores no permitidos: ${fuera.join(", ")}`;
    }
    case "Ref":
      return columna.ref && clavesPorTabla.get(columna.ref)?.has(String(valor))
        ? null
        : `referencia rota a ${columna.ref}: "${valor}" no existe`;
    default:
      return typeof valor === "string" || typeof valor === "number"
        ? null
        : "se esperaba texto";
  }
}

// ---------------------------------------------------------------------------
// 2. Base de conocimiento
// ---------------------------------------------------------------------------

const ES_PARAMETRO = /^[A-Z][A-Z0-9_]*$/;

function validarBaseConocimiento(datos: BaseDatos): string[] {
  const errores: string[] = [];
  const hechos = new Map<string, Fila>(
    datos.Hechos.map((hecho) => [String(hecho.ID_Hecho), hecho]),
  );
  const parametros = new Set(
    datos.Parametros.map((p) => String(p.ID_Parametro)),
  );
  const parametrosUsados = new Set<string>();

  for (const [id, origen] of Object.entries(HECHOS_DEL_MOTOR)) {
    const hecho = hechos.get(id);
    if (!hecho) {
      errores.push(`Hechos: falta "${id}", que el motor necesita`);
    } else if (hecho.Origen !== origen) {
      errores.push(`Hechos: "${id}" debe tener Origen = ${origen}`);
    }
  }

  const verificarIdentificador = (nombre: string, contexto: string) => {
    if (ES_PARAMETRO.test(nombre)) {
      if (parametros.has(nombre)) parametrosUsados.add(nombre);
      else errores.push(`${contexto}: el parámetro "${nombre}" no existe`);
    } else if (!hechos.has(nombre)) {
      errores.push(`${contexto}: el hecho "${nombre}" no existe`);
    }
  };

  const verificarExpresion = (expresion: string, contexto: string) => {
    try {
      const referencias = referenciasExpresion(expresion);
      for (const nombre of [...referencias.hechos, ...referencias.parametros]) {
        verificarIdentificador(nombre, contexto);
      }
    } catch (error) {
      if (!(error instanceof ErrorExpresion)) throw error;
      errores.push(`${contexto}: expresión inválida, ${error.message}`);
    }
  };

  const verificarPlantilla = (
    texto: string,
    contexto: string,
    soloParametros = false,
  ) => {
    const { marcadores, llavesSueltas } = analizarPlantilla(texto);
    for (const { nombre, formato } of marcadores) {
      if (soloParametros && !ES_PARAMETRO.test(nombre)) {
        errores.push(
          `${contexto}: aquí solo se admiten {PARAMETROS}, no el hecho "${nombre}"`,
        );
      } else {
        verificarIdentificador(nombre, contexto);
      }
      if (
        formato &&
        !(FORMATOS_PLANTILLA as readonly string[]).includes(formato)
      ) {
        errores.push(`${contexto}: el formato "${formato}" no existe`);
      }
    }
    if (llavesSueltas) {
      errores.push(`${contexto}: hay llaves sueltas o un marcador mal escrito`);
    }
  };

  const verificarLiteral = (
    idHecho: string,
    literal: string,
    contexto: string,
  ) => {
    const hecho = hechos.get(idHecho);
    if (!hecho) return; // la referencia rota ya la reporta la validación estructural
    if (
      hecho.Tipo_Dato === "Número" &&
      (literal.trim() === "" || Number.isNaN(Number(literal)))
    ) {
      errores.push(
        `${contexto}: "${literal}" no es un número válido para ${idHecho}`,
      );
    }
    if (hecho.Tipo_Dato === "SI/NO" && literal !== "SI" && literal !== "NO") {
      errores.push(
        `${contexto}: ${idHecho} solo admite SI o NO, llegó "${literal}"`,
      );
    }
    if (!esVacio(hecho.Valores_Permitidos)) {
      const permitidos = String(hecho.Valores_Permitidos).split(
        SEPARADOR_LISTA,
      );
      if (!permitidos.includes(literal)) {
        errores.push(
          `${contexto}: "${literal}" no está en el dominio de ${idHecho}`,
        );
      }
    }
  };

  // Reglas
  const prioridades = new Map<number, string>();
  for (const regla of datos.Reglas) {
    const id = String(regla.ID_Regla);
    const prioridad = Number(regla.Prioridad);
    const repetida = prioridades.get(prioridad);
    if (repetida) {
      errores.push(
        `Reglas ${id}: la prioridad ${prioridad} ya la usa ${repetida} (el orden de disparo sería ambiguo)`,
      );
    } else {
      prioridades.set(prioridad, id);
    }
    verificarPlantilla(
      String(regla.Enunciado ?? ""),
      `Reglas ${id} (Enunciado)`,
      true,
    );
    verificarPlantilla(
      String(regla.Explicacion ?? ""),
      `Reglas ${id} (Explicacion)`,
    );
    if (!datos.Condiciones_Regla.some((c) => c.ID_Regla === regla.ID_Regla)) {
      errores.push(`Reglas ${id}: no tiene condiciones (parte SI)`);
    }
    if (!datos.Acciones_Regla.some((a) => a.ID_Regla === regla.ID_Regla)) {
      errores.push(`Reglas ${id}: no tiene acciones (parte ENTONCES)`);
    }
  }

  // Condiciones
  for (const condicion of datos.Condiciones_Regla) {
    const contexto = `Condiciones_Regla ${condicion.ID_Condicion}`;
    const {
      Operador: operador,
      Tipo_Valor: tipoValor,
      Valor: valor,
    } = condicion;

    if (operador === "EXISTE" || operador === "NO_EXISTE") {
      if (!esVacio(tipoValor) || !esVacio(valor)) {
        errores.push(`${contexto}: ${operador} no lleva Tipo_Valor ni Valor`);
      }
      continue;
    }
    if (esVacio(tipoValor) || esVacio(valor)) {
      errores.push(
        `${contexto}: el operador ${operador} necesita Tipo_Valor y Valor`,
      );
      continue;
    }
    if (tipoValor === "Expresion") {
      if (operador === "EN_LISTA") {
        errores.push(`${contexto}: EN_LISTA solo admite valores Literal`);
      } else {
        verificarExpresion(String(valor), contexto);
      }
    } else {
      const literales =
        operador === "EN_LISTA"
          ? String(valor).split(SEPARADOR_LISTA)
          : [String(valor)];
      for (const literal of literales) {
        verificarLiteral(String(condicion.ID_Hecho), literal, contexto);
      }
    }
  }

  // Acciones
  const ordenesPorRegla = new Map<string, Set<number>>();
  for (const accion of datos.Acciones_Regla) {
    const contexto = `Acciones_Regla ${accion.ID_Accion}`;
    const idRegla = String(accion.ID_Regla);
    const ordenes = ordenesPorRegla.get(idRegla) ?? new Set<number>();
    if (ordenes.has(Number(accion.Orden))) {
      errores.push(
        `${contexto}: el Orden ${accion.Orden} está repetido en ${idRegla}`,
      );
    }
    ordenes.add(Number(accion.Orden));
    ordenesPorRegla.set(idRegla, ordenes);

    const valor = String(accion.Valor ?? "");
    if (accion.Tipo === "ASIGNAR" || accion.Tipo === "CALCULAR") {
      const idDestino = String(accion.ID_Hecho_Destino ?? "");
      const destino = hechos.get(idDestino);
      if (!destino) {
        errores.push(
          `${contexto}: ${accion.Tipo} necesita un ID_Hecho_Destino válido`,
        );
        continue;
      }
      if (destino.Origen !== "Derivado") {
        errores.push(
          `${contexto}: solo se pueden escribir hechos derivados ("${idDestino}" es de ${destino.Origen})`,
        );
      }
      if (accion.Tipo === "ASIGNAR") {
        verificarLiteral(idDestino, valor, contexto);
      } else {
        verificarExpresion(valor, contexto);
      }
    } else {
      if (!esVacio(accion.ID_Hecho_Destino)) {
        errores.push(
          `${contexto}: ${accion.Tipo} no escribe hechos, no lleva ID_Hecho_Destino`,
        );
      }
      verificarPlantilla(valor, contexto);
    }
  }

  for (const parametro of parametros) {
    if (!parametrosUsados.has(parametro)) {
      errores.push(`Parametros ${parametro}: ninguna regla lo usa`);
    }
  }
  return errores;
}
