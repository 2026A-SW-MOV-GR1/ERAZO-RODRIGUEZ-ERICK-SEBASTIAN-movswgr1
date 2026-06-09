/**
 * PUENTE JS → NATIVO: SecureStorage wrapper
 *
 * NativeModules.SecureStorageModule es el objeto que React Native inyecta
 * en el hilo JS a partir del módulo Kotlin registrado en SecureStoragePackage.
 * Este wrapper le da tipos estrictos y un contrato claro al resto de la app.
 */
import {NativeModules} from 'react-native';

export type Compartimento =
  | 'SHARED_PREFERENCES'
  | 'DATASTORE'
  | 'ENCRYPTED';

interface SecureStorageModuleInterface {
  /**
   * Persiste un valor en el compartimento elegido.
   * CRUCE: JS serializa los args → Bridge → Kotlin @ReactMethod recibe String, String, String, Promise
   */
  guardarSecreto(
    llave: string,
    valor: string,
    compartimento: Compartimento,
  ): Promise<boolean>;

  /**
   * Recupera un valor previamente guardado, o null si no existe.
   * CRUCE: Kotlin resuelve la Promise con el String (o null) → Bridge → JS await
   */
  recuperarSecreto(
    llave: string,
    compartimento: Compartimento,
  ): Promise<string | null>;
}

// Acceso al módulo nativo a través del Bridge de React Native
const {SecureStorageModule} = NativeModules as {
  SecureStorageModule: SecureStorageModuleInterface;
};

export default SecureStorageModule;
