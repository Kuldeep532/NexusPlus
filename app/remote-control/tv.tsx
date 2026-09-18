import { Stack, useRouter } from 'expo-router';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { sendUniversalTvKey, type UniversalTvKey } from '@/features/remote-control/tvUniversalRemote';
import { announceRemoteSelection } from '@/features/remote-control/tvAccessibility';
import { getComingSoonLabel } from '@/features/remote-control/remoteReceiverStatus';
import { remoteHaptic } from '@/features/remote-control/remoteFeedback';

const keys: UniversalTvKey[] = ['POWER_ON','POWER_OFF','VOLUME_UP','VOLUME_DOWN','MUTE','CHANNEL_UP','CHANNEL_DOWN','HOME','BACK','MENU','UP','DOWN','LEFT','RIGHT','OK','PLAY_PAUSE','REWIND','FAST_FORWARD','GUIDE','INPUT','VOICE_SEARCH','NUMBER_0','NUMBER_1','NUMBER_2','NUMBER_3','NUMBER_4','NUMBER_5','NUMBER_6','NUMBER_7','NUMBER_8','NUMBER_9','CHANNEL_RETURN'];
const defaults = ['YouTube','Netflix','Prime Video','All Apps'];

export default function TvRemoteScreen(){
  const colors=useColors(); const router=useRouter();
  const [status,setStatus]=useState('Universal remote ready');
  const [lastSelection,setLastSelection]=useState('Remote ready');

  const send = useCallback(async (key: UniversalTvKey, label = key.replaceAll('_',' ')) => {
    setLastSelection(label);
    void remoteHaptic('press');
    await announceRemoteSelection(label);
    try {
      await sendUniversalTvKey(key);
      setStatus(`Sent: ${label}`);
    } catch {
      void remoteHaptic('error');
      setStatus('Universal TV transmitter is not available on this phone');
    }
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 || Math.abs(g.dy) > 24,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > Math.abs(g.dy)) void send(g.dx > 0 ? 'RIGHT' : 'LEFT');
      else void send(g.dy > 0 ? 'DOWN' : 'UP');
    },
  }), [send]);

  return <View style={[styles.root,{backgroundColor:colors.background}]}>
   <Stack.Screen options={{title:'TV Remote'}}/>
   <ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>TV Remote</Text>
    <Text accessibilityLiveRegion="polite" style={[styles.sub,{color:colors.mutedForeground}]}>{status}</Text>
    <Text accessibilityLiveRegion="polite" style={[styles.selection,{color:colors.foreground}]}>Selected: {lastSelection}</Text>
    <View {...panResponder.panHandlers} accessible accessibilityLabel="Swipe pad. Swipe up, down, left or right to navigate the TV. Release to send." style={[styles.pad,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.padTitle,{color:colors.foreground}]}>Swipe / Touch Navigation</Text>
      <Text style={{color:colors.mutedForeground,textAlign:'center'}}>Swipe or use the universal controls below.</Text>
      <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Up" onPress={()=>void send('UP','Up')} style={styles.nav}><Text>▲</Text></Pressable></View>
      <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Left" onPress={()=>void send('LEFT','Left')} style={styles.nav}><Text>◀</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="OK" onPress={()=>void send('OK','OK')} style={[styles.nav,{minWidth:72}]}><Text>OK</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Right" onPress={()=>void send('RIGHT','Right')} style={styles.nav}><Text>▶</Text></Pressable></View>
      <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Down" onPress={()=>void send('DOWN','Down')} style={styles.nav}><Text>▼</Text></Pressable></View>
    </View>
    <View style={styles.grid}>{keys.map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={k.replaceAll('_',' ')} onPress={()=>void send(k)} style={[styles.key,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground,textAlign:'center'}}>{k.replaceAll('_',' ')}</Text></Pressable>)}</View>
    <Text style={[styles.section,{color:colors.foreground}]}>Apps</Text>
    <View style={styles.grid}>{defaults.map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={k} onPress={()=>{ void remoteHaptic('press'); if(k==='All Apps') router.push('/remote-control/tv-all-apps'); else Alert.alert(k,getComingSoonLabel('TV app launch')); }} style={[styles.key,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground}}>{k}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/tv-all-apps')} style={[styles.all,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>All Apps</Text></Pressable>
    <Text style={[styles.sub,{color:colors.mutedForeground}]}>{getComingSoonLabel('TV receiver-dependent screen/accessibility sync')}</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
   </ScrollView>
 </View>
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},selection:{fontSize:16},section:{fontSize:16,fontFamily:'Inter_700Bold'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:48,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8},all:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center'},pad:{borderWidth:1,borderRadius:16,padding:16,gap:10,minHeight:240},padTitle:{fontSize:17,fontFamily:'Inter_700Bold',textAlign:'center'},row:{flexDirection:'row',justifyContent:'center',gap:10},nav:{minWidth:54,minHeight:48,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'}});