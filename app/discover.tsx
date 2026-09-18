import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const DISCOVER = [
  { title: 'Nexus Assistant', description: 'Chat with Nexus AI and run supported tools conversationally.', route: '/nexus-assistant', icon: 'cpu' as const },
  { title: 'AI Calculator', description: 'Math, finance and what-if analysis.', route: '/calculator', icon: 'activity' as const },
  { title: 'QR Quick Create', description: 'Open the existing QR generator instantly.', route: '/utilities/qr-generator', icon: 'qrcode' as const },
  { title: 'Audio Editor', description: 'Audio trimming, mixing and audio-to-video tools.', route: '/audio-editor', icon: 'music-note-outline' as const },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="sparkles" size={28} color={colors.primary} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Discover</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A dedicated space for fast, unique and experimental Nexus Plus features.</Text>
        </View>
        <View style={styles.grid}>
          {DISCOVER.map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.title + '. ' + item.description} onPress={() => router.push(item.route as never)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={item.icon as never} size={20} color={colors.primary} /></View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description}</Text>
          </Pressable>)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{flex:1}, hero:{alignItems:'center',paddingVertical:16}, heroIcon:{width:60,height:60,borderRadius:20,alignItems:'center',justifyContent:'center'}, title:{fontSize:27,fontFamily:'Inter_700Bold',marginTop:12}, subtitle:{fontSize:12,lineHeight:18,textAlign:'center',maxWidth:340,marginTop:5},
  grid:{gap:10,marginTop:10}, card:{minHeight:108,borderWidth:1,borderRadius:18,padding:15}, icon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:10}, cardTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:4}, body:{fontSize:11,lineHeight:16}
});
