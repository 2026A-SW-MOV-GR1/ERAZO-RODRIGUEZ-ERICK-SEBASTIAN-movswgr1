import SQLite from 'react-native-sqlite-storage';
import {INotaRepository} from '../../domain/INotaRepository';
import {Nota} from '../../domain/Nota';
import {logger} from '../../core/Logger';

SQLite.enablePromise(true);

/** Genera un id único sin dependencias nativas externas */
const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

/**
 * Implementación relacional: persiste notas en una tabla SQLite.
 * La inicialización (CREATE TABLE IF NOT EXISTS) se ejecuta al obtener
 * la primera conexión, garantizando que la tabla exista antes de cualquier
 * operación CRUD.
 */
export class SQLiteNotaRepository implements INotaRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }
    this.db = await SQLite.openDatabase({name: 'notas.db', location: 'default'});
    // Crea la tabla si no existe; columnas tipadas para integridad relacional
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS notas (
        id       TEXT PRIMARY KEY,
        titulo   TEXT NOT NULL,
        contenido TEXT NOT NULL,
        fecha    TEXT NOT NULL
      );
    `);
    logger.info('SQLite', 'INIT', 'tabla notas verificada/creada');
    return this.db;
  }

  async getAll(): Promise<Nota[]> {
    try {
      const db = await this.getDb();
      const [results] = await db.executeSql(
        'SELECT * FROM notas ORDER BY fecha DESC;',
      );
      const notas: Nota[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        notas.push(results.rows.item(i) as Nota);
      }
      logger.debug('SQLite', 'GET_ALL', `count=${notas.length}`);
      return notas;
    } catch (e) {
      logger.error('SQLite', 'GET_ALL', String(e));
      throw e;
    }
  }

  async create(data: Omit<Nota, 'id'>): Promise<Nota> {
    try {
      const nota: Nota = {id: generateId(), ...data};
      const db = await this.getDb();
      await db.executeSql(
        'INSERT INTO notas (id, titulo, contenido, fecha) VALUES (?, ?, ?, ?);',
        [nota.id, nota.titulo, nota.contenido, nota.fecha],
      );
      logger.info('SQLite', 'CREATE', `nota id=${nota.id}`);
      return nota;
    } catch (e) {
      logger.error('SQLite', 'CREATE', String(e));
      throw e;
    }
  }

  async update(nota: Nota): Promise<Nota> {
    try {
      const db = await this.getDb();
      await db.executeSql(
        'UPDATE notas SET titulo=?, contenido=?, fecha=? WHERE id=?;',
        [nota.titulo, nota.contenido, nota.fecha, nota.id],
      );
      logger.info('SQLite', 'UPDATE', `nota id=${nota.id}`);
      return nota;
    } catch (e) {
      logger.error('SQLite', 'UPDATE', String(e));
      throw e;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.executeSql('DELETE FROM notas WHERE id=?;', [id]);
      logger.info('SQLite', 'DELETE', `nota id=${id}`);
    } catch (e) {
      logger.error('SQLite', 'DELETE', String(e));
      throw e;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      await db.executeSql('DELETE FROM notas;');
      logger.info('SQLite', 'CLEAR', 'todas las notas eliminadas');
    } catch (e) {
      logger.error('SQLite', 'CLEAR', String(e));
      throw e;
    }
  }
}
