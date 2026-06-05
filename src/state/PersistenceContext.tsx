import React, {createContext, useContext, useState} from 'react';
import {Motor} from '../data/RepositoryFactory';
import {logger} from '../core/Logger';

interface PersistenceContextValue {
  /** Motor activo en este momento */
  motor: Motor;
  /** Cambia el motor en tiempo de ejecución; dispara re-render en todos los consumers */
  setMotor: (motor: Motor) => void;
}

const PersistenceContext = createContext<PersistenceContextValue>({
  motor: 'SQL',
  setMotor: () => {},
});

/**
 * Proveedor global del motor de persistencia.
 * Colócalo en App.tsx envolviendo toda la navegación para que cualquier
 * pantalla pueda consumir el motor activo sin prop-drilling.
 */
export const PersistenceProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [motor, setMotorState] = useState<Motor>('SQL');

  const setMotor = (newMotor: Motor): void => {
    // Logueamos el cambio de motor como INFO porque es una operación significativa
    logger.info('System', 'CAMBIO_MOTOR', `anterior=${motor} nuevo=${newMotor}`);
    setMotorState(newMotor);
  };

  return (
    <PersistenceContext.Provider value={{motor, setMotor}}>
      {children}
    </PersistenceContext.Provider>
  );
};

/** Hook conveniente para consumir el contexto sin importar el objeto directamente */
export const usePersistence = (): PersistenceContextValue =>
  useContext(PersistenceContext);
