import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { listDocuments, removeDocumentRecord, saveDocumentRecord } from '@/features/document-studio/documentStore';
import { documentIdFor } from '@/features/document-studio/documentTypes';
import { shareDocument } from '@/features/document-studio/documentActions';
import { documentHaptic } from '@/features/document-studio/documentFeedback';
import { describeDocument } from '@/features/document-reader/documentReaderFormat';

export default function DocumentLibraryScreen() {
  const colors = useColors(), insets = useSafeAreaInsets(), router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]), [query, setQuery] = useState(''), [status, setStatus] = useState('');
  const load = async () => setDocuments(await listDocuments());
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => documents.filter(d => (d.title + ' ' + d.format).toLowerCase().includes(query.toLowerCase())), [documents, query]);
  const importDocument = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      multiple: false, copyToCacheDirectory: true,
      type: ['application/pdf', 'application/epub+zip', 'text/plain', 'text/markdown', 'text/html', 'application/rtf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.oasis.opendocument.text'],
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const a = picked.assets[0], d = describeDocument(a.uri, a.name || 'document', a.mimeType, a.size);
    await saveDocumentRecord({
      id: documentIdFor(a.uri, a.name || 'document'), title: a.name || 'document', uri: a.uri,
      mimeType: a.mimeType || 'application/octet-stream', format: d.format, sizeBytes: a.size, source: 'imported',
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    await load(); setStatus('Document imported into the library.'); await documentHaptic('success');
  };
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: 'Document Library' }} />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <View style={styles.header}><MaterialCommunityIcons name="folder-open" size={31} color={colors.primary} /><View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Document Library</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{documents.length} documents connected across Document Studio.</Text>
      </View></View>
      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="search" size={18} color={colors.mutedForeground}/><TextInput value={query} onChangeText={setQuery} placeholder="Search documents" placeholderTextColor={colors.mutedForeground} style={{ flex: 1, color: colors.foreground }} accessibilityLabel="Search documents"/></View>
      <Pressable onPress={() => void importDocument()} style={[styles.import, { backgroundColor: colors.primary }]}><Feather name="upload" size={18} color={colors.primaryForeground}/><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Import Document</Text></Pressable>
      {filtered.map(doc => <View key={doc.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><View style={[styles.badge, { backgroundColor: colors.secondary }]}><Text style={[styles.badgeText, { color: colors.primary }]}>{doc.format.toUpperCase()}</Text></View>
          <View style={styles.docCopy}><Text style={[styles.docTitle, { color: colors.foreground }]} numberOfLines={2}>{doc.title}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{doc.source} · {doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) + ' KB' : 'size unknown'}</Text></View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push({ pathname: '/document-reader', params: { documentId: doc.id } })} style={[styles.action, { borderColor: colors.border }]}><Feather name="book-open" size={17} color={colors.primary}/><Text style={{color:colors.foreground}}>Read</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/document-summarizer', params: { documentId: doc.id } })} style={[styles.action, { borderColor: colors.border }]}><Feather name="file-text" size={17} color={colors.primary}/><Text style={{color:colors.foreground}}>Summarize</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/document-translator', params: { documentId: doc.id } })} style={[styles.action, { borderColor: colors.border }]}><Feather name="globe" size={17} color={colors.primary}/><Text style={{color:colors.foreground}}>Translate</Text></Pressable>
          <Pressable onPress={() => void shareDocument(doc).catch(e => setStatus(e instanceof Error ? e.message : 'Share failed'))} style={[styles.action, { borderColor: colors.border }]}><Feather name="share-2" size={17} color={colors.primary}/><Text style={{color:colors.foreground}}>Share</Text></Pressable>
          <Pressable onPress={async()=>{await removeDocumentRecord(doc.id); await load(); setStatus('Document removed from the library.');}} style={[styles.action, { borderColor: colors.border }]}><Feather name="trash-2" size={17} color={colors.destructive}/><Text style={{color:colors.destructive}}>Delete</Text></Pressable>
        </View>
      </View>)}
      {!filtered.length && <Text style={[styles.empty, { color: colors.mutedForeground }]}>No documents match this search.</Text>}
      {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root:{flex:1}, header:{flexDirection:'row',paddingHorizontal:20,alignItems:'center',marginBottom:16}, copy:{flex:1,marginLeft:12},
  title:{fontSize:27,fontFamily:'Inter_700Bold'}, subtitle:{fontSize:11.5,lineHeight:17,marginTop:4},
  search:{marginHorizontal:20,minHeight:48,borderWidth:1,borderRadius:13,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},
  import:{marginHorizontal:20,minHeight:50,borderRadius:14,marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  card:{marginHorizontal:20,marginTop:10,borderWidth:1,borderRadius:17,padding:13}, row:{flexDirection:'row',alignItems:'center'},
  badge:{width:48,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'}, badgeText:{fontSize:9,fontFamily:'Inter_700Bold'},
  docCopy:{flex:1,marginLeft:11}, docTitle:{fontSize:13,fontFamily:'Inter_700Bold'}, meta:{fontSize:10,marginTop:4},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}, action:{minHeight:40,borderWidth:1,borderRadius:10,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:5},
  empty:{padding:22,textAlign:'center'}, status:{padding:20,fontSize:11,lineHeight:17}
});