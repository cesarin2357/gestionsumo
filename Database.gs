/**
 * ============================================================
 * DATABASE.gs — Operaciones CRUD con Google Sheets
 * ============================================================
 * Todas las operaciones de lectura/escritura de datos
 * ============================================================
 */

// =============================================
// ESTUDIANTES
// =============================================

/**
 * Obtener todos los estudiantes (con filtros opcionales)
 */
function getEstudiantes(filtros) {
  var todos = sheetToObjects('Estudiantes');
  
  if (!filtros) return todos;
  
  return todos.filter(function(est) {
    if (filtros.facultad && est['Facultad'] !== filtros.facultad) return false;
    if (filtros.tipoGrupo && est['Tipo Grupo'] !== filtros.tipoGrupo) return false;
    if (filtros.grupo && est['Grupo'] !== filtros.grupo) return false;
    if (filtros.estado && est['Estado'] !== filtros.estado) return false;
    if (filtros.busqueda) {
      var busqueda = filtros.busqueda.toLowerCase();
      var nombre = (est['Nombre Completo'] || '').toLowerCase();
      var ci = (est['CI'] || est['ID'] || '').toString().toLowerCase();
      if (nombre.indexOf(busqueda) === -1 && ci.indexOf(busqueda) === -1) return false;
    }
    return true;
  });
}

/**
 * Obtener un estudiante por CI/ID
 */
function getEstudiantePorId(id) {
  var todos = sheetToObjects('Estudiantes');
  for (var i = 0; i < todos.length; i++) {
    if (todos[i]['CI'] === id || todos[i]['ID'] === id) return todos[i];
  }
  return null;
}

/**
 * Crear un nuevo estudiante
 */
function crearEstudiante(datos) {
  var sheet = getOrCreateSheet('Estudiantes');
  var ci = validarCampo(datos.ci || datos.id, 'CI').toString().trim();
  
  // Validar duplicado
  if (getEstudiantePorId(ci)) {
    return { success: false, message: 'Ya existe un estudiante registrado con el CI: ' + ci };
  }
  
  var nombre = validarCampo(datos.nombre, 'Nombre Completo');
  var facultad = validarCampo(datos.facultad, 'Facultad');
  var tipoGrupo = validarCampo(datos.tipoGrupo, 'Tipo de Grupo');
  var grupo = validarCampo(datos.grupo, 'Grupo');
  
  var fila = [
    ci,
    nombre,
    facultad,
    tipoGrupo,
    grupo,
    datos.estado || 'Activo',
    datos.telefono || '',
    datos.email || '',
    datos.padreOMadre || '',
    datos.telefonoPadre || '',
    getFechaHoy()
  ];
  
  sheet.appendRow(fila);
  
  return { 
    success: true, 
    message: 'Estudiante "' + nombre + '" registrado con CI: ' + ci,
    id: ci 
  };
}

/**
 * Actualizar un estudiante existente
 */
function actualizarEstudiante(datos) {
  var sheet = getOrCreateSheet('Estudiantes');
  var todos = sheetToObjects('Estudiantes');
  
  var encontrado = null;
  var targetId = datos.ci || datos.id;
  for (var i = 0; i < todos.length; i++) {
    if (todos[i]['CI'] === targetId || todos[i]['ID'] === targetId) {
      encontrado = todos[i];
      break;
    }
  }
  
  if (!encontrado) {
    return { success: false, message: 'Estudiante no encontrado: ' + targetId };
  }
  
  var rowIndex = encontrado._rowIndex;
  var fila = [
    targetId,
    datos.nombre || encontrado['Nombre Completo'],
    datos.facultad || encontrado['Facultad'],
    datos.tipoGrupo || encontrado['Tipo Grupo'],
    datos.grupo || encontrado['Grupo'],
    datos.estado || encontrado['Estado'],
    datos.telefono || encontrado['Teléfono'],
    datos.email || encontrado['Email'],
    datos.padreOMadre !== undefined ? datos.padreOMadre : encontrado['Padre o Madre'],
    datos.telefonoPadre !== undefined ? datos.telefonoPadre : encontrado['Teléfono Padre'],
    encontrado['Fecha Inscripción']
  ];
  
  sheet.getRange(rowIndex, 1, 1, fila.length).setValues([fila]);
  
  return { success: true, message: 'Estudiante actualizado correctamente' };
}

/**
 * Eliminar (desactivar) un estudiante
 */
