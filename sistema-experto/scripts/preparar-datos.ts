// Prepara los datos que se cargan en Google Sheets a partir de la semilla:
// - conEvaluacionesDemo: agrega la salida REAL del motor para las
//   solicitudes de demostración (Evaluaciones, Reglas_Activadas, estado y
//   nivel de cada solicitud), para que AppSheet muestre clasificaciones y
//   explicaciones antes de que n8n esté conectado.
// - conUsuariosLocales: reemplaza los usuarios de ejemplo por las cuentas
//   reales del equipo, leídas de `sistema-experto/usuarios.local.json`.
//   Ese archivo está fuera de git porque el repositorio es público.

import { z } from "zod";
import {
  ESTADOS_USUARIO,
  fecha,
  type BaseDatos,
  type Fila,
} from "@/sistema-experto/base-conocimiento/esquema";
import {
  evaluarSolicitud,
  filasResultado,
} from "@/sistema-experto/motor/motor";

/** Momento fijo (hora de Colombia) para que las evaluaciones sean reproducibles. */
export const FECHA_EVALUACION_DEMO = "2026-09-13T12:00:00";
const ORIGEN_DEMO = "Carga inicial (demo)";

const codigo = (prefijo: string, numero: number) =>
  `${prefijo}-${String(numero).padStart(4, "0")}`;

export function conEvaluacionesDemo(datos: BaseDatos): BaseDatos {
  const ahora = fecha(FECHA_EVALUACION_DEMO);
  const evaluaciones: Fila[] = [...datos.Evaluaciones];
  const reglasActivadas: Fila[] = [...datos.Reglas_Activadas];
  const historial: Fila[] = [...datos.Historial_Estados];

  const solicitudes = datos.Solicitudes.map((solicitud) => {
    const idSolicitud = String(solicitud.ID_Solicitud);
    const resultado = evaluarSolicitud(idSolicitud, datos, {
      ahora,
      zonaHorariaMinutos: 0,
    });
    if (resultado.errores.length > 0) {
      throw new Error(
        `La evaluación de ${idSolicitud} tuvo errores: ${resultado.errores.join("; ")}`,
      );
    }

    const idEvaluacion = codigo("EVA", evaluaciones.length + 1);
    const filas = filasResultado(resultado, {
      idEvaluacion,
      fecha: ahora,
      origen: ORIGEN_DEMO,
    });
    evaluaciones.push(filas.evaluacion);
    reglasActivadas.push(...filas.reglasActivadas);

    const estado = resultado.estadoSugerido ?? solicitud.Estado;
    if (estado !== solicitud.Estado) {
      historial.push({
        ID_Historial: codigo("HIS", historial.length + 1),
        ID_Solicitud: idSolicitud,
        Estado_Anterior: solicitud.Estado,
        Estado_Nuevo: estado,
        Usuario: null,
        Fecha: ahora,
        Comentario: `Estado sugerido por el motor en la evaluación ${idEvaluacion} (carga inicial de demostración).`,
      });
    }
    return { ...solicitud, Estado: estado, Nivel_Resultado: resultado.nivel };
  });

  return {
    ...datos,
    Solicitudes: solicitudes,
    Evaluaciones: evaluaciones,
    Reglas_Activadas: reglasActivadas,
    Historial_Estados: historial,
  };
}

const usuarioLocalSchema = z.object({
  nombre: z.string().trim().min(1, "el nombre está vacío"),
  // AppSheet compara con USEREMAIL(), que siempre llega en minúscula.
  correo: z.string().trim().toLowerCase().pipe(z.email("correo inválido")),
  rol: z.string().trim().min(1, "el rol está vacío"),
  estado: z.enum(ESTADOS_USUARIO).default("Activo"),
  telegramChatId: z.string().trim().optional(),
});

const usuariosLocalesSchema = z
  .array(usuarioLocalSchema)
  .min(1, "no hay usuarios");

export type UsuarioLocal = z.input<typeof usuarioLocalSchema>;

/**
 * Reemplaza la tabla Usuarios y asigna las solicitudes al primer asesor
 * activo. Exige al menos un usuario activo por cada rol de la tabla Roles;
 * roles inexistentes o correos repetidos los detecta `validarBaseDatos`.
 */
export function conUsuariosLocales(
  datos: BaseDatos,
  entrada: unknown,
  alta: Date,
): BaseDatos {
  const lectura = usuariosLocalesSchema.safeParse(entrada);
  if (!lectura.success) {
    throw new Error(
      `usuarios.local.json no es válido:\n${z.prettifyError(lectura.error)}`,
    );
  }
  const usuarios = lectura.data;
  const activoCon = (rol: string) =>
    usuarios.find((u) => u.rol === rol && u.estado === "Activo");

  const rolesSinUsuario = datos.Roles.map((r) => String(r.ID_Rol)).filter(
    (rol) => !activoCon(rol),
  );
  if (rolesSinUsuario.length > 0) {
    throw new Error(
      `usuarios.local.json: falta un usuario activo con rol ${rolesSinUsuario.join(", ")}`,
    );
  }
  const asesor = activoCon("ASESOR");
  if (!asesor) {
    throw new Error(
      "usuarios.local.json: falta un usuario activo con rol ASESOR",
    );
  }

  // Día de calendario en Colombia (UTC−5): de noche, en UTC ya es mañana.
  const diaAlta = fecha(
    new Date(alta.getTime() - 5 * 3_600_000).toISOString().slice(0, 10),
  );
  return {
    ...datos,
    Usuarios: usuarios.map((usuario) => ({
      Correo: usuario.correo,
      Nombre: usuario.nombre,
      ID_Rol: usuario.rol,
      Estado: usuario.estado,
      Telegram_Chat_ID: usuario.telegramChatId ?? null,
      Fecha_Alta: diaAlta,
    })),
    Solicitudes: datos.Solicitudes.map((solicitud) => ({
      ...solicitud,
      Asesor: asesor.correo,
    })),
  };
}
