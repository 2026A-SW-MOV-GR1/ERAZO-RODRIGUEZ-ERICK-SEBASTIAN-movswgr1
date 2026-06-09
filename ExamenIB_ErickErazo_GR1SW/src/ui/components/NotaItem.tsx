import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Nota} from '../../domain/Nota';

interface Props {
  nota: Nota;
  onEditar: (nota: Nota) => void;
  onEliminar: (id: string) => void;
}

/** Tarjeta de presentación de una nota individual en el FlatList */
export const NotaItem: React.FC<Props> = ({nota, onEditar, onEliminar}) => {
  const fechaLocal = new Date(nota.fecha).toLocaleString('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.titulo} numberOfLines={1}>
          {nota.titulo}
        </Text>
        <Text style={styles.contenido} numberOfLines={2}>
          {nota.contenido}
        </Text>
        <Text style={styles.fecha}>{fechaLocal}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => onEditar(nota)}
          accessibilityLabel="Editar nota">
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnEliminar}
          onPress={() => onEliminar(nota.id)}
          accessibilityLabel="Eliminar nota">
          <Text style={styles.btnText}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  content: {flex: 1, marginRight: 10},
  titulo: {fontSize: 15, fontWeight: '700', color: '#212121'},
  contenido: {fontSize: 13, color: '#555', marginTop: 3},
  fecha: {fontSize: 11, color: '#BDBDBD', marginTop: 5},
  actions: {gap: 6},
  btnEditar: {
    backgroundColor: '#FF9800',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnEliminar: {
    backgroundColor: '#F44336',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {color: '#fff', fontSize: 12, fontWeight: '700'},
});
