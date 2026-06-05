import React from 'react';
import {StatusBar} from 'react-native';
import {PersistenceProvider} from './src/state/PersistenceContext';
import {CrudScreen} from './src/ui/CrudScreen';

/**
 * Raíz de la aplicación.
 * PersistenceProvider envuelve todo para que cualquier componente
 * pueda leer/cambiar el motor sin prop-drilling.
 */
const App: React.FC = () => (
  <PersistenceProvider>
    <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
    <CrudScreen />
  </PersistenceProvider>
);

export default App;
