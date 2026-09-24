import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useState } from 'react';
import { createRemoteConnection, getDefaultCapabilities, saveRemoteConnection, type RemoteTransport } from '@/features/remote-control/remoteControlStore';

export default function ConnectComputerScreen(){
 const colors=useColors(); const router=useRouter(); const [name,setName]=useState(''); const [code,setCode]=useState(''); const [transport,setTransport]=useState<RemoteTransport>('wifi');
 const pair=async()=>{ Alert.alert('Computer Remote', 'Computer Remote is Coming Soon. The Nexus PC receiver is currently discontinued.'); };
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
   <Stack.Screen options={{title:'Connect to Computer'}}/>
   <Text style={[styles.title,{color:colors.foreground}]}>Connect to Computer</Text>
   <Text style={[styles.sub,{color:colors.mutedForeground}]}>Supports the Nexus desktop receiver over Wi‑Fi. Bluetooth is kept as a transport option for compatible receivers; live commands require the receiver to be installed.</Text>
   <View style={styles.row}><Pressable onPress={()=>setTransport('wifi')} style={[styles.choice,{borderColor:transport==='wifi'?colors.primary:colors.border}]}><Text style={{color:colors.foreground}}>Wi-Fi</Text></Pressable><Pressable onPress={()=>setTransport('bluetooth')} style={[styles.choice,{borderColor:transport==='bluetooth'?colors.primary:colors.border}]}><Text style={{color:colors.foreground}}>Bluetooth</Text></Pressable></View>
   <TextInput accessibilityLabel="Computer name" placeholder="Computer name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
   <TextInput accessibilityLabel="Computer pairing code" placeholder="6-digit pairing code" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" maxLength={6} value={code} onChangeText={v=>setCode(v.replace(/\D/g,''))} style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
   <Pressable accessibilityRole="button" onPress={pair} style={[styles.primary,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>Pair Computer</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/add-new-connection')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},row:{flexDirection:'row',gap:10},choice:{flex:1,minHeight:48,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},input:{minHeight:50,borderWidth:1,borderRadius:12,paddingHorizontal:12},primary:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center'}});
