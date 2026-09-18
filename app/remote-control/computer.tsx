import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const keys=['CTRL','ALT','SHIFT','TAB','ENTER','ESC','BACKSPACE','SPACE','ARROW_UP','ARROW_DOWN','ARROW_LEFT','ARROW_RIGHT'];

export default function ComputerRemoteScreen(){
 const colors=useColors(); const router=useRouter();
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote</Text>
  <View style={styles.row}><Pressable style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Left Click</Text></Pressable><Pressable style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Right Click</Text></Pressable></View>
  <View style={styles.grid}>{keys.map(k=><Pressable key={k} style={[styles.key,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>{k.replaceAll('_',' ')}</Text></Pressable>)}</View>
  <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/computer-settings')} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Remote Settings</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:10},action:{minHeight:50,borderWidth:1,borderRadius:12,flex:1,alignItems:'center',justifyContent:'center'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:46,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8}});
