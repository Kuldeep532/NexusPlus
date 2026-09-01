import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => void SplashScreen.hideAsync(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: true }} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
