import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { saveDocumentRecord } from '@/features/document-studio/documentStore';
import { documentIdFor } from '@/features/document-studio/documentTypes';
import { describeDocument } from '@/features/document-reader/documentReaderFormat';

export default function DocumentImporterScreen() {
  const colors = useColors(), router = useRouter();
  const pick = async () => {
    const p = await DocumentPicker.getDocumentAsync({ multiple:false, copyToCacheDirectory:true, type:[
      'application/pdf','application/epub+zip','text/plain','text/markdown','text/html','application/rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','application/vnd.oasis.opendocument.text'
    ]});
    if (p.canceled || !p.assets?.[0]) return;
    const a=p.assets[0], d=describeDocument(a.uri,a.name||'document',a.mimeType,a.size), id=documentIdFor(a.uri,a.name||'document');
    await saveDocumentRecord({id,title:a.name||'document',uri:a.uri,mimeType:a.mimeType||'application/octet-stream',format:d.format,sizeBytes:a.size,source:'imported',createdAt:Date.now(),updatedAt:Date.now()});
    router.push({ pathname:'/document-reader', params:{documentId:id} });
  };
  return <View style={[styles.root,{backgroundColor:colors.background}]}><Stack.Screen options={{title:'Import Document'}}/><View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Import Document</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Choose a supported document. It is registered in the shared Document Studio library and opened in Reader next.</Text><Pressable onPress={pick} style={[styles.button,{backgroundColor:colors.primary}]}><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>Choose Document</Text></Pressable></View></View>;
}
const styles=StyleSheet.create({root:{flex:1,padding:20,justifyContent:'center'},card:{borderWidth:1,borderRadius:18,padding:20},title:{fontSize:23,fontFamily:'Inter_700Bold'},body:{fontSize:12,lineHeight:19,marginTop:9},button:{minHeight:50,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:18}});
