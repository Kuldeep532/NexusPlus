import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  DOCUMENT_TYPES,
  VAULT_CATEGORY_META,
  VaultCategory,
  VaultItem,
} from '../biometricVaultTypes';

interface Props {
  category: VaultCategory;
  initialItem?: VaultItem;
  onSave: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'> | VaultItem) => void;
  onCancel: () => void;
}

export function VaultItemForm({ category, initialItem, onSave, onCancel }: Props) {
  const colors = useColors();
  const isEdit = Boolean(initialItem);
  const [title, setTitle] = useState(initialItem?.title ?? '');
  const [reveal, setReveal] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!initialItem) return {};
    return Object.fromEntries(
      Object.entries(initialItem).filter(([key]) => !['id', 'category', 'title', 'createdAt', 'updatedAt', 'favorite', 'tags'].includes(key)),
    ) as Record<string, string>;
  });

  const meta = VAULT_CATEGORY_META[category];

  const field = (key: string, label: string, options?: { secure?: boolean; keyboardType?: any; multiline?: boolean; placeholder?: string }) => {
    const secure = options?.secure && !reveal;
    return (
      <View style={styles.field} key={key}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            accessible
            accessibilityLabel={label}
            placeholder={options?.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={values[key] ?? ''}
            onChangeText={(value) => setValues((prev) => ({ ...prev, [key]: value }))}
            style={[styles.input, { color: colors.foreground }, options?.multiline && styles.multiline]}
            secureTextEntry={secure}
            keyboardType={options?.keyboardType}
            multiline={options?.multiline}
            autoCorrect={false}
            autoCapitalize={key === 'website' || key === 'username' || key === 'networkName' ? 'none' : 'sentences'}
            importantForAutofill="no"
            textContentType="none"
          />
          {options?.secure ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={reveal ? `Hide ${label}` : `Reveal ${label}`}
              onPress={() => setReveal((value) => !value)}
              style={styles.eye}
            >
              <MaterialCommunityIcons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const fields = useMemo(() => {
    switch (category) {
      case 'PASSWORD':
        return [
          field('username', 'Username / Email'),
          field('password', 'Password', { secure: true }),
          field('website', 'Website', { placeholder: 'https://example.com' }),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'SECURE_NOTE':
        return [field('content', 'Secure note', { multiline: true })];
      case 'DEBIT_CARD':
        return [
          field('cardHolder', 'Card holder'),
          field('cardNumber', 'Card number', { keyboardType: 'number-pad' }),
          field('expiryMonth', 'Expiry month', { keyboardType: 'number-pad' }),
          field('expiryYear', 'Expiry year', { keyboardType: 'number-pad' }),
          field('cvv', 'CVV', { secure: true, keyboardType: 'number-pad' }),
          field('pin', 'ATM PIN', { secure: true, keyboardType: 'number-pad' }),
          field('bankName', 'Bank name'),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'CREDIT_CARD':
        return [
          field('cardHolder', 'Card holder'),
          field('cardNumber', 'Card number', { keyboardType: 'number-pad' }),
          field('expiryMonth', 'Expiry month', { keyboardType: 'number-pad' }),
          field('expiryYear', 'Expiry year', { keyboardType: 'number-pad' }),
          field('cvv', 'CVV', { secure: true, keyboardType: 'number-pad' }),
          field('creditLimit', 'Credit limit', { keyboardType: 'decimal-pad' }),
          field('bankName', 'Bank name'),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'IDENTITY_DOCUMENT':
        return [
          field('documentType', 'Document type'),
          field('documentNumber', 'Document number', { secure: true }),
          field('expiryDate', 'Expiry date'),
          field('issuingAuthority', 'Issuing authority'),
          field('fileUri', 'Encrypted file reference'),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'BANK_ACCOUNT':
        return [
          field('bankName', 'Bank name'),
          field('accountHolder', 'Account holder'),
          field('accountNumber', 'Account number', { secure: true, keyboardType: 'number-pad' }),
          field('ifsc', 'IFSC'),
          field('branch', 'Branch'),
          field('accountType', 'Account type'),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'WIFI':
        return [
          field('networkName', 'Network name'),
          field('password', 'Wi-Fi password', { secure: true }),
          field('securityType', 'Security type'),
          field('notes', 'Notes', { multiline: true }),
        ];
      case 'SECRET':
        return [
          field('secret', 'Secret', { secure: true, multiline: true }),
          field('notes', 'Notes', { multiline: true }),
        ];
    }
  }, [category, colors.card, colors.foreground, colors.border, colors.mutedForeground, reveal, values]);

  const submit = () => {
    const base = {
      ...(initialItem ?? {}),
      category,
      title: title.trim(),
      ...values,
      favorite: initialItem?.favorite ?? false,
      tags: initialItem?.tags ?? [],
    } as VaultItem;

    if (!base.title.trim()) return;
    onSave(base);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={meta.icon as any} size={23} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{isEdit ? `Edit ${meta.label}` : `New ${meta.label}`}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{meta.description}</Text>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {field('title', 'Title', { placeholder: `Example: ${meta.label}` })}
        {fields}
        {category === 'IDENTITY_DOCUMENT' ? (
          <View style={styles.typeHint}>
            <Text style={[styles.typeHintTitle, { color: colors.foreground }]}>Recommended document types</Text>
            <Text style={[styles.typeHintText, { color: colors.mutedForeground }]}>{DOCUMENT_TYPES.slice(0, 6).join(' • ')}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onCancel} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.secondaryText, { color: colors.foreground }]}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={isEdit ? 'Save changes' : `Create ${meta.label}`} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{isEdit ? 'Save Changes' : 'Save Securely'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)' },
  headerCopy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 19, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  subtitle: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 7 },
  inputWrap: { minHeight: 50, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, fontFamily: 'Inter_400Regular' },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  eye: { width: 48, alignItems: 'center', justifyContent: 'center' },
  typeHint: { borderRadius: 15, padding: 13, marginTop: 2, backgroundColor: 'rgba(0,0,0,0.04)' },
  typeHintTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  typeHintText: { fontSize: 10, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 15, paddingBottom: 20, flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1.4, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
