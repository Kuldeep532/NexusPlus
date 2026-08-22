import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function ExpenseTrackerAutomaticScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Automatic Detection',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Automatic detection</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Stage 1 defines the secure pipeline; production adapters will feed it only trusted financial events.</Text>
      {[['Payment Announcer','Ready as the trusted event source boundary.'],['SMS detection','Parser foundation added; Android SMS permission and receiver will be enabled in the next stage.'],['Merchant intelligence','Pattern engine maps recognizable merchants to financial categories.'],['Unknown transactions','Low-confidence transactions are saved as Other/Saved for later review.']].map(([title,description])=><View key={title} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="check-circle" size={19} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{description}</Text></View></View>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:18,borderWidth:1,padding:14,marginTop:12,flexDirection:'row',alignItems:'center'},icon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:11},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:4}});
