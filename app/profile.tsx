import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.headerRow}><Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground}/></Pressable><Text accessibilityRole="header" style={[styles.headerTitle,{color:colors.foreground}]}>Profile</Text><View style={styles.spacer}/></View>
        <View style={[styles.profileCard,{backgroundColor:colors.card,borderColor:colors.border}]}>
          <View style={[styles.avatar,{backgroundColor:colors.secondary}]}><Feather name="user" size={32} color={colors.primary}/></View>
          <View style={styles.identity}><Text style={[styles.name,{color:colors.foreground}]}>Google account</Text><Text style={[styles.email,{color:colors.mutedForeground}]}>Signed-in account details are provided by the existing authentication boundary.</Text></View>
        </View>
        <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
          <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Account</Text>
          <ProfileRow title="Google sign-in" value="Managed by app authentication" colors={colors}/>
          <ProfileRow title="Cloud data" value="User-owned and protected by backend policies" colors={colors}/>
          <ProfileRow title="Financial data" value="Biometric-protected before access" colors={colors}/>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Settings" onPress={() => router.push('/settings')} style={[styles.button,{backgroundColor:colors.secondary,borderColor:colors.border}]}><Feather name="settings" size={17} color={colors.foreground}/><Text style={[styles.buttonText,{color:colors.foreground}]}>Open Settings</Text></Pressable>
      </ScrollView>
    </View>
  );
}
function ProfileRow({title,value,colors}:{title:string;value:string;colors:ReturnType<typeof useColors>}){return <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{value}</Text></View></View>}
const styles=StyleSheet.create({root:{flex:1},content:{paddingHorizontal:18},headerRow:{flexDirection:'row',alignItems:'center',marginBottom:18},back:{width:42,height:42,alignItems:'center',justifyContent:'center'},headerTitle:{fontSize:20,fontFamily:'Inter_700Bold',flex:1,textAlign:'center'},spacer:{width:42},profileCard:{borderRadius:20,borderWidth:1,padding:18,flexDirection:'row',alignItems:'center'},avatar:{width:72,height:72,borderRadius:36,alignItems:'center',justifyContent:'center'},identity:{flex:1,marginLeft:14},name:{fontSize:17,fontFamily:'Inter_700Bold',marginBottom:5},email:{fontSize:11,lineHeight:16},card:{marginTop:14,borderRadius:18,borderWidth:1,padding:16},sectionTitle:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:8},row:{paddingVertical:10},copy:{flex:1},rowTitle:{fontSize:12,fontFamily:'Inter_700Bold',marginBottom:3},body:{fontSize:11,lineHeight:16},button:{marginTop:14,minHeight:46,borderRadius:13,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},buttonText:{fontSize:11,fontFamily:'Inter_700Bold'}});
