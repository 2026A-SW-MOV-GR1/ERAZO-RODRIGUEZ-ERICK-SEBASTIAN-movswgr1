import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import {usePersistence} from '../state/PersistenceContext';
import {useNotas} from '../state/useNotas';
import {NotaItem} from './components/NotaItem';
import {SourceChip} from './components/SourceChip';
import {Nota} from '../domain/Nota';

/**
 * Pantalla principal del CRUD.
 *
 * Responsabilidades de esta capa:
 *  - Renderizar el App Bar con el Switch de motor
 *  - Renderizar el formulario de alta/edición
 *  - Delegar toda la persistencia a useNotas (que a su vez usa el repositorio)
 *  - Mostrar el SourceChip con el origen activo
 *
 * Lo que NO hace: no llama a SQLite ni a MMKV en ningún momento.
 */
export const CrudScreen: React.FC = () => {
  const {motor, setMotor} = usePersistence();
  const {notas, loading, error, crear, actualizar, eliminar} = useNotas(motor);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [editando, setEditando] = useState<Nota | null>(null);

  const limpiarFormulario = () => {
    setTitulo('');
    setContenido('');
    setEditando(null);
  };

  const handleGuardar = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      Alert.alert('Campos requeridos', 'Completa título y contenido.');
      return;
    }
    if (editando) {
      await actualizar({
        ...editando,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fecha: new Date().toISOString(),
      });
    } else {
      await crear(titulo.trim(), contenido.trim());
    }
    limpiarFormulario();
  };

  const handleEditar = (nota: Nota) => {
    setEditando(nota);
    setTitulo(nota.titulo);
    setContenido(nota.contenido);
  };

  const handleEliminar = (id: string) => {
    Alert.alert('Confirmar', '¿Eliminar esta nota?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Eliminar', style: 'destructive', onPress: () => eliminar(id)},
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── App Bar ─────────────────────────────────────── */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          Persistencia Dual
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>SQL</Text>
          <Switch
            value={motor === 'NOSQL'}
            onValueChange={val => setMotor(val ? 'NOSQL' : 'SQL')}
            trackColor={{false: '#4CAF50', true: '#FF9800'}}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#4CAF50"
          />
          <Text style={styles.switchLabel}>NoSQL</Text>
        </View>
      </View>

      {/* ── Indicador del motor activo ───────────────────── */}
      <SourceChip motor={motor} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Formulario ──────────────────────────────────── */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editando ? 'Editar nota' : 'Nueva nota'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor="#BDBDBD"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Contenido"
            placeholderTextColor="#BDBDBD"
            value={contenido}
            onChangeText={setContenido}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
              <Text style={styles.btnText}>
                {editando ? 'Actualizar' : 'Guardar'}
              </Text>
            </TouchableOpacity>
            {editando && (
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={limpiarFormulario}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Mensajes de estado ──────────────────────────── */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* ── Lista de notas ──────────────────────────────── */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={styles.spinner}
          />
        ) : (
          <FlatList
            data={notas}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <NotaItem
                nota={item}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Sin notas en {motor === 'SQL' ? 'SQLite' : 'MMKV'}.{'\n'}
                ¡Crea la primera!
              </Text>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F5F5F5'},
  flex: {flex: 1},
  appBar: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  switchRow: {flexDirection: 'row', alignItems: 'center'},
  switchLabel: {color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginHorizontal: 4},
  form: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {minHeight: 72},
  formButtons: {flexDirection: 'row', gap: 8},
  btnGuardar: {
    flex: 1,
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 14},
  spinner: {marginTop: 30},
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
  listContent: {paddingBottom: 24},
  emptyText: {
    textAlign: 'center',
    color: '#9E9E9E',
    marginTop: 40,
    fontSize: 15,
    lineHeight: 24,
  },
});
