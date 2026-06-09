import {Nota} from './Nota';

/**
 * Contrato que toda implementación de persistencia debe cumplir.
 * La UI y el hook useNotas solo dependen de esta interfaz,
 * jamás de SQLite ni de MMKV directamente (Principio de Inversión de Dependencias).
 */
export interface INotaRepository {
  /** Devuelve todas las notas ordenadas por fecha descendente */
  getAll(): Promise<Nota[]>;

  /** Persiste una nueva nota generando un id único; devuelve la nota con id asignado */
  create(data: Omit<Nota, 'id'>): Promise<Nota>;

  /** Actualiza título, contenido y fecha de una nota existente */
  update(nota: Nota): Promise<Nota>;

  /** Elimina la nota identificada por id */
  delete(id: string): Promise<void>;

  /** Borra todas las notas del almacén (útil para tests y demostración) */
  clear(): Promise<void>;
}
