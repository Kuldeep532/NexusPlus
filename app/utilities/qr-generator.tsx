import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Tab = 'text' | 'url' | 'wifi' | 'upi' | 'whatsapp';
type WifiSecurity = 'WPA' | 'WPA2' | 'WPA3' | 'WPA3-Enterprise';

type QRTheme = {
  foreground: string;
  background: string;
};

const COLOR_PALETTE: Array<{ name: string; value: string }> = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Navy Blue', value: '#0B1F3A' },
  { name: 'Dark Blue', value: '#123C73' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Sky Blue', value: '#0EA5E9' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Dark Green', value: '#14532D' },
  { name: 'Lime', value: '#65A30D' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Maroon', value: '#7F1D1D' },
  { name: 'Pink', value: '#DB2777' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Deep Purple', value: '#4C1D95' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Indigo', value: '#4338CA' },
  { name: 'Brown', value: '#92400E' },
  { name: 'Slate', value: '#334155' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Silver', value: '#9CA3AF' },
  { name: 'Cream', value: '#FFF7ED' },
];

const tabs: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'text', label: 'Text', icon: 'text' },
  { key: 'url', label: 'URL', icon: 'link-variant' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { key: 'wifi', label: 'Wi‑Fi', icon: 'wifi' },
  { key: 'upi', label: 'UPI', icon: 'currency-inr' },
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
  const [qrTheme, setQrTheme] = useState<QRTheme>({ foreground: '#000000', background: '#FFFFFF' });
  const [size, setSize] = useState(240);
  const [quietZone, setQuietZone] = useState(12);

  const value = useMemo(() => {
    if (tab === 'text' || tab === 'url') return text.trim();
    if (tab === 'wifi') {
      if (!ssid.trim()) return '';
      const auth = security === 'WPA3-Enterprise' ? 'WPA2-EAP' : security;
      const identity = security === 'WPA3-Enterprise' && enterpriseIdentity.trim()
        ? `;E:${escapeWifi(enterpriseIdentity.trim())}`
        : '';
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

  const canUseCustomColors = qrTheme.foreground !== qrTheme.background;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="qrcode-edit" size={30} color={colors.primary} />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>QR Code Generator</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create QR codes for Text, URL, WhatsApp, Wi‑Fi and UPI.</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={`Generate ${item.label} QR code`}
            accessibilityState={{ selected: tab === item.key }}
            onPress={() => setTab(item.key)}
            style={[styles.tab, { borderColor: colors.border, backgroundColor: tab === item.key ? colors.primary : colors.card }]}
          >
            <MaterialCommunityIcons name={item.icon as never} size={15} color={tab === item.key ? colors.primaryForeground : colors.foreground} />
            <Text style={{ color: tab === item.key ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(tab === 'text' || tab === 'url') && (
          <Field
            label={tab === 'text' ? 'Text' : 'URL'}
            value={text}
            onChangeText={setText}
            placeholder={tab === 'text' ? 'Type any text' : 'https://example.com'}
            colors={colors}
            multiline
            autoCapitalize={tab === 'url' ? 'none' : 'sentences'}
            keyboardType={tab === 'url' ? 'url' : 'default'}
          />
        )}

        {tab === 'wifi' && (
          <>
            <Field label="Network name (SSID)" value={ssid} onChangeText={setSsid} placeholder="My Wi‑Fi" colors={colors} />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Wi‑Fi password" colors={colors} secure />
            <Text style={[styles.label, { color: colors.foreground }]}>Security</Text>
            <View style={styles.securityRow}>
              {(['WPA', 'WPA2', 'WPA3', 'WPA3-Enterprise'] as WifiSecurity[]).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: security === item }}
                  onPress={() => setSecurity(item)}
                  style={[styles.security, { borderColor: security === item ? colors.primary : colors.border, backgroundColor: security === item ? colors.secondary : colors.background }]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 11 }}>{item}</Text>
                </Pressable>
              ))}
            </View>
            {security === 'WPA3-Enterprise' && <Field label="Enterprise identity" value={enterpriseIdentity} onChangeText={setEnterpriseIdentity} placeholder="Identity" colors={colors} />}
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: hidden }} onPress={() => setHidden((value) => !value)} style={[styles.switchRow, { borderColor: colors.border }]}>
              <Text style={[styles.switchText, { color: colors.foreground }]}>Hidden network</Text>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{hidden ? 'On' : 'Off'}</Text>
            </Pressable>
          </>
        )}

        {tab === 'upi' && (
          <>
            <Field label="UPI ID" value={upiId} onChangeText={setUpiId} placeholder="name@upi" colors={colors} autoCapitalize="none" />
            <Field label="Name" value={upiName} onChangeText={setUpiName} placeholder="Receiver name" colors={colors} />
            <Field label="Amount (INR)" value={amount} onChangeText={setAmount} placeholder="0.00" colors={colors} keyboardType="decimal-pad" />
            <Field label="Note" value={note} onChangeText={setNote} placeholder="Payment note" colors={colors} multiline />
          </>
        )}

        {tab === 'whatsapp' && (
          <>
            <Field label="WhatsApp number" value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="919876543210" colors={colors} keyboardType="phone-pad" />
            <Field label="Pre-filled message" value={whatsappMessage} onChangeText={setWhatsappMessage} placeholder="Hello!" colors={colors} multiline />
            <Text style={[styles.help, { color: colors.mutedForeground }]}>Use the international phone number without the + sign.</Text>
          </>
        )}
      </View>

      <View style={[styles.customizer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customize QR</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Choose separate QR and background colors. High contrast is recommended for reliable scanning.</Text>

        <Text style={[styles.label, { color: colors.foreground }]}>QR color</Text>
        <ColorGrid selected={qrTheme.foreground} onSelect={(value) => setQrTheme((current) => ({ ...current, foreground: value }))} colors={colors} />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 12 }]}>Background color</Text>
        <ColorGrid selected={qrTheme.background} onSelect={(value) => setQrTheme((current) => ({ ...current, background: value }))} colors={colors} />

        <View style={styles.sliderRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>QR size</Text>
          <Text style={[styles.valueBadge, { color: colors.primary }]}>{size}px</Text>
        </View>
        <View style={styles.stepperRow}>
          {[180, 220, 240, 280, 320].map((item) => (
            <Pressable key={item} onPress={() => setSize(item)} accessibilityRole="button" accessibilityState={{ selected: size === item }} style={[styles.stepper, { borderColor: size === item ? colors.primary : colors.border, backgroundColor: size === item ? colors.secondary : colors.background }]}>
              <Text style={{ color: colors.foreground, fontSize: 11 }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sliderRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>Quiet zone</Text>
          <Text style={[styles.valueBadge, { color: colors.primary }]}>{quietZone}</Text>
        </View>
        <View style={styles.stepperRow}>
          {[4, 8, 12, 16, 20].map((item) => (
            <Pressable key={item} onPress={() => setQuietZone(item)} accessibilityRole="button" accessibilityState={{ selected: quietZone === item }} style={[styles.stepper, { borderColor: quietZone === item ? colors.primary : colors.border, backgroundColor: quietZone === item ? colors.secondary : colors.background }]}>
              <Text style={{ color: colors.foreground, fontSize: 11 }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {!canUseCustomColors && (
          <Text style={[styles.warning, { color: colors.mutedForeground }]}>QR and background colors should be different for dependable scanning.</Text>
        )}
      </View>

      <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.previewTitle, { color: colors.foreground }]}>Live Preview</Text>
        {value && canUseCustomColors ? (
          <View style={{ padding: quietZone, backgroundColor: qrTheme.background, borderRadius: 12 }} accessible accessibilityLabel="Generated QR code preview">
            <QRCode value={value} size={size} backgroundColor={qrTheme.background} color={qrTheme.foreground} quietZone={0} ecl="H" />
          </View>
        ) : (
          <View accessible accessibilityRole="text" style={styles.empty}>
            <MaterialCommunityIcons name="qrcode-scan" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{value ? 'Adjust the colors so the QR code has contrast.' : 'Enter the required information to generate the QR code.'}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ColorGrid({ selected, onSelect, colors }: { selected: string; onSelect: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.colorGrid}>
      {COLOR_PALETTE.map((color) => (
        <Pressable
          key={color.value}
          accessibilityRole="radio"
          accessibilityLabel={`${color.name}, ${color.value}`}
          accessibilityState={{ selected: selected === color.value }}
          onPress={() => onSelect(color.value)}
          style={[styles.colorSwatch, { backgroundColor: color.value, borderColor: selected === color.value ? colors.primary : colors.border }]}
        >
          {selected === color.value ? <MaterialCommunityIcons name="check" size={18} color={color.value === '#FFFFFF' || color.value === '#FFF7ED' || color.value === '#EAB308' ? '#000000' : '#FFFFFF'} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, secure, multiline, keyboardType, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secure?: boolean; multiline?: boolean; keyboardType?: 'default' | 'decimal-pad' | 'phone-pad' | 'url'; autoCapitalize?: 'none' | 'sentences' }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secure} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, minHeight: multiline ? 78 : 46 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  copy: { flex: 1 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { marginTop: 3, fontSize: 12, lineHeight: 18 },
  tabs: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  tab: { minHeight: 42, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  form: { marginHorizontal: 20, borderWidth: 1, borderRadius: 18, padding: 15, gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, textAlignVertical: 'top' },
  securityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  security: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
  switchRow: { minHeight: 48, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  switchText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  help: { fontSize: 11, lineHeight: 16 },
  customizer: { margin: 20, borderRadius: 18, borderWidth: 1, padding: 15, gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionHint: { fontSize: 11, lineHeight: 16, marginBottom: 4 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  colorSwatch: { width: 35, height: 35, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sliderRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueBadge: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  stepperRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  stepper: { minWidth: 48, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  warning: { fontSize: 11, lineHeight: 16, marginTop: 6 },
  preview: { marginHorizontal: 20, minHeight: 330, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 18 },
  previewTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: 260 },
  emptyText: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
