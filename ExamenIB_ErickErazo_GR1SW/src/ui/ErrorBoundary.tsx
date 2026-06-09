import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  State
> {
  state: State = {hasError: false, error: ''};

  static getDerivedStateFromError(e: Error): State {
    return {hasError: true, error: e.message};
  }

  reset = () => this.setState({hasError: false, error: ''});

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Error de persistencia</Text>
          <Text style={styles.message}>{this.state.error}</Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  title: {fontSize: 18, fontWeight: '700', color: '#D32F2F', marginBottom: 12},
  message: {
    fontSize: 13,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {color: '#FFF', fontWeight: '700'},
});
