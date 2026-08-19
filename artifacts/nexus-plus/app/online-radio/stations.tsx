import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { INDIAN_RADIO_STATIONS } from '@/features/online-radio/onlineRadioTypes';
import { useRadioStore } from '@/features/online-radio/useRadioStore';

export default function RadioStationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playStation, currentStationId, isPlaying } = useRadioStore();

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Station Browser</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Indian stations grouped by language, city and category.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open now playing" onPress={() => router.push('/online-radio/now-playing' as never)}><Feather name="radio" size={22} color={colors.primary} /></Pressable></View>
    <View style={styles.list}>{INDIAN_RADIO_STATIONS.map((station) => { const active = currentStationId === station.id && isPlaying; return <Pressable key={station.id} accessibilityRole="button" accessibilityLabel={`${active ? 'Playing' : 'Play'} ${station.name}, ${station.city}, ${station.language}`} onPress={() => playStation(station)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border }, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={active ? 'radio' : 'radio-tower'} size={22} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{station.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{station.city} • {station.language} • {station.category}</Text></View><Feather name={active ? 'pause' : 'play'} size={20} color={colors.primary} /></Pressable>; })}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen:{flex:1},header:{paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:10,marginBottom:18},copy:{flex:1},title:{fontSize:27,fontFamily:'Inter_700Bold'},subtitle:{marginTop:4,fontSize:12,lineHeight:18},list:{paddingHorizontal:20,gap:10},card:{minHeight:78,borderRadius:17,borderWidth:1,paddingHorizontal:12,flexDirection:'row',alignItems:'center'},icon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},name:{fontSize:14,fontFamily:'Inter_700Bold'},meta:{marginTop:3,fontSize:11,lineHeight:16},pressed:{opacity:0.76}};
