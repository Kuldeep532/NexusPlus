import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useState } from 'react';
import { createRemoteConnection, getDefaultCapabilities, saveRemoteConnection } from '@/features/remote-control/remoteControlStore';

export default function ConnectTvScreen(){
 const colors=useColors(); const router=useRouter(); const [name,setName]=useState(''); const [code,setCode]=useState('');
 const pair=async()=>{ if(!name.trim()||code.length!==6){Alert.alert('TV pairing','Enter TV name and the 6-digit code shown by the TV.');return;} await saveRemoteConnection(createRemoteConnection({name:name.trim(),type:'tv',transport:'wifi',capabilities:getDefaultCapabilities('tv','wifi'),online:true})); router.replace('/remote-control/tv'); };
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
   <Stack.Screen options={{title:'Connect to TV'}}/>
   <Text style={[styles.title,{color:colors.foreground}]}>Connect to TV</Text>
   <Text style={[styles.sub,{color:colors.mutedForeground}]}>The TV must be on the same Wi-Fi network. First pairing uses the code displayed on the TV.</Text>
   <TextInput accessibilityLabel="TV name" placeholder="TV name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
   <TextInput accessibilityLabel="TV pairing code" placeholder="6-digit pairing code" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" maxLength={6} value={code} onChangeText={v=>setCode(v.replace(/\D/g,''))} style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
   <Pressable accessibilityRole="button" onPress={pair} style={[styles.primary,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>Pair TV</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/add-new-connection')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},input:{minHeight:50,borderWidth:1,borderRadius:12,paddingHorizontal:12},primary:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center'}});
