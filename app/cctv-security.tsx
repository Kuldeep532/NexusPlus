import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { readCctvSecrets } from '@/features/cctv/cctvStorage';

export default function CctvSecurityScreen() {
  const colors = useColors(); const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [oldPassword, setOldPassword] = useState(''); const [newPassword, setNewPassword] = useState('');
  const changePassword = async () => {
    if (!camera) return;
    if (!oldPassword || !newPassword) { Alert.alert('Both passwords required', 'Enter the current camera password and the new password.'); return; }
    const secrets = await readCctvSecrets(camera.id);
    if (!secrets) { Alert.alert('Camera credentials unavailable', 'Local credentials could not be read. No change was attempted.'); return; }
    Alert.alert('Secure adapter required', 'Password change will be enabled only for a verified camera adapter on the same local network. No remote service is used.');
  };
  return <View style={[styles.root,{backgroundColor:colors.background}]}><Stack.Screen options={{title:'Camera Security'}}/><View style={styles.content}><Text style={[styles.title,{color:colors.foreground}]}>Camera Security</Text><Text style={[styles.text,{color:colors.mutedForeground}]}>Password changes stay local and require a verified same-network camera adapter.</Text><TextInput accessibilityLabel="Current camera password" value={oldPassword} onChangeText={setOldPassword} placeholder="Current password" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={[styles.input,{color:colors.foreground,backgroundColor:colors.card,borderColor:colors.border}]}/><TextInput accessibilityLabel="New camera password" value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={[styles.input,{color:colors.foreground,backgroundColor:colors.card,borderColor:colors.border}]}/><Pressable accessibilityRole="button" accessibilityLabel="Change camera password" onPress={()=>void changePassword()} style={[styles.button,{backgroundColor:colors.primary}]}><Text style={[styles.buttonText,{color:colors.primaryForeground}]}>Change Password</Text></Pressable></View></View>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:18,gap:13},title:{fontSize:22,fontFamily:'Inter_700Bold'},text:{fontSize:11,lineHeight:17},input:{minHeight:50,borderWidth:1,borderRadius:13,paddingHorizontal:13,fontSize:13},button:{minHeight:50,borderRadius:14,alignItems:'center',justifyContent:'center'},buttonText:{fontSize:12,fontFamily:'Inter_700Bold'}});
