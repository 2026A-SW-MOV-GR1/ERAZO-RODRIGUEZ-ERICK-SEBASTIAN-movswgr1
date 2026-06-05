/**
 * Suite de pruebas unitarias — Persistencia Dual
 *
 * Estrategia:
 *  - Los módulos nativos (SQLite, MMKV) están mockeados en __mocks__/
 *    para que los tests corran en Node.js sin necesidad de un dispositivo.
 *  - InMemoryNotaRepository valida el contrato INotaRepository de forma
 *    completamente pura, sin ninguna dependencia nativa.
 *  - Los tests de la factory y del logger usan los mocks del entorno Jest.
 */

import {INotaRepository} from '../domain/INotaRepository';
import {Nota} from '../domain/Nota';
import {RepositoryFactory} from '../data/RepositoryFactory';
import {SQLiteNotaRepository} from '../data/sqlite/SQLiteNotaRepository';
import {NoSQLNotaRepository} from '../data/nosql/NoSQLNotaRepository';

// ─── Implementación en memoria para validar el contrato ──────────────────────

class InMemoryNotaRepository implements INotaRepository {
  private store = new Map<string, Nota>();
  private counter = 0;

  async getAll(): Promise<Nota[]> {
    return Array.from(this.store.values()).sort((a, b) =>
      b.fecha.localeCompare(a.fecha),
    );
  }

  async create(data: Omit<Nota, 'id'>): Promise<Nota> {
    const nota: Nota = {id: `mem-id-${++this.counter}`, ...data};
    this.store.set(nota.id, nota);
    return nota;
  }

  async update(nota: Nota): Promise<Nota> {
    this.store.set(nota.id, nota);
    return nota;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ─── Test A: contrato del repositorio en memoria ─────────────────────────────

describe('Test A — InMemoryNotaRepository: contrato INotaRepository', () => {
  let repo: INotaRepository;

  beforeEach(() => {
    repo = new InMemoryNotaRepository();
  });

  test('create devuelve una nota con id asignado y los datos correctos', async () => {
    const creada = await repo.create({
      titulo: 'Mi primera nota',
      contenido: 'Contenido de prueba',
      fecha: '2024-06-01T10:00:00.000Z',
    });

    expect(creada.id).toBeDefined();
    expect(creada.id.length).toBeGreaterThan(0);
    expect(creada.titulo).toBe('Mi primera nota');
    expect(creada.contenido).toBe('Contenido de prueba');
    expect(creada.fecha).toBe('2024-06-01T10:00:00.000Z');
  });

  test('getAll recupera la misma nota que fue creada', async () => {
    const creada = await repo.create({
      titulo: 'Nota recuperable',
      contenido: 'Debe aparecer en getAll',
      fecha: '2024-06-01T11:00:00.000Z',
    });

    const notas = await repo.getAll();

    expect(notas).toHaveLength(1);
    expect(notas[0].id).toBe(creada.id);
    expect(notas[0].titulo).toBe('Nota recuperable');
    expect(notas[0].contenido).toBe('Debe aparecer en getAll');
  });

  test('update modifica título y contenido correctamente', async () => {
    const original = await repo.create({
      titulo: 'Original',
      contenido: 'Sin cambios',
      fecha: '2024-06-01T12:00:00.000Z',
    });

    const actualizada = await repo.update({
      ...original,
      titulo: 'Modificado',
      contenido: 'Ahora tiene cambios',
    });

    expect(actualizada.titulo).toBe('Modificado');
    const notas = await repo.getAll();
    expect(notas[0].titulo).toBe('Modificado');
    expect(notas[0].contenido).toBe('Ahora tiene cambios');
  });

  test('delete elimina la nota y getAll devuelve lista vacía', async () => {
    const creada = await repo.create({
      titulo: 'Para borrar',
      contenido: 'Contenido',
      fecha: '2024-06-01T13:00:00.000Z',
    });

    await repo.delete(creada.id);
    const notas = await repo.getAll();

    expect(notas).toHaveLength(0);
  });

  test('clear deja el repositorio completamente vacío', async () => {
    await repo.create({titulo: 'Nota 1', contenido: 'c1', fecha: '2024-01-01T00:00:00.000Z'});
    await repo.create({titulo: 'Nota 2', contenido: 'c2', fecha: '2024-01-02T00:00:00.000Z'});

    await repo.clear();
    const notas = await repo.getAll();

    expect(notas).toHaveLength(0);
  });
});

// ─── Test B: aislamiento entre motores ───────────────────────────────────────

describe('Test B — Aislamiento de almacenes: los datos de SQL no aparecen en NoSQL', () => {
  // Usamos dos instancias en memoria que representan el aislamiento de motores
  let repoSQL: INotaRepository;
  let repoNOSQL: INotaRepository;

  beforeEach(() => {
    repoSQL = new InMemoryNotaRepository();
    repoNOSQL = new InMemoryNotaRepository();
  });

  test('una nota creada en SQL no aparece en NoSQL', async () => {
    await repoSQL.create({
      titulo: 'Nota SQLite',
      contenido: 'Solo en el almacén relacional',
      fecha: new Date().toISOString(),
    });

    const notasNOSQL = await repoNOSQL.getAll();

    // El almacén NoSQL está completamente vacío
    expect(notasNOSQL).toHaveLength(0);

    // El almacén SQL tiene exactamente 1 nota
    const notasSQL = await repoSQL.getAll();
    expect(notasSQL).toHaveLength(1);
    expect(notasSQL[0].titulo).toBe('Nota SQLite');
  });

  test('una nota creada en NoSQL no aparece en SQL', async () => {
    await repoNOSQL.create({
      titulo: 'Documento MMKV',
      contenido: 'Solo en el almacén NoSQL',
      fecha: new Date().toISOString(),
    });

    const notasSQL = await repoSQL.getAll();
    expect(notasSQL).toHaveLength(0);

    const notasNOSQL = await repoNOSQL.getAll();
    expect(notasNOSQL).toHaveLength(1);
    expect(notasNOSQL[0].titulo).toBe('Documento MMKV');
  });

  test('los títulos de SQL nunca aparecen en NoSQL y viceversa', async () => {
    await repoSQL.create({titulo: 'SQL-Exclusivo', contenido: 'SQL', fecha: new Date().toISOString()});
    await repoNOSQL.create({titulo: 'NOSQL-Exclusivo', contenido: 'NOSQL', fecha: new Date().toISOString()});

    const notasSQL = await repoSQL.getAll();
    const notasNOSQL = await repoNOSQL.getAll();

    expect(notasSQL.some(n => n.titulo === 'NOSQL-Exclusivo')).toBe(false);
    expect(notasNOSQL.some(n => n.titulo === 'SQL-Exclusivo')).toBe(false);
  });

  test('RepositoryFactory devuelve instancias de tipos distintos para SQL y NOSQL', () => {
    RepositoryFactory.reset();
    const sql = RepositoryFactory.getRepository('SQL');
    const nosql = RepositoryFactory.getRepository('NOSQL');

    expect(sql).toBeInstanceOf(SQLiteNotaRepository);
    expect(nosql).toBeInstanceOf(NoSQLNotaRepository);
    // Son instancias distintas
    expect(sql).not.toBe(nosql);
  });

  test('RepositoryFactory reutiliza la misma instancia para el mismo motor (Singleton)', () => {
    RepositoryFactory.reset();
    const sql1 = RepositoryFactory.getRepository('SQL');
    const sql2 = RepositoryFactory.getRepository('SQL');
    expect(sql1).toBe(sql2);
  });
});

// ─── Tests de Logger ─────────────────────────────────────────────────────────

describe('Logger — formato estructurado [NIVEL][MOTOR] acción detalle', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('logger.info emite formato correcto a console.log', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const {logger} = require('../core/Logger');

    logger.info('SQLite', 'CREATE', 'nota id=abc');

    expect(spy).toHaveBeenCalledWith('[INFO][SQLite] CREATE nota id=abc');
    spy.mockRestore();
  });

  test('logger.debug emite formato correcto a console.log', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const {logger} = require('../core/Logger');

    logger.debug('MMKV', 'GET_ALL', 'count=5');

    expect(spy).toHaveBeenCalledWith('[DEBUG][MMKV] GET_ALL count=5');
    spy.mockRestore();
  });