function eliminarEstudiante(id) {
  return actualizarEstudiante({ id: id, estado: 'Inactivo' });
}

/**
 * Importar estudiantes desde Excel en Lotes (secuencial)
 */
function importarEstudiantesBatch(datosBatch, facultad, tipoGrupo, grupo) {
  var sheet = getOrCreateSheet('Estudiantes');
  var contador = 0;
  var errores = [];
  
  // Obtener CIs existentes para evitar duplicados en la base de datos
  var todos = sheetToObjects('Estudiantes');
  var cisExistentes = {};
  todos.forEach(function(est) {
    var ciVal = est['CI'] || est['ID'];
    if (ciVal) {
      cisExistentes[ciVal.toString().trim()] = true;
    }
  });
  
  datosBatch.forEach(function(fila, index) {
    try {
      var ci = validarCampo(fila.ci, 'CI').toString().trim();
      
      // Validar duplicados en la base de datos
      if (cisExistentes[ci]) {
        throw new Error('El estudiante con CI ' + ci + ' ya está registrado en el sistema.');
      }
      
      var nuevaFila = [
        ci,
        validarCampo(fila.nombreCompleto, 'Nombre Completo'),
        validarCampo(facultad, 'Facultad'),
        validarCampo(tipoGrupo, 'Tipo Grupo'),
        validarCampo(grupo, 'Grupo'),
        'Activo',
        fila.celular || '',
        fila.email || '',
        fila.padreOMadre || '',
        fila.celularPadre || '',
        fila.fechaInscripcion || getFechaHoy()
      ];
      
      sheet.appendRow(nuevaFila);
      cisExistentes[ci] = true; // Evitar duplicar en el mismo lote
      contador++;
    } catch (e) {
      errores.push('Fila ' + (fila.nro || (index + 1)) + ' (CI: ' + (fila.ci || 'S/N') + '): ' + e.message);
    }
  });
  
  return {
    success: true,
    importados: contador,
    errores: errores
  };
}

/**
 * Registrar el log de auditoría de importación
 */
function registrarLogImportacion(logInfo) {
  var sheet = getOrCreateSheet('LOG_IMPORTACIONES');
  
  var fecha = getFechaHoy();
  var hoy = new Date();
  var hora = ('0' + hoy.getHours()).slice(-2) + ':' + 
             ('0' + hoy.getMinutes()).slice(-2) + ':' + 
             ('0' + hoy.getSeconds()).slice(-2);
  
  var fila = [
    fecha,
    hora,
    logInfo.usuario || 'Desconocido',
    logInfo.archivo || 'N/A',
    logInfo.total || 0,
    logInfo.importados || 0,
    logInfo.errores || 0,
    logInfo.tiempo || 0,
    logInfo.estado || 'INCOMPLETO',
    logInfo.detalles || ''
  ];
  
  sheet.appendRow(fila);
  return { success: true };
}

/**
 * Obtener el email del usuario logueado en Google
 */
function getUsuarioSesion() {
  try {
    var email = Session.getActiveUser().getEmail();
    return { email: email || 'admin@instituto.edu' };
  } catch (e) {
    return { email: 'admin@instituto.edu' };
  }
}

// =============================================
// ASISTENCIA
// =============================================

/**
 * Registrar asistencia de un grupo completo
 * registros = [{ idEstudiante, nombre, estado, observacion }, ...]
 */
function registrarAsistencia(facultad, tipoGrupo, grupo, materia, docente, registros) {
  var sheet = getOrCreateSheet('Asistencia');
  var fecha = getFechaHoy();
  var dia = getDiaHoy();
  
  var filas = registros.map(function(reg) {
    return [
      fecha,
      dia,
      reg.idEstudiante,
      reg.nombre,
      facultad,
      tipoGrupo,
      grupo,
      materia,
      docente || '',
      reg.estado || 'Presente',
      reg.observacion || ''
    ];
  });
  
  if (filas.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
  }
  
  var presentes = registros.filter(function(r) { return r.estado === 'Presente'; }).length;
  var ausentes = registros.filter(function(r) { return r.estado === 'Ausente'; }).length;
  var tardanzas = registros.filter(function(r) { return r.estado === 'Tardanza'; }).length;
  
  return {
    success: true,
    message: 'Asistencia registrada: ' + presentes + ' presentes, ' + ausentes + ' ausentes, ' + tardanzas + ' tardanzas',
    resumen: { presentes: presentes, ausentes: ausentes, tardanzas: tardanzas, total: registros.length }
  };
}

