import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { KRISHNA_LEELA_STORIES, type KrishnaLeelaStory } from '@/features/spiritual/krishnaLeelaCatalog';
import { loadOnlineKrishnaLeelaStories } from '@/features/spiritual/krishnaLeelaOnline';

export default function KrishnaLeelaScreen() {
  const colors = useColors();
  const [stories, setStories] = useState<KrishnaLeelaStory[]>(KRISHNA_LEELA_STORIES);
  const [selected, setSelected] = useState<KrishnaLeelaStory>(KRISHNA_LEELA_STORIES[0]);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState('स्थानीय कहानियाँ उपलब्ध हैं।');

  useEffect(() => () => { void Speech.stop(); }, []);

  const speak = async () => {
    await Speech.stop();
    setSpeaking(true);
    Speech.speak(selected.text, {
      language: 'hi-IN',
      rate: 0.82,
      pitch: 1,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stop = async () => {
    await Speech.stop();
    setSpeaking(false);
  };

  const loadOnline = async () => {
    await Speech.stop();
    setSpeaking(false);
    setStatus('ऑनलाइन stories लोड हो रही हैं…');
    try {
      const onlineStories = await loadOnlineKrishnaLeelaStories();
      if (!onlineStories.length) throw new Error('ऑनलाइन feed में अभी stories नहीं हैं।');
      setStories(onlineStories);
      setSelected(onlineStories[0]);
      setStatus(`${onlineStories.length} ऑनलाइन stories लोड हुईं।`);
    } catch (error) {
      setStories(KRISHNA_LEELA_STORIES);
      setSelected(KRISHNA_LEELA_STORIES[0]);
      setStatus(error instanceof Error ? error.message : 'ऑनलाइन stories लोड नहीं हो सकीं; local stories दिखाई जा रही हैं।');
    }
  };

  const useLocal = () => {
    void Speech.stop();
    setSpeaking(false);
    setStories(KRISHNA_LEELA_STORIES);
    setSelected(KRISHNA_LEELA_STORIES[0]);
    setStatus('मेरी local stories सक्रिय हैं।');
  };

  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'कृष्ण लीला'}} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>कृष्ण लीला</Text>
      <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>बालकृष्ण की छोटी कथाएँ पढ़ें और हिंदी टेक्स्ट-टू-स्पीच से सुनें। content source आसानी से बदला जा सकता है।</Text>
      <View style={styles.sources}>
        <Pressable accessibilityRole="button" onPress={()=>void loadOnline()} style={[styles.primaryButton,{backgroundColor:colors.primary}]}>
          <Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>ऑनलाइन stories लोड करें</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={useLocal} style={[styles.secondaryButton,{backgroundColor:colors.card,borderColor:colors.border}]}>
          <Text style={{color:colors.foreground,fontFamily:'Inter_700Bold'}}>मेरी stories</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={[styles.status,{color:colors.mutedForeground}]}>{status}</Text>
      <View style={styles.list}>{stories.map(story=>
        <Pressable key={story.id} accessibilityRole="button" accessibilityState={{selected:story.id===selected.id}} accessibilityLabel={story.title} onPress={()=>{void Speech.stop();setSpeaking(false);setSelected(story);}} style={[styles.story,{backgroundColor:story.id===selected.id?colors.secondary:colors.card,borderColor:colors.border}]}>
          <Text style={[styles.storyTitle,{color:colors.foreground}]}>{story.title}</Text>
          <Text style={[styles.summary,{color:colors.mutedForeground}]}>{story.summary}</Text>
        </Pressable>
      )}</View>
      <View style={[styles.reader,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Text accessibilityRole="header" style={[styles.readerTitle,{color:colors.foreground}]}>{selected.title}</Text>
        <Text selectable style={[styles.body,{color:colors.foreground}]}>{selected.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={speaking?'कहानी सुनना रोकें':'कहानी सुनें'} onPress={()=>void (speaking?stop():speak())} style={[styles.listen,{backgroundColor:colors.primary}]}>
          <Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>{speaking?'सुनना रोकें':'कहानी सुनें'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({
 root:{flex:1},content:{padding:18,paddingBottom:40},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},subtitle:{fontSize:12,lineHeight:18,marginBottom:16},
 sources:{gap:10},primaryButton:{minHeight:46,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:14},secondaryButton:{minHeight:46,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:14},
 status:{fontSize:11,lineHeight:17,marginVertical:12},list:{gap:10},story:{borderWidth:1,borderRadius:16,padding:14},storyTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:5},summary:{fontSize:11,lineHeight:16},
 reader:{borderWidth:1,borderRadius:18,padding:16,marginTop:14},readerTitle:{fontSize:20,fontFamily:'Inter_700Bold',marginBottom:12},body:{fontSize:16,lineHeight:28},listen:{minHeight:46,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:16,marginTop:16}
});
