import {useState, useEffect, useCallback} from 'react';
import {Nota} from '../domain/Nota';
import {RepositoryFactory, Motor} from '../data/RepositoryFactory';
import {logger} from '../core/Logger';

const motorLabel = (m: Motor) => (m === 'SQL' ? 'SQLite' : 'MMKV') as const;

/**
 * Hook de estado para el CRUD de notas.
 *
 * Recibe el motor activo como parámetro; cuando éste cambia el useEffect
 * con dependencia [cargar] se dispara automáticamente, recargando la lista
 * desde el nuevo almacén sin reiniciar la aplicación.
 *
 * La UI solo llama a {crear, eliminar, actualizar, cargar} y observa
 * {notas, loading, error}; nunca interactúa con SQLite ni MMKV directamente.
 */
export const useNotas = (motor: Motor) => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repo = RepositoryFactory.getRepository(motor);
  const label = motorLabel(motor);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.getAll();
      setNotas(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(label, 'GET_ALL', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motor]); // motor es la dependencia clave: cambiarlo recarga la lista

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (titulo: string, contenido: string): Promise<void> => {
    try {
      await repo.create({titulo, contenido, fecha: new Date().toISOString()});
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(label, 'CREATE', msg);
      setError(msg);
    }
  };

  const actualizar = async (nota: Nota): Promise<void> => {
    try {
      await repo.update(nota);
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(label, 'UPDATE', msg);
      setError(msg);
    }
  };

  const eliminar = async (id: string): Promise<void> => {
    try {
      await repo.delete(id);
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(label, 'DELETE', msg);
      setError(msg);
    }
  };

  return {notas, loading, error, crear, actualizar, eliminar, cargar};
};