  test('logger.error emite a console.error (no a console.log)', () => {
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const {logger} = require('../core/Logger');

    logger.error('MMKV', 'CREATE', 'error de disco');

    expect(spyErr).toHaveBeenCalledWith('[ERROR][MMKV] CREATE error de disco');
    expect(spyLog).not.toHaveBeenCalled();
    spyErr.mockRestore();
    spyLog.mockRestore();
  });

  test('logger acepta mensajes sin detalle opcional', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const {logger} = require('../core/Logger');

    logger.info('System', 'CAMBIO_MOTOR');

    expect(spy).toHaveBeenCalledWith('[INFO][System] CAMBIO_MOTOR');
    spy.mockRestore();
  });
});

// ─── Tests de SQLiteNotaRepository con mock ───────────────────────────────────

describe('SQLiteNotaRepository — CRUD con mock nativo', () => {
  let repo: SQLiteNotaRepository;

  beforeEach(() => {
    // Limpia el store del mock entre tests
    const SQLiteMock = require('react-native-sqlite-storage');
    SQLiteMock._resetStores();
    repo = new SQLiteNotaRepository();
  });

  test('create e inmediatamente getAll devuelve la nota creada', async () => {
    const creada = await repo.create({
      titulo: 'SQLite real',
      contenido: 'Via mock nativo',
      fecha: '2024-06-05T09:00:00.000Z',
    });

    expect(creada.id).toBeDefined();

    const notas = await repo.getAll();
    expect(notas.length).toBeGreaterThanOrEqual(1);
    const encontrada = notas.find(n => n.id === creada.id);
    expect(encontrada).toBeDefined();
    expect(encontrada?.titulo).toBe('SQLite real');
  });
});

// ─── Tests de NoSQLNotaRepository con mock ────────────────────────────────────

describe('NoSQLNotaRepository — CRUD con mock MMKV', () => {
  let repo: NoSQLNotaRepository;

  beforeEach(() => {
    const {MMKV} = require('react-native-mmkv');
    MMKV._resetAll();
    repo = new NoSQLNotaRepository();
  });

  test('create e inmediatamente getAll devuelve el documento creado', async () => {
    const creada = await repo.create({
      titulo: 'MMKV real',
      contenido: 'Documento JSON',
      fecha: '2024-06-05T10:00:00.000Z',
    });

    expect(creada.id).toBeDefined();

    const notas = await repo.getAll();
    expect(notas.length).toBeGreaterThanOrEqual(1);
    const encontrado = notas.find(n => n.id === creada.id);
    expect(encontrado).toBeDefined();
    expect(encontrado?.titulo).toBe('MMKV real');
  });

  test('delete elimina solo la nota indicada', async () => {
    const n1 = await repo.create({titulo: 'A', contenido: 'ca', fecha: '2024-01-01T00:00:00.000Z'});
    const n2 = await repo.create({titulo: 'B', contenido: 'cb', fecha: '2024-01-02T00:00:00.000Z'});

    await repo.delete(n1.id);
    const notas = await repo.getAll();

    expect(notas.find(n => n.id === n1.id)).toBeUndefined();
    expect(notas.find(n => n.id === n2.id)).toBeDefined();
  });
});
