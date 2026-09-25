import { useEffect,useState } from 'react';
import { Alert,Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { adminListPendingOrders,adminSetPremiumFeature,adminVerifyPayment,getPremiumFeatureCatalog,type PremiumFeatureCatalogRow } from '@/features/premium/premiumRepository';

type Order={order_id:string;user_id:string;product_type:string;plan_code:string;amount_inr:number|string;upi_id:string;status:string;payment_reference:string|null;created_at:string};

export default function AdminPremiumScreen(){
 const colors=useColors(); const router=useRouter(); const [orders,setOrders]=useState<Order[]>([]); const [features,setFeatures]=useState<PremiumFeatureCatalogRow[]>([]); const [loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);try{const [o,f]=await Promise.all([adminListPendingOrders(),getPremiumFeatureCatalog()]);setOrders(o);setFeatures(f);}catch{Alert.alert('Admin','Admin access is required, or the data could not be loaded.');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const verify=async(o:Order,approved:boolean)=>{try{await adminVerifyPayment(o.order_id,approved,o.payment_reference??undefined);Alert.alert('Payment',approved?'Payment verified and entitlement/credits activated.':'Payment rejected.');await load();}catch{Alert.alert('Payment','Only an authorized admin can verify payments.');}};
 const toggle=async(f:PremiumFeatureCatalogRow)=>{try{await adminSetPremiumFeature({...f,access_type:f.access_type==='FREE'?'PREMIUM_ONLY':'FREE'});await load();}catch{Alert.alert('Feature access','Only an authorized admin can change Premium feature access.');}};
 return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={styles.content}>
  <Pressable accessibilityRole="button" onPress={()=>router.back()}><Text style={[styles.back,{color:colors.primary}]}>Back</Text></Pressable>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Premium Admin</Text>
  <Text style={[styles.note,{color:colors.mutedForeground}]}>All entitlement and feature-access changes are controlled by Supabase. This panel cannot grant access locally.</Text>
  <Text style={[styles.section,{color:colors.foreground}]}>Pending UPI payments</Text>
  {orders.length===0&&<Text style={[styles.note,{color:colors.mutedForeground}]}>No pending payments.</Text>}
  {orders.map(o=><View key={o.order_id} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.name,{color:colors.foreground}]}>{o.product_type} • {o.plan_code}</Text><Text style={[styles.note,{color:colors.mutedForeground}]}>₹{o.amount_inr} • {o.status}</Text><Text selectable style={[styles.note,{color:colors.mutedForeground}]}>User: {o.user_id}</Text><Text selectable style={[styles.note,{color:colors.mutedForeground}]}>Reference: {o.payment_reference??'Not submitted'}</Text><View style={styles.row}><Pressable onPress={()=>void verify(o,true)} style={[styles.button,{backgroundColor:colors.primary}]}><Text style={styles.buttonText}>Verify payment</Text></Pressable><Pressable onPress={()=>void verify(o,false)} style={[styles.button,{backgroundColor:colors.secondary,borderWidth:1,borderColor:colors.border}]}><Text style={[styles.buttonText,{color:colors.foreground}]}>Reject</Text></Pressable></View></View>)}
  <Text style={[styles.section,{color:colors.foreground}]}>Live Premium feature access</Text>
  <Text style={[styles.note,{color:colors.mutedForeground}]}>Changing this list changes the live Supabase catalog used by the app.</Text>
  {features.map(f=><View key={f.feature_code} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.name,{color:colors.foreground}]}>{f.feature_name}</Text><Text style={[styles.note,{color:colors.mutedForeground}]}>{f.access_type} • Tier {f.min_tier} • {f.credit_cost} credits</Text><Pressable onPress={()=>void toggle(f)} style={[styles.button,{backgroundColor:colors.primary}]}><Text style={styles.buttonText}>{f.access_type==='FREE'?'Make Premium':'Make Free'}</Text></Pressable></View>)}
  {loading&&<Text style={[styles.note,{color:colors.mutedForeground}]}>Loading…</Text>}
 </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:20,paddingTop:60,paddingBottom:40},back:{fontSize:14,marginBottom:18},title:{fontSize:26,fontFamily:'Inter_700Bold'},section:{fontSize:17,fontFamily:'Inter_700Bold',marginTop:24,marginBottom:8},note:{fontSize:12,lineHeight:18,marginTop:5},card:{borderWidth:1,borderRadius:14,padding:14,marginTop:10},name:{fontSize:14,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:8},button:{minHeight:44,borderRadius:12,paddingHorizontal:14,alignItems:'center',justifyContent:'center',marginTop:12},buttonText:{color:'#fff',fontSize:12,fontFamily:'Inter_700Bold'}});
