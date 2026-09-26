import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getCustomElevenLabsApiKey, getCustomProviderApiKey, setCustomElevenLabsApiKey, setCustomProviderApiKey } from '@/features/nexus-assistant/aiProviderPreferences';

export default function ApiStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [openAiKey, setOpenAiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');

  useEffect(() => {
    void Promise.all([
      getCustomProviderApiKey('openai'),
      getCustomProviderApiKey('anthropic'),
      getCustomElevenLabsApiKey(),
    ]).then(([openai, anthropic, elevenlabs]) => {
      setOpenAiKey(openai ?? '');
      setAnthropicKey(anthropic ?? '');
      setElevenLabsKey(elevenlabs ?? '');
    });
  }, []);

  const save = async () => {
    await Promise.all([
      setCustomProviderApiKey('openai', openAiKey),
      setCustomProviderApiKey('anthropic', anthropicKey),
      setCustomElevenLabsApiKey(elevenLabsKey),
    ]);
    Alert.alert('API Studio', 'Your API keys were saved securely on this device.');
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, paddingHorizontal: 18 }}
    >
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="key" size={23} color={colors.primary} /></View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>API Studio</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Add your own provider keys when you want to use your own accounts and billing.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>OpenAI API</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Your personal key is stored locally and is not written to the Nexus Assistant source code.</Text>
        <TextInput
          accessibilityLabel="OpenAI API key"
          value={openAiKey}
          onChangeText={setOpenAiKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="sk-..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Anthropic / Claude API</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Add your personal Anthropic API key when you want to use Claude with your own billing.</Text>
        <TextInput
          accessibilityLabel="Anthropic API key"
          value={anthropicKey}
          onChangeText={setAnthropicKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="sk-ant-..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ElevenLabs API</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Add your personal ElevenLabs key to use your own ElevenLabs account. Your key is stored securely on this device.</Text>
        <TextInput
          accessibilityLabel="ElevenLabs API key"
          value={elevenLabsKey}
          onChangeText={setElevenLabsKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="sk_..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => void save()} style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Save API Keys</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  copy: { flex: 1 },
  title: { fontSize: 23, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  body: { fontSize: 11, lineHeight: 17 },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 12 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, marginTop: 12, fontSize: 12 },
  button: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
