import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateAiSketch } from '@/features/sketch/aiSketchGateway';
import { addStroke, BRUSH_SIZES, clearSketch, createSketchDocument, createStroke, SKETCH_COLORS, setBackground, undoLastStroke, type Point, type SketchDocument, type SketchSettings, type ToolKind } from '@/features/sketch/sketchEngine';

const CANVAS_SIZE = 320;
const TOOLS: { label: string; tool: ToolKind; icon: string }[] = [
  { label: 'Pen', tool: 'pen', icon: 'edit-3' },
  { label: 'Pencil', tool: 'pencil', icon: 'edit-2' },
  { label: 'Marker', tool: 'marker', icon: 'edit-3' },
  { label: 'Brush', tool: 'brush', icon: 'feather' },
  { label: 'Highlight', tool: 'highlighter', icon: 'sun' },
  { label: 'Eraser', tool: 'eraser', icon: 'square' },
  { label: 'Line', tool: 'line', icon: 'minus' },
  { label: 'Rect', tool: 'rectangle', icon: 'square' },
  { label: 'Ellipse', tool: 'ellipse', icon: 'circle' },
  { label: 'Arrow', tool: 'arrow', icon: 'arrow-up-right' },
];

export default function SketchGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [document, setDocument] = useState<SketchDocument>(() => createSketchDocument());
  const [mode, setMode] = useState<'traditional' | 'ai'>('traditional');
  const [settings, setSettings] = useState<SketchSettings>({ color: '#111827', width: 4, opacity: 1, tool: 'pen' });
  const [background, setCanvasBackground] = useState('#FFFFFF');
  const [customColor, setCustomColor] = useState('#111827');
  const [history, setHistory] = useState<SketchDocument[]>([]);
  const [prompt, setPrompt] = useState('A simple mountain landscape with a sun');
  const [style, setStyle] = useState('pencil sketch');
  const [busy, setBusy] = useState(false);
  const [aiAsset, setAiAsset] = useState<string | null>(null);
  const drawing = useRef<Point[]>([]);
  const gestureStart = useRef<Point | null>(null);

  const scale = CANVAS_SIZE / document.width;
  const previewStrokes = useMemo(() => document.strokes, [document.strokes]);

  const commit = (next: SketchDocument) => {
    setHistory((current) => [...current, document].slice(-50));
    setDocument(next);
  };

  const startStroke = (x: number, y: number) => {
    const point = { x: x / scale, y: y / scale };
    gestureStart.current = point;
    drawing.current = [point];
  };
  const moveStroke = (x: number, y: number) => {
    drawing.current = [...drawing.current, { x: x / scale, y: y / scale }];
  };

  const finishStroke = () => {
    const start = gestureStart.current;
    const end = drawing.current[drawing.current.length - 1];
    if (!start || !end) return;
    if (settings.tool === 'line' || settings.tool === 'arrow') {
      commit(addStroke(document, createStroke([start, end], settings)));
    } else if (settings.tool === 'rectangle' || settings.tool === 'ellipse') {
      const minX = Math.min(start.x, end.x); const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x); const maxY = Math.max(start.y, end.y);
      commit(addStroke(document, createStroke([
        { x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }, { x: minX, y: minY },
      ], settings)));
    } else if (drawing.current.length > 1) {
      commit(addStroke(document, createStroke(drawing.current, settings)));
    }
    gestureStart.current = null;
    drawing.current = [];
  };

  const undo = () => {
    if (!history.length) return;
    setDocument(history[history.length - 1]);
    setHistory((current) => current.slice(0, -1));
  };
  const clear = () => { setHistory((current) => [...current, document].slice(-50)); setDocument(clearSketch(document)); };
  const chooseColor = (color: string) => { setCustomColor(color); setSettings((current) => ({ ...current, color, tool: current.tool === 'eraser' ? 'pen' : current.tool })); };
  const changeBackground = (color: string) => { setCanvasBackground(color); setDocument((current) => setBackground(current, color)); };

  const renderStroke = (stroke: SketchDocument['strokes'][number]) => {
    const pts = stroke.points.map((point) => `${point.x * scale},${point.y * scale}`).join(' ');
    const strokeColor = stroke.tool === 'eraser' ? document.background : stroke.color;
    const opacity = stroke.tool === 'highlighter' ? Math.min(stroke.opacity, 0.35) : stroke.opacity;
    const sw = Math.max(1, stroke.width * scale);
    if (stroke.tool === 'ellipse' && stroke.points.length >= 4) {
      const xs = stroke.points.map((p) => p.x * scale); const ys = stroke.points.map((p) => p.y * scale);
      return <Ellipse key={stroke.id} cx={(Math.min(...xs) + Math.max(...xs)) / 2} cy={(Math.min(...ys) + Math.max(...ys)) / 2} rx={(Math.max(...xs) - Math.min(...xs)) / 2} ry={(Math.max(...ys) - Math.min(...ys)) / 2} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={sw} />;
    }
    if (stroke.tool === 'rectangle' && stroke.points.length >= 4) {
      const xs = stroke.points.map((p) => p.x * scale); const ys = stroke.points.map((p) => p.y * scale);
      return <Rect key={stroke.id} x={Math.min(...xs)} y={Math.min(...ys)} width={Math.max(...xs) - Math.min(...xs)} height={Math.max(...ys) - Math.min(...ys)} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={sw} />;
    }
    if (stroke.tool === 'line' || stroke.tool === 'arrow') {
      const [start, end] = stroke.points; if (!start || !end) return null;
      const x1 = start.x * scale; const y1 = start.y * scale; const x2 = end.x * scale; const y2 = end.y * scale;
      const angle = Math.atan2(y2 - y1, x2 - x1); const head = Math.max(8, sw * 2.8);
      const hx1 = x2 - head * Math.cos(angle - Math.PI / 6); const hy1 = y2 - head * Math.sin(angle - Math.PI / 6);
      const hx2 = x2 - head * Math.cos(angle + Math.PI / 6); const hy2 = y2 - head * Math.sin(angle + Math.PI / 6);
      return <><Line key={`${stroke.id}-line`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeOpacity={opacity} strokeWidth={sw} strokeLinecap="round" />{stroke.tool === 'arrow' && <Path key={`${stroke.id}-head`} d={`M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}</>;
    }
    return stroke.points.length > 1 ? <Polyline key={stroke.id} points={pts} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /> : null;
  };

  const generate = async () => {
    setBusy(true); setAiAsset(null);
    try { const result = await generateAiSketch({ prompt, style, width: document.width, height: document.height }); setAiAsset(result.imageUrl ?? result.svg ?? null); }
    finally { setBusy(false); }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: 'Sketch Generator' }} />
    <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Sketch Generator</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Traditional painting tools first, with AI available separately.</Text>
      <View style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'traditional' }} onPress={() => setMode('traditional')} style={[styles.modeButton, mode === 'traditional' && { backgroundColor: colors.secondary }]}><Feather name="edit-3" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Traditional</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'ai' }} onPress={() => setMode('ai')} style={[styles.modeButton, mode === 'ai' && { backgroundColor: colors.secondary }]}><Feather name="cpu" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>AI Based</Text></Pressable>
      </View>
      {mode === 'traditional' ? <>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Painter tools</Text>
        <View style={styles.toolGrid}>{TOOLS.map((item) => <Pressable key={item.tool} accessibilityRole="button" accessibilityLabel={`${item.label} tool`} accessibilityState={{ selected: settings.tool === item.tool }} onPress={() => setSettings((current) => ({ ...current, tool: item.tool }))} style={[styles.toolButton, { backgroundColor: colors.card, borderColor: settings.tool === item.tool ? colors.primary : colors.border }]}><Feather name={item.icon as never} size={15} color={colors.foreground} /><Text style={[styles.toolText, { color: colors.foreground }]}>{item.label}</Text></Pressable>)}</View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Colors</Text>
        <View style={styles.colorGrid}>{SKETCH_COLORS.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Color ${color}`} onPress={() => chooseColor(color)} style={[styles.colorSwatch, { backgroundColor: color, borderColor: settings.color === color ? colors.primary : colors.border }]} />)}</View>
        <View style={styles.colorEditor}><TextInput accessibilityLabel="Custom hex color" value={customColor} onChangeText={setCustomColor} maxLength={7} autoCapitalize="characters" style={[styles.hexInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="#RRGGBB" placeholderTextColor={colors.mutedForeground} /><Pressable accessibilityRole="button" accessibilityLabel="Apply custom color" onPress={() => /^#[0-9A-Fa-f]{6}$/.test(customColor) && chooseColor(customColor)} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontSize: 11, fontFamily: 'Inter_700Bold' }}>Apply</Text></Pressable></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Brush size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>{BRUSH_SIZES.map((size) => <Pressable key={size} accessibilityRole="button" accessibilityLabel={`Brush size ${size}`} accessibilityState={{ selected: settings.width === size }} onPress={() => setSettings((current) => ({ ...current, width: size }))} style={[styles.sizeButton, { backgroundColor: colors.card, borderColor: settings.width === size ? colors.primary : colors.border }]}><Circle cx={18} cy={12} r={Math.min(12, Math.max(2, size / 2))} fill={settings.color} /><Text style={[styles.sizeText, { color: colors.foreground }]}>{size}px</Text></Pressable>)}</ScrollView>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Opacity</Text>
        <View style={styles.opacityRow}>{[1, 0.75, 0.5, 0.25].map((opacity) => <Pressable key={opacity} accessibilityRole="button" accessibilityLabel={`${Math.round(opacity * 100)} percent opacity`} accessibilityState={{ selected: settings.opacity === opacity }} onPress={() => setSettings((current) => ({ ...current, opacity }))} style={[styles.opacityButton, { backgroundColor: colors.card, borderColor: settings.opacity === opacity ? colors.primary : colors.border }]}><Text style={[styles.opacityText, { color: colors.foreground }]}>{Math.round(opacity * 100)}%</Text></Pressable>)}</View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Drawing canvas</Text>
        <View style={[styles.canvasWrap, { backgroundColor: colors.card, borderColor: colors.border }]}><View accessibilityRole="image" accessibilityLabel="Sketch drawing canvas. Draw with touch." onTouchStart={(event) => startStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)} onTouchMove={(event) => moveStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)} onTouchEnd={finishStroke} style={[styles.canvas, { backgroundColor: background }]}><Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>{previewStrokes.map(renderStroke)}</Svg></View></View>
        <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Undo last drawing action" disabled={!history.length} onPress={undo} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: history.length ? 1 : 0.5 }]}><Feather name="corner-up-left" size={17} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Undo</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Clear entire sketch" onPress={clear} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="trash-2" size={17} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Clear</Text></Pressable></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Paper / background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.backgroundRow}>{['#FFFFFF', '#F3F4F6', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#111827'].map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Background ${color}`} onPress={() => changeBackground(color)} style={[styles.backgroundSwatch, { backgroundColor: color, borderColor: background === color ? colors.primary : colors.border }]} />)}</ScrollView>
      </> : <>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI sketch prompt</Text>
        <TextInput accessibilityLabel="AI sketch prompt" value={prompt} onChangeText={setPrompt} multiline style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Describe the sketch you want" placeholderTextColor={colors.mutedForeground} />
        <TextInput accessibilityLabel="AI sketch style" value={style} onChangeText={setStyle} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Style" placeholderTextColor={colors.mutedForeground} />
        <Pressable accessibilityRole="button" accessibilityLabel="Generate AI sketch" disabled={busy || !prompt.trim()} onPress={generate} style={[styles.generateButton, { backgroundColor: colors.primary, opacity: busy || !prompt.trim() ? 0.6 : 1 }]}><Feather name="zap" size={18} color={colors.primaryForeground} /><Text style={[styles.generateText, { color: colors.primaryForeground }]}>{busy ? 'Generating…' : 'Generate Sketch'}</Text></Pressable>
        <View accessible accessibilityRole="summary" style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>AI gateway</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>The mobile app calls the configured REST gateway; Hugging Face credentials remain server-side.</Text></View>
        {aiAsset && <View accessible accessibilityRole="summary" style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Generated asset ready</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>{aiAsset.startsWith('<svg') ? 'SVG returned.' : 'Image asset returned.'}</Text></View>}
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17, marginTop: 6 }, modeRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, marginTop: 18 }, modeButton: { flex: 1, minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, modeText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 18, marginBottom: 9 }, toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, toolButton: { width: '31%', minHeight: 43, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, gap: 3 }, toolText: { fontSize: 8.5, fontFamily: 'Inter_700Bold' }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, colorSwatch: { width: 31, height: 31, borderRadius: 16, borderWidth: 2 }, colorEditor: { flexDirection: 'row', gap: 8, marginTop: 9 }, hexInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 12 }, smallButton: { minWidth: 80, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, sizeRow: { gap: 8 }, sizeButton: { minWidth: 70, minHeight: 54, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 1 }, sizeText: { fontSize: 9 }, opacityRow: { flexDirection: 'row', gap: 8 }, opacityButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, opacityText: { fontSize: 10, fontFamily: 'Inter_700Bold' }, canvasWrap: { alignSelf: 'center', borderWidth: 1, borderRadius: 18, padding: 7 }, canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, overflow: 'hidden', borderRadius: 12 }, actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, actionButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, backgroundRow: { gap: 9 }, backgroundSwatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2 }, input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, marginBottom: 10 }, generateButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, generateText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, infoCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 }, resultCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10 }, infoTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 5 }, infoText: { fontSize: 11, lineHeight: 17 }
});
