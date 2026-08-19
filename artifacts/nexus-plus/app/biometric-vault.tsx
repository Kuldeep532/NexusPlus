import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VaultLockedView } from '@/features/biometric-vault/components/VaultLockedView';
import { VaultHome } from '@/features/biometric-vault/components/VaultHome';
import { VaultItemForm } from '@/features/biometric-vault/components/VaultItemForm';
import { useBiometricVault } from '@/features/biometric-vault/useBiometricVault';
import { VaultCategory, VaultItem } from '@/features/biometric-vault/biometricVaultTypes';
import { useColors } from '@/hooks/useColors';

export default function BiometricVaultRoute() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const vault = useBiometricVault();
  const [formCategory, setFormCategory] = useState<VaultCategory | null>(null);
  const [editingItem, setEditingItem] = useState<VaultItem | undefined>();

  const closeForm = () => {
    setFormCategory(null);
    setEditingItem(undefined);
  };

  const openItem = (item: VaultItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
  };

  const saveItem = async (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'> | VaultItem) => {
    try {
      if ('id' in item && item.id) {
        await vault.updateItem(item as VaultItem);
      } else {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...newItem } = item as VaultItem;
        void _id; void _createdAt; void _updatedAt;
        await vault.addItem(newItem);
      }
      closeForm();
    } catch {
      Alert.alert('Could not save item', 'The encrypted vault could not be updated. Your existing data was not discarded.');
    }
  };

  const content = !vault.isUnlocked ? (
    <VaultLockedView
      authError={vault.authError}
      strongBiometric={vault.biometricStrong}
      onUnlock={vault.unlock}
    />
  ) : formCategory ? (
    <VaultItemForm
      category={formCategory}
      initialItem={editingItem}
      onSave={saveItem}
      onCancel={closeForm}
    />
  ) : (
    <VaultHome
      items={vault.items}
      sessionExpiresAt={vault.sessionExpiresAt}
      onLock={vault.lock}
      onAdd={(category) => {
        setEditingItem(undefined);
        setFormCategory(category);
      }}
      onOpen={openItem}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
