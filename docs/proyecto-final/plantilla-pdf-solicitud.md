# Plantilla del PDF de una solicitud (Google Docs + AppSheet)

Texto para pegar en un Google Doc vacío. AppSheet reemplaza cada `<<...>>`
con datos de la fila de **Solicitudes** sobre la que se dispara el bot.
Los nombres de columna salen de `sistema-experto/base-conocimiento/esquema.ts`.

Cómo se arma:

1. Crear un Google Doc vacío en la cuenta dueña de la app (nombre sugerido:
   `Plantilla_Informe_Solicitud`) y pegar el texto de abajo.
2. La tabla de la sección 4 debe ser una **tabla real de Google Docs** con
   2 filas: encabezado y una fila con las expresiones. El
   `<<Start: ...>>` va al inicio de la primera celda de esa fila y el
   `<<End>>` al final de la última celda.
3. En AppSheet el bot usa la tarea **Create a new file** con esta plantilla,
   tipo de archivo PDF y una carpeta de Drive (ver la guía del módulo).

Antes de usarla, comprobar en Data → Solicitudes y Data → Evaluaciones que
existen las columnas virtuales `Related Evaluaciones` y
`Related Reglas_Activadas` (las crea AppSheet al detectar los Ref). Si el
nombre difiere, ajustar los dos `Start`.

---

## Texto de la plantilla

```text
SolutaPLUS
Informe de evaluación de solicitud de afiliación

Radicado: <<[ID_Solicitud]>>
Fecha de radicación: <<TEXT([Fecha_Creacion], "dd/mm/yyyy")>>
Estado actual: <<[Estado]>>
Clasificación del sistema experto: <<[Nivel_Resultado]>>
Asesor asignado: <<[Asesor].[Nombre]>>

1. DATOS DEL SOLICITANTE
Nombre o razón social: <<[ID_Solicitante].[Nombre_Completo]>>
Documento: <<[ID_Solicitante].[Tipo_Documento]>> <<[ID_Solicitante].[Numero_Documento]>>
Teléfono: <<[ID_Solicitante].[Telefono]>>
Correo: <<[ID_Solicitante].[Correo]>>
Ciudad: <<[ID_Solicitante].[Ciudad]>>
Autorización de tratamiento de datos (Ley 1581 de 2012): <<IF([ID_Solicitante].[Autoriza_Datos], "Sí", "No")>>

2. DATOS DE LA SOLICITUD
Servicio: <<[ID_Servicio].[Nombre]>>
Plan: <<[ID_Plan].[Nombre]>>
Tipo de vinculación: <<[Tipo_Vinculacion]>>
Ingreso mensual: <<[Ingreso_Mensual]>>
Costos deducibles: <<[Costos_Deducibles]>>
Duración del contrato (días): <<[Duracion_Contrato_Dias]>>
Actividad económica: <<[ID_Actividad].[Nombre]>>
Número de trabajadores: <<[Numero_Trabajadores]>>
Descripción del solicitante: <<[Descripcion_Libre]>>

3. RESULTADO DE LA EVALUACIÓN
<<Start: [Related Evaluaciones]>>
Evaluación <<[ID_Evaluacion]>> del <<TEXT([Fecha], "dd/mm/yyyy HH:mm")>> (origen: <<[Origen]>>)
Clasificación: <<[Nivel_Resultado]>>
Estado sugerido por el sistema: <<[Estado_Sugerido]>>
Reglas activadas: <<[Num_Reglas_Activadas]>> (críticas: <<[Num_Criticas]>>, advertencias: <<[Num_Advertencias]>>)

Aportes mensuales estimados
Ingreso base de cotización (IBC): <<[IBC]>>
Salud: <<[Aporte_Salud]>>
Pensión: <<[Aporte_Pension]>>
ARL: <<[Aporte_ARL]>>
Total mensual a cargo del solicitante: <<[Total_Aportes_Cliente]>>

Conclusiones
<<[Conclusiones]>>

Recomendaciones para el asesor
<<[Recomendaciones]>>

Explicación en lenguaje natural
<<[Explicacion_IA]>>

4. REGLAS ACTIVADAS (EXPLICACIÓN TRAZABLE)
```

Tabla de 4 columnas (encabezado + una fila con la expresión):

| # | Regla | Impacto | Explicación |
|---|---|---|---|
| `<<Start: [Related Reglas_Activadas]>><<[Orden_Disparo]>>` | `<<[ID_Regla].[ID_Regla]>> · <<[ID_Regla].[Nombre]>>` | `<<[Nivel_Impacto]>>` | `<<[Explicacion_Generada]>><<End>>` |

```text
<<End>>

5. FIRMA DEL SOLICITANTE
<<[Firma_Solicitante]>>

Informe generado automáticamente por SolutaPLUS el <<TEXT(NOW(), "dd/mm/yyyy HH:mm")>>.
Los aportes son estimaciones calculadas con los parámetros normativos vigentes de la base de conocimiento; la decisión final la toma un asesor.
```

Notas:

- El primer `<<End>>` (dentro de la tabla) cierra el bucle de reglas; el
  segundo (después de la tabla) cierra el bucle de evaluaciones. Si una
  solicitud tiene varias evaluaciones, el PDF las lista todas.
- Las columnas de moneda salen con el formato de AppSheet (`Price`).
- La firma es la columna `Firma_Solicitante` (tipo `Signature`); si está
  vacía, esa sección queda en blanco.
