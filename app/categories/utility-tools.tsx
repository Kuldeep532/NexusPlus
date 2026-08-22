import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const tools = [
  ['Clock', '/time-announcer', 'clock', 'Announce the current time.'],
  ['Time Announcer', '/time-announcer', 'volume-2', 'Configure time announcements.'],
  ['Battery Announcer', '/battery-announcer', 'battery', 'Announce battery state.'],
  ['Language & Preferences', '/language-and-preference', 'globe', 'Configure language and app preferences.'],
] as const;

export default function UtilityToolsScreen(){const colors=useColors();const router=useRouter();const insets=useSafeAreaInsets();return <View style={[s.root,{backgroundColor:colors.background}]}><ScrollView contentContainerStyle={{padding:18,paddingTop:insets.top+12,paddingBottom:insets.bottom+24}}><Text accessibilityRole="header" style={[s.title,{color:colors.foreground}]}>Utility Tools</Text><Text style={[s.body,{color:colors.mutedForeground}]}>Everyday accessibility and announcement utilities.</Text><View style={s.list}>{tools.map(([title,route,icon,description])=><Pressable key={route+title} accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={()=>router.push(route as never)} style={[s.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[s.icon,{backgroundColor:colors.secondary}]}><Feather name={icon as never} size={20} color={colors.primary}/></View><View style={s.copy}><Text style={[s.cardTitle,{color:colors.foreground}]}>{title}</Text><Text style={[s.body,{color:colors.mutedForeground}]}>{description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground}/></Pressable>)}</View></ScrollView></View>}
const s=StyleSheet.create({root:{flex:1},title:{fontSize:26,fontFamily:'Inter_700Bold',marginBottom:6},body:{fontSize:11,lineHeight:17},list:{marginTop:18,gap:10},card:{minHeight:74,borderWidth:1,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center'},icon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:12,marginRight:8},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:3}});
