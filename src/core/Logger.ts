/** Niveles de log disponibles */
type Level = 'DEBUG' | 'INFO' | 'ERROR';

/** Motores conocidos más un valor genérico de sistema */
export type LogMotor = 'SQLite' | 'MMKV' | 'System';

/**
 * Formatea y emite un mensaje estructurado con el patrón:
 *   [NIVEL][MOTOR] acción detalle
 * Ejemplo: [INFO][SQLite] CREATE nota id=abc
 *
 * Decisión de diseño: DEBUG usa console.log (solo en dev),
 * INFO usa console.log, ERROR usa console.error para que
 * las herramientas de monitoreo puedan filtrar por severidad.
 */
const emit = (level: Level, motor: LogMotor, accion: string, detalle?: string): void => {
  const msg = `[${level}][${motor}] ${accion}${detalle ? ' ' + detalle : ''}`;
  if (level === 'ERROR') {
    console.error(msg);
  } else {
    console.log(msg);
  }
};

export const logger = {
  /** Lecturas y operaciones frecuentes de bajo impacto */
  debug: (motor: LogMotor, accion: string, detalle?: string) =>
    emit('DEBUG', motor, accion, detalle),

  /** Escrituras (create / update / delete) y cambios de motor */
  info: (motor: LogMotor, accion: string, detalle?: string) =>
    emit('INFO', motor, accion, detalle),

  /** Errores capturados en bloques catch */
  error: (motor: LogMotor, accion: string, detalle?: string) =>
    emit('ERROR', motor, accion, detalle),
};
