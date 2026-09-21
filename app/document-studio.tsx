import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DOCUMENT_STUDIO_TOOLS } from '@/features/document-studio/documentStudioRegistry';

export default function DocumentStudioScreen() {
  const colors = useColors(); const router = useRouter(); const insets = useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Document Studio'}} />
    <ScrollView contentContainerStyle={{paddingTop:insets.top+14,paddingBottom:insets.bottom+36}}>
      <View style={styles.header}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><MaterialCommunityIcons name="file-document-multiple-outline" size={31} color={colors.primary}/></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Document Studio</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Every document workflow is separate, but all tools share one document library.</Text></View></View>
      <Text style={[styles.section,{color:colors.foreground}]}>Document tools</Text>
      <View style={styles.list}>{DOCUMENT_STUDIO_TOOLS.map(tool=><Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={tool.title+'. '+tool.description} onPress={()=>router.push(tool.route as never)} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.toolIcon,{backgroundColor:colors.secondary}]}><Feather name={tool.icon as never} size={21} color={colors.primary}/></View><View style={styles.toolCopy}><Text style={[styles.toolTitle,{color:colors.foreground}]}>{tool.title}</Text><Text style={[styles.toolDescription,{color:colors.mutedForeground}]}>{tool.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground}/></Pressable>)}</View>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,marginBottom:20},icon:{width:56,height:56,borderRadius:17,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:13},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:5},subtitle:{fontSize:12,lineHeight:18},section:{marginHorizontal:20,fontSize:16,fontFamily:'Inter_700Bold',marginBottom:10},list:{marginHorizontal:20,gap:10},card:{minHeight:78,borderWidth:1,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center'},toolIcon:{width:46,height:46,borderRadius:14,alignItems:'center',justifyContent:'center'},toolCopy:{flex:1,marginLeft:12,marginRight:8},toolTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:3},toolDescription:{fontSize:11,lineHeight:16}});