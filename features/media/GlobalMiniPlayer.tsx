import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePersistentMedia } from '@/media-player/PersistentMediaController';

export function GlobalMiniPlayer() {
  const media = usePersistentMedia();
  const router = useRouter();
  if (!media.current) return null;

  return (
    <View style={styles.container} accessibilityRole="summary" accessibilityLabel={`Now playing ${media.current.title}`}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open media player" onPress={() => router.push('/media-player')} style={styles.info}>
        <View style={styles.icon}><Feather name={media.isPlaying ? 'volume-2' : 'pause-circle'} size={18} color="#ffffff" /></View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>{media.current.title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{media.current.artist || 'Audio'}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={media.isPlaying ? 'Pause audio' : 'Play audio'} onPress={media.toggle} style={styles.action}>
        <Feather name={media.isPlaying ? 'pause' : 'play'} size={18} color="#ffffff" />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Close audio player" accessibilityHint="Stops playback" onPress={media.stop} style={styles.action}>
        <Feather name="x" size={19} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 10, right: 10, bottom: 74, minHeight: 58, borderRadius: 16, backgroundColor: '#14181e', borderWidth: 1, borderColor: '#2a3038', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#273243', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 10, marginRight: 6 },
  title: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  subtitle: { color: '#aeb4be', fontSize: 10, marginTop: 2 },
  action: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
