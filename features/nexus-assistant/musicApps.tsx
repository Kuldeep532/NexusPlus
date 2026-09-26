import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { listInstalledMusicApps, readSelectedMusicApp, selectMusicApp, type InstalledMusicApp } from './musicIntent';

export function MusicAppsPanel() {
  const colors = useColors();
  const [apps, setApps] = useState<InstalledMusicApp[]>([]);
  const [selected, setSelected] = useState<InstalledMusicApp | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    const [available, saved] = await Promise.all([listInstalledMusicApps(), readSelectedMusicApp()]);
    setApps(available);
    setSelected(saved && available.some((app) => app.packageName === saved.packageName) ? saved : null);
  };

  useEffect(() => { void refresh(); }, []);

  const choose = async (app: InstalledMusicApp) => {
    await selectMusicApp(app);
    setSelected(app);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Music"
        onPress={() => setOpen(true)}
        style={[styles.attachItem, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Feather name="music" size={17} color={colors.primary} />
        <Text style={[styles.attachText, { color: colors.foreground }]}>Music</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Select Music App to play</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose one installed compatible music app. This choice is saved and can only be changed from Settings.</Text>
            {apps.length ? apps.map((app) => (
              <Pressable key={app.packageName} accessibilityRole="radio" accessibilityState={{ selected: selected?.packageName === app.packageName }} onPress={() => void choose(app)} style={[styles.appRow, { borderColor: selected?.packageName === app.packageName ? colors.primary : colors.border }]}>
                <Feather name={selected?.packageName === app.packageName ? 'check-circle' : 'circle'} size={20} color={selected?.packageName === app.packageName ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.appName, { color: colors.foreground }]}>{app.label}</Text>
              </Pressable>
            )) : <Text style={[styles.empty, { color: colors.mutedForeground }]}>No compatible music apps were found on this device.</Text>}
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={[styles.close, { borderColor: colors.border }]}>
              <Text style={[styles.closeText, { color: colors.foreground }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function SelectedMusicAppLabel() {
  const [selected, setSelected] = useState<InstalledMusicApp | null>(null);
  useEffect(() => { void readSelectedMusicApp().then(setSelected); }, []);
  return <Text accessibilityLabel={selected ? `Selected music app: ${selected.label}` : 'No music app selected'} style={styles.hiddenLabel}>{selected?.label ?? ''}</Text>;
}

const styles = StyleSheet.create({
  attachItem: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, width: '48%' },
  attachText: { fontSize: 11, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 18 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 18 },
  appRow: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontSize: 14, fontWeight: '700' },
  empty: { fontSize: 13, paddingVertical: 12 },
  close: { minHeight: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  closeText: { fontSize: 13, fontWeight: '700' },
  hiddenLabel: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
