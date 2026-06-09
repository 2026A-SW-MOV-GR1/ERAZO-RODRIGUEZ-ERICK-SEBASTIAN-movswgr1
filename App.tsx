import React from 'react';
import {StatusBar} from 'react-native';
import {PersistenceProvider} from './src/state/PersistenceContext';
import {CrudScreen} from './src/ui/CrudScreen';
import {ErrorBoundary} from './src/ui/ErrorBoundary';

const App: React.FC = () => (
  <ErrorBoundary>
    <PersistenceProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <CrudScreen />
    </PersistenceProvider>
  </ErrorBoundary>
);

export default App;
