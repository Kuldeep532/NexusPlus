import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { getVoicePitchProfiles, type VoiceGender, type VoicePitchProfile } from './voicePitchingEngine';

type Props = {
  value?: string;
  onChange: (profile: VoicePitchProfile) => void;
  gender?: VoiceGender;
};

export function VoicePitchSoundSelector({ value, onChange, gender }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const profiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return getVoicePitchProfiles(gender).filter((profile) => {
      if (!normalized) return true;
      return `${profile.name} ${profile.gender} ${profile.style} ${profile.id}`.toLowerCase().includes(normalized);
    });
  }, [gender, query]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          <Feather name="mic" size={18} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice sound</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Dynamic natural-style pitch profiles</Text>
        </View>
        <Text style={[styles.count, { color: colors.primary }]}>{profiles.length}</Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search voice name"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.search, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
        accessibilityLabel="Search voice sound"
      />

      <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {profiles.map((profile) => {
          const selected = profile.id === value;
          return (
            <Pressable
              key={profile.id}
              onPress={() => onChange(profile)}
              accessibilityRole="button"
              accessibilityLabel={`${profile.name}, ${profile.gender}, ${profile.style}, pitch ${profile.pitchSemitones} semitones`}
              accessibilityState={{ selected }}
              style={[styles.item, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
            >
              <View style={styles.itemCopy}>
                <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{profile.gender} • {profile.style} • pitch {profile.pitchSemitones >= 0 ? '+' : ''}{profile.pitchSemitones} st</Text>
              </View>
              {selected ? <Feather name="check-circle" size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, marginTop: 3 },
  count: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12.5 },
  list: { maxHeight: 420 },
  item: { minHeight: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 7, flexDirection: 'row', alignItems: 'center' },
  itemCopy: { flex: 1 },
  name: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 3 },
});
