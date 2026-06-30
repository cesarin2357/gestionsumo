/**
 * ============================================================
 * UTILS.gs — Utilidades y Helpers
 * ============================================================
 */

/**
 * Nombre de la Google Sheet (debe coincidir con el nombre real)
 * Cambiar este valor si la hoja tiene otro nombre
 */
var SPREADSHEET_ID = ''; // Dejar vacío para usar la hoja vinculada, o poner el ID

/**
 * Obtiene la referencia a la Spreadsheet
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  // Si el script está vinculado a una hoja, usar esa
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Obtiene o crea una hoja por nombre
 */
function getOrCreateSheet(nombre) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
  }
  return sheet;
}

/**
 * Genera un ID único para estudiantes: EST-0001, EST-0002, etc.
 */
function generarIdEstudiante() {
  var sheet = getOrCreateSheet('Estudiantes');
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 'EST-0001'; // Solo encabezados o vacía
  
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = 0;
  ids.forEach(function(row) {
    var id = row[0].toString();
    if (id.startsWith('EST-')) {
      var num = parseInt(id.replace('EST-', ''), 10);
      if (num > maxNum) maxNum = num;
    }
  });
  
  var siguiente = maxNum + 1;
  return 'EST-' + ('0000' + siguiente).slice(-4);
}

/**
 * Obtiene la fecha actual formateada
 */
function getFechaHoy() {
  var hoy = new Date();
  var year = hoy.getFullYear();
  var month = ('0' + (hoy.getMonth() + 1)).slice(-2);
  var day = ('0' + hoy.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/**
 * Obtiene el día de la semana en español
 */
function getDiaHoy() {
  var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date().getDay()];
}

/**
 * Convierte datos de hoja a array de objetos
 * Primera fila = encabezados
 */
function sheetToObjects(sheetName) {
  try {
    var sheet = getOrCreateSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    if (lastRow <= 1 || lastCol < 1) return []; // Solo encabezados o vacía
    
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    if (!data || data.length <= 1) return [];
    
    var headers = data[0];
    var result = [];
    var tz = Session.getScriptTimeZone();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Ignorar filas completamente vacías
      var filaVacia = true;
      for (var k = 0; k < row.length; k++) {
        if (row[k] !== '' && row[k] !== null && row[k] !== undefined) {
          filaVacia = false;
          break;
        }
      }
      if (filaVacia) continue;
      
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        // Detectar objetos Date (doble verificación para Apps Script)
        if (val instanceof Date || Object.prototype.toString.call(val) === '[object Date]') {
          try {
            val = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
          } catch(fe) {
            val = '';
          }
        }
        // Convertir null/undefined a string vacío
        if (val === null || val === undefined) val = '';
        obj[headers[j]] = val;
      }
      obj._rowIndex = i + 1;
      result.push(obj);
    }
    
    return result;
  } catch(e) {
    Logger.log('ERROR sheetToObjects(' + sheetName + '): ' + e.message + '\n' + e.stack);
    throw new Error('Error al leer hoja "' + sheetName + '": ' + e.message);
  }
}

/**
 * Inicializa los encabezados de una hoja si está vacía
 */
function initSheetHeaders(sheetName, headers) {
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(headers);
    // Formato de encabezados
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#f1f5f9');
    sheet.setFrozenRows(1);
  } else {
    // Si la hoja ya tiene datos, verificar si la cabecera actual coincide.
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var match = true;
    if (currentHeaders.length < headers.length) {
      match = false;
    } else {
      for (var i = 0; i < headers.length; i++) {
        if (currentHeaders[i] !== headers[i]) {
          match = false;
          break;
        }
      }
    }
    
    if (!match) {
      // Actualizar fila 1 con las nuevas cabeceras
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setFontWeight('bold');
      range.setBackground('#1e293b');
      range.setFontColor('#f1f5f9');
      sheet.setFrozenRows(1);
      Logger.log('Cabeceras actualizadas para la hoja: ' + sheetName);
    }
  }
  return sheet;
}

/**
 * Inicializa todas las hojas del sistema
 */
function inicializarSistema() {
  initSheetHeaders('Estudiantes', [
    'CI', 'Nombre Completo', 'Facultad', 'Tipo Grupo', 'Grupo',
    'Estado', 'Teléfono', 'Email', 'Padre o Madre', 'Teléfono Padre', 'Fecha Inscripción'
  ]);
  
  initSheetHeaders('Asistencia', [
    'Fecha', 'Día', 'ID_Estudiante', 'Nombre', 'Facultad',
    'Tipo Grupo', 'Grupo', 'Materia', 'Docente', 'Estado', 'Observación'
  ]);
  
  initSheetHeaders('Desempeño', [
    'Fecha', 'ID_Estudiante', 'Nombre', 'Facultad', 'Tipo Grupo',
    'Grupo', 'Materia', 'Tipo Evaluación', 'Descripción',
    'Calificación', 'Cal. Máxima', 'Observación'
  ]);
  
  initSheetHeaders('Prácticas', [
    'Fecha Asignación', 'Fecha Límite', 'ID_Estudiante', 'Nombre',
    'Facultad', 'Tipo Grupo', 'Grupo', 'Materia', 'Nombre Práctica',
    'Estado', 'Calificación', 'Link Archivo', 'Observación'
  ]);
  
  initSheetHeaders('LOG_IMPORTACIONES', [
    'Fecha', 'Hora', 'Usuario', 'Archivo', 'Registros Totales',
    'Registros Importados', 'Registros Errores', 'Tiempo (seg)', 'Estado', 'Detalles'
  ]);
  
  Logger.log('✅ Sistema inicializado correctamente');
  return { success: true, message: 'Sistema inicializado correctamente' };
}

/**
 * Valida que un string no esté vacío
 */
function validarCampo(valor, nombreCampo) {
  if (!valor || valor.toString().trim() === '') {
    throw new Error('El campo "' + nombreCampo + '" es obligatorio');
  }
  return valor.toString().trim();
}

/**
 * Formatea fecha para mostrar
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  var d = new Date(fecha);
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var year = d.getFullYear();
  return day + '/' + month + '/' + year;
}
