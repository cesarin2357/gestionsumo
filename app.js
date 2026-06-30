/**
 * ============================================================
 * JAVASCRIPT.html — Lógica del Cliente (Frontend)
 * ============================================================
 */

// =============================================
// ESTADO GLOBAL
// =============================================
var CONFIG = null;
var currentPage = 'dashboard';
var currentReportTab = 'asistencia';

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // Mostrar fecha actual
  actualizarFechaUI();
  
  // Detección de cuenta de Google de la sesión
  google.script.run
    .withSuccessHandler(function(res) {
      var emailEl = document.getElementById('userEmailText');
      if (emailEl) emailEl.textContent = res.email;
    })
    .api_getUsuarioSesion();
  
  // Cargar configuración del servidor
  google.script.run
    .withSuccessHandler(function(config) {
      CONFIG = config;
      poblarSelectsFacultad();
      cargarDashboard();
      // Inicializar el sistema (crear hojas si no existen)
      google.script.run.api_inicializar();
    })
    .withFailureHandler(function(err) {
      showToast('Error al cargar configuración: ' + err.message, 'error');
    })
    .api_getConfig();
});

function actualizarFechaUI() {
  var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var hoy = new Date();
  var texto = dias[hoy.getDay()] + ' ' + hoy.getDate() + ' de ' + meses[hoy.getMonth()] + ', ' + hoy.getFullYear();
  document.getElementById('currentDate').textContent = texto;
}

// =============================================
// NAVEGACIÓN
// =============================================
function navigateTo(page) {
  // Ocultar todas las páginas
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  
  // Mostrar la página seleccionada
  var pageEl = document.getElementById('page-' + page);
  var navEl = document.getElementById('nav-' + page);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  
  currentPage = page;
  
  // Actualizar título
  var titles = {
    'dashboard': 'Dashboard',
    'asistencia': 'Asistencia y Control',
    'calificaciones': 'Calificaciones',
    'practicas': 'Control de Prácticas',
    'estudiantes': 'Gestión de Estudiantes',
    'reportes': 'Reportes'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  
  // Cargar datos según la página
  if (page === 'dashboard') cargarDashboard();
  if (page === 'estudiantes') cargarEstudiantes();
  
  // Cerrar sidebar en móvil
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// =============================================
// POBLAR SELECTS DE FACULTAD (cascada)
// =============================================
function poblarSelectsFacultad() {
  if (!CONFIG) return;
  
  var selectIds = [
    'attFacultad', 'calFacultad', 'pracFacultad', 'estFacultad',
    'repFacultad', 'formEstFacultad', 'formPracFacultad', 'importFacultad'
  ];
  
  selectIds.forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    // Mantener primera opción
    var firstOpt = sel.options[0].outerHTML;
    sel.innerHTML = firstOpt;
    CONFIG.facultades.forEach(function(f) {
      var opt = document.createElement('option');
      opt.value = f.codigo;
      opt.textContent = f.codigo + ' — ' + f.nombre;
      sel.appendChild(opt);
    });
  });
  
  // Poblar tipos de evaluación
  var calTipoEval = document.getElementById('calTipoEval');
  if (calTipoEval && CONFIG.tiposEvaluacion) {
    CONFIG.tiposEvaluacion.forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      calTipoEval.appendChild(opt);
    });
  }
}

// Funciones cascada genéricas
function poblarTiposGrupo(selectId, codigoFacultad) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var firstOpt = sel.options[0].outerHTML;
  sel.innerHTML = firstOpt;
  
  if (!codigoFacultad || !CONFIG) return;
  
  var grupos = CONFIG.gruposPorFacultad[codigoFacultad] || [];
  var tipos = {};
  grupos.forEach(function(g) { tipos[g.tipo] = true; });
  
  Object.keys(tipos).forEach(function(tipo) {
    var opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = tipo;
    sel.appendChild(opt);
  });
}

function poblarGrupos(selectId, codigoFacultad, tipoGrupo) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var firstOpt = sel.options[0].outerHTML;
  sel.innerHTML = firstOpt;
  
  if (!codigoFacultad || !tipoGrupo || !CONFIG) return;
  
  var grupos = CONFIG.gruposPorFacultad[codigoFacultad] || [];
  grupos.filter(function(g) { return g.tipo === tipoGrupo; }).forEach(function(g) {
    var opt = document.createElement('option');
    opt.value = g.grupo;
    opt.textContent = g.grupo + ' (' + g.horaInicio + ' - ' + g.horaFin + ')';
    sel.appendChild(opt);
  });
}

function poblarMaterias(selectId, codigoFacultad) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var firstOpt = sel.options[0].outerHTML;
  sel.innerHTML = firstOpt;
  
  if (!codigoFacultad || !CONFIG) return;
  
  var materias = CONFIG.materiasPorFacultad[codigoFacultad] || [];
  materias.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m.materia;
    opt.textContent = m.materia;
    sel.appendChild(opt);
  });
}

// --- Cascada: Asistencia ---
function onAttFacultadChange() {
  var fac = document.getElementById('attFacultad').value;
  poblarTiposGrupo('attTipoGrupo', fac);
  poblarGrupos('attGrupo', fac, '');
  poblarMaterias('attMateria', fac);
}
function onAttTipoChange() {
  var fac = document.getElementById('attFacultad').value;
  var tipo = document.getElementById('attTipoGrupo').value;
  poblarGrupos('attGrupo', fac, tipo);
}
function onAttGrupoChange() {}

// --- Cascada: Calificaciones ---
function onCalFacultadChange() {
  var fac = document.getElementById('calFacultad').value;
  poblarTiposGrupo('calTipoGrupo', fac);
  poblarGrupos('calGrupo', fac, '');
  poblarMaterias('calMateria', fac);
}
function onCalTipoChange() {
  var fac = document.getElementById('calFacultad').value;
  var tipo = document.getElementById('calTipoGrupo').value;
  poblarGrupos('calGrupo', fac, tipo);
}
function onCalGrupoChange() {}

// --- Cascada: Prácticas ---
function onPracFacultadChange() {
  var fac = document.getElementById('pracFacultad').value;
  poblarTiposGrupo('pracTipoGrupo', fac);
  poblarGrupos('pracGrupo', fac, '');
}
function onPracTipoChange() {
  var fac = document.getElementById('pracFacultad').value;
  var tipo = document.getElementById('pracTipoGrupo').value;
  poblarGrupos('pracGrupo', fac, tipo);
}

// --- Cascada: Estudiantes ---
function onEstFacultadChange() {
  var fac = document.getElementById('estFacultad').value;
  poblarTiposGrupo('estTipoGrupo', fac);
  poblarGrupos('estGrupo', fac, '');
}
function onEstTipoChange() {
  var fac = document.getElementById('estFacultad').value;
  var tipo = document.getElementById('estTipoGrupo').value;
  poblarGrupos('estGrupo', fac, tipo);
}

// --- Cascada: Reportes ---
function onRepFacultadChange() {
  var fac = document.getElementById('repFacultad').value;
  poblarTiposGrupo('repTipoGrupo', fac);
  poblarGrupos('repGrupo', fac, '');
}
function onRepTipoChange() {
  var fac = document.getElementById('repFacultad').value;
  var tipo = document.getElementById('repTipoGrupo').value;
  poblarGrupos('repGrupo', fac, tipo);
}

// --- Cascada: Formulario Estudiante ---
function onFormEstFacultadChange() {
  var fac = document.getElementById('formEstFacultad').value;
  poblarTiposGrupo('formEstTipoGrupo', fac);
  poblarGrupos('formEstGrupo', fac, '');
}
function onFormEstTipoChange() {
  var fac = document.getElementById('formEstFacultad').value;
  var tipo = document.getElementById('formEstTipoGrupo').value;
  poblarGrupos('formEstGrupo', fac, tipo);
}

// --- Cascada: Formulario Práctica ---
function onFormPracFacultadChange() {
  var fac = document.getElementById('formPracFacultad').value;
  poblarTiposGrupo('formPracTipoGrupo', fac);
  poblarGrupos('formPracGrupo', fac, '');
  poblarMaterias('formPracMateria', fac);
}
function onFormPracTipoChange() {
  var fac = document.getElementById('formPracFacultad').value;
  var tipo = document.getElementById('formPracTipoGrupo').value;
  poblarGrupos('formPracGrupo', fac, tipo);
}

// --- Cascada: Importación ---
function onImportFacultadChange() {
  var fac = document.getElementById('importFacultad').value;
  poblarTiposGrupo('importTipoGrupo', fac);
  poblarGrupos('importGrupo', fac, '');
  updateImportButtonState();
}
function onImportTipoChange() {
  var fac = document.getElementById('importFacultad').value;
  var tipo = document.getElementById('importTipoGrupo').value;
  poblarGrupos('importGrupo', fac, tipo);
  updateImportButtonState();
}
function updateImportButtonState() {
  var fac = document.getElementById('importFacultad').value;
  var tipo = document.getElementById('importTipoGrupo').value;
  var grupo = document.getElementById('importGrupo').value;
  var fileInput = document.getElementById('csvFileInput');
  var fileSelected = fileInput && fileInput.files && fileInput.files.length > 0;
  
  var btn = document.getElementById('btnImportValidate');
  if (btn) {
    btn.disabled = !(fac && tipo && grupo && fileSelected);
  }
}

