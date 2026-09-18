import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useEffect, useState } from 'react';
import { getRemoteConnections, type RemoteConnection } from '@/features/remote-control/remoteControlStore';

export default function RemoteHomeScreen() {
  const colors = useColors(); const router = useRouter(); const [devices, setDevices] = useState<RemoteConnection[]>([]);
  const refresh = async () => { const saved = await getRemoteConnections(); setDevices(saved.filter((item) => item.paired && Boolean(item.pairingSecret))); };
  useEffect(() => { void refresh(); }, []);
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Nexus Remote</Text>
    <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Available connected devices</Text>
    {devices.map((d)=><Pressable key={d.id} accessibilityRole="button" onPress={()=>router.push(d.type==='tv'?'/remote-control/tv':'/remote-control/computer')} style={[styles.device,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.name,{color:colors.foreground}]}>{d.name}</Text>
      <Text style={[styles.meta,{color:colors.mutedForeground}]}>{d.type==='tv'?'TV':'Computer'} · {d.transport.toUpperCase()}</Text>
    </Pressable>)}
    <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/add-new-connection')} style={[styles.add,{backgroundColor:colors.primary}]}>
      <Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>Add New Connection</Text>
    </Pressable>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},subtitle:{fontSize:13},device:{padding:16,borderWidth:1,borderRadius:16},name:{fontSize:16,fontFamily:'Inter_700Bold'},meta:{fontSize:12,marginTop:4},add:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:8}});
