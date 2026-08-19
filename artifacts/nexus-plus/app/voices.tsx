import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Voice = {
  name: string;
  language: string;
  size: string;
  installed: boolean;
  tone: 'primary' | 'accent' | 'secondary';
};

const voiceData: Voice[] = [
  { name: 'Aarav', language: 'English · India', size: '42 MB', installed: true, tone: 'primary' },
  { name: 'Priya', language: 'Hindi · India', size: '38 MB', installed: true, tone: 'accent' },
  { name: 'Sofia', language: 'English · US', size: '44 MB', installed: false, tone: 'secondary' },
];

export default function VoicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState<Voice[]>(voiceData);
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = (name: string) => {
    setDownloading(name);
    setTimeout(() => {
      setVoices((current) => current.map((voice) => voice.name === name ? { ...voice, installed: true } : voice));
      setDownloading(null);
    }, 900);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>VOICE LIBRARY</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voices that work{'\n'}without a signal.</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Download once. Use them anywhere in the Reader.</Text>
      </View>

      <View style={[styles.info, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
          <Feather name="wifi-off" size={17} color={colors.primary} />
        </View>
        <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>Voice files are stored locally. Playback stays available offline.</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>AVAILABLE VOICES</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{voices.filter((voice) => voice.installed).length} ready</Text>
      </View>
      {voices.map((voice) => {
        const voiceColor = voice.tone === 'primary' ? colors.primary : voice.tone === 'accent' ? colors.accent : colors.secondaryForeground;
        const isDownloading = downloading === voice.name;
        return (
          <View key={voice.name} style={[styles.voice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.avatarText, { color: voiceColor }]}>{voice.name[0]}</Text>
            </View>
            <View style={styles.voiceCopy}>
              <Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text>
              <Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.language} · {voice.size}</Text>
              <Text style={[styles.tagText, { color: voice.installed ? colors.primary : colors.mutedForeground }]}>{voice.installed ? 'READY OFFLINE' : 'AVAILABLE TO DOWNLOAD'}</Text>
            </View>
            {voice.installed ? (
              <View style={[styles.ready, { backgroundColor: colors.muted }]}>
                <Feather name="check" size={17} color={colors.primary} />
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isDownloading ? `Downloading ${voice.name} voice` : `Download ${voice.name} voice`}
                testID={`voice-download-${voice.name.toLowerCase()}`}
                onPress={() => download(voice.name)}
                disabled={isDownloading}
                style={({ pressed }) => [styles.download, { borderColor: colors.primary }, pressed && styles.pressed]}
              >
                <Feather name={isDownloading ? 'clock' : 'download'} size={14} color={colors.primary} />
                <Text style={[styles.downloadText, { color: colors.primary }]}>{isDownloading ? 'Adding' : 'Get'}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <View style={[styles.note, { borderColor: colors.border }]}>
        <Feather name="headphones" size={17} color={colors.accent} />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>Choose a voice in your device settings to make it the default for new reading sessions.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 20, marginBottom: 21 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  title: { fontSize: 29, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  info: { marginHorizontal: 20, padding: 13, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 27 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium', marginLeft: 10 },
  sectionHeader: { marginHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  label: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  voice: { marginHorizontal: 20, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  voiceCopy: { flex: 1, marginLeft: 12, marginRight: 9 },
  voiceName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  voiceMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 7 },
  tagText: { fontSize: 9, letterSpacing: 0.9, fontFamily: 'Inter_700Bold' },
  ready: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  download: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  downloadText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  note: { margin: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', gap: 9 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.72 },
});