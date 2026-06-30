/**
 * ============================================================
 * CONFIG.gs — Configuración del Instituto
 * ============================================================
 * Facultades, materias, grupos y horarios.
 * Para agregar nuevas áreas, solo agregar datos aquí.
 * ============================================================
 */

/**
 * Retorna todas las facultades del instituto
 */
function getFacultades() {
  return [
    { codigo: 'CEF', nombre: 'Ciencias Económicas y Financieras', estado: 'Activa' },
    { codigo: 'ING', nombre: 'Ingeniería', estado: 'Activa' },
    { codigo: 'MED', nombre: 'Medicina', estado: 'Activa' },
    { codigo: 'BIOQUI', nombre: 'Ciencias Farmacéuticas y Bioquímica', estado: 'Activa' },
    { codigo: 'ODONTO', nombre: 'Odontología', estado: 'Activa' },
    { codigo: 'INFO', nombre: 'Informática', estado: 'Activa' },
    { codigo: 'ESFM', nombre: 'Escuelas Superiores de Formación de Maestros', estado: 'Activa' },
    { codigo: 'POLMIL', nombre: 'Instituciones Militares y Policiales', estado: 'Activa' },
    { codigo: 'AREA9', nombre: 'Área 9 (Por definir)', estado: 'Inactiva' },
    { codigo: 'AREA10', nombre: 'Área 10 (Por definir)', estado: 'Inactiva' }
  ];
}

/**
 * Retorna solo las facultades activas
 */
function getFacultadesActivas() {
  return getFacultades().filter(f => f.estado === 'Activa');
}

/**
 * Retorna las materias por facultad
 */
function getMateriasPorFacultad() {
  return {
    'CEF': [
      { materia: 'Matemática', docente: '' },
      { materia: 'Lenguaje', docente: '' }
    ],
    'ING': [
      { materia: 'Matemática', docente: '' },
      { materia: 'Física', docente: '' },
      { materia: 'Química', docente: '' },
      { materia: 'Cálculo I', docente: '' }
    ],
    'MED': [
      { materia: 'Anatomía Humana', docente: '' },
      { materia: 'Lenguaje', docente: '' },
      { materia: 'Física', docente: '' },
      { materia: 'Química', docente: '' },
      { materia: 'Matemáticas', docente: '' },
      { materia: 'Histología', docente: '' },
      { materia: 'Embriología', docente: '' }
    ],
    'BIOQUI': [
      { materia: 'Matemática', docente: '' },
      { materia: 'Lenguaje', docente: '' },
      { materia: 'Física', docente: '' },
      { materia: 'Química', docente: '' },
      { materia: 'Biología', docente: '' }
    ],
    'ODONTO': [
      { materia: 'Lenguaje', docente: '' },
      { materia: 'Física', docente: '' },
      { materia: 'Química', docente: '' },
      { materia: 'Biología', docente: '' },
      { materia: 'Psicotécnico', docente: '' }
    ],
    'INFO': [
      { materia: 'Matemática', docente: '' },
      { materia: 'Informática', docente: '' },
      { materia: 'Computación', docente: '' }
    ],
    'ESFM': [
      { materia: 'Razonamiento lógico matemático', docente: '' },
      { materia: 'Razonamiento verbal', docente: '' },
      { materia: 'Conocimientos generales de la realidad del país y del sistema educativo', docente: '' }
    ],
    'POLMIL': [
      { materia: 'Algebra', docente: '' },
      { materia: 'Trigonometría', docente: '' },
      { materia: 'Física', docente: '' }
    ]
  };
}

/**
 * Retorna las materias de una facultad específica
 */
function getMateriasDE(codigoFacultad) {
  var todas = getMateriasPorFacultad();
  return todas[codigoFacultad] || [];
}

/**
 * Retorna los grupos por facultad con tipo y horario
 */
