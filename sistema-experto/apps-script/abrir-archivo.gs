/**
 * Redirige al enlace real de un informe PDF o reporte Excel de SolutaPLUS.
 * AppSheet no expone el enlace del archivo que crea el bot, y una búsqueda de
 * Drive abre el Drive de quien pulsa. Este script (que corre como el dueño) lo
 * busca por nombre exacto y lleva a su descarga directa (va a la carpeta Descargas del navegador).
 * Uso: <URL del despliegue>?nombre=Informe_SOL-0001.pdf
 * El acceso al archivo lo sigue controlando Drive: la carpeta debe estar
 * compartida con el equipo.
 */
function doGet(e) {
  var nombre = (e && e.parameter && e.parameter.nombre) || '';
  var valido = /^(Informe_SOL-\d{4}\.pdf|Reporte de solicitudes - [\w .-]+\.xlsx)$/.test(nombre);
  if (!valido) return HtmlService.createHtmlOutput('Nombre de archivo no válido.');
  var archivos = DriveApp.getFilesByName(nombre);
  if (!archivos.hasNext()) {
    return HtmlService.createHtmlOutput('Todavía no existe ' + nombre + '. Genera el archivo y vuelve a intentar.');
  }
  var url = 'https://drive.google.com/uc?export=download&id=' + archivos.next().getId();
  return HtmlService.createHtmlOutput(
    '<script>window.top.location.href=' + JSON.stringify(url) + ';</script>' +
    '<a href="' + url + '" target="_top">Descargar archivo</a>');
}


var ID_HOJA = '1O2zZNprQexe7myH7oqBAufvWNw9ze0LV4Ke2EGD7G0U';

/**
 * Escribe en Solicitudes.URL_PDF el enlace directo de descarga del informe
 * (el mas reciente con ese nombre). Se ejecuta cada minuto.
 */
function sincronizarEnlaces() {
  var hoja = SpreadsheetApp.openById(ID_HOJA).getSheetByName('Solicitudes');
  var datos = hoja.getDataRange().getValues();
  var cab = datos[0];
  var cId = cab.indexOf('ID_Solicitud');
  var cUrl = cab.indexOf('URL_PDF');
  if (cId < 0 || cUrl < 0) return;
  for (var i = 1; i < datos.length; i++) {
    var id = datos[i][cId];
    if (!id) continue;
    var archivos = DriveApp.getFilesByName('Informe_' + id + '.pdf');
    var mejor = null;
    while (archivos.hasNext()) {
      var f = archivos.next();
      if (!mejor || f.getLastUpdated() > mejor.getLastUpdated()) mejor = f;
    }
    if (!mejor) continue;
    var url = 'https://drive.google.com/uc?export=download&id=' + mejor.getId();
    if (datos[i][cUrl] !== url) hoja.getRange(i + 1, cUrl + 1).setValue(url);
  }
}

/** Ejecutar una sola vez para crear el disparador de cada minuto. */
function instalarDisparador() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sincronizarEnlaces') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sincronizarEnlaces').timeBased().everyMinutes(1).create();
}
