import {MMKV} from 'react-native-mmkv';
import {INotaRepository} from '../../domain/INotaRepository';
import {Nota} from '../../domain/Nota';
import {logger} from '../../core/Logger';

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

/**
 * Almacén de documentos JSON sobre MMKV.
 *
 * Estrategia de almacenamiento NoSQL:
 *   - Cada nota se guarda bajo la clave  "nota:<id>"  (documento independiente)
 *   - Un índice "notas:ids" guarda el array de ids como JSON
 *
 * Esto imita el patrón de documentos de MongoDB/Firestore sin esquema fijo,
 * demostrando la naturaleza schema-less del motor NoSQL.
 *
 * Se usa una instancia MMKV con id propio ('notas-storage') para que el
 * almacén sea completamente independiente del almacén SQLite.
 */
export class NoSQLNotaRepository implements INotaRepository {
  private storage = new MMKV({id: 'notas-storage'});
  private readonly INDEX_KEY = 'notas:ids';

  private getIds(): string[] {
    const raw = this.storage.getString(this.INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  private setIds(ids: string[]): void {
    this.storage.set(this.INDEX_KEY, JSON.stringify(ids));
  }

  async getAll(): Promise<Nota[]> {
    try {
      const ids = this.getIds();
      const notas: Nota[] = ids
        .map(id => {
          const raw = this.storage.getString(`nota:${id}`);
          return raw ? (JSON.parse(raw) as Nota) : null;
        })
        .filter((n): n is Nota => n !== null)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
      logger.debug('MMKV', 'GET_ALL', `count=${notas.length}`);
      return notas;
    } catch (e) {
      logger.error('MMKV', 'GET_ALL', String(e));
      throw e;
    }
  }

  async create(data: Omit<Nota, 'id'>): Promise<Nota> {
    try {
      const nota: Nota = {id: generateId(), ...data};
      // Persiste el documento JSON de la nota
      this.storage.set(`nota:${nota.id}`, JSON.stringify(nota));
      // Actualiza el índice de ids
      const ids = this.getIds();
      ids.push(nota.id);
      this.setIds(ids);
      logger.info('MMKV', 'CREATE', `nota id=${nota.id}`);
      return nota;
    } catch (e) {
      logger.error('MMKV', 'CREATE', String(e));
      throw e;
    }
  }

  async update(nota: Nota): Promise<Nota> {
    try {
      this.storage.set(`nota:${nota.id}`, JSON.stringify(nota));
      logger.info('MMKV', 'UPDATE', `nota id=${nota.id}`);
      return nota;
    } catch (e) {
      logger.error('MMKV', 'UPDATE', String(e));
      throw e;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.storage.delete(`nota:${id}`);
      const ids = this.getIds().filter(i => i !== id);
      this.setIds(ids);
      logger.info('MMKV', 'DELETE', `nota id=${id}`);
    } catch (e) {
      logger.error('MMKV', 'DELETE', String(e));
      throw e;
    }
  }

  async clear(): Promise<void> {
    try {
      const ids = this.getIds();
      ids.forEach(id => this.storage.delete(`nota:${id}`));
      this.setIds([]);
      logger.info('MMKV', 'CLEAR', 'todos los documentos eliminados');
    } catch (e) {
      logger.error('MMKV', 'CLEAR', String(e));
      throw e;
    }
  }
}
