/**
 * ============================================================
 * CODE.gs — Punto de entrada principal
 * ============================================================
 * Maneja doGet (Web App), routing y API del frontend
 * ============================================================
 */

/**
 * Punto de entrada de la Web App
 * Se ejecuta cuando alguien accede a la URL de la app
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  var html = template.evaluate()
    .setTitle('Sistema de Gestión Académica')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  return html;
}

/**
 * Incluir archivos HTML parciales (css.html, javascript.html, etc.)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================
// API — Funciones llamadas desde el frontend
// =============================================

/**
 * Obtener configuración completa (facultades, materias, grupos)
 */
function api_getConfig() {
  return getConfigCompleta();
}

/**
 * Inicializar el sistema (crear hojas con encabezados)
 */
function api_inicializar() {
  return inicializarSistema();
}

/**
 * Obtener datos del dashboard
 */
function api_getDashboard() {
  try {
    return getDashboardStats();
  } catch(e) {
    Logger.log('ERROR api_getDashboard: ' + e.message);
    return { fechaHoy: '', diaHoy: '', totalEstudiantes: 0, asistenciaHoy: { presentes:0, ausentes:0, tardanzas:0, totalRegistros:0 }, practicasPendientes: 0, porFacultad: {} };
  }
}

// --- ESTUDIANTES ---

function api_getEstudiantes(filtros) {
  try {
    var resultado = getEstudiantes(filtros);
    if (!Array.isArray(resultado)) {
      Logger.log('ADVERTENCIA api_getEstudiantes: resultado no es array, es: ' + typeof resultado);
      return [];
    }
    return resultado;
  } catch(e) {
    Logger.log('ERROR api_getEstudiantes: ' + e.message + '\n' + e.stack);
    throw new Error('Error al obtener estudiantes: ' + e.message);
  }
}

function api_crearEstudiante(datos) {
  try {
    return crearEstudiante(datos);
  } catch(e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

function api_actualizarEstudiante(datos) {
  try {
    return actualizarEstudiante(datos);
  } catch(e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

function api_eliminarEstudiante(id) {
  try {
    return eliminarEstudiante(id);
  } catch(e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

function api_importarEstudiantesBatch(datosBatch, facultad, tipoGrupo, grupo) {
  try {
    return importarEstudiantesBatch(datosBatch, facultad, tipoGrupo, grupo);
  } catch(e) {
    Logger.log('ERROR api_importarEstudiantesBatch: ' + e.message);
    return { success: false, message: e.message, importados: 0, errores: [e.message] };
  }
}

function api_registrarLogImportacion(logInfo) {
  try {
    return registrarLogImportacion(logInfo);
  } catch(e) {
    return { success: false };
  }
}

function api_getUsuarioSesion() {
  return getUsuarioSesion();
}

function api_getPerfilEstudiante(id) {
  return getPerfilEstudiante(id);
}

// --- ASISTENCIA ---

function api_registrarAsistencia(facultad, tipoGrupo, grupo, materia, docente, registros) {
  return registrarAsistencia(facultad, tipoGrupo, grupo, materia, docente, registros);
}

function api_getAsistencia(filtros) {
  return getAsistencia(filtros);
}

function api_verificarAsistenciaHoy(facultad, tipoGrupo, grupo, materia) {
  return verificarAsistenciaHoy(facultad, tipoGrupo, grupo, materia);
}

// --- CALIFICACIONES ---

function api_registrarCalificaciones(facultad, tipoGrupo, grupo, materia, tipoEval, descripcion, calMaxima, registros) {
  return registrarCalificaciones(facultad, tipoGrupo, grupo, materia, tipoEval, descripcion, calMaxima, registros);
}

function api_getCalificaciones(filtros) {
  return getCalificaciones(filtros);
}

// --- PRÁCTICAS ---

function api_crearPractica(facultad, tipoGrupo, grupo, materia, nombrePractica, fechaLimite) {
  return crearPractica(facultad, tipoGrupo, grupo, materia, nombrePractica, fechaLimite);
}

function api_actualizarPractica(idEstudiante, nombrePractica, estado, calificacion, linkArchivo, observacion) {
  return actualizarPractica(idEstudiante, nombrePractica, estado, calificacion, linkArchivo, observacion);
}

function api_actualizarPracticasLote(nombrePractica, materia, facultad, tipoGrupo, grupo, registros) {
  return actualizarPracticasLote(nombrePractica, materia, facultad, tipoGrupo, grupo, registros);
}

function api_getPracticas(filtros) {
  return getPracticas(filtros);
}

function api_getPracticasUnicas(filtros) {
  return getPracticasUnicas(filtros);
}

// --- UTILIDADES ---

function api_getFechaHoy() {
  return { fecha: getFechaHoy(), dia: getDiaHoy() };
}
