# SolutaPLUS — Proyecto final de Sistemas Expertos

**Sistema experto para la evaluación de solicitudes de afiliación a
Seguridad Social** (Salud, Pensión y ARL) con AppSheet, Google Sheets, n8n,
Telegram y un agente IA (Gemini). Requisitos y rúbrica:
`Requisitos Proyecto Final.pdf` en la raíz del proyecto.

## Estado por módulo

| Módulo | Contenido                                  | Estado    |
| ------ | ------------------------------------------ | --------- |
| 7      | Base de conocimiento y modelo de datos     | ✅        |
| 8      | Motor de inferencia y explicación          | ✅        |
| 9      | App en AppSheet (vistas, roles, dashboard) | En curso  |
| 10     | Workflows en n8n                           | Pendiente |
| 11     | Telegram y agente IA                       | Pendiente |
| 12     | PDF del informe                            | Pendiente |
| 13     | Guion de sustentación                      | Pendiente |

Todos los entregables se generan con:

```bash
npm run sistema-experto:generar
```

## Módulo 7 — Base de conocimiento y modelo de datos

### Entregables

| Archivo                                            | Qué es                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `sistema-experto/salida/SolutaPLUS_BaseDatos.xlsx` | Las 20 tablas con sus datos iniciales, una pestaña por tabla. Local: no se versiona. |
| [`modelo-datos.md`](modelo-datos.md)               | Diagrama entidad-relación y diccionario de cada columna.                             |
| [`catalogo-reglas.md`](catalogo-reglas.md)         | Las 29 reglas, hechos, parámetros, fuentes y casos de demostración.                  |

Se generan desde `sistema-experto/base-conocimiento/`, así que nunca se
contradicen. El script valida la integridad antes de escribir: si hay una
referencia rota, un parámetro inexistente o una regla sin condiciones, no
genera nada y muestra los errores. Los tests de
`tests/unit/base-conocimiento.test.ts` comprueban también los mínimos de la
rúbrica: 5 tablas relacionadas, 3 roles, 10 reglas y 3 niveles.

### Cómo cargarlo en Google Sheets y AppSheet

1. Copiar `sistema-experto/usuarios.example.json` como
   `sistema-experto/usuarios.local.json` y poner las cuentas de Google reales
   del equipo, con al menos un usuario activo por rol (`ADMIN`, `ASESOR`,
   `SUPERVISOR`). Ese archivo y el `.xlsx` generado no se suben a git porque
   el repositorio es público.
2. Ejecutar `npm run sistema-experto:generar`. El `.xlsx` sale con esas
   cuentas y con las evaluaciones reales del motor para las 7 solicitudes de
   demostración (`Evaluaciones`, `Reglas_Activadas`, estado y nivel de cada
   solicitud).
3. Subir `SolutaPLUS_BaseDatos.xlsx` a Google Drive y abrirlo con Google
   Sheets (**Archivo → Guardar como Hojas de cálculo de Google**).
4. En AppSheet: **Create → App → Start with existing data** y elegir la
   hoja. La configuración de tipos, vistas, roles y acciones es el
   Módulo 9.

### Cómo está representado el conocimiento

El conocimiento no está escrito en el código: vive en 5 tablas que el rol
Administrador edita desde AppSheet.

- **Hechos**: variables del problema. Nombres en minúscula
  (`ingreso_neto`). Pueden ser _Entrada_ (salen de las tablas), _Derivado_
  (los escriben las reglas) o _Motor_ (contadores de reglas activadas).
- **Parametros**: valores normativos o de política, en MAYÚSCULA (`SMMLV`,
  `TARIFA_SALUD`). Cambiar el salario mínimo es editar una fila, sin tocar
  ninguna regla.
- **Reglas**: nombre, enunciado, categoría, prioridad, impacto (_Normal_,
  _Advertencia_, _Crítico_), plantilla de explicación y fuente.
- **Condiciones_Regla** (parte SI): `hecho operador valor`. Todas las
  condiciones de una regla se unen con Y. Operadores: `=`, `!=`, `>`, `>=`,
  `<`, `<=`, `EN_LISTA`, `EXISTE`, `NO_EXISTE`. El valor puede ser un
  _Literal_ o una _Expresion_ aritmética con hechos y parámetros
  (`SMMLV * IBC_MIN_SMMLV`; funciones `MAX`, `MIN`, `ROUND`).
- **Acciones_Regla** (parte ENTONCES): `ASIGNAR` o `CALCULAR` escriben un
  hecho derivado; `CONCLUIR`, `RECOMENDAR` y `ALERTAR` generan texto con
  marcadores (`{ibc|moneda}`).

### Respaldo normativo (consultado el 13-09-2026)

Cada regla y parámetro tiene su `Fuente` y un `Estado_Verificacion`:

