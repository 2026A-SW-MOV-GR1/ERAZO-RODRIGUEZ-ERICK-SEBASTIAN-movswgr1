/**
 * Mock de react-native-sqlite-storage para el entorno Jest (sin nativo).
 * Simula la API async de SQLite con un almacén en memoria por cada nombre de DB.
 */
const stores = {};

const makeMockDb = name => {
  if (!stores[name]) {
    stores[name] = {rows: []};
  }
  const store = stores[name];

  return {
    executeSql: jest.fn((sql, params = []) => {
      const normalized = sql.trim().toUpperCase();

      if (normalized.startsWith('CREATE TABLE')) {
        return Promise.resolve([{rows: {length: 0, item: jest.fn()}}]);
      }

      if (normalized.startsWith('INSERT')) {
        store.rows.push({
          id: params[0],
          titulo: params[1],
          contenido: params[2],
          fecha: params[3],
        });
        return Promise.resolve([{rows: {length: 0, item: jest.fn()}}]);
      }

      if (normalized.startsWith('SELECT')) {
        const sorted = [...store.rows].sort((a, b) =>
          b.fecha.localeCompare(a.fecha),
        );
        return Promise.resolve([
          {
            rows: {
              length: sorted.length,
              item: idx => sorted[idx],
            },
          },
        ]);
      }

      if (normalized.startsWith('UPDATE')) {
        const id = params[3];
        const idx = store.rows.findIndex(r => r.id === id);
        if (idx !== -1) {
          store.rows[idx] = {id, titulo: params[0], contenido: params[1], fecha: params[2]};
        }
        return Promise.resolve([{rows: {length: 0, item: jest.fn()}}]);
      }

      if (normalized.startsWith('DELETE')) {
        if (params.length > 0) {
          store.rows = store.rows.filter(r => r.id !== params[0]);
        } else {
          store.rows = [];
        }
        return Promise.resolve([{rows: {length: 0, item: jest.fn()}}]);
      }

      return Promise.resolve([{rows: {length: 0, item: jest.fn()}}]);
    }),
  };
};

const SQLite = {
  enablePromise: jest.fn(),
  openDatabase: jest.fn(({name}) => Promise.resolve(makeMockDb(name))),
  // Permite resetear los stores entre tests
  _resetStores: () => {
    Object.keys(stores).forEach(k => delete stores[k]);
  },
};

module.exports = SQLite;
module.exports.default = SQLite;
