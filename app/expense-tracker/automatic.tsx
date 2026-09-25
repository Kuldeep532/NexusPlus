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
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Automatically record supported payment activity and review how detected expenses are added.</Text>
      {[['Payment Announcer','Available for supported payment activity.'],['SMS detection','SMS-based detection can be added when the required Android access is enabled.'],['Merchant intelligence','Recognized merchants can be organized into suitable spending categories.'],['Unknown transactions','Transactions that cannot be confidently categorized can be reviewed later.']].map(([title,description])=><View key={title} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="check-circle" size={19} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{description}</Text></View></View>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:18,borderWidth:1,padding:14,marginTop:12,flexDirection:'row',alignItems:'center'},icon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:11},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:4}});
