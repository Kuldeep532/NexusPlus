import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Development-only crash diagnostics for JavaScript/render errors.
 * This component intentionally shows nothing special in release builds.
 */
export default class DebugErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[Nexus Plus] Crash Details:', error, errorInfo);
    }
  }

  render() {
    if (__DEV__ && this.state.hasError) {
      const message = this.state.error?.stack || this.state.error?.toString() || 'Unknown JavaScript error';

      return (
        <View style={styles.container}>
          <Text style={styles.title}>App Crashed (Debug Mode)</Text>
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
