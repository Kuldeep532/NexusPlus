import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_MEDIA_PLAYER_PREFERENCES, readMediaPlayerPreferences, writeMediaPlayerPreferences, type MediaPlayerPreferences } from '@/features/media-player/mediaPlayerPreferences';

function Choice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{selected}} onPress={onPress} style={({pressed}) => [styles.choice, selected && styles.choiceSelected, pressed && {opacity:.7}]}>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot}/> : null}</View>
    <Text style={styles.choiceText}>{label}</Text>
  </Pressable>;
}
function SwitchRow({title, description, value, onPress}: {title:string;description:string;value:boolean;onPress:()=>void}) {
  return <Pressable accessibilityRole="switch" accessibilityState={{checked:value}} onPress={onPress} style={styles.row}>
    <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
    <Text style={styles.value}>{value ? 'On' : 'Off'}</Text>
  </Pressable>;
}

export default function MediaPlayerSettingsScreen() {
  const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
  const [prefs,setPrefs]=useState<MediaPlayerPreferences>(DEFAULT_MEDIA_PLAYER_PREFERENCES);
  useEffect(()=>{void readMediaPlayerPreferences().then(setPrefs)},[]);
  const save=(next:MediaPlayerPreferences)=>{setPrefs(next);void writeMediaPlayerPreferences(next)};
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <ScrollView contentContainerStyle={{paddingTop:insets.top+12,paddingBottom:insets.bottom+28,paddingHorizontal:18}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={styles.back}><Feather name="arrow-left" size={20} color={colors.foreground}/><Text style={[styles.backText,{color:colors.foreground}]}>Media Player Settings</Text></Pressable>
      <Text style={[styles.heading,{color:colors.foreground}]}>Advanced Media Player Settings</Text>
      <Text style={[styles.subheading,{color:colors.mutedForeground}]}>Playback, subtitles, live video description and speech behavior.</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Video Description</Text>
        <SwitchRow title="Live video description" description="Describe important visual changes while video is playing." value={prefs.videoDescriptionEnabled} onPress={()=>save({...prefs,videoDescriptionEnabled:!prefs.videoDescriptionEnabled})}/>
        <Text style={styles.label}>Description language</Text>
        <View style={styles.choices}>{(['auto','hi','en'] as const).map(v=><Choice key={v} label={v==='auto'?'Auto detect':v==='hi'?'Hindi':'English'} selected={prefs.videoDescriptionLanguage===v} onPress={()=>save({...prefs,videoDescriptionLanguage:v})}/>)}</View>
        <Text style={styles.label}>Speech engine</Text>
        <View style={styles.choices}>{(['auto','piper','system'] as const).map(v=><Choice key={v} label={v==='auto'?'Piper → System fallback':v==='piper'?'Piper TTS':'Android System TTS'} selected={prefs.ttsProvider===v} onPress={()=>save({...prefs,ttsProvider:v})}/>)}</View>
        <Text style={styles.label}>Description interval</Text>
        <View style={styles.choices}>{([5000,7500,10000] as const).map(v=><Choice key={v} label={v/1000+' seconds'} selected={prefs.descriptionIntervalMs===v} onPress={()=>save({...prefs,descriptionIntervalMs:v})}/>)}</View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Playback</Text>
        <SwitchRow title="Auto play" description="Start playback automatically after opening a media item." value={prefs.autoPlay} onPress={()=>save({...prefs,autoPlay:!prefs.autoPlay})}/>
        <SwitchRow title="Background playback" description="Allow audio playback to continue in the background." value={prefs.backgroundPlayback} onPress={()=>save({...prefs,backgroundPlayback:!prefs.backgroundPlayback})}/>
        <SwitchRow title="Resume position" description="Resume media from the last saved position." value={prefs.resumePosition} onPress={()=>save({...prefs,resumePosition:!prefs.resumePosition})}/>
        <SwitchRow title="Remember volume" description="Restore the previous media volume." value={prefs.rememberVolume} onPress={()=>save({...prefs,rememberVolume:!prefs.rememberVolume})}/>
        <SwitchRow title="Subtitles by default" description="Enable available subtitle tracks automatically." value={prefs.subtitlesEnabled} onPress={()=>save({...prefs,subtitlesEnabled:!prefs.subtitlesEnabled})}/>
        <Text style={styles.label}>Skip duration</Text>
        <View style={styles.choices}>{([5,10,15,30] as const).map(v=><Choice key={v} label={v+' seconds'} selected={prefs.skipSeconds===v} onPress={()=>save({...prefs,skipSeconds:v})}/>)}</View>
        <Text style={styles.label}>Playback speed</Text>
        <View style={styles.choices}>{[0.75,1,1.25,1.5,2].map(v=><Choice key={v} label={v+'×'} selected={prefs.playbackRate===v} onPress={()=>save({...prefs,playbackRate:v})}/>)}</View>
      </View>
    </ScrollView>
  </View>
}

const styles=StyleSheet.create({
 root:{flex:1},back:{minHeight:48,flexDirection:'row',alignItems:'center',gap:10},backText:{fontSize:18,fontWeight:'800'},heading:{fontSize:27,fontWeight:'800',marginTop:12},subheading:{fontSize:13,lineHeight:19,marginTop:6},card:{marginTop:18,padding:16,borderRadius:18,backgroundColor:'#171b21',gap:6},section:{fontSize:17,fontWeight:'800',color:'#fff',marginBottom:6},label:{fontSize:13,fontWeight:'700',color:'#fff',marginTop:14},row:{minHeight:62,flexDirection:'row',alignItems:'center',gap:12},copy:{flex:1},title:{fontSize:14,fontWeight:'700',color:'#fff'},description:{fontSize:12,lineHeight:17,color:'#aeb4be',marginTop:2},value:{fontSize:12,fontWeight:'800',color:'#fff'},choices:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{minHeight:42,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:'#39414c',flexDirection:'row',alignItems:'center',gap:7},choiceSelected:{borderColor:'#5f8cff',backgroundColor:'#26303d'},radio:{width:16,height:16,borderRadius:8,borderWidth:2,borderColor:'#7f8794',alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:'#fff'},radioDot:{width:7,height:7,borderRadius:4,backgroundColor:'#fff'},choiceText:{fontSize:12,color:'#fff',fontWeight:'700'}})
