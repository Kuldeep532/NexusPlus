import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VAULT_CATEGORY_META, VaultCategory, VaultItem } from '../biometricVaultTypes';

interface Props {
  items: VaultItem[];
  sessionExpiresAt: number | null;
  onLock: () => void;
  onAdd: (category: VaultCategory) => void;
  onOpen: (item: VaultItem) => void;
}

const CATEGORY_ORDER: VaultCategory[] = [
  'PASSWORD', 'SECURE_NOTE', 'DEBIT_CARD', 'CREDIT_CARD',
  'IDENTITY_DOCUMENT', 'BANK_ACCOUNT', 'WIFI', 'SECRET',
];

function maskValue(category: VaultCategory, item: VaultItem): string {
  switch (category) {
    case 'PASSWORD': return (item as Extract<VaultItem, { category: 'PASSWORD' }>).username || 'Saved login';
    case 'SECURE_NOTE': return 'Encrypted note';
    case 'DEBIT_CARD': {
      const value = (item as Extract<VaultItem, { category: 'DEBIT_CARD' }>).cardNumber;
      return value ? `•••• ${value.replace(/\s/g, '').slice(-4)}` : 'Debit card';
    }
    case 'CREDIT_CARD': {
      const value = (item as Extract<VaultItem, { category: 'CREDIT_CARD' }>).cardNumber;
      return value ? `•••• ${value.replace(/\s/g, '').slice(-4)}` : 'Credit card';
    }
    case 'IDENTITY_DOCUMENT': return (item as Extract<VaultItem, { category: 'IDENTITY_DOCUMENT' }>).documentType;
    case 'BANK_ACCOUNT': return 'Bank account';
    case 'WIFI': return (item as Extract<VaultItem, { category: 'WIFI' }>).networkName;
    case 'SECRET': return 'Protected secret';
  }
}

export function VaultHome({ items, sessionExpiresAt, onLock, onAdd, onOpen }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<VaultCategory | 'ALL'>('ALL');
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'ALL' || item.category === category;
      const matchesQuery = !q || `${item.title} ${(item.tags ?? []).join(' ')}`.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  const secondsLeft = sessionExpiresAt ? Math.max(0, Math.ceil((sessionExpiresAt - now) / 1000)) : null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Your Vault</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Everything sensitive, protected in one place.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lock vault now"
          onPress={onLock}
          style={[styles.lockButton, { backgroundColor: colors.secondary }]}
        >
          <MaterialCommunityIcons name="lock" size={20} color={colors.foreground} />
          {secondsLeft !== null ? <Text style={[styles.timer, { color: secondsLeft < 15 ? colors.destructive : colors.mutedForeground }]}>{secondsLeft}s</Text> : null}
        </Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          accessible
          accessibilityLabel="Search vault"
          accessibilityHint="Search by item title or tag"
          placeholder="Search your vault"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
          autoCorrect={false}
          importantForAutofill="no"
          secureTextEntry={false}
        />
      </View>

      <FlatList
        horizontal
        data={['ALL', ...CATEGORY_ORDER] as const}
        keyExtractor={(value) => value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item: value }) => {
          const selected = category === value;
          const label = value === 'ALL' ? 'All' : VAULT_CATEGORY_META[value].label;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Filter ${label}`}
              onPress={() => setCategory(value)}
              style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
              <Text style={[styles.chipText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[styles.count, { color: colors.mutedForeground }]}>{filtered.length} protected item{filtered.length === 1 ? '' : 's'}</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shield-search" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing here yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add your first protected item and it will be encrypted before storage.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = VAULT_CATEGORY_META[item.category];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${meta.label}: ${item.title}`}
              accessibilityHint="Open protected item"
              onPress={() => onOpen(item)}
              style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name={meta.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{maskValue(item.category, item)}</Text>
              </View>
              {item.favorite ? <MaterialCommunityIcons name="star" size={17} color={colors.accent} style={styles.star} /> : null}
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          );
        }}
      />

      <FlatList
        horizontal
        data={CATEGORY_ORDER}
        keyExtractor={(value) => `add-${value}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.addRow}
        renderItem={({ item: value }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${VAULT_CATEGORY_META[value].label}`}
            onPress={() => onAdd(value)}
            style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <MaterialCommunityIcons name={VAULT_CATEGORY_META[value].icon as any} size={19} color={colors.primary} />
            <Text style={[styles.addText, { color: colors.foreground }]}>{VAULT_CATEGORY_META[value].label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  titleWrap: { flex: 1, marginRight: 12 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  lockButton: { minWidth: 48, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, paddingHorizontal: 10 },
  timer: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  search: { marginHorizontal: 20, minHeight: 50, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 9, fontSize: 13, fontFamily: 'Inter_400Regular' },
  categories: { paddingHorizontal: 20, paddingVertical: 13, gap: 8 },
  chip: { minHeight: 37, borderRadius: 12, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 20, paddingBottom: 145 },
  count: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  row: { minHeight: 72, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12, marginRight: 8 },
  itemTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  itemMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  star: { marginRight: 8 },
  pressed: { opacity: 0.75 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 14 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', fontFamily: 'Inter_400Regular', marginTop: 6 },
  addRow: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  addButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  addText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
