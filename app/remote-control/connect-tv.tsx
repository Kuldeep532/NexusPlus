import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { createRemoteConnection, getDefaultCapabilities, getRemoteConnections, saveRemoteConnection, type RemoteConnection } from '@/features/remote-control/remoteControlStore';
import { isUniversalIrAvailable, discoverWifiTvs } from '@/features/remote-control/tvUniversalRemote';

export default function ConnectTvScreen(){
 const colors=useColors(); const router=useRouter();
 const [devices,setDevices]=useState<Array<{id:string;name:string;address?:string;brand?:string}>>([]);
 const [irAvailable,setIrAvailable]=useState(false);
 const [busy,setBusy]=useState(false); const [name,setName]=useState('');
 useEffect(()=>{ void refresh(); void isUniversalIrAvailable().then(setIrAvailable); },[]);
 const refresh=async()=>{setBusy(true); try{setDevices(await discoverWifiTvs());}finally{setBusy(false);}};
 const useUniversal=async (transport:'wifi'|'ir', chosen?:{name:string;address?:string;brand?:string})=>{
   const connection=createRemoteConnection({name: chosen?.name ?? (name.trim() || (transport === 'ir' ? 'IR TV' : 'Wi-Fi TV')),type:'tv',transport,capabilities:{...getDefaultCapabilities('tv',transport),apps:true,navigation:true,volume:true,power:true,ir:transport==='ir'},address:chosen?.address,online:transport==='wifi'&&Boolean(chosen?.address),paired:true,pairingState:'paired'});
   await saveRemoteConnection(connection); router.replace('/remote-control/tv');
 };
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
   <Stack.Screen options={{title:'Connect to TV'}}/>
   <ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Connect to TV</Text>
    <Text style={[styles.sub,{color:colors.mutedForeground}]}>Use automatic Wi-Fi discovery for smart TVs, or a universal IR remote when this phone has an IR transmitter.</Text>
    <Pressable accessibilityRole="button" onPress={()=>void refresh()} style={[styles.primary,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>{busy?'Refreshing…':'Automatic Wi‑Fi discovery · Refresh'}</Text></Pressable>
    {devices.map(d=><Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`Pair ${d.name}`} onPress={()=>void useUniversal('wifi',d)} style={[styles.device,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.deviceName,{color:colors.foreground}]}>{d.name}</Text><Text style={{color:colors.mutedForeground}}>{d.brand ? d.brand+' · ' : ''}{d.address ?? 'Wi‑Fi TV'}</Text></Pressable>)}
    {!devices.length && <Text style={[styles.sub,{color:colors.mutedForeground}]}>No compatible Wi‑Fi TV discovered yet. The universal Wi‑Fi control surface remains available after receiver support is added.</Text>}
    <TextInput accessibilityLabel="TV name" placeholder="Optional TV name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
    <Pressable accessibilityRole="button" onPress={()=>void useUniversal('wifi',{name:name.trim()||'Universal Wi‑Fi TV'})} style={[styles.secondary,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground,fontFamily:'Inter_700Bold'}}>Use Universal Wi‑Fi Remote</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>irAvailable?void useUniversal('ir',{name:name.trim()||'Universal IR TV'}):Alert.alert('IR TV','No Android IR transmitter is available on this phone. IR receiver pairing will be available on supported phones.') } style={[styles.secondary,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground,fontFamily:'Inter_700Bold'}}>Pair with IR TV</Text></Pressable>
    <Text style={[styles.sub,{color:colors.mutedForeground}]}>Pairing gesture: double-tap and hold on “Pair with IR TV” will be supported as a dedicated accessible pairing action. Brand-specific remote layouts will be added when the TV identifies its brand; otherwise Nexus uses the fixed universal layout.</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/add-new-connection')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
   </ScrollView>
 </View>}
const styles=StyleSheet.create({root:{flex:1},content:{padding:18,gap:12,paddingBottom:30},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:13,lineHeight:19},input:{minHeight:50,borderWidth:1,borderRadius:12,paddingHorizontal:12},primary:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center'},secondary:{minHeight:52,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:10},device:{padding:15,borderWidth:1,borderRadius:14},deviceName:{fontSize:16,fontFamily:'Inter_700Bold'}});