import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const TOOLS = [
  { route:'/spiritual-japa', title:'Japa Counter', description:'Count mantra repetitions with mala-style cycles, targets, and local progress.', icon:'hash' },
  { route:'/spiritual-meditation', title:'Meditation Timer', description:'Guided silent practice with configurable duration, interval bell, and session history.', icon:'clock' },
  { route:'/spiritual-breathing', title:'Pranayama Timer', description:'Practice timed breathing cycles with inhale, hold, exhale, and rest phases.', icon:'wind' },
  { route:'/spiritual-daily-sadhana', title:'Daily Sadhana', description:'Create a simple spiritual practice checklist and track completed practices each day.', icon:'check-circle' },
  { route:'/spiritual-mantra', title:'Mantra Player', description:'Play licensed remote mantra recordings or use the device speech engine.', icon:'volume-2' },
  { route:'/spiritual-krishna-mantras', title:'Krishna Mantras', description:'Dedicated Krishna mantra library including the Hare Krishna Mahamantra.', icon:'heart' },
];

export default function SpiritualScreen() {
  const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Spiritual'}} />
    <ScrollView contentContainerStyle={{padding:18,paddingTop:insets.top+12,paddingBottom:insets.bottom+28}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Spiritual</Text>
      <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Practical tools for mantra, meditation, breath practice and daily sadhana.</Text>
      <View style={styles.list}>{TOOLS.map(t=><Pressable key={t.route} accessibilityRole="button" accessibilityLabel={t.title+'. '+t.description} onPress={()=>router.push(t.route as never)} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name={t.icon as never} size={21} color={colors.primary}/></View>
        <View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{t.title}</Text><Text style={[styles.desc,{color:colors.mutedForeground}]}>{t.description}</Text></View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground}/>
      </Pressable>)}</View>
    </ScrollView>
  </View>
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},subtitle:{fontSize:12,lineHeight:18,marginBottom:18},list:{gap:11},card:{minHeight:82,borderWidth:1,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center'},icon:{width:46,height:46,borderRadius:14,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:12,marginRight:8},cardTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:4},desc:{fontSize:11,lineHeight:16}});