/**
 * Obtener asistencia con filtros
 */
function getAsistencia(filtros) {
  var todos = sheetToObjects('Asistencia');
  
  if (!filtros) return todos;
  
  return todos.filter(function(reg) {
    if (filtros.fecha && reg['Fecha'] !== filtros.fecha) return false;
    if (filtros.facultad && reg['Facultad'] !== filtros.facultad) return false;
    if (filtros.tipoGrupo && reg['Tipo Grupo'] !== filtros.tipoGrupo) return false;
    if (filtros.grupo && reg['Grupo'] !== filtros.grupo) return false;
    if (filtros.materia && reg['Materia'] !== filtros.materia) return false;
    if (filtros.idEstudiante && reg['ID_Estudiante'] !== filtros.idEstudiante) return false;
    if (filtros.fechaDesde) {
      var fechaReg = new Date(reg['Fecha']);
      var desde = new Date(filtros.fechaDesde);
      if (fechaReg < desde) return false;
    }
    if (filtros.fechaHasta) {
      var fechaReg2 = new Date(reg['Fecha']);
      var hasta = new Date(filtros.fechaHasta);
      if (fechaReg2 > hasta) return false;
    }
    return true;
  });
}

/**
 * Verificar si ya se tomó asistencia hoy para un grupo/materia
 */
function verificarAsistenciaHoy(facultad, tipoGrupo, grupo, materia) {
  var registros = getAsistencia({
    fecha: getFechaHoy(),
    facultad: facultad,
    tipoGrupo: tipoGrupo,
    grupo: grupo,
    materia: materia
  });
  return registros.length > 0;
}

// =============================================
// DESEMPEÑO / CALIFICACIONES
// =============================================

/**
 * Registrar calificaciones de un grupo
 * registros = [{ idEstudiante, nombre, calificacion, observacion }, ...]
 */
function registrarCalificaciones(facultad, tipoGrupo, grupo, materia, tipoEval, descripcion, calMaxima, registros) {
  var sheet = getOrCreateSheet('Desempeño');
  var fecha = getFechaHoy();
  
  var filas = registros.map(function(reg) {
    return [
      fecha,
      reg.idEstudiante,
      reg.nombre,
      facultad,
      tipoGrupo,
      grupo,
      materia,
      tipoEval,
      descripcion || '',
      reg.calificacion || 0,
      calMaxima || 100,
      reg.observacion || ''
    ];
  });
  
  if (filas.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
  }
  
  return {
    success: true,
    message: 'Calificaciones registradas para ' + registros.length + ' estudiantes'
  };
}

/**
 * Obtener calificaciones con filtros
 */
function getCalificaciones(filtros) {
  var todos = sheetToObjects('Desempeño');
  
  if (!filtros) return todos;
  
  return todos.filter(function(reg) {
    if (filtros.facultad && reg['Facultad'] !== filtros.facultad) return false;
    if (filtros.tipoGrupo && reg['Tipo Grupo'] !== filtros.tipoGrupo) return false;
    if (filtros.grupo && reg['Grupo'] !== filtros.grupo) return false;
    if (filtros.materia && reg['Materia'] !== filtros.materia) return false;
    if (filtros.idEstudiante && reg['ID_Estudiante'] !== filtros.idEstudiante) return false;
    if (filtros.tipoEvaluacion && reg['Tipo Evaluación'] !== filtros.tipoEvaluacion) return false;
    return true;
  });
}

// =============================================
// PRÁCTICAS
// =============================================

/**
 * Crear una práctica para un grupo completo
 */
function crearPractica(facultad, tipoGrupo, grupo, materia, nombrePractica, fechaLimite) {
  var sheet = getOrCreateSheet('Prácticas');
  var estudiantes = getEstudiantes({
    facultad: facultad,
    tipoGrupo: tipoGrupo,
    grupo: grupo,
    estado: 'Activo'
  });
  
  var fecha = getFechaHoy();
  
  var filas = estudiantes.map(function(est) {
    return [
      fecha,
      fechaLimite || '',
      est['ID'],
      est['Nombre Completo'],
      facultad,
      tipoGrupo,
      grupo,
      materia,
      nombrePractica,
      'Pendiente',
      '',
      '',
      ''
    ];
  });
  
  if (filas.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
  }
  
  return {
    success: true,
    message: 'Práctica "' + nombrePractica + '" creada para ' + estudiantes.length + ' estudiantes'
  };
}

/**
 * Actualizar estado de práctica de un estudiante
 */