// =============================================
// DASHBOARD
// =============================================
function cargarDashboard() {
  google.script.run
    .withSuccessHandler(function(stats) {
      document.getElementById('statTotalEstudiantes').textContent = stats.totalEstudiantes;
      document.getElementById('statPresentes').textContent = stats.asistenciaHoy.presentes;
      document.getElementById('statAusentes').textContent = stats.asistenciaHoy.ausentes;
      document.getElementById('statPracticasPend').textContent = stats.practicasPendientes;
      
      // Tabla de facultades
      var tbody = document.getElementById('dashboardFacultades');
      tbody.innerHTML = '';
      
      if (stats.porFacultad) {
        Object.keys(stats.porFacultad).forEach(function(codigo) {
          var f = stats.porFacultad[codigo];
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td><strong>' + codigo + '</strong> — ' + f.nombre + '</td>' +
            '<td>' + f.totalEstudiantes + '</td>' +
            '<td><span class="badge badge-present">' + f.presentesHoy + '</span></td>' +
            '<td><span class="badge badge-absent">' + f.ausentesHoy + '</span></td>';
          tbody.appendChild(tr);
        });
      }
      
      if (Object.keys(stats.porFacultad).length === 0 || stats.totalEstudiantes === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:30px;color:var(--text-muted)">No hay estudiantes registrados aún. <a href="#" onclick="navigateTo(\'estudiantes\')" style="color:var(--accent-blue)">Agregar estudiantes</a></td></tr>';
      }
    })
    .withFailureHandler(function(err) {
      showToast('Error al cargar dashboard: ' + err.message, 'error');
    })
    .api_getDashboard();
}

