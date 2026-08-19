import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const screens = [
  { title: 'Station Browser', detail: 'Browse Indian stations by city, language and category.', icon: 'radio-tower', route: '/online-radio/stations' },
  { title: 'Favorites', detail: 'Keep your preferred stations together.', icon: 'heart-outline', route: '/online-radio/favorites' },
  { title: 'Now Playing', detail: 'Open the current station and player controls.', icon: 'play-circle-outline', route: '/online-radio/now-playing' },
];

export default function OnlineRadioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="radio-tower" size={30} color={colors.primary} /></View>
      <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Online Radio</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Indian internet radio with the same Nexus Media Player.</Text></View>
    </View>
    <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={18} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="Search stations" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} accessibilityLabel="Search online radio stations" /></View>
    <View style={styles.list}>{screens.map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={`Open ${item.title}. ${item.detail}`} onPress={() => router.push(item.route as never)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.iconSmall, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={item.icon as never} size={22} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{item.detail}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>)}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen:{flex:1}, header:{paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:14,marginBottom:18}, icon:{width:58,height:58,borderRadius:17,alignItems:'center',justifyContent:'center'}, iconSmall:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'}, copy:{flex:1}, title:{fontSize:28,fontFamily:'Inter_700Bold'},subtitle:{marginTop:4,fontSize:12,lineHeight:18},search:{marginHorizontal:20,minHeight:50,borderRadius:15,borderWidth:1,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:9,marginBottom:14},input:{flex:1,fontSize:14},list:{paddingHorizontal:20,gap:10},card:{minHeight:78,borderRadius:17,borderWidth:1,paddingHorizontal:12,flexDirection:'row',alignItems:'center'},cardTitle:{fontSize:15,fontFamily:'Inter_700Bold'},cardDetail:{marginTop:3,fontSize:11,lineHeight:16},pressed:{opacity:0.76,transform:[{scale:0.985}]}};
