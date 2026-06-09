import React, {useReducer, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// ── tipos ────────────────────────────────────────────────────────────────────

type Post = {id: number; title: string; body: string};

type State =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; data: Post; banner: string}
  | {status: 'error'; message: string};

type Action =
  | {type: 'FETCH_START'}
  | {type: 'FETCH_OK'; post: Post}
  | {type: 'PUT_OK'; post: Post}
  | {type: 'ERROR'; message: string}
  | {type: 'RESET'};

// ── reducer ──────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return {status: 'loading'};
    case 'FETCH_OK':
      return {status: 'success', data: action.post, banner: ''};
    case 'PUT_OK':
      return {
        status: 'success',
        data: action.post,
        banner: 'Recurso actualizado · 200 OK',
      };
    case 'ERROR':
      return {status: 'error', message: action.message};
    case 'RESET':
      return {status: 'idle'};
    default:
      return state;
  }
}

// ── componente ───────────────────────────────────────────────────────────────

export default function RedScreen(): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, {status: 'idle'});
  const [idText, setIdText] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [idError, setIdError] = React.useState('');

  const isLoading = state.status === 'loading';
  const hasPost = state.status === 'success';

  // Valida el ID (1–100)
  function validateId(): number | null {
    const trimmed = idText.trim();
    if (!trimmed) {
      setIdError('El ID no puede estar vacío.');
      return null;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || isNaN(n)) {
      setIdError('El ID debe ser un número entero.');
      return null;
    }
    if (n < 1 || n > 100) {
      setIdError('El ID debe estar entre 1 y 100.');
      return null;
    }
    setIdError('');
    return n;
  }

  // GET /posts/{id}
  const handleGet = useCallback(async () => {
    const id = validateId();
    if (id === null) return;
    dispatch({type: 'FETCH_START'});
    try {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${id}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const post: Post = await res.json();
      setTitle(post.title);
      setBody(post.body);
      dispatch({type: 'FETCH_OK', post});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      dispatch({type: 'ERROR', message: `Error en GET: ${msg}`});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idText]);

  // PUT /posts/{id}
  const handlePut = useCallback(async () => {
    const id = validateId();
    if (id === null) return;
    dispatch({type: 'FETCH_START'});
    try {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${id}`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id, title, body, userId: 1}),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const post: Post = await res.json();
      dispatch({type: 'PUT_OK', post});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      dispatch({type: 'ERROR', message: `Error en PUT: ${msg}`});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idText, title, body]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        {/* ── Banner de estado ── */}
        {state.status === 'success' && state.banner !== '' && (
          <View style={styles.bannerSuccess}>
            <Text style={styles.bannerText}>✓ {state.banner}</Text>
          </View>
        )}
        {state.status === 'error' && (
          <View style={styles.bannerError}>
            <Text style={styles.bannerText}>✗ {state.message}</Text>
          </View>
        )}

        {/* ── Sección GET ── */}
        <Text style={styles.sectionTitle}>Consultar Post</Text>
        <Text style={styles.label}>ID del Post (1 – 100)</Text>
        <TextInput
          style={[styles.input, idError ? styles.inputError : null]}
          placeholder="Ej. 42"
          placeholderTextColor="#AAA"
          keyboardType="number-pad"
          value={idText}
          onChangeText={t => {
            setIdText(t);
            setIdError('');
            if (state.status !== 'loading') dispatch({type: 'RESET'});
          }}
          editable={!isLoading}
        />
        {idError !== '' && <Text style={styles.errorText}>{idError}</Text>}

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleGet}
          disabled={isLoading}>
          <Text style={styles.btnText}>Consultar (GET)</Text>
        </TouchableOpacity>

        {/* ── Indicador de carga ── */}
        {isLoading && (
          <ActivityIndicator
            size="large"
            color="#4FC3F7"
            style={styles.loader}
          />
        )}

        {/* ── Campos editables (aparecen tras GET) ── */}
        {hasPost && (
          <>
            <Text style={styles.sectionTitle}>Campos del Post</Text>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={title}
              onChangeText={setTitle}
              multiline
              editable={!isLoading}
              placeholderTextColor="#AAA"
            />

            <Text style={styles.label}>Cuerpo</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, {minHeight: 100}]}
              value={body}
              onChangeText={setBody}
              multiline
              editable={!isLoading}
              placeholderTextColor="#AAA"
            />

            {/* ── Sección PUT ── */}
            <TouchableOpacity
              style={[styles.btnSecondary, isLoading && styles.btnDisabled]}
              onPress={handlePut}
              disabled={isLoading}>
              <Text style={styles.btnText}>Actualizar (PUT)</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#F0F4F8'},
  container: {padding: 20, paddingBottom: 40},
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 10,
  },
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
    marginBottom: 6,
  },
  inputMulti: {minHeight: 60, textAlignVertical: 'top'},
  inputError: {borderColor: '#E53935'},
  errorText: {color: '#E53935', fontSize: 12, marginBottom: 8},
  btnPrimary: {
    backgroundColor: '#0F3460',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {opacity: 0.45},
  btnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
  loader: {marginVertical: 16},
  bannerSuccess: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerError: {
    backgroundColor: '#B71C1C',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerText: {color: '#FFFFFF', fontWeight: '600', fontSize: 14},
});
