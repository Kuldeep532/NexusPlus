import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const screens = [
  { title: 'Station Browser', detail: 'Browse Indian stations by city, language and category.', icon: 'radio-tower', route: '/online-radio/stations' },
  { title: 'Favorites', detail: 'Keep your preferred stations together.', icon: 'heart-outline', route: '/online-radio/favorites' },
  { title: 'Now Playing', detail: 'Use the shared Nexus Media Player controls.', icon: 'play-circle-outline', route: '/online-radio/now-playing' },
];

export default function OnlineRadioHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <ScrollView style={[styles.screen,{backgroundColor:colors.background}]} contentContainerStyle={{paddingTop:insets.top+12,paddingBottom:insets.bottom+40}}>
    <View style={styles.header}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><MaterialCommunityIcons name="radio-tower" size={30} color={colors.primary}/></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Online Radio</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Indian internet radio using the same Nexus Media Player.</Text></View></View>
    <View style={styles.list}>{screens.map((item)=><Pressable key={item.route} accessibilityRole="button" accessibilityLabel={`Open ${item.title}. ${item.detail}`} onPress={()=>router.push(item.route as never)} style={({pressed})=>[styles.card,{backgroundColor:colors.card,borderColor:colors.border},pressed&&styles.pressed]}><View style={[styles.smallIcon,{backgroundColor:colors.secondary}]}><MaterialCommunityIcons name={item.icon as never} size={22} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{item.title}</Text><Text style={[styles.detail,{color:colors.mutedForeground}]}>{item.detail}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground}/></Pressable>)}</View>
  </ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1},header:{paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:14,marginBottom:20},icon:{width:58,height:58,borderRadius:17,alignItems:'center',justifyContent:'center'},smallIcon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},copy:{flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold'},subtitle:{marginTop:4,fontSize:12,lineHeight:18},list:{paddingHorizontal:20,gap:10},card:{minHeight:80,borderRadius:18,borderWidth:1,paddingHorizontal:12,flexDirection:'row',alignItems:'center'},cardTitle:{fontSize:15,fontFamily:'Inter_700Bold'},detail:{marginTop:3,fontSize:11,lineHeight:16},pressed:{opacity:0.76}});
