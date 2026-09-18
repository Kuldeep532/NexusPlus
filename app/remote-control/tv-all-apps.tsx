import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { launchTvApp } from '@/features/remote-control/tvAppLaunch';
import { remoteHaptic } from '@/features/remote-control/remoteFeedback';

type TvApp = { id: string; name: string; category: string; packageHints: string[] };

export const GENERIC_TV_APPS: TvApp[] = [
  { id: 'youtube', name: 'YouTube', category: 'Video', packageHints: ['com.google.android.youtube.tv'] },
  { id: 'netflix', name: 'Netflix', category: 'Video', packageHints: ['com.netflix.ninja'] },
  { id: 'prime-video', name: 'Prime Video', category: 'Video', packageHints: ['com.amazon.amazonvideo.livingroom'] },
  { id: 'disney-plus', name: 'Disney+', category: 'Video', packageHints: ['com.disney.disneyplus'] },
  { id: 'hotstar', name: 'JioHotstar', category: 'India', packageHints: ['in.startv.hotstar'] },
  { id: 'jio-cinema', name: 'JioCinema', category: 'India', packageHints: ['com.jio.media.ondemand'] },
  { id: 'zee5', name: 'ZEE5', category: 'India', packageHints: ['com.graymatrix.did'] },
  { id: 'sonyliv', name: 'Sony LIV', category: 'India', packageHints: ['com.sonyliv'] },
  { id: 'jiotv', name: 'JioTV', category: 'India', packageHints: ['com.jio.jioplay.tv'] },
  { id: 'mx-player', name: 'MX Player', category: 'Video', packageHints: ['com.mxtech.videoplayer.ad'] },
  { id: 'spotify', name: 'Spotify', category: 'Music', packageHints: ['com.spotify.tv.android'] },
  { id: 'youtube-music', name: 'YouTube Music', category: 'Music', packageHints: ['com.google.android.apps.youtube.music'] },
  { id: 'twitch', name: 'Twitch', category: 'Video', packageHints: ['tv.twitch.android.app'] },
  { id: 'plex', name: 'Plex', category: 'Media', packageHints: ['com.plexapp.android'] },
  { id: 'vlc', name: 'VLC', category: 'Media', packageHints: ['org.videolan.vlc'] },
  { id: 'discovery-plus', name: 'discovery+', category: 'Video', packageHints: ['com.discovery.discoveryplus'] },
  { id: 'crunchyroll', name: 'Crunchyroll', category: 'Video', packageHints: ['com.crunchyroll.crunchyroid'] },
  { id: 'apple-tv', name: 'Apple TV', category: 'Video', packageHints: ['com.apple.atve.androidtv.appletv'] },
  { id: 'paramount-plus', name: 'Paramount+', category: 'Video', packageHints: ['com.paramountplus'] },
  { id: 'max', name: 'Max', category: 'Video', packageHints: ['com.hbo.hbonow'] },
  { id: 'peacock', name: 'Peacock', category: 'Video', packageHints: ['com.peacocktv.peacockandroid'] },
  { id: 'tubi', name: 'Tubi', category: 'Video', packageHints: ['com.tubitv'] },
  { id: 'facebook-watch', name: 'Facebook Watch', category: 'Social', packageHints: ['com.facebook.katana'] },
  { id: 'ted', name: 'TED', category: 'Education', packageHints: ['com.ted.android.tv'] },
  { id: 'weather', name: 'Weather', category: 'Utility', packageHints: [] },
  { id: 'google-play-store', name: 'Google Play Store', category: 'System', packageHints: ['com.android.vending'] },
  { id: 'settings', name: 'TV Settings', category: 'System', packageHints: ['com.android.tv.settings'] },
  { id: 'live-tv', name: 'Live TV', category: 'TV', packageHints: ['com.google.android.tv.livechannels'] },
];

export default function TvAllAppsScreen() {
  const colors = useColors(); const router = useRouter();

  const openGenericApp = async (app: TvApp) => {
    void remoteHaptic('press');
    if (!app.packageHints.length) {
      void remoteHaptic('error');
      Alert.alert(app.name, 'This TV app cannot be checked without a TV connection. The app is not installed or not available through the current remote transport.');
      return;
    }
    try {
      await launchTvApp(app.packageHints);
    } catch (error) {
      if (error instanceof Error && error.message === 'APP_NOT_INSTALLED') {
        void remoteHaptic('error');
        Alert.alert(app.name, 'The app is not installed or this TV does not expose that app through the current remote transport.');
      } else {
        void remoteHaptic('error');
        Alert.alert(app.name, 'The app could not be opened on this device.');
      }
    }
  };

  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'All TV Apps'}}/>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>All Apps</Text>
      <Text style={[styles.sub,{color:colors.mutedForeground}]}>
        Installed-app launch uses the local Android app registry where supported. Dynamic TV installed-app discovery remains receiver-ready.
      </Text>
      {['Video','India','Music','Media','Social','Education','Utility','System','TV'].map((category) => {
        const apps = GENERIC_TV_APPS.filter((app) => app.category === category);
        if (!apps.length) return null;
        return <View key={category} style={styles.section}>
          <Text style={[styles.sectionTitle,{color:colors.foreground}]}>{category}</Text>
          <View style={styles.grid}>
            {apps.map((app) => <Pressable
              key={app.id}
              accessibilityRole="button"
              accessibilityLabel={app.name}
              onPress={() => openGenericApp(app)}
              style={[styles.app,{backgroundColor:colors.card,borderColor:colors.border}]}
            >
              <Text style={{color:colors.foreground,textAlign:'center'}}>{app.name}</Text>
            </Pressable>)}
          </View>
        </View>;
      })}
      <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/tv')}>
        <Text style={{color:colors.foreground,textAlign:'center'}}>Back to TV Remote</Text>
      </Pressable>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({
  root:{flex:1},
  content:{padding:18,gap:14,paddingBottom:30},
  title:{fontSize:28,fontFamily:'Inter_700Bold'},
  sub:{fontSize:12,lineHeight:18},
  section:{gap:8},
  sectionTitle:{fontSize:16,fontFamily:'Inter_700Bold'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  app:{minWidth:'45%',flexGrow:1,minHeight:50,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
});
