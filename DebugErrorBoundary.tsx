import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class DebugErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep diagnostics out of the user-facing UI.
    console.error('[Nexus Plus] Render error', { message: error.message, componentStack: errorInfo.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Nexus Plus needs to refresh</Text>
        <Text style={styles.message}>
          Something went wrong on this screen. Your saved data is kept safe. Please try again.
        </Text>
        <Button title="Try Again" onPress={() => this.setState({ hasError: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10, color: '#111' },
  message: { fontSize: 15, lineHeight: 22, marginBottom: 20, color: '#444' },
});