function getGruposPorFacultad() {
  return {
    'CEF': [
      { tipo: 'NUEVOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'NUEVOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'NUEVOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'ANTIGUOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'ANTIGUOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'ANTIGUOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' }
    ],
    'ING': [
      { tipo: 'PREFACULTATIVO', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'PREFACULTATIVO', grupo: 'G2', horaInicio: '11:30', horaFin: '14:30' },
      { tipo: 'PREFACULTATIVO', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'PREFACULTATIVO', grupo: 'G4', horaInicio: '19:00', horaFin: '22:00' },
      { tipo: 'DISPENSACIÓN', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'DISPENSACIÓN', grupo: 'G2', horaInicio: '11:30', horaFin: '14:30' },
      { tipo: 'DISPENSACIÓN', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'DISPENSACIÓN', grupo: 'G4', horaInicio: '19:00', horaFin: '22:00' }
    ],
    'MED': [
      { tipo: 'Primer Parcial', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'Primer Parcial', grupo: 'G2', horaInicio: '11:30', horaFin: '14:30' },
      { tipo: 'Primer Parcial', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'Primer Parcial', grupo: 'G4', horaInicio: '19:00', horaFin: '22:00' },
      { tipo: 'Segundo Parcial', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'Segundo Parcial', grupo: 'G2', horaInicio: '11:30', horaFin: '14:30' },
      { tipo: 'Segundo Parcial', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'Segundo Parcial', grupo: 'G4', horaInicio: '19:00', horaFin: '22:00' },
      { tipo: 'Tercer Parcial', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'Tercer Parcial', grupo: 'G2', horaInicio: '11:30', horaFin: '14:30' },
      { tipo: 'Tercer Parcial', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'Tercer Parcial', grupo: 'G4', horaInicio: '19:00', horaFin: '22:00' }
    ],
    'BIOQUI': [
      { tipo: 'NUEVOS', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'NUEVOS', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'NUEVOS', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' },
      { tipo: 'ANTIGUOS', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'ANTIGUOS', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'ANTIGUOS', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' }
    ],
    'ODONTO': [
      { tipo: 'NUEVOS', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'NUEVOS', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'NUEVOS', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' },
      { tipo: 'ANTIGUOS', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'ANTIGUOS', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'ANTIGUOS', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' }
    ],
    'INFO': [
      { tipo: 'PREFACULTATIVO', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'PREFACULTATIVO', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'PREFACULTATIVO', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' },
      { tipo: 'DISPENSACIÓN', grupo: 'G1', horaInicio: '08:30', horaFin: '11:00' },
      { tipo: 'DISPENSACIÓN', grupo: 'G2', horaInicio: '11:30', horaFin: '14:00' },
      { tipo: 'DISPENSACIÓN', grupo: 'G3', horaInicio: '15:00', horaFin: '17:30' }
    ],
    'ESFM': [
      { tipo: 'NUEVOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'NUEVOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'NUEVOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'ANTIGUOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'ANTIGUOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'ANTIGUOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' }
    ],
    'POLMIL': [
      { tipo: 'NUEVOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'NUEVOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'NUEVOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' },
      { tipo: 'ANTIGUOS', grupo: 'G1', horaInicio: '08:00', horaFin: '11:00' },
      { tipo: 'ANTIGUOS', grupo: 'G2', horaInicio: '11:00', horaFin: '14:00' },
      { tipo: 'ANTIGUOS', grupo: 'G3', horaInicio: '15:00', horaFin: '18:00' }
    ]
  };
}

/**
 * Retorna los grupos de una facultad específica
 */
function getGruposDE(codigoFacultad) {
  var todos = getGruposPorFacultad();
  return todos[codigoFacultad] || [];
}

/**
 * Retorna los tipos de grupo de una facultad
 */
function getTiposGrupoDE(codigoFacultad) {
  var grupos = getGruposDE(codigoFacultad);
  var tipos = [];
  var vistos = {};
  grupos.forEach(function(g) {
    if (!vistos[g.tipo]) {
      tipos.push(g.tipo);
      vistos[g.tipo] = true;
    }
  });
  return tipos;
}

/**
 * Retorna los grupos filtrados por facultad y tipo
 */
function getGruposFiltrados(codigoFacultad, tipoGrupo) {
  var grupos = getGruposDE(codigoFacultad);
  return grupos.filter(function(g) { return g.tipo === tipoGrupo; });
}

/**
 * Días de clase
 */
function getDiasClase() {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
}

/**
 * Estados de asistencia
 */
function getEstadosAsistencia() {
  return ['Presente', 'Ausente', 'Tardanza', 'Justificado'];
}

/**
 * Estados de prácticas
 */
function getEstadosPracticas() {
  return ['Pendiente', 'Entregada', 'Tardía', 'No Entregada'];
}

/**
 * Tipos de evaluación
 */
function getTiposEvaluacion() {
  return ['Examen', 'Participación', 'Proyecto', 'Tarea', 'Práctica'];
}

/**
 * Obtiene toda la configuración para enviar al frontend
 */
function getConfigCompleta() {
  return {
    facultades: getFacultadesActivas(),
    materiasPorFacultad: getMateriasPorFacultad(),
    gruposPorFacultad: getGruposPorFacultad(),
    diasClase: getDiasClase(),
    estadosAsistencia: getEstadosAsistencia(),
    estadosPracticas: getEstadosPracticas(),
    tiposEvaluacion: getTiposEvaluacion()
  };
}
