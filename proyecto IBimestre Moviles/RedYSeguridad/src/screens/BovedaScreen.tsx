import React, {useReducer, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import SecureStorage, {Compartimento} from '../native/SecureStorage';

type OpState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; message: string}
  | {status: 'error'; message: string};

type OpAction =
  | {type: 'START'}
  | {type: 'SUCCESS'; message: string}
  | {type: 'ERROR'; message: string}
  | {type: 'RESET'};

function reducer(state: OpState, action: OpAction): OpState {
  switch (action.type) {
    case 'START':   return {status: 'loading'};
    case 'SUCCESS': return {status: 'success', message: action.message};
    case 'ERROR':   return {status: 'error',   message: action.message};
    case 'RESET':   return {status: 'idle'};
    default:        return state;
  }
}

const COMPARTIMENTOS: {label: string; value: Compartimento; desc: string}[] = [
  {label: 'SharedPreferences',        value: 'SHARED_PREFERENCES', desc: 'XML plano · sin cifrado'},
  {label: 'DataStore',                value: 'DATASTORE',          desc: 'Preferences DataStore · sin cifrado'},
  {label: 'EncryptedSharedPreferences', value: 'ENCRYPTED',        desc: 'AES-256-GCM · cifrado en disco'},
];

export default function BovedaScreen(): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, {status: 'idle'});
  const [llave, setLlave]   = useState('');
  const [valor, setValor]   = useState('');
  const [compartimento, setCompartimento] = useState<Compartimento>('SHARED_PREFERENCES');

  // Refs: siempre tienen el texto más reciente sin depender del closure del render
  const llaveRef = useRef('');
  const valorRef = useRef('');

  const isLoading = state.status === 'loading';

  async function handleGuardar() {
    Keyboard.dismiss();
    const ll = llaveRef.current.trim();
    const vl = valorRef.current.trim();
    if (!ll) { dispatch({type: 'ERROR', message: 'La llave no puede estar vacía.'}); return; }
    if (!vl) { dispatch({type: 'ERROR', message: 'El valor no puede estar vacío para guardar.'}); return; }
    dispatch({type: 'START'});
    try {
      await SecureStorage.guardarSecreto(ll, vl, compartimento);
      dispatch({type: 'SUCCESS', message: `Guardado en ${compartimento.replace(/_/g, ' ')}.`});
      setValor('');
      valorRef.current = '';
    } catch (e: unknown) {
      dispatch({type: 'ERROR', message: `Error al guardar: ${e instanceof Error ? e.message : String(e)}`});
    }
  }

  async function handleRecuperar() {
    Keyboard.dismiss();
    const ll = llaveRef.current.trim();
    if (!ll) { dispatch({type: 'ERROR', message: 'La llave no puede estar vacía.'}); return; }
    dispatch({type: 'START'});
    try {
      const resultado = await SecureStorage.recuperarSecreto(ll, compartimento);
      if (resultado !== null && resultado !== undefined) {
        setValor(resultado);
        valorRef.current = resultado;
        dispatch({type: 'SUCCESS', message: `Recuperado de ${compartimento.replace(/_/g, ' ')}.`});
      } else {
        dispatch({type: 'SUCCESS', message: 'No se encontró valor para esa llave en este compartimento.'});
      }
    } catch (e: unknown) {
      dispatch({type: 'ERROR', message: `Error al recuperar: ${e instanceof Error ? e.message : String(e)}`});
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always">

        {state.status === 'success' && (
          <View style={styles.bannerSuccess}>
            <Text style={styles.bannerText}>✓ {state.message}</Text>
          </View>
        )}
        {state.status === 'error' && (
          <View style={styles.bannerError}>
            <Text style={styles.bannerText}>✗ {state.message}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Datos del Secreto</Text>

        <Text style={styles.label}>Llave</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. jwt_token"
          placeholderTextColor="#AAA"
          value={llave}
          onChangeText={t => { setLlave(t); llaveRef.current = t; if (!isLoading) dispatch({type: 'RESET'}); }}
          editable={!isLoading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Valor</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="ej. eyJhbGciOiJ..."
          placeholderTextColor="#AAA"
          value={valor}
          onChangeText={t => { setValor(t); valorRef.current = t; if (!isLoading) dispatch({type: 'RESET'}); }}
          editable={!isLoading}
          multiline
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>Compartimento de Almacenamiento</Text>
        {COMPARTIMENTOS.map(c => (
          <TouchableOpacity
            key={c.value}
            style={[styles.segmentOption, compartimento === c.value && styles.segmentSelected, isLoading && styles.btnDisabled]}
            onPress={() => { if (!isLoading) { setCompartimento(c.value); dispatch({type: 'RESET'}); } }}
            disabled={isLoading}>
            <View style={styles.segmentRow}>
              <View style={[styles.radio, compartimento === c.value && styles.radioSelected]} />
              <View style={styles.segmentTextWrap}>
                <Text style={[styles.segmentLabel, compartimento === c.value && styles.segmentLabelSelected]}>{c.label}</Text>
                <Text style={styles.segmentDesc}>{c.desc}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {isLoading && <ActivityIndicator size="large" color="#4FC3F7" style={styles.loader} />}

        <Text style={styles.sectionTitle}>Acciones</Text>

        <TouchableOpacity
          style={[styles.btnGuardar, isLoading && styles.btnDisabled]}
          onPress={handleGuardar}
          disabled={isLoading}>
          <Text style={styles.btnText}>💾  Guardar Secreto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnRecuperar, isLoading && styles.btnDisabled]}
          onPress={handleRecuperar}
          disabled={isLoading}>
          <Text style={styles.btnText}>🔍  Recuperar Secreto</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#F0F4F8'},
  container: {padding: 20, paddingBottom: 50},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginTop: 20, marginBottom: 10},
  label: {fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4},
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE3ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
    marginBottom: 12,
  },
  inputMulti: {minHeight: 70, textAlignVertical: 'top'},
  segmentOption: {backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#DDE3ED', padding: 14, marginBottom: 8},
  segmentSelected: {borderColor: '#0F3460', backgroundColor: '#EBF3FB'},
  segmentRow: {flexDirection: 'row', alignItems: 'center'},
  radio: {width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#AAA', marginRight: 12},
  radioSelected: {borderColor: '#0F3460', backgroundColor: '#0F3460'},
  segmentTextWrap: {flex: 1},
  segmentLabel: {fontSize: 14, fontWeight: '600', color: '#555'},
  segmentLabelSelected: {color: '#0F3460'},
  segmentDesc: {fontSize: 12, color: '#888', marginTop: 2},
  loader: {marginVertical: 16},
  btnGuardar:  {backgroundColor: '#1B5E20', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8},
  btnRecuperar:{backgroundColor: '#0F3460', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10},
  btnDisabled: {opacity: 0.45},
  btnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
  bannerSuccess: {backgroundColor: '#1B5E20', borderRadius: 10, padding: 12, marginBottom: 10},
  bannerError:   {backgroundColor: '#B71C1C', borderRadius: 10, padding: 12, marginBottom: 10},
  bannerText: {color: '#FFFFFF', fontWeight: '600', fontSize: 14},
});
