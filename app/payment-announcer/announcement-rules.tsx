import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function PaymentAnnouncerRulesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Announcement Rules',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Announcement rules</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Rules apply after the payment event has been authenticated and validated.</Text>
      {[
        ['Verified events only','Speak only events that pass the provider verifier.'],
        ['Ignore malformed events','Rejected or incomplete events are never spoken.'],
        ['Fail closed','If verification cannot be established, do not announce.'],
        ['No arbitrary UI payments','The app UI cannot inject transaction identity or amount into the announcement pipeline.'],
      ].map(([title,description])=><View key={title} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{description}</Text></View>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{marginTop:12,borderRadius:18,borderWidth:1,padding:16},cardTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:5}});