function actualizarPractica(idEstudiante, nombrePractica, estado, calificacion, linkArchivo, observacion) {
  var sheet = getOrCreateSheet('Prácticas');
  var todos = sheetToObjects('Prácticas');
  
  for (var i = 0; i < todos.length; i++) {
    if (todos[i]['ID_Estudiante'] === idEstudiante && todos[i]['Nombre Práctica'] === nombrePractica) {
      var rowIndex = todos[i]._rowIndex;
      if (estado) sheet.getRange(rowIndex, 10).setValue(estado);
      if (calificacion !== undefined && calificacion !== '') sheet.getRange(rowIndex, 11).setValue(calificacion);
      if (linkArchivo) sheet.getRange(rowIndex, 12).setValue(linkArchivo);
      if (observacion) sheet.getRange(rowIndex, 13).setValue(observacion);
      
      return { success: true, message: 'Práctica actualizada' };
    }
  }
  
  return { success: false, message: 'Registro de práctica no encontrado' };
}

/**
 * Actualizar prácticas en lote
 * registros = [{ idEstudiante, estado, calificacion, observacion }, ...]
 */
function actualizarPracticasLote(nombrePractica, materia, facultad, tipoGrupo, grupo, registros) {
  var sheet = getOrCreateSheet('Prácticas');
  var todos = sheetToObjects('Prácticas');
  var actualizados = 0;
  
  registros.forEach(function(reg) {
    for (var i = 0; i < todos.length; i++) {
      var r = todos[i];
      if (r['ID_Estudiante'] === reg.idEstudiante && 
          r['Nombre Práctica'] === nombrePractica &&
          r['Materia'] === materia &&
          r['Facultad'] === facultad) {
        var rowIndex = r._rowIndex;
        if (reg.estado) sheet.getRange(rowIndex, 10).setValue(reg.estado);
        if (reg.calificacion !== undefined && reg.calificacion !== '') sheet.getRange(rowIndex, 11).setValue(reg.calificacion);
        if (reg.observacion) sheet.getRange(rowIndex, 13).setValue(reg.observacion);
        actualizados++;
        break;
      }
    }
  });
  
  return {
    success: true,
    message: actualizados + ' prácticas actualizadas'
  };
}

/**
 * Obtener prácticas con filtros
 */
function getPracticas(filtros) {
  var todos = sheetToObjects('Prácticas');
  
  if (!filtros) return todos;
  
  return todos.filter(function(reg) {
    if (filtros.facultad && reg['Facultad'] !== filtros.facultad) return false;
    if (filtros.tipoGrupo && reg['Tipo Grupo'] !== filtros.tipoGrupo) return false;
    if (filtros.grupo && reg['Grupo'] !== filtros.grupo) return false;
    if (filtros.materia && reg['Materia'] !== filtros.materia) return false;
    if (filtros.idEstudiante && reg['ID_Estudiante'] !== filtros.idEstudiante) return false;
    if (filtros.nombrePractica && reg['Nombre Práctica'] !== filtros.nombrePractica) return false;
    if (filtros.estado && reg['Estado'] !== filtros.estado) return false;
    return true;
  });
}

/**
 * Obtener lista de prácticas únicas (sin duplicados por estudiante)
 */
function getPracticasUnicas(filtros) {
  var todas = getPracticas(filtros);
  var vistas = {};
  var unicas = [];
  
  todas.forEach(function(p) {
    var key = p['Nombre Práctica'] + '|' + p['Materia'] + '|' + p['Facultad'] + '|' + p['Tipo Grupo'] + '|' + p['Grupo'];
    if (!vistas[key]) {
      var mismas = todas.filter(function(x) {
        return x['Nombre Práctica'] === p['Nombre Práctica'] && 
               x['Materia'] === p['Materia'] &&
               x['Facultad'] === p['Facultad'] &&
               x['Tipo Grupo'] === p['Tipo Grupo'] &&
               x['Grupo'] === p['Grupo'];
      });
      var entregadas = mismas.filter(function(x) { return x['Estado'] === 'Entregada'; }).length;
      var pendientes = mismas.filter(function(x) { return x['Estado'] === 'Pendiente'; }).length;
      
      unicas.push({
        nombrePractica: p['Nombre Práctica'],
        materia: p['Materia'],
        facultad: p['Facultad'],
        tipoGrupo: p['Tipo Grupo'],
        grupo: p['Grupo'],
        fechaAsignacion: p['Fecha Asignación'],
        fechaLimite: p['Fecha Límite'],
        totalEstudiantes: mismas.length,
        entregadas: entregadas,
        pendientes: pendientes
      });
      vistas[key] = true;
    }
  });
  
  return unicas;
}

