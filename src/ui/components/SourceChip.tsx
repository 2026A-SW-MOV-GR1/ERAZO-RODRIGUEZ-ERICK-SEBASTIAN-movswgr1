import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Motor} from '../../data/RepositoryFactory';

interface Props {
  motor: Motor;
}

/**
 * Indicador visual del motor activo.
 * Verde  = SQLite (Relacional)
 * Naranja = NoSQL (MMKV)
 *
 * Decisión: chip en lugar de texto plano para que sea reconocible
 * de un vistazo durante la demostración en vivo.
 */
export const SourceChip: React.FC<Props> = ({motor}) => {
  const isSql = motor === 'SQL';
  return (
    <View style={[styles.chip, isSql ? styles.chipSql : styles.chipNosql]}>
      <View style={[styles.dot, isSql ? styles.dotSql : styles.dotNosql]} />
      <Text style={[styles.text, isSql ? styles.textSql : styles.textNosql]}>
        {isSql ? 'SQLite (Relacional)' : 'NoSQL (MMKV)'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  chipSql: {backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7'},
  chipNosql: {backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFCC80'},
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  dotSql: {backgroundColor: '#4CAF50'},
  dotNosql: {backgroundColor: '#FF9800'},
  text: {fontSize: 13, fontWeight: '600'},
  textSql: {color: '#2E7D32'},
  textNosql: {color: '#E65100'},
});
