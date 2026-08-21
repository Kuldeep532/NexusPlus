import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { INDIAN_RADIO_STATIONS } from '@/features/online-radio/onlineRadioTypes';
import { useRadioPlayer } from '@/features/online-radio/RadioPlayerContext';

export default function RadioFavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, playStation } = useRadioPlayer();
  const stations = INDIAN_RADIO_STATIONS.filter((station) => favorites.includes(station.id));
  return <ScrollView style={[styles.screen,{backgroundColor:colors.background}]} contentContainerStyle={{paddingTop:insets.top+12,paddingBottom:insets.bottom+40}}>
    <View style={styles.header}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Favorites</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Your saved Indian radio stations.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open station browser" onPress={()=>router.push('/online-radio/stations' as never)}><Feather name="search" size={21} color={colors.primary}/></Pressable></View>
    {stations.length===0?<View style={styles.empty}><Feather name="heart" size={42} color={colors.primary}/><Text style={[styles.emptyTitle,{color:colors.foreground}]}>No favorites yet</Text><Text style={[styles.emptyText,{color:colors.mutedForeground}]}>Save stations from the browser to find them here.</Text></View>:<View style={styles.list}>{stations.map((station)=><View key={station.id} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>{station.name}</Text><Text style={[styles.meta,{color:colors.mutedForeground}]}>{station.city} • {station.language}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Play ${station.name}`} onPress={()=>void playStation(station)} style={styles.iconButton}><Feather name="play" size={18} color={colors.primary}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${station.name} from favorites`} onPress={()=>toggleFavorite(station.id)} style={styles.iconButton}><Feather name="heart" size={18} color={colors.primary}/></Pressable></View>)}</View>}
  </ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1},header:{paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:10,marginBottom:18},copy:{flex:1},title:{fontSize:27,fontFamily:'Inter_700Bold'},subtitle:{marginTop:4,fontSize:12},list:{paddingHorizontal:20,gap:10},card:{minHeight:72,borderRadius:16,borderWidth:1,paddingHorizontal:13,flexDirection:'row',alignItems:'center'},name:{fontSize:14,fontFamily:'Inter_700Bold'},meta:{marginTop:3,fontSize:11},iconButton:{width:42,height:42,alignItems:'center',justifyContent:'center'},empty:{padding:40,alignItems:'center'},emptyTitle:{marginTop:15,fontSize:19,fontFamily:'Inter_700Bold'},emptyText:{marginTop:5,fontSize:12,textAlign:'center'}});
