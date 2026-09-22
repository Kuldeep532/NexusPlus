import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { KRISHNA_MANTRAS } from '@/features/spiritual/krishnaMantraCatalog';

export default function KrishnaMantrasScreen(){
 const c=useColors();
 return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Krishna Mantras'}}/><ScrollView contentContainerStyle={s.content}>
 <Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Krishna Mantras</Text>
 <Text style={[s.sub,{color:c.mutedForeground}]}>A dedicated Krishna devotional library. Audio can be added to each verified recording without bundling files in the app.</Text>
 {KRISHNA_MANTRAS.map(m=><View key={m.id} style={[s.card,{backgroundColor:c.card,borderColor:c.border}]}>
  <Text style={[s.name,{color:c.foreground}]}>{m.title}</Text><Text style={[s.sanskrit,{color:c.foreground}]}>{m.sanskrit}</Text><Text style={[s.meaning,{color:c.mutedForeground}]}>{m.meaning}</Text>
  <Pressable accessibilityRole="button" onPress={()=>Speech.speak(m.sanskrit,{language:'hi-IN',rate:0.72})} style={[s.button,{backgroundColor:c.primary}]}><Text style={{color:c.primaryForeground,fontFamily:'Inter_700Bold'}}>Listen / Chant</Text></Pressable>
 </View>)}
 </ScrollView></View>
}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,paddingBottom:35},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:18},card:{borderWidth:1,borderRadius:18,padding:15,marginBottom:10},name:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:10},sanskrit:{fontSize:20,lineHeight:32,textAlign:'center',fontFamily:'Inter_700Bold'},meaning:{fontSize:11,lineHeight:17,marginTop:10},button:{height:45,borderRadius:13,alignItems:'center',justifyContent:'center',marginTop:12}});
