import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function QRToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<'generator' | 'scanner'>('generator');

  const open = (next: 'generator' | 'scanner') => {
    setSelected(next);
    router.push(next === 'generator' ? '/utilities/qr-generator' : '/utilities/qr-scanner');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderColor: colors.border, backgroundColor: colors.card }]}> 
        <MaterialCommunityIcons name="qrcode" size={28} color={colors.primary} />
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>QR Code Tools</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Generate or scan QR codes.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: selected === 'generator' }} onPress={() => open('generator')} style={[styles.action, { borderColor: selected === 'generator' ? colors.primary : colors.border, backgroundColor: selected === 'generator' ? colors.secondary : colors.card }]}>
          <MaterialCommunityIcons name="qrcode-edit" size={24} color={colors.primary} />
          <View style={styles.actionCopy}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>QR Generator</Text>
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Create Text, URL, WhatsApp, Wi‑Fi and UPI QR codes.</Text>
          </View>
        </Pressable>

        <Pressable accessibilityRole="tab" accessibilityState={{ selected: selected === 'scanner' }} onPress={() => open('scanner')} style={[styles.action, { borderColor: selected === 'scanner' ? colors.primary : colors.border, backgroundColor: selected === 'scanner' ? colors.secondary : colors.card }]}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color={colors.primary} />
          <View style={styles.actionCopy}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>QR Scanner</Text>
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Scan a QR code with the rear camera and view its payload.</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 14 },
  header: { minHeight: 78, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { marginTop: 3, fontSize: 12 },
  actions: { gap: 12 },
  action: { minHeight: 104, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  actionCopy: { flex: 1 },
  actionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  actionText: { marginTop: 5, fontSize: 11, lineHeight: 17 },
});
