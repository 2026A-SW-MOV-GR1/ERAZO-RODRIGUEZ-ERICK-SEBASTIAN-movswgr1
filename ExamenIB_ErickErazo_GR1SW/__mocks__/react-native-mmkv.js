/**
 * Mock de react-native-mmkv para el entorno Jest (sin nativo).
 * Cada instancia MMKV recibe un id; instancias con diferente id
 * tienen almacenes completamente separados (aislamiento de motor).
 */
const instanceStores = {};

class MockMMKV {
  constructor({id = 'default'} = {}) {
    this._id = id;
    if (!instanceStores[id]) {
      instanceStores[id] = {};
    }
    this._store = instanceStores[id];
  }

  getString(key) {
    return this._store[key] !== undefined ? this._store[key] : undefined;
  }

  set(key, value) {
    this._store[key] = value;
  }

  delete(key) {
    delete this._store[key];
  }

  contains(key) {
    return key in this._store;
  }

  clearAll() {
    Object.keys(this._store).forEach(k => delete this._store[k]);
  }

  static _resetAll() {
    Object.keys(instanceStores).forEach(k => delete instanceStores[k]);
  }
}

module.exports = {MMKV: MockMMKV};
