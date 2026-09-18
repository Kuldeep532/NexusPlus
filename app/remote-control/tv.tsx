import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const keys = ['POWER_ON','POWER_OFF','VOLUME_UP','VOLUME_DOWN','MUTE','CHANNEL_UP','CHANNEL_DOWN','HOME','BACK','MENU','UP','DOWN','LEFT','RIGHT','OK','PLAY_PAUSE','REWIND','FAST_FORWARD','GUIDE','INPUT','VOICE_SEARCH'];
const defaults = ['YouTube','Netflix','Prime Video'];

export default function TvRemoteScreen(){
 const colors=useColors(); const router=useRouter();
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
   <Stack.Screen options={{title:'TV Remote'}}/>
   <ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>TV Remote</Text>
    <Text style={[styles.sub,{color:colors.mutedForeground}]}>Universal layout. App shortcuts are populated from the connected TV when supported.</Text>
    <View style={styles.grid}>{keys.map(k=><Pressable key={k} accessibilityRole="button" style={[styles.key,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground,textAlign:'center'}}>{k.replaceAll('_',' ')}</Text></Pressable>)}</View>
    <View style={styles.grid}>{defaults.map(k=><Pressable key={k} accessibilityRole="button" style={[styles.key,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground}}>{k}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/tv-all-apps')} style={[styles.all,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>All Apps</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
   </ScrollView>
 </View>
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:48,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8},all:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center'}});
