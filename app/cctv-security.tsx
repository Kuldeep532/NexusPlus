import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { openCctvSession, closeCctvSession } from '@/features/cctv/cctvSession';
import { getCctvAdapter, CctvBackendError } from '@/features/cctv/cctvBackend';

export default function CctvSecurityScreen() {
  const colors = useColors(); const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [oldPassword, setOldPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [busy, setBusy] = useState(false);
  const changePassword = async () => {
    if (!camera || busy) return;
    if (!oldPassword || !newPassword) { Alert.alert('Both passwords required', 'Enter the current camera password and the new password.'); return; }
    if (newPassword.length < 8) { Alert.alert('Password too short', 'Use at least 8 characters for the new camera password.'); return; }
    setBusy(true);
    try {
      const active = await openCctvSession(camera);
      await getCctvAdapter(camera.protocol).changePassword(active.context, oldPassword, newPassword);
      Alert.alert('Password changed', 'The camera password was changed through the authenticated local ONVIF connection. Update access uses the new credential on the next secure connection.');
    } catch (error) {
      const message = error instanceof CctvBackendError ? error.message : error instanceof Error ? error.message : 'Password change failed.';
      Alert.alert('Password not changed', message);
    } finally {
      await closeCctvSession(camera.id);
      setOldPassword(''); setNewPassword(''); setBusy(false);
    }
  };
  return <View style={[styles.root,{backgroundColor:colors.background}]}><Stack.Screen options={{title:'Camera Security'}}/><View style={styles.content}><Text style={[styles.title,{color:colors.foreground}]}>Camera Security</Text><Text style={[styles.text,{color:colors.mutedForeground}]}>Password changes require a verified local HTTPS ONVIF session. Credentials are kept in protected device storage and are never displayed.</Text><TextInput accessibilityLabel="Current camera password" value={oldPassword} onChangeText={setOldPassword} placeholder="Current password" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={[styles.input,{color:colors.foreground,backgroundColor:colors.card,borderColor:colors.border}]}/><TextInput accessibilityLabel="New camera password" value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={[styles.input,{color:colors.foreground,backgroundColor:colors.card,borderColor:colors.border}]}/><Pressable accessibilityRole="button" accessibilityLabel="Change camera password securely" disabled={busy} onPress={()=>void changePassword()} style={[styles.button,{backgroundColor:colors.primary,opacity:busy?0.6:1}]}><Text style={[styles.buttonText,{color:colors.primaryForeground}]}>{busy?'Changing…':'Change Password'}</Text></Pressable></View></View>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:18,gap:13},title:{fontSize:22,fontFamily:'Inter_700Bold'},text:{fontSize:11,lineHeight:17},input:{minHeight:50,borderWidth:1,borderRadius:13,paddingHorizontal:13,fontSize:13},button:{minHeight:50,borderRadius:14,alignItems:'center',justifyContent:'center'},buttonText:{fontSize:12,fontFamily:'Inter_700Bold'}});