- **Verificado**: confirmado en fuente oficial o en fuentes concordantes.
  - IBC del 40 %, mínimo de 1 y tope de 25 SMMLV, tarifas de Salud (12,5 %)
    y Pensión (16 %), ARL obligatoria en contratos de más de un mes o en
    riesgo IV-V pagada por el contratante:
    [UGPP — ABC Trabajador independiente con contrato de prestación de servicios](https://www.ugpp.gov.co/wp-content/uploads/2026/01/ABC-Trabajador-Independiente-Contrato-Prestacion-Servicios.pdf).
  - SMMLV 2026 de $1.750.905 (Decreto 1469 de 2025):
    [Holland & Knight](https://www.hklaw.com/en/insights/publications/2025/12/colombia-decreta-aumento-del-salario-minimo-y-auxilio-de-transporte),
    [Alegra](https://blog.alegra.com/colombia/salario-minimo-en-colombia-2026/).
  - Tarifas de ARL por clase (Decreto 1772 de 1994) y clasificación de
    actividades (Decreto 768 de 2022):
    [Buk](https://www.buk.co/blog/tarifas-arl-tabla-riesgos-calculo),
    [Función Pública — Decreto 768 de 2022](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=186926).
- **Por validar**: la fuente es secundaria o la norma no es clara para el
  caso. R04 y R05 dependen de la depuración de costos del Decreto 0379 de
  2026 ([Portafolio](https://www.portafolio.co/economia/gobierno/nuevo-decreto-en-colombia-cambia-aportes-de-independientes-asi-calcularan-salud-y-pension-492800)).
  R12 depende de cómo se aplica la ARL obligatoria por alto riesgo a quien
  trabaja por cuenta propia.
- **Política interna**: decisiones de SolutaPLUS para el ejercicio
  (documentos exigidos, umbrales de bloqueo y escalamiento, coherencia con
  los planes).

**Fuera del alcance a propósito:** ninguna regla depende de la reforma
pensional (Ley 2381 de 2024), cuya vigencia sigue en discusión en la Corte
Constitucional. Tampoco se modelan las reglas de pensionados ni del régimen
subsidiado, porque no se pudieron verificar en una fuente confiable.

## Módulo 8 — Motor de inferencia y explicación

### Entregables

| Archivo                                        | Qué es                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| `sistema-experto/motor/motor.ts`               | El motor: compilación de la base, inferencia, explicación y salidas.        |
| `sistema-experto/salida/motor-n8n.js`          | El mismo motor como script autónomo para el nodo Code de n8n (Módulo 10).   |
| [`evaluaciones-demo.md`](evaluaciones-demo.md) | Salida real del motor para los 7 casos de demostración, con su explicación. |

### Cómo razona

1. **Compila la base de conocimiento** leída de Sheets. Una regla mal
   configurada (por ejemplo, editada a mano en AppSheet con un hecho que no
   existe) se descarta con un aviso en `errores`; las demás siguen
   funcionando.
2. **Arma los hechos de entrada** de la solicitud cruzando las tablas:
   clase y tarifa de ARL desde la actividad económica, porcentaje de
   documentos obligatorios recibidos según el tipo de vinculación y horas
   sin gestión en hora de Colombia. Si falta un dato, aplica el
   `Valor_Por_Defecto` de la tabla Hechos.
3. **Encadena hacia adelante:** en cada ciclo toma, por `Prioridad`, la
   primera regla no disparada cuyas condiciones se cumplen y ejecuta sus
   acciones. Esas acciones escriben hechos nuevos que pueden activar otras
   reglas. Ejemplo (SOL-0001): ingreso → ingreso neto (R03) → obligación de
   cotizar (R06) → IBC (R08) → aportes (R17, R18) → viable (R27).
4. **Clasifica:** **Crítica** si se activó alguna regla crítica,
   **Requiere revisión** si hubo advertencias, **Viable** en otro caso.
5. **Explica:** cada regla activada deja su orden de disparo, su
   explicación con los valores reales y los valores exactos que hicieron
   cumplir sus condiciones. Esto es lo que se guarda en `Reglas_Activadas`.

Las expresiones se evalúan con un analizador propio, sin `eval`. El
validador del Módulo 7 usa ese mismo analizador, así que lo que se valida es
exactamente lo que el motor ejecuta.

### Uso

```ts
const resultado = evaluarSolicitud("SOL-0001", tablas, { ahora: new Date() });
resultado.nivel; // "Viable"
resultado.reglasActivadas; // [{ orden, idRegla, explicacion, hechosUsados }, …]
filasResultado(resultado, { idEvaluacion, fecha, origen }); // filas para Sheets
resumenTexto(resultado); // explicación completa en texto (Telegram, PDF, IA)
```

En n8n, `motor-n8n.js` expone lo mismo en el global `SolutaPLUSMotor`. Para
evitar ambigüedades con las fechas, conviene leer Sheets con valores sin
formato (serial) o en formato ISO (`2026-09-13 12:00`).

### Cómo se verificó

`tests/unit/motor.test.ts`:

- **Casos de demostración:** los 7 producen exactamente las reglas, en el
  mismo orden de disparo, con el nivel y el estado esperados.
- **Ejemplo oficial de la UGPP:** SOL-0001 da IBC $2.000.000, Salud
  $250.000, Pensión $320.000, ARL $10.440 y total $580.440.
- **Situaciones límite:** tope de 25 SMMLV, ARL voluntaria, contratista sin
  duración de contrato, empleador pequeño y valores por defecto.
- **Datos como llegan de Sheets:** con todas las tablas convertidas a texto,
  el resultado es idéntico.
- **Configurabilidad:** desactivar una regla o cambiar el salario mínimo
  cambia la conclusión sin tocar el código.
- **Robustez:** una regla dañada o una división por cero no detienen la
  inferencia.
- **Versión para n8n:** el script generado se ejecuta en un contexto aislado
  (sin `require`) y da el mismo resultado que el motor original.

**Aproximaciones conocidas:** los aportes se calculan con el valor exacto y
las filas para Sheets se redondean al peso. El redondeo oficial de la PILA no
se implementó porque no se verificó su norma.
