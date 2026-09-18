import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function TvAllAppsScreen(){
 const colors=useColors(); const router=useRouter();
 const apps=['YouTube','Netflix','Prime Video','Disney+','Hotstar','Spotify','YouTube Music'];
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'All TV Apps'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>All Apps</Text>
  <Text style={[styles.sub,{color:colors.mutedForeground}]}>Installed apps can be populated automatically after TV receiver discovery is implemented.</Text>
  <View style={styles.grid}>{apps.map(a=><Pressable key={a} style={[styles.app,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground}}>{a}</Text></Pressable>)}</View>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/tv')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},app:{minWidth:'45%',flexGrow:1,minHeight:50,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'}});