// =============================================
// ASISTENCIA
// =============================================
function cargarListaAsistencia() {
  var facultad = document.getElementById('attFacultad').value;
  var tipoGrupo = document.getElementById('attTipoGrupo').value;
  var grupo = document.getElementById('attGrupo').value;
  var materia = document.getElementById('attMateria').value;
  
  if (!facultad || !tipoGrupo || !grupo || !materia) {
    showToast('Selecciona facultad, tipo, grupo y materia', 'warning');
    return;
  }
  
  var container = document.getElementById('attendanceContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando lista...</div>';
  
  // Verificar si ya se tomó asistencia
  google.script.run
    .withSuccessHandler(function(yaTomada) {
      if (yaTomada) {
        container.innerHTML = 
          '<div class="card" style="text-align:center; padding:40px;">' +
          '<span class="material-icons" style="font-size:48px;color:var(--accent-green);margin-bottom:12px;">check_circle</span>' +
          '<h3 style="margin-bottom:8px;">Asistencia ya registrada</h3>' +
          '<p style="color:var(--text-secondary);">La asistencia de ' + materia + ' para ' + facultad + ' ' + tipoGrupo + ' ' + grupo + ' ya fue tomada hoy.</p>' +
          '<button class="btn btn-outline mt-4" onclick="forzarCargarAsistencia()">Registrar de nuevo</button>' +
          '</div>';
        return;
      }
      forzarCargarAsistencia();
    })
    .api_verificarAsistenciaHoy(facultad, tipoGrupo, grupo, materia);
}

function forzarCargarAsistencia() {
  var facultad = document.getElementById('attFacultad').value;
  var tipoGrupo = document.getElementById('attTipoGrupo').value;
  var grupo = document.getElementById('attGrupo').value;
  var materia = document.getElementById('attMateria').value;
  var container = document.getElementById('attendanceContainer');
  
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando estudiantes...</div>';
  
  google.script.run
    .withSuccessHandler(function(estudiantes) {
      try {
        if (!estudiantes) {
          container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>El servidor retornó un valor vacío (null/undefined).</p></div>';
          return;
        }
        if (!Array.isArray(estudiantes)) {
          container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Los datos retornados no son una lista válida.</p></div>';
          return;
        }
        
        if (estudiantes.length === 0) {
          container.innerHTML = 
            '<div class="empty-state">' +
            '<span class="material-icons">people_outline</span>' +
            '<h3>No hay estudiantes en este grupo</h3>' +
            '<p>Agrega estudiantes a ' + facultad + ' ' + tipoGrupo + ' ' + grupo + '</p>' +
            '</div>';
          return;
        }
        
        var html = '<div class="card">' +
          '<div class="card-header">' +
          '<div class="card-title"><span class="material-icons">fact_check</span> ' + 
          materia + ' — ' + facultad + ' ' + tipoGrupo + ' ' + grupo + 
          ' (' + estudiantes.length + ' estudiantes)</div>' +
          '</div>' +
          '<div class="attendance-list">';
        
        estudiantes.forEach(function(est, i) {
          var estId = est['CI'] || est['ID'] || 'S/N';
          var estNombre = est['Nombre Completo'] || 'Estudiante';
          var telPadre = est['Teléfono Padre'] || '';
          var padre = est['Padre o Madre'] || '';
          
          html += '<div class="attendance-row" id="att-row-' + i + '" data-tel-padre="' + telPadre + '" data-padre="' + padre + '">' +
            '<div class="student-number">' + (i + 1) + '</div>' +
            '<div class="student-name">' + estNombre + 
            '<span class="student-id">' + estId + '</span></div>' +
            '<input type="hidden" class="att-id" value="' + estId + '">' +
            '<input type="hidden" class="att-nombre" value="' + estNombre + '">' +
            '<div class="attendance-btns">' +
            '<button class="att-btn selected-present" onclick="setAttendance(' + i + ',\'Presente\')" title="Presente">✓</button>' +
            '<button class="att-btn" onclick="setAttendance(' + i + ',\'Ausente\')" title="Ausente">✗</button>' +
            '<button class="att-btn" onclick="setAttendance(' + i + ',\'Tardanza\')" title="Tardanza">⏰</button>' +
            '<button class="att-btn" onclick="setAttendance(' + i + ',\'Justificado\')" title="Justificado">📋</button>' +
            '</div>' +
            '<div class="wa-btn-container" id="wa-container-' + i + '" style="display:inline-flex; align-items:center; justify-content:center; width:40px; margin:0 8px;"></div>' +
            '<input type="text" class="obs-input att-obs" placeholder="Obs." value="">' +
            '</div>';
        });
        
        html += '</div>' +
          '<div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="btn btn-outline" onclick="marcarTodosPresentes()"><span class="material-icons">done_all</span> Todos Presente</button>' +
          '<button class="btn btn-success btn-lg" onclick="guardarAsistencia()" id="btnGuardarAtt">' +
          '<span class="material-icons">save</span> Guardar Asistencia</button>' +
          '</div></div>';
        
        container.innerHTML = html;
      } catch (err) {
        showToast('Error en renderizado: ' + err.message, 'error');
        container.innerHTML = '<div class="empty-state"><h3>Error de Renderizado</h3><p>' + err.message + '</p><pre style="text-align:left; font-size:11px; margin-top:10px; max-height:200px; overflow:auto; padding:10px; background:var(--bg-secondary); border-radius:6px;">' + err.stack + '</pre></div>';
      }
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="empty-state"><h3>Error en Servidor</h3><p>' + err.message + '</p></div>';
    })
    .api_getEstudiantes({ facultad: facultad, tipoGrupo: tipoGrupo, grupo: grupo, estado: 'Activo' });
}

function setAttendance(index, estado) {
  var row = document.getElementById('att-row-' + index);
  if (!row) return;
  
  var btns = row.querySelectorAll('.att-btn');
  btns.forEach(function(btn) {
    btn.className = 'att-btn';
  });
  
  var classes = {
    'Presente': 'selected-present',
    'Ausente': 'selected-absent',
    'Tardanza': 'selected-late',
    'Justificado': 'selected-justified'
  };
  
  var estados = ['Presente', 'Ausente', 'Tardanza', 'Justificado'];
  var idx = estados.indexOf(estado);
  if (idx >= 0 && btns[idx]) {
    btns[idx].classList.add(classes[estado]);
  }
  
  row.dataset.estado = estado;

  // Lógica del botón de alertas de WhatsApp
  var waContainer = document.getElementById('wa-container-' + index);
  if (waContainer) {
    if (estado === 'Ausente' || estado === 'Tardanza') {
      var tel = row.dataset.telPadre || '';
      if (tel) {
        waContainer.innerHTML = '<button class="btn-whatsapp" onclick="enviarAlertaWhatsApp(' + index + ', \'' + estado + '\')" title="Enviar alerta por WhatsApp"><span class="material-icons">chat</span></button>';
      } else {
        waContainer.innerHTML = '<span class="material-icons" style="font-size:16px;color:var(--text-muted);" title="Sin celular de padre/madre">chat_disabled</span>';
      }
    } else {
      waContainer.innerHTML = '';
    }
  }
}

function enviarAlertaWhatsApp(index, estado) {
  var row = document.getElementById('att-row-' + index);
  if (!row) return;
  
  var nombre = row.querySelector('.att-nombre').value;
  var padre = row.dataset.padre || 'Padre/Madre de familia';
  var tel = row.dataset.telPadre || '';
  var materia = document.getElementById('attMateria').value;
  var grupoSel = document.getElementById('attGrupo');
  var grupoText = grupoSel.options[grupoSel.selectedIndex].text;
  var fac = document.getElementById('attFacultad').value;
  
  if (!tel) {
    showToast('No se tiene registrado el teléfono del padre.', 'warning');
    return;
  }
  
  var estadoTxt = (estado === 'Ausente') ? 'FALTA (Ausente)' : 'TARDANZA';
  var fechaHoy = document.getElementById('currentDate').textContent;
  
  var mensaje = "Estimado/a " + padre + ",\n\nLe comunicamos que el estudiante *" + nombre + "* del área de *" + fac + "* registró *" + estadoTxt + "* en la materia *" + materia + "* (" + grupoText + ") el día de hoy, " + fechaHoy + ".\n\nAtentamente,\nDirección Académica";
  
  // Asegurar formato correcto del celular (eliminar espacios y validar +591)
  tel = tel.replace(/\s+/g, '');
  if (!tel.startsWith('+')) {
    tel = '+' + tel;
  }
  
  var link = "https://api.whatsapp.com/send?phone=" + encodeURIComponent(tel) + "&text=" + encodeURIComponent(mensaje);
  window.open(link, '_blank');
}

function marcarTodosPresentes() {
  var rows = document.querySelectorAll('.attendance-row');
  rows.forEach(function(row, i) {
    setAttendance(i, 'Presente');
  });
  showToast('Todos marcados como presentes', 'info');
}

function guardarAsistencia() {
  var facultad = document.getElementById('attFacultad').value;
  var tipoGrupo = document.getElementById('attTipoGrupo').value;
  var grupo = document.getElementById('attGrupo').value;
  var materia = document.getElementById('attMateria').value;
  
  var rows = document.querySelectorAll('.attendance-row');
  var registros = [];
  
  rows.forEach(function(row, i) {
    var btns = row.querySelectorAll('.att-btn');
    var estado = 'Presente';
    if (btns[0].classList.contains('selected-present')) estado = 'Presente';
    else if (btns[1].classList.contains('selected-absent')) estado = 'Ausente';
    else if (btns[2].classList.contains('selected-late')) estado = 'Tardanza';
    else if (btns[3].classList.contains('selected-justified')) estado = 'Justificado';
    
    registros.push({
      idEstudiante: row.querySelector('.att-id').value,
      nombre: row.querySelector('.att-nombre').value,
      estado: estado,
      observacion: row.querySelector('.att-obs').value
    });
  });
  
  var btn = document.getElementById('btnGuardarAtt');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;"></div> Guardando...';
  
  google.script.run
    .withSuccessHandler(function(result) {
      showToast(result.message, 'success');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-icons">save</span> Guardar Asistencia';
      // Mostrar resumen
      var container = document.getElementById('attendanceContainer');
      container.innerHTML = 
        '<div class="card" style="text-align:center; padding:40px;">' +
        '<span class="material-icons" style="font-size:64px;color:var(--accent-green);margin-bottom:16px;">check_circle</span>' +
        '<h3 style="margin-bottom:8px;">¡Asistencia Guardada!</h3>' +
        '<p style="color:var(--text-secondary); margin-bottom:20px;">' + result.message + '</p>' +
        '<div class="stats-grid" style="max-width:500px;margin:0 auto;">' +
        '<div class="stat-card green"><div class="stat-value">' + result.resumen.presentes + '</div><div class="stat-label">Presentes</div></div>' +
        '<div class="stat-card red"><div class="stat-value">' + result.resumen.ausentes + '</div><div class="stat-label">Ausentes</div></div>' +
        '<div class="stat-card amber"><div class="stat-value">' + result.resumen.tardanzas + '</div><div class="stat-label">Tardanzas</div></div>' +
        '</div></div>';
    })
    .withFailureHandler(function(err) {
      showToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-icons">save</span> Guardar Asistencia';
    })
    .api_registrarAsistencia(facultad, tipoGrupo, grupo, materia, document.getElementById('userEmailText').textContent || '', registros);
}

// =============================================
// CALIFICACIONES
// =============================================
function cargarListaCalificaciones() {
  var facultad = document.getElementById('calFacultad').value;
  var tipoGrupo = document.getElementById('calTipoGrupo').value;
  var grupo = document.getElementById('calGrupo').value;
  var materia = document.getElementById('calMateria').value;
  var tipoEval = document.getElementById('calTipoEval').value;
  var descripcion = document.getElementById('calDescripcion').value;
  var calMaxima = document.getElementById('calMaxima').value || 100;
  
  if (!facultad || !tipoGrupo || !grupo || !materia || !tipoEval) {
    showToast('Completa todos los filtros', 'warning');
    return;
  }
  
  var container = document.getElementById('gradesContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando lista...</div>';
  
  google.script.run
    .withSuccessHandler(function(estudiantes) {
      if (estudiantes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay estudiantes</h3></div>';
        return;
      }
      
      var html = '<div class="card">' +
        '<div class="card-header">' +
        '<div class="card-title"><span class="material-icons">grade</span> ' +
        tipoEval + ': ' + (descripcion || materia) + ' — ' + facultad + ' ' + tipoGrupo + ' ' + grupo +
        '</div></div>' +
        '<div class="table-container"><table><thead><tr>' +
        '<th>#</th><th>Estudiante</th><th>ID</th><th>Calificación (/' + calMaxima + ')</th><th>Observación</th>' +
        '</tr></thead><tbody>';
      
      estudiantes.forEach(function(est, i) {
        html += '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + est['Nombre Completo'] + '</td>' +
          '<td style="color:var(--text-muted)">' + est['ID'] + '</td>' +
          '<td><input type="number" class="grade-input cal-nota" min="0" max="' + calMaxima + '" value="" ' +
          'data-id="' + est['ID'] + '" data-nombre="' + est['Nombre Completo'] + '"></td>' +
          '<td><input type="text" class="obs-input cal-obs" placeholder="—" data-id="' + est['ID'] + '"></td>' +
          '</tr>';
      });
      
      html += '</tbody></table></div>' +
        '<div style="margin-top:20px; display:flex; justify-content:flex-end;">' +
        '<button class="btn btn-success btn-lg" onclick="guardarCalificaciones()">' +
        '<span class="material-icons">save</span> Guardar Calificaciones</button>' +
        '</div></div>';
      
      container.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
    })
    .api_getEstudiantes({ facultad: facultad, tipoGrupo: tipoGrupo, grupo: grupo, estado: 'Activo' });
}

function guardarCalificaciones() {
  var facultad = document.getElementById('calFacultad').value;
  var tipoGrupo = document.getElementById('calTipoGrupo').value;
  var grupo = document.getElementById('calGrupo').value;
  var materia = document.getElementById('calMateria').value;
  var tipoEval = document.getElementById('calTipoEval').value;
  var descripcion = document.getElementById('calDescripcion').value;
  var calMaxima = parseInt(document.getElementById('calMaxima').value) || 100;
  
  var inputs = document.querySelectorAll('.cal-nota');
  var registros = [];
  
  inputs.forEach(function(input) {
    var cal = input.value;
    if (cal !== '' && !isNaN(cal)) {
      var id = input.dataset.id;
      var obsInput = document.querySelector('.cal-obs[data-id="' + id + '"]');
      registros.push({
        idEstudiante: id,
        nombre: input.dataset.nombre,
        calificacion: parseFloat(cal),
        observacion: obsInput ? obsInput.value : ''
      });
    }
  });
  
  if (registros.length === 0) {
    showToast('Ingresa al menos una calificación', 'warning');
    return;
  }
  
  google.script.run
    .withSuccessHandler(function(result) {
      showToast(result.message, 'success');
    })
    .withFailureHandler(function(err) {
      showToast('Error: ' + err.message, 'error');
    })
    .api_registrarCalificaciones(facultad, tipoGrupo, grupo, materia, tipoEval, descripcion, calMaxima, registros);
}

// =============================================
// PRÁCTICAS
// =============================================
function abrirModalPractica() {
  document.getElementById('formPracNombre').value = '';
  document.getElementById('formPracFechaLimite').value = '';
  abrirModal('modalPractica');
}

function guardarPractica() {
  var facultad = document.getElementById('formPracFacultad').value;
  var tipoGrupo = document.getElementById('formPracTipoGrupo').value;
  var grupo = document.getElementById('formPracGrupo').value;
  var materia = document.getElementById('formPracMateria').value;
  var nombre = document.getElementById('formPracNombre').value;
  var fechaLimite = document.getElementById('formPracFechaLimite').value;
  
  if (!facultad || !tipoGrupo || !grupo || !materia || !nombre) {
    showToast('Completa todos los campos obligatorios', 'warning');
    return;
  }
  
  google.script.run
    .withSuccessHandler(function(result) {
      showToast(result.message, 'success');
      cerrarModal('modalPractica');
      cargarPracticas();
    })
    .withFailureHandler(function(err) {
      showToast('Error: ' + err.message, 'error');
    })
    .api_crearPractica(facultad, tipoGrupo, grupo, materia, nombre, fechaLimite);
}

function cargarPracticas() {
  var filtros = {};
  var fac = document.getElementById('pracFacultad').value;
  var tipo = document.getElementById('pracTipoGrupo').value;
  var grupo = document.getElementById('pracGrupo').value;
  if (fac) filtros.facultad = fac;
  if (tipo) filtros.tipoGrupo = tipo;
  if (grupo) filtros.grupo = grupo;
  
  var container = document.getElementById('practicasContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando prácticas...</div>';
  
  google.script.run
    .withSuccessHandler(function(practicas) {
      if (practicas.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons">assignment</span><h3>No hay prácticas</h3><p>Crea una nueva práctica</p></div>';
        return;
      }
      
      var html = '<div class="table-container"><table><thead><tr>' +
        '<th>Práctica</th><th>Materia</th><th>Facultad</th><th>Tipo</th><th>Grupo</th>' +
        '<th>Entregadas</th><th>Pendientes</th><th>Acciones</th>' +
        '</tr></thead><tbody>';
      
      practicas.forEach(function(p) {
        var pctEntregadas = p.totalEstudiantes > 0 ? Math.round((p.entregadas / p.totalEstudiantes) * 100) : 0;
        html += '<tr>' +
          '<td><strong>' + p.nombrePractica + '</strong></td>' +
          '<td>' + p.materia + '</td>' +
          '<td>' + p.facultad + '</td>' +
          '<td>' + p.tipoGrupo + '</td>' +
          '<td>' + p.grupo + '</td>' +
          '<td><span class="badge badge-delivered">' + p.entregadas + '/' + p.totalEstudiantes + ' (' + pctEntregadas + '%)</span></td>' +
          '<td><span class="badge badge-pending">' + p.pendientes + '</span></td>' +
          '<td><button class="btn btn-sm btn-outline" onclick="verDetallePractica(\'' + 
          encodeURIComponent(p.nombrePractica) + '\',\'' + p.materia + '\',\'' + p.facultad + '\',\'' + p.tipoGrupo + '\',\'' + p.grupo + '\')">Ver</button></td>' +
          '</tr>';
      });
      
      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
    })
    .api_getPracticasUnicas(filtros);
}

function verDetallePractica(nombreEncoded, materia, facultad, tipoGrupo, grupo) {
  var nombre = decodeURIComponent(nombreEncoded);
  document.getElementById('detPracTitulo').textContent = nombre;
  abrirModal('modalDetallePractica');
  
  var content = document.getElementById('detallePracticaContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
  
  google.script.run
    .withSuccessHandler(function(registros) {
      var html = '<div class="table-container"><table><thead><tr>' +
        '<th>#</th><th>Estudiante</th><th>Estado</th><th>Calificación</th><th>Observación</th>' +
        '</tr></thead><tbody>';
      
      registros.forEach(function(r, i) {
        var badgeClass = r['Estado'] === 'Entregada' ? 'badge-delivered' : 
                         r['Estado'] === 'Pendiente' ? 'badge-pending' : 'badge-absent';
        html += '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + r['Nombre'] + ' <span style="color:var(--text-muted)">' + r['ID_Estudiante'] + '</span></td>' +
          '<td><select class="det-prac-estado" data-id="' + r['ID_Estudiante'] + '" style="width:130px">' +
          '<option ' + (r['Estado'] === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
          '<option ' + (r['Estado'] === 'Entregada' ? 'selected' : '') + '>Entregada</option>' +
          '<option ' + (r['Estado'] === 'Tardía' ? 'selected' : '') + '>Tardía</option>' +
          '<option ' + (r['Estado'] === 'No Entregada' ? 'selected' : '') + '>No Entregada</option>' +
          '</select></td>' +
          '<td><input type="number" class="grade-input det-prac-cal" data-id="' + r['ID_Estudiante'] + '" value="' + (r['Calificación'] || '') + '" min="0" max="100"></td>' +
          '<td><input type="text" class="obs-input det-prac-obs" data-id="' + r['ID_Estudiante'] + '" value="' + (r['Observación'] || '') + '"></td>' +
          '</tr>';
      });
      
      html += '</tbody></table></div>';
      content.innerHTML = html;
      
      // Guardar referencia para la función guardar
      content.dataset.nombrePractica = nombre;
      content.dataset.materia = materia;
      content.dataset.facultad = facultad;
      content.dataset.tipoGrupo = tipoGrupo;
      content.dataset.grupo = grupo;
    })
    .withFailureHandler(function(err) {
      content.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
    })
    .api_getPracticas({ nombrePractica: nombre, materia: materia, facultad: facultad, tipoGrupo: tipoGrupo, grupo: grupo });
}

function guardarDetallePractica() {
  var content = document.getElementById('detallePracticaContent');
  var nombre = content.dataset.nombrePractica;
  var materia = content.dataset.materia;
  var facultad = content.dataset.facultad;
  var tipoGrupo = content.dataset.tipoGrupo;
  var grupo = content.dataset.grupo;
  
  var estados = document.querySelectorAll('.det-prac-estado');
  var registros = [];
  
  estados.forEach(function(sel) {
    var id = sel.dataset.id;
    var calInput = document.querySelector('.det-prac-cal[data-id="' + id + '"]');
    var obsInput = document.querySelector('.det-prac-obs[data-id="' + id + '"]');
    registros.push({
      idEstudiante: id,
      estado: sel.value,
      calificacion: calInput ? calInput.value : '',
      observacion: obsInput ? obsInput.value : ''
    });
  });
  
  google.script.run
    .withSuccessHandler(function(result) {
      showToast(result.message, 'success');
      cerrarModal('modalDetallePractica');
      cargarPracticas();
    })
    .withFailureHandler(function(err) {
      showToast('Error: ' + err.message, 'error');
    })
    .api_actualizarPracticasLote(nombre, materia, facultad, tipoGrupo, grupo, registros);
}

// =============================================
// ESTUDIANTES
// =============================================
function cargarEstudiantes() {
  var filtros = {};
  var fac = document.getElementById('estFacultad').value;
  var tipo = document.getElementById('estTipoGrupo').value;
  var grupo = document.getElementById('estGrupo').value;
  var estado = document.getElementById('estEstado').value;
  var busqueda = document.getElementById('estBusqueda').value;
  
  if (fac) filtros.facultad = fac;
  if (tipo) filtros.tipoGrupo = tipo;
  if (grupo) filtros.grupo = grupo;
  if (estado) filtros.estado = estado;
  if (busqueda) filtros.busqueda = busqueda;
  
  var container = document.getElementById('estudiantesContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando estudiantes...</div>';
  
  google.script.run
    .withSuccessHandler(function(estudiantes) {
      try {
        if (!estudiantes) {
          container.innerHTML = '<div class="empty-state"><h3>Error del Servidor</h3><p>El servidor retornó un valor vacío. Revisa los permisos del script o ejecuta <strong>inicializarSistema()</strong> desde el editor de Apps Script.</p></div>';
          return;
        }
        if (!Array.isArray(estudiantes)) {
          container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Los datos retornados no son una lista válida. Tipo recibido: ' + typeof estudiantes + '</p></div>';
          return;
        }
        
        if (estudiantes.length === 0) {
          container.innerHTML = '<div class="empty-state"><span class="material-icons">people_outline</span><h3>No se encontraron estudiantes</h3><p>Agrega un nuevo estudiante o ajusta los filtros</p></div>';
          return;
        }
        
        var html = '<div class="card mb-4" style="padding:12px 16px;"><span style="color:var(--text-secondary);font-size:14px;">' + estudiantes.length + ' estudiantes encontrados</span></div>' +
          '<div class="table-container"><table><thead><tr>' +
          '<th>ID / CI</th><th>Nombre</th><th>Facultad</th><th>Tipo</th><th>Grupo</th><th>Estado</th><th>Acciones</th>' +
          '</tr></thead><tbody>';
        
        estudiantes.forEach(function(est) {
          var badgeClass = est['Estado'] === 'Activo' ? 'badge-active' : 'badge-inactive';
          var estId = est['CI'] || est['ID'] || 'S/ID';
          var estNombre = est['Nombre Completo'] || 'Sin Nombre';
          
          html += '<tr>' +
            '<td style="color:var(--text-muted);font-size:12px;">' + estId + '</td>' +
            '<td><strong>' + estNombre + '</strong></td>' +
            '<td>' + (est['Facultad'] || '') + '</td>' +
            '<td>' + (est['Tipo Grupo'] || est['Tipo_Grupo'] || '') + '</td>' +
            '<td>' + (est['Grupo'] || '') + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + (est['Estado'] || 'Activo') + '</span></td>' +
            '<td class="flex gap-2">' +
            '<button class="btn btn-sm btn-outline" onclick="verPerfilEstudiante(\'' + estId + '\')"><span class="material-icons" style="font-size:16px">person</span></button>' +
            '<button class="btn btn-sm btn-outline" onclick="editarEstudiante(\'' + estId + '\')"><span class="material-icons" style="font-size:16px">edit</span></button>' +
            '</td></tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
      } catch (err) {
        showToast('Error en renderizado: ' + err.message, 'error');
        container.innerHTML = '<div class="empty-state"><h3>Error de Renderizado</h3><p>' + err.message + '</p><pre style="text-align:left; font-size:11px; margin-top:10px; max-height:200px; overflow:auto; padding:10px; background:var(--bg-secondary); border-radius:6px;">' + err.stack + '</pre></div>';
      }
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="empty-state"><h3>Error en Servidor</h3><p style="color:var(--accent-red);font-weight:600;">' + err.message + '</p><p style="font-size:12px;color:var(--text-muted);margin-top:8px;">Verifica que el script tenga permisos de acceso a la hoja de cálculo.</p></div>';
    })
    .api_getEstudiantes(filtros);
}

var busquedaTimeout;
function buscarEstudiantes() {
  clearTimeout(busquedaTimeout);
  busquedaTimeout = setTimeout(function() {
    cargarEstudiantes();
  }, 500);
}

function abrirModalEstudiante() {
  document.getElementById('modalEstTitulo').textContent = 'Nuevo Estudiante';
  document.getElementById('formEstId').value = '';
  document.getElementById('formEstCi').value = '';
  document.getElementById('formEstCi').disabled = false;
  document.getElementById('formEstNombre').value = '';
  document.getElementById('formEstTelefono').value = '';
  document.getElementById('formEstEmail').value = '';
  document.getElementById('formEstPadreOMadre').value = '';
  document.getElementById('formEstTelefonoPadre').value = '';
  document.getElementById('formEstEstado').value = 'Activo';
  abrirModal('modalEstudiante');
}

function editarEstudiante(id) {
  google.script.run
    .withSuccessHandler(function(estArray) {
      if (!estArray || estArray.length === 0) { showToast('Estudiante no encontrado', 'error'); return; }
      var est = estArray[0];
      document.getElementById('modalEstTitulo').textContent = 'Editar Estudiante';
      document.getElementById('formEstId').value = est['CI'] || est['ID'];
      document.getElementById('formEstCi').value = est['CI'] || est['ID'];
      document.getElementById('formEstCi').disabled = true;
      document.getElementById('formEstNombre').value = est['Nombre Completo'] || '';
      document.getElementById('formEstFacultad').value = est['Facultad'] || '';
      onFormEstFacultadChange();
      setTimeout(function() {
        document.getElementById('formEstTipoGrupo').value = est['Tipo Grupo'] || '';
        onFormEstTipoChange();
        setTimeout(function() {
          document.getElementById('formEstGrupo').value = est['Grupo'] || '';
        }, 100);
      }, 100);
      document.getElementById('formEstEstado').value = est['Estado'] || 'Activo';
      document.getElementById('formEstTelefono').value = est['Teléfono'] || '';
      document.getElementById('formEstEmail').value = est['Email'] || '';
      document.getElementById('formEstPadreOMadre').value = est['Padre o Madre'] || '';
      document.getElementById('formEstTelefonoPadre').value = est['Teléfono Padre'] || '';
      abrirModal('modalEstudiante');
    })
    .api_getEstudiantes({ busqueda: id });
}

function guardarEstudiante() {
  var id = document.getElementById('formEstId').value;
  var ci = document.getElementById('formEstCi').value.trim();
  
  var datos = {
    ci: ci || id,
    nombre: document.getElementById('formEstNombre').value.trim(),
    facultad: document.getElementById('formEstFacultad').value,
    tipoGrupo: document.getElementById('formEstTipoGrupo').value,
    grupo: document.getElementById('formEstGrupo').value,
    estado: document.getElementById('formEstEstado').value,
    telefono: document.getElementById('formEstTelefono').value.trim(),
    email: document.getElementById('formEstEmail').value.trim(),
    padreOMadre: document.getElementById('formEstPadreOMadre').value.trim(),
    telefonoPadre: document.getElementById('formEstTelefonoPadre').value.trim()
  };
  
  if (!datos.ci) {
    showToast('El CI del estudiante es obligatorio.', 'warning');
    return;
  }
  if (!datos.nombre || !datos.facultad || !datos.tipoGrupo || !datos.grupo) {
    showToast('Completa los campos obligatorios (*).', 'warning');
    return;
  }
  if (!datos.telefonoPadre) {
    showToast('El celular del padre/madre es obligatorio.', 'warning');
    return;
  }
  
  // Validar formato celular padre
  var celPadre = datos.telefonoPadre.replace(/\s+/g, '');
  if (!celPadre.startsWith('+591')) {
    if (celPadre.length === 8 && /^\d+$/.test(celPadre)) {
      datos.telefonoPadre = '+591' + celPadre;
    } else {
      showToast('Celular del padre debe tener 8 dígitos y comenzar con +591.', 'warning');
      return;
    }
  } else {
    var cleanNum = celPadre.replace('+591', '');
    if (cleanNum.length !== 8 || !/^\d+$/.test(cleanNum)) {
      showToast('Número de celular de padre inválido (debe tener 8 dígitos después de +591).', 'warning');
      return;
    }
  }

  var btn = document.getElementById('btnGuardarEst');
  btn.disabled = true;
  
  if (id) {
    datos.id = id;
    google.script.run
      .withSuccessHandler(function(result) {
        btn.disabled = false;
        if (!result.success) {
          showToast(result.message, 'error');
          return;
        }
        showToast(result.message, 'success');
        cerrarModal('modalEstudiante');
        cargarEstudiantes();
      })
      .withFailureHandler(function(err) {
        showToast('Error: ' + err.message, 'error');
        btn.disabled = false;
      })
      .api_actualizarEstudiante(datos);
  } else {
    google.script.run
      .withSuccessHandler(function(result) {
        btn.disabled = false;
        if (!result.success) {
          showToast(result.message, 'error');
          return;
        }
        showToast(result.message, 'success');
        cerrarModal('modalEstudiante');
        cargarEstudiantes();
      })
      .withFailureHandler(function(err) {
        showToast('Error: ' + err.message, 'error');
        btn.disabled = false;
      })
      .api_crearEstudiante(datos);
  }
}

// VARIABLES DE ESTADO DEL IMPORTADOR WIZARD
var importedStudents = [];
var importValidationErrors = [];
var importFileName = "";
var isImportPaused = false;
var isImportCancelled = false;
var currentImportIndex = 0;
var importBatchSize = 100;
var importStartTime = null;
var parsedSheetData = null; // Guardar los datos leídos del Excel

function abrirModalImportar() {
  importedStudents = [];
  importValidationErrors = [];
  importFileName = "";
  parsedSheetData = null;
  
  document.getElementById('csvFileInput').value = '';
  document.getElementById('importFacultad').value = '';
  document.getElementById('importTipoGrupo').innerHTML = '<option value="">— Seleccionar —</option>';
  document.getElementById('importGrupo').innerHTML = '<option value="">— Seleccionar —</option>';
  
  var uploadText = document.getElementById('csvUploadText');
  uploadText.innerHTML = 'Arrastra tu archivo .xlsx aquí o <span style="color: var(--accent-blue); text-decoration: underline; font-weight: 500; cursor: pointer;">haz clic para buscar</span>';
  
  irAPaso1();
  abrirModal('modalImportar');
  setupDragAndDrop();
}

function setupDragAndDrop() {
  var dropZone = document.getElementById('csvDropZone');
  if (dropZone.dataset.dragSetup) return;
  dropZone.dataset.dragSetup = 'true';
  
  ['dragenter', 'dragover'].forEach(function(eventName) {
    dropZone.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(function(eventName) {
    dropZone.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });
  
  dropZone.addEventListener('drop', function(e) {
    var dt = e.dataTransfer;
    var files = dt.files;
    if (files.length > 0) {
      var file = files[0];
      if (file.name.endsWith('.xlsx')) {
        document.getElementById('csvFileInput').files = files;
        processExcelFile(file);
      } else {
        showToast('Por favor, selecciona un archivo Excel .xlsx válido', 'warning');
      }
    }
  }, false);
}

function handleCSVFileSelect(event) {
  var file = event.target.files[0];
  if (file) {
    processExcelFile(file);
  }
}

function normalizar(txt) {
  if (!txt) return "";
  return txt.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remover acentos
    .replace(/[^a-z0-9]/g, ""); // mantener alfanumérico
}

function capitalizarTexto(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function processExcelFile(file) {
  importFileName = file.name;
  var reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var workbook = XLSX.read(data, { type: 'array' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
      if (sheetData.length < 5) {
        showToast('El archivo Excel no tiene el número mínimo de filas requerido.', 'error');
        return;
      }
      
      parsedSheetData = sheetData;
      
      // Auto-detección
      var cellA1 = sheetData[0] ? sheetData[0][0] : "";
      var cellA2 = sheetData[1] ? sheetData[1][0] : "";
      var cellA3 = sheetData[2] ? sheetData[2][0] : "";
      
      detectarYSeleccionarMetadatos(cellA1, cellA2, cellA3);
      
      var linesCount = sheetData.length - 4; // Fila 5 en adelante son datos
      if (linesCount < 0) linesCount = 0;
      
      var uploadText = document.getElementById('csvUploadText');
      uploadText.innerHTML = '<span class="material-icons" style="font-size: 18px; color: var(--accent-green); vertical-align: middle; margin-right: 4px;">check_circle</span>' +
        'Archivo cargado: <strong>' + file.name + '</strong> (' + linesCount + ' registros de datos)';
      
      showToast('Archivo Excel leído correctamente', 'success');
      updateImportButtonState();
    } catch(err) {
      showToast('Error al procesar el archivo Excel: ' + err.message, 'error');
    }
  };
  
  reader.onerror = function() {
    showToast('Error al leer el archivo', 'error');
  };
  
  reader.readAsArrayBuffer(file);
}

function detectarYSeleccionarMetadatos(A1, A2, A3) {
  if (!A1 || !CONFIG) return;
  
  var normA1 = normalizar(A1);
  var matchedFac = null;
  
  // Buscar coincidencia de Facultad
  CONFIG.facultades.forEach(function(f) {
    var normFac = normalizar(f.nombre);
    var normCod = normalizar(f.codigo);
    if (normA1.includes(normFac) || normA1.includes(normCod) || normFac.includes(normA1)) {
      matchedFac = f.codigo;
    }
  });
  
  if (matchedFac) {
    document.getElementById('importFacultad').value = matchedFac;
    poblarTiposGrupo('importTipoGrupo', matchedFac);
    
    var normA2 = normalizar(A2);
    var matchedTipo = null;
    var grupos = CONFIG.gruposPorFacultad[matchedFac] || [];
    var tiposVistos = {};
    grupos.forEach(function(g) { tiposVistos[g.tipo] = true; });
    
    Object.keys(tiposVistos).forEach(function(tipo) {
      var normTipo = normalizar(tipo);
      if (normA2.includes(normTipo) || normTipo.includes(normA2)) {
        matchedTipo = tipo;
      }
    });
    
    if (matchedTipo) {
      document.getElementById('importTipoGrupo').value = matchedTipo;
      poblarGrupos('importGrupo', matchedFac, matchedTipo);
      
      var cellA3Text = A3 ? A3.toString().toUpperCase() : "";
      var matchedGrupo = null;
      
      grupos.filter(function(g) { return g.tipo === matchedTipo; }).forEach(function(g) {
        if (cellA3Text.includes(g.grupo.toUpperCase())) {
          matchedGrupo = g.grupo;
        }
      });
      
      if (matchedGrupo) {
        document.getElementById('importGrupo').value = matchedGrupo;
        showToast('Auto-detección exitosa de Facultad, Tipo y Grupo', 'success');
      }
    }
  }
}

function irAPaso1() {
  document.getElementById('importStep1').style.display = 'block';
  document.getElementById('importStep2').style.display = 'none';
  document.getElementById('importStep3').style.display = 'none';
  document.getElementById('importStep4').style.display = 'none';
  
  document.getElementById('btnImportCancel').style.display = 'inline-block';
  document.getElementById('btnImportValidate').style.display = 'inline-block';
  document.getElementById('btnImportBack').style.display = 'none';
  document.getElementById('btnImportProceed').style.display = 'none';
  
  updateImportButtonState();
}

function validarYPasarPaso2() {
  if (!parsedSheetData) {
    showToast('No hay datos cargados', 'warning');
    return;
  }
  
  var fac = document.getElementById('importFacultad').value;
  var tipo = document.getElementById('importTipoGrupo').value;
  var grupo = document.getElementById('importGrupo').value;
  
  if (!fac || !tipo || !grupo) {
    showToast('Selecciona la Facultad, Tipo de Grupo y Grupo de destino', 'warning');
    return;
  }
  
  importedStudents = [];
  importValidationErrors = [];
  
  var headers = parsedSheetData[3] || [];
  var colMap = {};
  headers.forEach(function(h, idx) {
    if (!h) return;
    var norm = normalizar(h.toString());
    if (norm === "ci") colMap.ci = idx;
    else if (norm === "nro" || norm === "no" || norm === "num") colMap.nro = idx;
    else if (norm === "nombre" || norm === "nombres") colMap.nombre = idx;
    else if (norm === "primerapellido" || norm === "apellido1" || norm === "papellid") colMap.primerApellido = idx;
    else if (norm === "segundoapellido" || norm === "apellido2" || norm === "sapellid") colMap.segundoApellido = idx;
    else if (norm === "celular" || norm === "telefono") colMap.celular = idx;
    else if (norm === "email" || norm === "correo") colMap.email = idx;
    else if (norm.includes("padre") && (norm.includes("nombre") || norm.includes("nompre") || norm.includes("tutor"))) colMap.padreOMadre = idx;
    else if (norm.includes("padre") && (norm.includes("celular") || norm.includes("telefono"))) colMap.celularPadre = idx;
    else if (norm.includes("inscripcion") || norm.includes("fecha")) colMap.fechaInscripcion = idx;
  });
  
  // Validaciones básicas de cabeceras requeridas
  if (colMap.ci === undefined) {
    showToast('No se encontró la columna requerida: CI', 'error');
    return;
  }
  if (colMap.nombre === undefined) {
    showToast('No se encontró la columna requerida: Nombre', 'error');
    return;
  }
  if (colMap.celularPadre === undefined) {
    showToast('No se encontró la columna de celular del padre/madre', 'error');
    return;
  }
  
  var ciVistosEnLote = {};
  
  // Procesar filas de estudiantes (fila 5 en adelante -> index 4)
  for (var i = 4; i < parsedSheetData.length; i++) {
    var row = parsedSheetData[i];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue; // Fila vacía
    
    var filaNro = colMap.nro !== undefined ? row[colMap.nro] : (i - 3);
    var ci = row[colMap.ci] ? row[colMap.ci].toString().trim() : "";
    
    if (!ci) {
      importValidationErrors.push('Fila ' + filaNro + ': CI vacío.');
      continue;
    }
    
    // Validar duplicado en el mismo lote
    if (ciVistosEnLote[ci]) {
      importValidationErrors.push('Fila ' + filaNro + ' (CI: ' + ci + '): CI duplicado en este mismo archivo.');
      continue;
    }
    ciVistosEnLote[ci] = true;
    
    var nombre = colMap.nombre !== undefined ? (row[colMap.nombre] || "") : "";
    var primerApe = colMap.primerApellido !== undefined ? (row[colMap.primerApellido] || "") : "";
    var segundoApe = colMap.segundoApellido !== undefined ? (row[colMap.segundoApellido] || "") : "";
    var nombreCompleto = (nombre + " " + primerApe + " " + segundoApe).trim().replace(/\s+/g, " ");
    
    if (!nombreCompleto) {
      importValidationErrors.push('Fila ' + filaNro + ' (CI: ' + ci + '): Nombre del estudiante vacío.');
      continue;
    }
    
    // Capitalizar
    nombreCompleto = capitalizarTexto(nombreCompleto);
    
    var celular = colMap.celular !== undefined ? row[colMap.celular].toString().trim() : "";
    if (celular) {
      celular = celular.replace(/\s+/g, '');
      if (!celular.startsWith('+591')) {
        if (celular.length === 8 && /^\d+$/.test(celular)) {
          celular = '+591' + celular;
        }
      }
    }
    
    var email = colMap.email !== undefined ? row[colMap.email].toString().trim() : "";
    
    var padreOMadre = colMap.padreOMadre !== undefined ? row[colMap.padreOMadre].toString().trim() : "";
    padreOMadre = capitalizarTexto(padreOMadre);
    
    var celularPadre = colMap.celularPadre !== undefined ? row[colMap.celularPadre].toString().trim() : "";
    celularPadre = celularPadre.replace(/\s+/g, '');
    
    // Validar celular padre
    if (!celularPadre) {
      importValidationErrors.push('Fila ' + filaNro + ' (CI: ' + ci + '): El celular del padre/madre es obligatorio.');
      continue;
    }
    
    if (!celularPadre.startsWith('+591')) {
      if (celularPadre.length === 8 && /^\d+$/.test(celularPadre)) {
        celularPadre = '+591' + celularPadre;
      } else {
        importValidationErrors.push('Fila ' + filaNro + ' (CI: ' + ci + '): Celular del padre inválido (debe tener 8 dígitos).');
        continue;
      }
    } else {
      var cleanNum = celularPadre.replace('+591', '');
      if (cleanNum.length !== 8 || !/^\d+$/.test(cleanNum)) {
        importValidationErrors.push('Fila ' + filaNro + ' (CI: ' + ci + '): Celular del padre inválido (debe tener 8 dígitos después de +591).');
        continue;
      }
    }
    
    var fechaInsc = colMap.fechaInscripcion !== undefined ? row[colMap.fechaInscripcion] : "";
    if (fechaInsc) {
      // Intentar formatear fecha si es un número de serie de excel
      if (!isNaN(fechaInsc)) {
        try {
          var dateObj = XLSX.SSF.parse_date_code(fechaInsc);
          fechaInsc = dateObj.y + '-' + ('0' + dateObj.m).slice(-2) + '-' + ('0' + dateObj.d).slice(-2);
        } catch(e) {}
      } else {
        fechaInsc = fechaInsc.toString().trim();
      }
    }
    
    importedStudents.push({
      nro: filaNro,
      ci: ci,
      nombreCompleto: nombreCompleto,
      celular: celular,
      email: email,
      padreOMadre: padreOMadre,
      celularPadre: celularPadre,
      fechaInscripcion: fechaInsc
    });
  }
  
  // Actualizar UI del Paso 2
  var statusTitle = document.getElementById('valStatusTitle');
  var statusDesc = document.getElementById('valStatusDesc');
  var statusIcon = document.getElementById('valStatusIcon');
  
  if (importedStudents.length > 0 && importValidationErrors.length === 0) {
    statusTitle.textContent = "Archivo válido para importación";
    statusDesc.textContent = "Se encontraron " + importedStudents.length + " estudiantes correctos y listos para importar. No se detectaron errores.";
    statusIcon.innerHTML = '<span class="material-icons" style="font-size:32px;color:var(--accent-green);">check_circle</span>';
    document.getElementById('btnImportProceed').disabled = false;
  } else if (importedStudents.length > 0 && importValidationErrors.length > 0) {
    statusTitle.textContent = "Archivo con observaciones";
    statusDesc.textContent = "Se encontraron " + importedStudents.length + " registros válidos y " + importValidationErrors.length + " con errores que serán omitidos.";
    statusIcon.innerHTML = '<span class="material-icons" style="font-size:32px;color:var(--accent-amber);">warning</span>';
    document.getElementById('btnImportProceed').disabled = false;
  } else {
    statusTitle.textContent = "Archivo inválido";
    statusDesc.textContent = "No se encontraron registros válidos para importar. Todos los registros (" + importValidationErrors.length + ") contienen errores.";
    statusIcon.innerHTML = '<span class="material-icons" style="font-size:32px;color:var(--accent-red);">cancel</span>';
    document.getElementById('btnImportProceed').disabled = true;
  }
  
  // Cargar vista previa (máximo 10 registros)
  var previewBody = document.getElementById('importPreviewBody');
  previewBody.innerHTML = '';
  importedStudents.slice(0, 10).forEach(function(est) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + est.ci + '</td>' +
      '<td><strong>' + est.nombreCompleto + '</strong></td>' +
      '<td>' + (est.celular || '—') + '</td>' +
      '<td>' + (est.padreOMadre || '—') + '</td>' +
      '<td>' + est.celularPadre + '</td>';
    previewBody.appendChild(tr);
  });
  
  if (importedStudents.length === 0) {
    previewBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted);">Sin registros válidos</td></tr>';
  }
  
  // Cargar errores
  var errorsContainer = document.getElementById('importErrorsContainer');
  var errorsBody = document.getElementById('importErrorsBody');
  errorsBody.innerHTML = '';
  
  if (importValidationErrors.length > 0) {
    errorsContainer.style.display = 'block';
    importValidationErrors.forEach(function(err) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td style="padding: 4px 8px; font-size:13px;"><span class="material-icons" style="font-size:14px;vertical-align:middle;margin-right:4px;">error_outline</span>' + err + '</td>';
      errorsBody.appendChild(tr);
    });
  } else {
    errorsContainer.style.display = 'none';
  }
  
  // Cambiar pantallas
  document.getElementById('importStep1').style.display = 'none';
  document.getElementById('importStep2').style.display = 'block';
  
  document.getElementById('btnImportValidate').style.display = 'none';
  document.getElementById('btnImportBack').style.display = 'inline-block';
  document.getElementById('btnImportProceed').style.display = 'inline-block';
}

function descargarReporteErrores() {
  if (importValidationErrors.length === 0) {
    showToast('No hay errores para descargar', 'info');
    return;
  }
  
  var csvContent = "data:text/csv;charset=utf-8,\uFEFFDetalle del Error\n";
  importValidationErrors.forEach(function(err) {
    var row = '"' + err.replace(/"/g, '""') + '"';
    csvContent += row + "\n";
  });
  
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "errores_importacion_" + Date.now() + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function iniciarImportacionBatch() {
  if (importedStudents.length === 0) return;
  
  isImportPaused = false;
  isImportCancelled = false;
  currentImportIndex = 0;
  importStartTime = Date.now();
  
  // Cambiar pantalla
  document.getElementById('importStep2').style.display = 'none';
  document.getElementById('importStep3').style.display = 'block';
  
  document.getElementById('btnImportBack').style.display = 'none';
  document.getElementById('btnImportProceed').style.display = 'none';
  document.getElementById('btnImportCancel').style.display = 'none';
  
  ejecutarSiguienteBatch();
}

function ejecutarSiguienteBatch() {
  if (isImportCancelled) {
    registrarLogFinal('CANCELADO', 'El usuario canceló el proceso manualmente.');
    return;
  }
  
  if (isImportPaused) {
    document.getElementById('progressTitle').textContent = "Importación Pausada";
    document.getElementById('progressSub').textContent = "Haz clic en 'Reanudar' para continuar.";
    return;
  }
  
  var total = importedStudents.length;
  if (currentImportIndex >= total) {
    var totalErrores = importValidationErrors.length;
    var detalles = "Importación exitosa. " + totalErrores + " errores de validación.";
    registrarLogFinal('COMPLETO', detalles);
    return;
  }
  
  document.getElementById('progressTitle').textContent = "Importando estudiantes...";
  document.getElementById('progressSub').textContent = "Importando del registro " + (currentImportIndex + 1) + " al " + Math.min(currentImportIndex + importBatchSize, total) + " de " + total;
  
  var batch = importedStudents.slice(currentImportIndex, currentImportIndex + importBatchSize);
  var fac = document.getElementById('importFacultad').value;
  var tipo = document.getElementById('importTipoGrupo').value;
  var grupo = document.getElementById('importGrupo').value;
  
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        currentImportIndex += batch.length;
        
        if (result.errores && result.errores.length > 0) {
          result.errores.forEach(function(beErr) {
            importValidationErrors.push('Error Servidor: ' + beErr);
          });
        }
        
        var pct = Math.round((currentImportIndex / total) * 100);
        document.getElementById('importProgressBar').style.width = pct + '%';
        document.getElementById('progressPercent').textContent = pct + '% completado';
        
        var elapsed = (Date.now() - importStartTime) / 1000;
        var rate = currentImportIndex / elapsed;
        var remaining = (total - currentImportIndex) / rate;
        document.getElementById('progressTime').textContent = 'Tiempo restante: ' + Math.ceil(remaining) + ' seg';
        
        setTimeout(ejecutarSiguienteBatch, 200);
      } else {
        showToast('Error en lote de importación: ' + result.message, 'error');
        importValidationErrors.push('Lote del index ' + currentImportIndex + ' falló: ' + result.message);
        currentImportIndex += batch.length;
        ejecutarSiguienteBatch();
      }
    })
    .withFailureHandler(function(err) {
      showToast('Fallo crítico al conectar con el servidor: ' + err.message, 'error');
      importValidationErrors.push('Lote del index ' + currentImportIndex + ' falló por error de red: ' + err.message);
      currentImportIndex += batch.length;
      ejecutarSiguienteBatch();
    })
    .api_importarEstudiantesBatch(batch, fac, tipo, grupo);
}

function togglePauseImport() {
  isImportPaused = !isImportPaused;
  var btnText = document.getElementById('btnPauseText');
  var btnIcon = document.querySelector('#btnPauseImport .material-icons');
  
  if (isImportPaused) {
    btnText.textContent = "Reanudar";
    btnIcon.textContent = "play_arrow";
    showToast('Importación pausada', 'info');
  } else {
    btnText.textContent = "Pausar";
    btnIcon.textContent = "pause";
    showToast('Importación reanudada', 'info');
    ejecutarSiguienteBatch();
  }
}

function cancelImport() {
  if (confirm('¿Estás seguro de que deseas cancelar la importación actual? Los registros ya insertados se guardarán.')) {
    isImportCancelled = true;
    showToast('Proceso cancelado por el usuario', 'warning');
    if (isImportPaused) {
      isImportPaused = false;
      ejecutarSiguienteBatch();
    }
  }
}

function registrarLogFinal(estado, detalles) {
  var total = parsedSheetData ? parsedSheetData.length - 4 : 0;
  if (total < 0) total = 0;
  
  var importadosCount = currentImportIndex;
  var erroresCount = importValidationErrors.length;
  var tiempoTotal = Math.round((Date.now() - importStartTime) / 1000);
  
  var logInfo = {
    usuario: document.getElementById('userEmailText').textContent || 'docente@instituto.edu',
    archivo: importFileName || 'archivo.xlsx',
    total: total,
    importados: importadosCount,
    errores: erroresCount,
    tiempo: tiempoTotal,
    estado: estado,
    detalles: detalles || ''
  };
  
  google.script.run
    .withSuccessHandler(function() {
      document.getElementById('importStep3').style.display = 'none';
      document.getElementById('importStep4').style.display = 'block';
      
      document.getElementById('resValidos').textContent = importadosCount;
      document.getElementById('resErrores').textContent = erroresCount;
      
      var resSummary = document.getElementById('importResultSummary');
      if (estado === 'COMPLETO') {
        resSummary.textContent = "La importación de *" + importFileName + "* ha finalizado correctamente.";
      } else {
        resSummary.textContent = "La importación de *" + importFileName + "* fue cancelada. Se cargaron " + importadosCount + " registros.";
      }
    })
    .api_registrarLogImportacion(logInfo);
}

function finalizarImportacion() {
  cerrarModal('modalImportar');
  cargarEstudiantes();
}

function verPerfilEstudiante(id) {
  abrirModal('modalPerfil');
  var content = document.getElementById('perfilContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando perfil...</div>';
  
  google.script.run
    .withSuccessHandler(function(perfil) {
      if (!perfil.success) {
        content.innerHTML = '<div class="empty-state"><h3>' + perfil.message + '</h3></div>';
        return;
      }
      
      var est = perfil.estudiante;
      var initials = est['Nombre Completo'].split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
      
      var html = '<div class="profile-header">' +
        '<div class="profile-avatar">' + initials + '</div>' +
        '<div class="profile-info">' +
        '<h2>' + est['Nombre Completo'] + '</h2>' +
        '<p>' + est['ID'] + ' — ' + est['Facultad'] + ' · ' + est['Tipo Grupo'] + ' · ' + est['Grupo'] + '</p>' +
        '</div></div>';
      
      html += '<div class="profile-stats">' +
        '<div class="stat-card green"><div class="stat-value">' + perfil.asistencia.porcentaje + '%</div><div class="stat-label">Asistencia</div></div>' +
        '<div class="stat-card blue"><div class="stat-value">' + perfil.calificaciones.promedio + '</div><div class="stat-label">Promedio</div></div>' +
        '<div class="stat-card amber"><div class="stat-value">' + perfil.practicas.entregadas + '/' + perfil.practicas.total + '</div><div class="stat-label">Prácticas</div></div>' +
        '<div class="stat-card red"><div class="stat-value">' + perfil.asistencia.ausentes + '</div><div class="stat-label">Faltas</div></div>' +
        '</div>';
      
      // Últimas calificaciones
      if (perfil.calificaciones.registros.length > 0) {
        html += '<h4 style="margin:16px 0 8px;font-size:14px;color:var(--text-secondary)">Últimas Calificaciones</h4>' +
          '<div class="table-container"><table><thead><tr><th>Fecha</th><th>Materia</th><th>Tipo</th><th>Cal.</th></tr></thead><tbody>';
        perfil.calificaciones.registros.slice(-10).forEach(function(c) {
          html += '<tr><td>' + c['Fecha'] + '</td><td>' + c['Materia'] + '</td><td>' + c['Tipo Evaluación'] + '</td>' +
            '<td><strong>' + c['Calificación'] + '</strong>/' + c['Cal. Máxima'] + '</td></tr>';
        });
        html += '</tbody></table></div>';
      }
      
      content.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      content.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
    })
    .api_getPerfilEstudiante(id);
}

// =============================================
// REPORTES
// =============================================
function switchReportTab(tab) {
  currentReportTab = tab;
  document.querySelectorAll('#reportTabs .tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
}

function generarReporte() {
  var facultad = document.getElementById('repFacultad').value;
  var tipoGrupo = document.getElementById('repTipoGrupo').value;
  var grupo = document.getElementById('repGrupo').value;
  var fechaDesde = document.getElementById('repFechaDesde').value;
  var fechaHasta = document.getElementById('repFechaHasta').value;
  
  var container = document.getElementById('reportesContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Generando reporte...</div>';
  
  if (currentReportTab === 'asistencia') {
    var filtros = {};
    if (facultad) filtros.facultad = facultad;
    if (tipoGrupo) filtros.tipoGrupo = tipoGrupo;
    if (grupo) filtros.grupo = grupo;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;
    
    google.script.run
      .withSuccessHandler(function(registros) {
        if (registros.length === 0) {
          container.innerHTML = '<div class="empty-state"><h3>Sin datos</h3><p>No hay registros de asistencia para estos filtros</p></div>';
          return;
        }
        
        // Calcular resumen
        var presentes = registros.filter(function(r) { return r['Estado'] === 'Presente'; }).length;
        var ausentes = registros.filter(function(r) { return r['Estado'] === 'Ausente'; }).length;
        var tardanzas = registros.filter(function(r) { return r['Estado'] === 'Tardanza'; }).length;
        var total = registros.length;
        
        var html = '<div class="stats-grid mb-6">' +
          '<div class="stat-card blue"><div class="stat-value">' + total + '</div><div class="stat-label">Total Registros</div></div>' +
          '<div class="stat-card green"><div class="stat-value">' + Math.round((presentes/total)*100) + '%</div><div class="stat-label">Asistencia</div></div>' +
          '<div class="stat-card red"><div class="stat-value">' + ausentes + '</div><div class="stat-label">Faltas</div></div>' +
          '<div class="stat-card amber"><div class="stat-value">' + tardanzas + '</div><div class="stat-label">Tardanzas</div></div>' +
          '</div>';
        
        // Estudiantes con más faltas
        var faltasPorEstudiante = {};
        registros.forEach(function(r) {
          if (r['Estado'] === 'Ausente') {
            var key = r['ID_Estudiante'];
            if (!faltasPorEstudiante[key]) {
              faltasPorEstudiante[key] = { nombre: r['Nombre'], facultad: r['Facultad'], faltas: 0 };
            }
            faltasPorEstudiante[key].faltas++;
          }
        });
        
        var topFaltas = Object.values(faltasPorEstudiante).sort(function(a, b) { return b.faltas - a.faltas; }).slice(0, 10);
        
        if (topFaltas.length > 0) {
          html += '<div class="card"><div class="card-header"><div class="card-title"><span class="material-icons">warning</span> Estudiantes con más faltas</div></div>' +
            '<div class="table-container"><table><thead><tr><th>#</th><th>Estudiante</th><th>Facultad</th><th>Faltas</th></tr></thead><tbody>';
          topFaltas.forEach(function(f, i) {
            html += '<tr><td>' + (i+1) + '</td><td>' + f.nombre + '</td><td>' + f.facultad + '</td>' +
              '<td><span class="badge badge-absent">' + f.faltas + '</span></td></tr>';
          });
          html += '</tbody></table></div></div>';
        }
        
        container.innerHTML = html;
      })
      .withFailureHandler(function(err) {
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
      })
      .api_getAsistencia(filtros);
  } else if (currentReportTab === 'rendimiento') {
    var filtros2 = {};
    if (facultad) filtros2.facultad = facultad;
    if (tipoGrupo) filtros2.tipoGrupo = tipoGrupo;
    if (grupo) filtros2.grupo = grupo;
    
    google.script.run
      .withSuccessHandler(function(registros) {
        if (registros.length === 0) {
          container.innerHTML = '<div class="empty-state"><h3>Sin datos</h3><p>No hay calificaciones registradas</p></div>';
          return;
        }
        
        // Promedio por materia
        var porMateria = {};
        registros.forEach(function(r) {
          var mat = r['Materia'];
          if (!porMateria[mat]) porMateria[mat] = { suma: 0, count: 0, max: 0 };
          var cal = parseFloat(r['Calificación']) || 0;
          var max = parseFloat(r['Cal. Máxima']) || 100;
          porMateria[mat].suma += (cal / max) * 100;
          porMateria[mat].count++;
        });
        
        var html = '<div class="card"><div class="card-header"><div class="card-title"><span class="material-icons">bar_chart</span> Promedio por Materia</div></div>' +
          '<div class="table-container"><table><thead><tr><th>Materia</th><th>Evaluaciones</th><th>Promedio</th></tr></thead><tbody>';
        
        Object.keys(porMateria).forEach(function(mat) {
          var data = porMateria[mat];
          var prom = Math.round(data.suma / data.count);
          var color = prom >= 70 ? 'var(--accent-green)' : prom >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
          html += '<tr><td>' + mat + '</td><td>' + data.count + '</td>' +
            '<td><strong style="color:' + color + '">' + prom + '%</strong></td></tr>';
        });
        
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
      })
      .withFailureHandler(function(err) {
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
      })
      .api_getCalificaciones(filtros2);
  } else {
    // Prácticas
    var filtros3 = {};
    if (facultad) filtros3.facultad = facultad;
    if (tipoGrupo) filtros3.tipoGrupo = tipoGrupo;
    if (grupo) filtros3.grupo = grupo;
    
    google.script.run
      .withSuccessHandler(function(practicas) {
        if (practicas.length === 0) {
          container.innerHTML = '<div class="empty-state"><h3>Sin datos</h3><p>No hay prácticas registradas</p></div>';
          return;
        }
        
        var html = '<div class="card"><div class="card-header"><div class="card-title"><span class="material-icons">assignment</span> Resumen de Prácticas</div></div>' +
          '<div class="table-container"><table><thead><tr><th>Práctica</th><th>Materia</th><th>Grupo</th><th>Entregadas</th><th>Pendientes</th><th>% Cumplimiento</th></tr></thead><tbody>';
        
        practicas.forEach(function(p) {
          var pct = p.totalEstudiantes > 0 ? Math.round((p.entregadas / p.totalEstudiantes) * 100) : 0;
          var color = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
          html += '<tr><td>' + p.nombrePractica + '</td><td>' + p.materia + '</td>' +
            '<td>' + p.facultad + ' ' + p.tipoGrupo + ' ' + p.grupo + '</td>' +
            '<td><span class="badge badge-delivered">' + p.entregadas + '</span></td>' +
            '<td><span class="badge badge-pending">' + p.pendientes + '</span></td>' +
            '<td><strong style="color:' + color + '">' + pct + '%</strong></td></tr>';
        });
        
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
      })
      .withFailureHandler(function(err) {
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + err.message + '</p></div>';
      })
      .api_getPracticasUnicas(filtros3);
  }
}

// =============================================
// MODALES
// =============================================
function abrirModal(id) {
  document.getElementById(id).classList.add('active');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Cerrar modal con Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(function(m) {
      m.classList.remove('active');
    });
  }
});

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  
  var icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="material-icons">' + icons[type] + '</span> ' + message;
  container.appendChild(toast);
  
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
}