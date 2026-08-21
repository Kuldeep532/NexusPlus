import React from 'react';
import { Stack } from 'expo-router';
import { NexusMediaPlayer } from '@/media-player';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function MediaPlayerRoute() {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Nexus Media Player', headerShown: false }} />
      <NexusMediaPlayer />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
