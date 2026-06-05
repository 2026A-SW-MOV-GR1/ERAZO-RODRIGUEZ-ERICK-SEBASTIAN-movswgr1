import {INotaRepository} from '../domain/INotaRepository';
import {SQLiteNotaRepository} from './sqlite/SQLiteNotaRepository';
import {NoSQLNotaRepository} from './nosql/NoSQLNotaRepository';
import {logger} from '../core/Logger';

export type Motor = 'SQL' | 'NOSQL';

/**
 * Único punto del sistema que conoce ambas implementaciones concretas.
 *
 * Patrón Singleton por motor: reutiliza la misma instancia para evitar
 * múltiples aperturas de base de datos. Cada motor tiene su propia instancia
 * completamente aislada: los datos escritos en 'SQL' nunca aparecen en 'NOSQL'
 * y viceversa, que es el núcleo de la demostración del examen.
 */
export class RepositoryFactory {
  private static sqlInstance: SQLiteNotaRepository | null = null;
  private static nosqlInstance: NoSQLNotaRepository | null = null;

  static getRepository(motor: Motor): INotaRepository {
    logger.debug('System', 'FACTORY', `motor=${motor}`);
    if (motor === 'SQL') {
      if (!RepositoryFactory.sqlInstance) {
        RepositoryFactory.sqlInstance = new SQLiteNotaRepository();
      }
      return RepositoryFactory.sqlInstance;
    } else {
      if (!RepositoryFactory.nosqlInstance) {
        RepositoryFactory.nosqlInstance = new NoSQLNotaRepository();
      }
      return RepositoryFactory.nosqlInstance;
    }
  }

  /** Reinicia las instancias; útil en tests para garantizar aislamiento */
  static reset(): void {
    RepositoryFactory.sqlInstance = null;
    RepositoryFactory.nosqlInstance = null;
  }
}
