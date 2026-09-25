import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Crash diagnostics for JavaScript/render errors.
 * Release builds keep the app usable by showing a recoverable fallback instead of a blank screen.
 */
export default class DebugErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Nexus Plus] Crash Details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.stack || this.state.error?.toString() || 'Unknown JavaScript error';

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Nexus Plus recovered from an app error</Text>
          <ScrollView style={styles.box} contentContainerStyle={styles.boxContent}>
            <Text selectable style={styles.errorText}>
              {message}
            </Text>
          </ScrollView>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 },
  box: { flex: 1, backgroundColor: '#eee', borderRadius: 5, marginBottom: 10 },
  boxContent: { padding: 10 },
  errorText: { color: '#333', fontFamily: 'monospace' },
});
