# Manual del Panel Administrativo

Guía rápida para el equipo comercial que gestiona los leads que llegan
desde la landing.

## Acceso

1. Entra a `https://<tu-dominio>/admin/login` (en desarrollo local:
   `http://localhost:3000/admin/login`).
2. Ingresa la contraseña compartida del panel (la define quien administra
   el proyecto, variable de entorno `ADMIN_PASSWORD`).
3. La sesión dura 8 horas. Pasado ese tiempo, o si cierras sesión con el
   botón "Cerrar sesión", tendrás que volver a ingresar la contraseña.

> El panel no tiene usuarios individuales todavía — todo el equipo usa la
> misma contraseña. Si alguien deja el equipo, cambien la contraseña.

## Dashboard

Al entrar verás un resumen general:

- **Total leads / Hoy / Esta semana / Este mes** — conteo de solicitudes
  recibidas en cada periodo.
- **Servicio top / Ciudad top** — el servicio y la ciudad con más leads
  hasta el momento.
- **Distribución por estado** — cuántos leads hay en cada estado del
  embudo (Nuevo, En proceso, Contactado, etc.).

## Gestión de leads

En la sección **Leads** puedes:

- **Buscar** por nombre, teléfono o correo (escribe y presiona Enter).
- **Filtrar** por estado, servicio o ciudad.
- **Ordenar** haciendo clic en los encabezados "Nombre", "Estado" o
  "Fecha".
- **Ver el detalle** haciendo clic en cualquier fila: datos de contacto,
  servicio/plan cotizado, precio estimado, observaciones y el historial
  completo de cambios de estado.

### Cambiar el estado de un lead

Desde el detalle de un lead, en "Cambiar estado":

1. Selecciona el nuevo estado.
2. Opcionalmente escribe un comentario (por ejemplo, por qué cambió, o
   qué se acordó con el cliente).
3. Presiona "Actualizar estado". El cambio queda registrado en el
   historial con fecha y hora — no se puede editar ni borrar después,
   así que revisa antes de confirmar.

Estados disponibles: **Nuevo** → **En proceso** → **Contactado** →
**Pendiente** → **Afiliado** / **No interesado** / **Cancelado**. No es
obligatorio seguir ese orden exacto; úsalos según corresponda a la
conversación real con el cliente.

## Exportar leads

En la parte superior de la tabla de leads, los botones **Exportar CSV** y
**Exportar Excel** descargan exactamente lo que estás viendo en pantalla
(respetan los filtros de búsqueda/estado/servicio/ciudad activos en ese
momento, no solo la página actual).

## Preguntas frecuentes

**¿Puedo eliminar un lead?**
No desde el panel todavía — es una decisión deliberada para evitar borrar
información de contacto por error. Si necesitas depurar datos de prueba o
duplicados, pídele a quien administra el proyecto que lo haga
directamente en la base de datos.

**Olvidé la contraseña del panel.**
Pídele a quien administra el proyecto que la revise en las variables de
entorno (`ADMIN_PASSWORD`) o que la cambie.

**¿Qué significa que un lead esté "duplicado"?**
Si alguien envía el formulario dos veces con el mismo teléfono para el
mismo servicio en menos de 30 minutos, el sistema no crea un segundo
registro — asume que fue un reenvío accidental (doble clic, recarga de
página).
