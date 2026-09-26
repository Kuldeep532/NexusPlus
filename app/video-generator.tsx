import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  generateRunwayVideo,
  downloadGeneratedVideo,
  saveVideoHistory,
  type VideoHistoryItem,
} from '@/features/video-generator/runwayVideoGenerator';

function GeneratedVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; void p.play(); });
  return <VideoView player={player} nativeControls style={{ width:'100%', aspectRatio:16/9, borderRadius:16 }} />;
}

export default function VideoGeneratorScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string|null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // History is intentionally local to this device.
  }, []);

  const generate = async () => {
    const text = prompt.trim();
    if (!text) {
      Alert.alert('Add a description', 'Describe the video you want to create.');
      return;
    }
    setBusy(true);
    try {
      const uri = await generateRunwayVideo({ prompt:text });
      setVideoUrl(uri);
      await saveVideoHistory(text, uri);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const message =
        code === 'SIGN_IN_REQUIRED' ? 'Please sign in to generate videos.' :
        code === 'MEDIA_PERMISSION_REQUIRED' ? 'Allow photo and video access to download the video.' :
        'The video could not be generated right now. Please try again.';
      Alert.alert('Video generation', message);
    } finally {
      setBusy(false);
    }
  };

  const regenerate = () => { void generate(); };

  const download = async () => {
    if (!videoUrl) return;
    setDownloading(true);
    try {
      await downloadGeneratedVideo(videoUrl);
      Alert.alert('Video saved', 'The video has been saved to your device.');
    } catch {
      Alert.alert('Download failed', 'The video could not be saved. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const goBack = () => {
    if (videoUrl) {
      void saveVideoHistory(prompt.trim(), videoUrl);
      router.back();
      return;
    }
    router.back();
  };

  return <ScrollView
    style={{flex:1,backgroundColor:colors.background}}
    contentContainerStyle={{padding:18,paddingTop:insets.top+10,paddingBottom:insets.bottom+28,gap:12}}
  >
    <Stack.Screen options={{ headerShown:false }} />
    <View style={styles.header}>
      <Pressable accessibilityRole='button' accessibilityLabel='Back' onPress={goBack} style={[styles.back,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Feather name='arrow-left' size={20} color={colors.foreground}/>
      </Pressable>
      <View style={{flex:1}}>
        <Text accessibilityRole='header' style={[styles.title,{color:colors.foreground}]}>Video Generator</Text>
        <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Create a video from a description.</Text>
      </View>
      <Pressable accessibilityRole='button' onPress={()=>router.push('/video-generator-settings' as never)} style={[styles.back,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Feather name='settings' size={19} color={colors.foreground}/>
      </Pressable>
    </View>

    <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.section,{color:colors.foreground}]}>Describe your video</Text>
      <TextInput
        multiline
        value={prompt}
        onChangeText={setPrompt}
        editable={!busy}
        placeholder='Example: A peaceful sunrise over the Himalayas with soft clouds'
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel='Video description'
        style={[styles.input,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.background}]}
      />
      <Pressable accessibilityRole='button' disabled={busy} onPress={()=>void generate()} style={[styles.primary,{backgroundColor:colors.primary,opacity:busy?0.6:1}]}>
        {busy?<ActivityIndicator color={colors.primaryForeground}/>:<Feather name='video' size={18} color={colors.primaryForeground}/>}
        <Text style={[styles.primaryText,{color:colors.primaryForeground}]}>{busy?'Creating video…':'Generate Video'}</Text>
      </Pressable>
    </View>

    {videoUrl ? <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.section,{color:colors.foreground}]}>Your video</Text>
      <GeneratedVideo uri={videoUrl}/>
      <View style={styles.actions}>
        <Pressable accessibilityRole='button' onPress={()=>void regenerate()} disabled={busy} style={[styles.secondary,{borderColor:colors.border,backgroundColor:colors.background}]}>
          <Feather name='refresh-cw' size={17} color={colors.foreground}/>
          <Text style={[styles.secondaryText,{color:colors.foreground}]}>Regenerate Video</Text>
        </Pressable>
        <Pressable accessibilityRole='button' onPress={()=>void download()} disabled={downloading} style={[styles.secondary,{borderColor:colors.border,backgroundColor:colors.background}]}>
          {downloading?<ActivityIndicator color={colors.primary}/>:<Feather name='download' size={17} color={colors.foreground}/>}
          <Text style={[styles.secondaryText,{color:colors.foreground}]}>Download Video</Text>
        </Pressable>
      </View>
      <Text style={[styles.hint,{color:colors.mutedForeground}]}>Going back saves this video in your local Video Generator history.</Text>
    </View> : null}

    {history.length ? null : null}
  </ScrollView>;
}

const styles=StyleSheet.create({
 root:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:4},
 back:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},
 title:{fontSize:24,fontFamily:'Inter_700Bold'},subtitle:{fontSize:11,lineHeight:16,marginTop:3},
 card:{borderWidth:1,borderRadius:18,padding:14},section:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:8},
 input:{minHeight:130,borderWidth:1,borderRadius:14,padding:12,textAlignVertical:'top',fontSize:12},
 primary:{minHeight:50,borderRadius:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:10},
 primaryText:{fontSize:12,fontFamily:'Inter_700Bold'},actions:{gap:8,marginTop:10},
 secondary:{minHeight:48,borderWidth:1,borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 secondaryText:{fontSize:11,fontFamily:'Inter_700Bold'},hint:{fontSize:10.5,lineHeight:16,marginTop:10}
});
