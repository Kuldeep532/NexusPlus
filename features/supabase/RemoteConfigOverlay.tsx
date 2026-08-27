import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { fetchRemoteConfig, type RemoteConfigRow } from './remoteConfig';

type Props = { children: React.ReactNode };

export function RemoteConfigOverlay({ children }: Props) {
  const colors = useColors();
  const [rows, setRows] = useState<RemoteConfigRow[]>([]);
  const [dialogKey, setDialogKey] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const next = await fetchRemoteConfig(controller.signal).catch(() => []);
      if (!disposed) setRows(next);
    };

    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(interval);
    };
  }, []);

  const banner = useMemo(() => rows.find((row) => row.kind === 'top_banner'), [rows]);
  const dialog = useMemo(() => rows.find((row) => row.kind === 'dialog'), [rows]);
  const activeDialog = dialogKey === dialog?.key ? dialog : dialog && dialogKey === null ? dialog : null;

  useEffect(() => {
    if (!dialog) {
      setDialogKey(null);
      return;
    }
    setDialogKey((current) => current ?? dialog.key);
  }, [dialog]);

  const openAction = async (row: RemoteConfigRow) => {
    if (!row.action_url) return;
    try {
      await Linking.openURL(row.action_url);
    } catch {
      // Ignore invalid remote URLs.
    }
  };

  return (
    <View style={styles.root}>
      {children}
      {banner && (
        <View accessible accessibilityRole="summary" style={[styles.banner, { backgroundColor: colors.primary }]}>
          <Feather name="info" size={17} color={colors.primaryForeground} accessibilityElementsHidden />
          <View style={styles.bannerCopy}>
            {!!banner.title && <Text style={[styles.bannerTitle, { color: colors.primaryForeground }]}>{banner.title}</Text>}
            {!!banner.message && <Text style={[styles.bannerMessage, { color: colors.primaryForeground }]}>{banner.message}</Text>}
          </View>
          {!!banner.action_label && (
            <Pressable accessibilityRole="button" accessibilityLabel={banner.action_label} onPress={() => void openAction(banner)} style={styles.bannerAction}>
              <Text style={[styles.bannerActionText, { color: colors.primaryForeground }]}>{banner.action_label}</Text>
            </Pressable>
          )}
        </View>
      )}
      <Modal visible={Boolean(activeDialog)} transparent animationType="fade" onRequestClose={() => setDialogKey(null)}>
        <View style={styles.modalBackdrop}>
          <View accessible accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!!activeDialog?.title && <Text accessibilityRole="header" style={[styles.dialogTitle, { color: colors.foreground }]}>{activeDialog.title}</Text>}
            {!!activeDialog?.message && <Text style={[styles.dialogMessage, { color: colors.mutedForeground }]}>{activeDialog.message}</Text>}
            <View style={styles.dialogActions}>
              {!!activeDialog?.action_label && (
                <Pressable accessibilityRole="button" accessibilityLabel={activeDialog.action_label} onPress={() => void openAction(activeDialog)} style={[styles.dialogPrimary, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.dialogPrimaryText, { color: colors.primaryForeground }]}>{activeDialog.action_label}</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={() => setDialogKey(null)} style={[styles.dialogSecondary, { borderColor: colors.border }]}>
                <Text style={[styles.dialogSecondaryText, { color: colors.foreground }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  bannerMessage: { fontSize: 10.5, lineHeight: 15 },
  bannerAction: { paddingHorizontal: 5, paddingVertical: 6 },
  bannerActionText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderWidth: 1, borderRadius: 20, padding: 20 },
  dialogTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  dialogMessage: { fontSize: 12, lineHeight: 18 },
  dialogActions: { marginTop: 18, gap: 9 },
  dialogPrimary: { minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  dialogPrimaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  dialogSecondary: { minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  dialogSecondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