// =============================================
// DASHBOARD / ESTADÍSTICAS
// =============================================

/**
 * Obtener estadísticas del dashboard
 */
function getDashboardStats() {
  var estudiantes = getEstudiantes({ estado: 'Activo' });
  var asistenciaHoy = getAsistencia({ fecha: getFechaHoy() });
  
  // Conteos por facultad
  var porFacultad = {};
  getFacultadesActivas().forEach(function(f) {
    porFacultad[f.codigo] = {
      nombre: f.nombre,
      codigo: f.codigo,
      totalEstudiantes: 0,
      presentesHoy: 0,
      ausentesHoy: 0
    };
  });
  
  estudiantes.forEach(function(est) {
    if (porFacultad[est['Facultad']]) {
      porFacultad[est['Facultad']].totalEstudiantes++;
    }
  });
  
  asistenciaHoy.forEach(function(reg) {
    if (porFacultad[reg['Facultad']]) {
      if (reg['Estado'] === 'Presente') porFacultad[reg['Facultad']].presentesHoy++;
      if (reg['Estado'] === 'Ausente') porFacultad[reg['Facultad']].ausentesHoy++;
    }
  });
  
  // Prácticas pendientes
  var practicasPendientes = getPracticas({ estado: 'Pendiente' });
  
  // Resumen global
  var presentesTotal = asistenciaHoy.filter(function(r) { return r['Estado'] === 'Presente'; }).length;
  var ausentesTotal = asistenciaHoy.filter(function(r) { return r['Estado'] === 'Ausente'; }).length;
  var tardanzasTotal = asistenciaHoy.filter(function(r) { return r['Estado'] === 'Tardanza'; }).length;
  
  return {
    fechaHoy: getFechaHoy(),
    diaHoy: getDiaHoy(),
    totalEstudiantes: estudiantes.length,
    asistenciaHoy: {
      presentes: presentesTotal,
      ausentes: ausentesTotal,
      tardanzas: tardanzasTotal,
      totalRegistros: asistenciaHoy.length
    },
    practicasPendientes: practicasPendientes.length,
    porFacultad: porFacultad
  };
}

/**
 * Obtener perfil completo de un estudiante
 */
function getPerfilEstudiante(idEstudiante) {
  var estudiante = getEstudiantePorId(idEstudiante);
  if (!estudiante) return { success: false, message: 'Estudiante no encontrado' };
  
  var asistencia = getAsistencia({ idEstudiante: idEstudiante });
  var calificaciones = getCalificaciones({ idEstudiante: idEstudiante });
  var practicas = getPracticas({ idEstudiante: idEstudiante });
  
  // Calcular estadísticas de asistencia
  var totalClases = asistencia.length;
  var presentes = asistencia.filter(function(a) { return a['Estado'] === 'Presente'; }).length;
  var ausentes = asistencia.filter(function(a) { return a['Estado'] === 'Ausente'; }).length;
  var tardanzas = asistencia.filter(function(a) { return a['Estado'] === 'Tardanza'; }).length;
  
  // Calcular promedio de calificaciones
  var totalCal = 0;
  var countCal = 0;
  calificaciones.forEach(function(c) {
    var cal = parseFloat(c['Calificación']);
    var max = parseFloat(c['Cal. Máxima']) || 100;
    if (!isNaN(cal)) {
      totalCal += (cal / max) * 100;
      countCal++;
    }
  });
  var promedio = countCal > 0 ? Math.round(totalCal / countCal) : 0;
  
  return {
    success: true,
    estudiante: estudiante,
    asistencia: {
      registros: asistencia.slice(-30), // Últimos 30
      totalClases: totalClases,
      presentes: presentes,
      ausentes: ausentes,
      tardanzas: tardanzas,
      porcentaje: totalClases > 0 ? Math.round((presentes / totalClases) * 100) : 0
    },
    calificaciones: {
      registros: calificaciones,
      promedio: promedio
    },
    practicas: {
      registros: practicas,
      entregadas: practicas.filter(function(p) { return p['Estado'] === 'Entregada'; }).length,
      pendientes: practicas.filter(function(p) { return p['Estado'] === 'Pendiente'; }).length,
      total: practicas.length
    }
  };
}
