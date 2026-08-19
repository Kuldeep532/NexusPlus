import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Tab = 'text' | 'wifi' | 'upi' | 'whatsapp';
type WifiSecurity = 'WPA' | 'WPA2' | 'WPA3' | 'WPA3-Enterprise';
const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'text', label: 'Text / URL' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'upi', label: 'UPI' },
  { key: 'whatsapp', label: 'WhatsApp' },
];
const escapeWifi = (value: string) => value.replace(/([\\;,":])/g, '\\$1');

export default function QRGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('text');
  const [text, setText] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<WifiSecurity>('WPA2');
  const [hidden, setHidden] = useState(false);
  const [enterpriseIdentity, setEnterpriseIdentity] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const value = useMemo(() => {
    if (tab === 'text') return text.trim();
    if (tab === 'wifi') {
      if (!ssid.trim()) return '';
      const auth = security === 'WPA3-Enterprise' ? 'WPA2-EAP' : security;
      const identity = security === 'WPA3-Enterprise' && enterpriseIdentity.trim() ? `;E:${escapeWifi(enterpriseIdentity.trim())}` : '';
      return `WIFI:T:${auth};S:${escapeWifi(ssid.trim())};P:${escapeWifi(password)};H:${hidden ? 'true' : 'false'}${identity};;`;
    }
    if (tab === 'upi') {
      if (!upiId.trim()) return '';
      const params = new URLSearchParams({ pa: upiId.trim(), cu: 'INR' });
      if (upiName.trim()) params.set('pn', upiName.trim());
      if (amount.trim()) params.set('am', amount.trim());
      if (note.trim()) params.set('tn', note.trim());
      return `upi://pay?${params.toString()}`;
    }
    const digits = whatsappNumber.replace(/\D/g, '');
    if (!digits) return '';
    return `https://wa.me/${digits}${whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ''}`;
  }, [tab, text, ssid, password, security, hidden, enterpriseIdentity, upiId, upiName, amount, note, whatsappNumber, whatsappMessage]);

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 50 }} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><MaterialCommunityIcons name="qrcode" size={30} color={colors.primary} /><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>QR Code Generator</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Generate useful QR codes for common sharing tasks.</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} onPress={() => setTab(item.key)} style={[styles.tab, { borderColor: colors.border, backgroundColor: tab === item.key ? colors.primary : colors.card }]}><Text style={{ color: tab === item.key ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item.label}</Text></Pressable>)}</ScrollView>
    <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {tab === 'text' && <Field label="Text or URL" value={text} onChangeText={setText} placeholder="https://example.com" colors={colors} multiline />}
      {tab === 'wifi' && <>
        <Field label="Network name (SSID)" value={ssid} onChangeText={setSsid} placeholder="My WiFi" colors={colors} />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="WiFi password" colors={colors} secure />
        <Text style={[styles.label, { color: colors.foreground }]}>Security</Text>
        <View style={styles.securityRow}>{(['WPA', 'WPA2', 'WPA3', 'WPA3-Enterprise'] as WifiSecurity[]).map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: security === item }} onPress={() => setSecurity(item)} style={[styles.security, { borderColor: security === item ? colors.primary : colors.border, backgroundColor: security === item ? colors.secondary : colors.background }]}><Text style={{ color: colors.foreground, fontSize: 11 }}>{item}</Text></Pressable>)}</View>
        {security === 'WPA3-Enterprise' && <Field label="Enterprise identity" value={enterpriseIdentity} onChangeText={setEnterpriseIdentity} placeholder="Identity" colors={colors} />}
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: hidden }} onPress={() => setHidden((value) => !value)} style={[styles.switchRow, { borderColor: colors.border }]}><Text style={[styles.switchText, { color: colors.foreground }]}>Hidden network</Text><Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{hidden ? 'On' : 'Off'}</Text></Pressable>
      </>}
      {tab === 'upi' && <>
        <Field label="UPI ID" value={upiId} onChangeText={setUpiId} placeholder="name@upi" colors={colors} autoCapitalize="none" />
        <Field label="Name" value={upiName} onChangeText={setUpiName} placeholder="Receiver name" colors={colors} />
        <Field label="Amount (INR)" value={amount} onChangeText={setAmount} placeholder="0.00" colors={colors} keyboardType="decimal-pad" />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Payment note" colors={colors} multiline />
      </>}
      {tab === 'whatsapp' && <>
        <Field label="WhatsApp number" value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="919876543210" colors={colors} keyboardType="phone-pad" />
        <Field label="Pre-filled message" value={whatsappMessage} onChangeText={setWhatsappMessage} placeholder="Hello!" colors={colors} multiline />
        <Text style={[styles.help, { color: colors.mutedForeground }]}>Use the international phone number without the + sign.</Text>
      </>}
    </View>
    <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.previewTitle, { color: colors.foreground }]}>Preview</Text>{value ? <QRCode value={value} size={210} backgroundColor="white" color="black" /> : <View accessible accessibilityRole="text" style={styles.empty}><MaterialCommunityIcons name="qrcode-scan" size={42} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Enter the required information to generate the QR code.</Text></View>}</View>
  </ScrollView>;
}

function Field({ label, value, onChangeText, placeholder, colors, secure, multiline, keyboardType, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secure?: boolean; multiline?: boolean; keyboardType?: 'default' | 'decimal-pad' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secure} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, lineHeight: 18 }, tabs: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 }, tab: { minHeight: 40, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, form: { marginHorizontal: 20, borderWidth: 1, borderRadius: 18, padding: 15, gap: 12 }, field: { gap: 6 }, label: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, input: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 }, securityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, security: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }, switchRow: { minHeight: 48, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 }, switchText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, help: { fontSize: 11, lineHeight: 16 }, preview: { margin: 20, minHeight: 280, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 18 }, previewTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, empty: { alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: 250 }, emptyText: { textAlign: 'center', fontSize: 12, lineHeight: 18 } });
