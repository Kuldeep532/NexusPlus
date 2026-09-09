import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addStroke, BRUSH_SIZES, clearSketch, createSketchDocument, createStroke, SKETCH_COLORS, setBackground, undoLastStroke, type Point, type SketchDocument, type SketchSettings, type ToolKind } from '@/features/sketch/sketchEngine';
import { generateAiSketch } from '@/features/sketch/aiSketchGateway';

const CANVAS_SIZE = 320;
const TOOL_GROUPS: { label: string; tool: ToolKind }[] = [
  { label: 'Pen', tool: 'pen' }, { label: 'Pencil', tool: 'pencil' }, { label: 'Marker', tool: 'marker' },
  { label: 'Brush', tool: 'brush' }, { label: 'Highlighter', tool: 'highlighter' }, { label: 'Eraser', tool: 'eraser' },
  { label: 'Line', tool: 'line' }, { label: 'Rectangle', tool: 'rectangle' }, { label: 'Ellipse', tool: 'ellipse' }, { label: 'Arrow', tool: 'arrow' },
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
  const previewPoints = useMemo(() => document.strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ x: point.x * scale, y: point.y * scale })) })), [document, scale]);

  const commit = (next: SketchDocument) => {
    setHistory((current) => [...current, document].slice(-50));
    setDocument(next);
  };

  const finishFreehand = () => {
    if (drawing.current.length > 1) commit(addStroke(document, createStroke(drawing.current, settings)));
    drawing.current = [];
  };

  const finishShape = () => {
    const start = gestureStart.current;
    const end = drawing.current.at(-1);
    if (!start || !end) return;
    const minX = Math.min(start.x, end.x); const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x); const maxY = Math.max(start.y, end.y);
    const points: Point[] = settings.tool === 'line' || settings.tool === 'arrow'
      ? [start, end]
      : [
          { x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }, { x: minX, y: minY },
        ];
    commit(addStroke(document, createStroke(points, settings)));
    drawing.current = []; gestureStart.current = null;
  };

  const startStroke = (x: number, y: number) => {
    const point = { x: x / scale, y: y / scale };
    gestureStart.current = point;
    drawing.current = [point];
  };
  const moveStroke = (x: number, y: number) => { drawing.current = [...drawing.current, { x: x / scale, y: y / scale }]; };
  const finishStroke = () => ['line', 'rectangle', 'ellipse', 'arrow'].includes(settings.tool) ? finishShape() : finishFreehand();

  const undo = () => {
    if (!history.length) return;
    setDocument(history[history.length - 1]);
    setHistory((current) => current.slice(0, -1));
  };

  const clear = () => { setHistory((current) => [...current, document].slice(-50)); setDocument(clearSketch(document)); };
  const chooseColor = (color: string) => { setCustomColor(color); setSettings((current) => ({ ...current, color, tool: current.tool === 'eraser' ? 'pen' : current.tool })); };
  const changeBackground = (color: string) => { setCanvasBackground(color); setDocument((current) => setBackground(current, color)); };

  const renderStroke = (stroke: SketchDocument['strokes'][number]) => {
    const points = stroke.points.map((point) => `${point.x * scale},${point.y * scale}`).join(' ');
    const isShape = ['line', 'rectangle', 'ellipse', 'arrow'].includes(stroke.tool);
    const strokeColor = stroke.tool === 'eraser' ? document.background : stroke.color;
    const opacity = stroke.tool === 'highlighter' ? Math.min(stroke.opacity, 0.35) : stroke.opacity;
    if (stroke.tool === 'ellipse' && stroke.points.length >= 4) {
      const xs = stroke.points.map((p) => p.x * scale); const ys = stroke.points.map((p) => p.y * scale);
      return <Ellipse key={stroke.id} cx={(Math.min(...xs) + Math.max(...xs)) / 2} cy={(Math.min(...ys) + Math.max(...ys)) / 2} rx={(Math.max(...xs) - Math.min(...xs)) / 2} ry={(Math.max(...ys) - Math.min(...ys)) / 2} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={Math.max(1, stroke.width * scale)} />;
    }
    if (stroke.tool === 'rectangle' && stroke.points.length >= 4) {
      const xs = stroke.points.map((p) => p.x * scale); const ys = stroke.points.map((p) => p.y * scale);
      return <Rect key={stroke.id} x={Math.min(...xs)} y={Math.min(...ys)} width={Math.max(...xs) - Math.min(...xs)} height={Math.max(...ys) - Math.min(...ys)} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={Math.max(1, stroke.width * scale)} />;
    }
    if ((stroke.tool === 'line' || stroke.tool === 'arrow') && stroke.points.length >= 2) {
      const [start, end] = stroke.points; const x1 = start.x * scale; const y1 = start.y * scale; const x2 = end.x * scale; const y2 = end.y * scale;
      const angle = Math.atan2(y2 - y1, x2 - x1); const head = Math.max(7, stroke.width * scale * 2.5);
      const hx1 = x2 - head * Math.cos(angle - Math.PI / 6); const hy1 = y2 - head * Math.sin(angle - Math.PI / 6);
      const hx2 = x2 - head * Math.cos(angle + Math.PI / 6); const hy2 = y2 - head * Math.sin(angle + Math.PI / 6);
      return <View key={stroke.id}><Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeOpacity={opacity} strokeWidth={Math.max(1, stroke.width * scale)} strokeLinecap="round" />{stroke.tool === 'arrow' && <Path d={`M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={Math.max(1, stroke.width * scale)} strokeLinecap="round" strokeLinejoin="round" />}</View>;
    }
    if (!isShape && stroke.points.length > 1) return <Polyline key={stroke.id} points={points} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={Math.max(1, stroke.width * scale)} strokeLinecap="round" strokeLinejoin="round" />;
    return null;
  };

  const generate = async () => {
    setBusy(true); setAiAsset(null);
    try { const result = await generateAiSketch({ prompt, style, width: document.width, height: document.height }); setAiAsset(result.imageUrl ?? result.svg ?? null); }
    finally { setBusy(false); }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Sketch Generator' }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Sketch Generator</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A complete drawing workspace with freehand painting, shapes, colors and AI generation.</Text>
        <View style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['traditional', 'ai'] as const).map((nextMode) => <Pressable key={nextMode} accessibilityRole="button" accessibilityState={{ selected: mode === nextMode }} onPress={() => setMode(nextMode)} style={[styles.modeButton, mode === nextMode && { backgroundColor: colors.secondary }]}><Feather name={nextMode === 'traditional' ? 'edit-3' : 'cpu'} size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>{nextMode === 'traditional' ? 'Traditional' : 'AI Based'}</Text></Pressable>)}
        </View>

        {mode === 'traditional' ? <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tools</Text>
          <View style={styles.toolGrid}>{TOOL_GROUPS.map((item) => <Pressable key={item.tool} accessibilityRole="button" accessibilityLabel={`${item.label} tool`} accessibilityState={{ selected: settings.tool === item.tool }} onPress={() => setSettings((current) => ({ ...current, tool: item.tool }))} style={[styles.toolButton, { backgroundColor: colors.card, borderColor: settings.tool === item.tool ? colors.primary : colors.border }]}><Feather name={item.tool === 'eraser' ? 'square' : item.tool === 'pencil' ? 'edit-2' : item.tool === 'brush' ? 'feather' : item.tool === 'rectangle' ? 'square' : item.tool === 'ellipse' ? 'circle' : item.tool === 'arrow' ? 'arrow-up-right' : 'edit-3'} size={15} color={colors.foreground} /><Text style={[styles.toolText, { color: colors.foreground }]}>{item.label}</Text></Pressable>)}</View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Colors</Text>
          <View style={styles.colorGrid}>{SKETCH_COLORS.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Color ${color}`} onPress={() => chooseColor(color)} style={[styles.colorSwatch, { backgroundColor: color, borderColor: settings.color === color ? colors.primary : colors.border }]} />)}</View>
          <View style={styles.colorEditor}><TextInput accessibilityLabel="Custom hex color" value={customColor} onChangeText={(value) => { setCustomColor(value); if (/^#[0-9A-Fa-f]{6}$/.test(value)) chooseColor(value); }} autoCapitalize="characters" maxLength={7} style={[styles.hexInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="#RRGGBB" placeholderTextColor={colors.mutedForeground} /><Pressable accessibilityRole="button" accessibilityLabel="Use custom color" onPress={() => /^#[0-9A-Fa-f]{6}$/.test(customColor) && chooseColor(customColor)} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Use Color</Text></Pressable></View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Brush size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>{BRUSH_SIZES.map((size) => <Pressable key={size} accessibilityRole="button" accessibilityLabel={`Brush size ${size}`} accessibilityState={{ selected: settings.width === size }} onPress={() => setSettings((current) => ({ ...current, width: size }))} style={[styles.sizeButton, { backgroundColor: colors.card, borderColor: settings.width === size ? colors.primary : colors.border }]}><View style={[styles.sizeDot, { width: Math.min(28, Math.max(3, size / 2)), height: Math.min(28, Math.max(3, size / 2)), backgroundColor: settings.color }]} /><Text style={[styles.sizeText, { color: colors.foreground }]}>{size}px</Text></Pressable>)}</ScrollView>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Opacity</Text>
          <View style={styles.opacityRow}>{[1, 0.75, 0.5, 0.25].map((opacity) => <Pressable key={opacity} accessibilityRole="button" accessibilityLabel={`${Math.round(opacity * 100)} percent opacity`} accessibilityState={{ selected: settings.opacity === opacity }} onPress={() => setSettings((current) => ({ ...current, opacity }))} style={[styles.opacityButton, { backgroundColor: colors.card, borderColor: settings.opacity === opacity ? colors.primary : colors.border }]}><Text style={[styles.opacityText, { color: colors.foreground }]}>{Math.round(opacity * 100)}%</Text></Pressable>)}</View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Canvas</Text>
          <View style={[styles.canvasWrap, { backgroundColor: colors.card, borderColor: colors.border }]}><View accessibilityRole="image" accessibilityLabel="Sketch drawing canvas. Draw with touch." onTouchStart={(event) => startStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)} onTouchMove={(event) => moveStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)} onTouchEnd={finishStroke} style={[styles.canvas, { backgroundColor: background }]}><Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>{previewPoints.map(renderStroke)}</Svg></View></View>
          <View style={styles.actionRow}>{[["Undo", undo, 'corner-up-left'], ["Clear", clear, 'trash-2']].map(([label, action, icon]) => <Pressable key={label as string} accessibilityRole="button" accessibilityLabel={label as string} onPress={action as () => void} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={icon as never} size={17} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>{label as string}</Text></Pressable>)}</View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Canvas background</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.backgroundRow}>{['#FFFFFF', '#F3F4F6', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#111827'].map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Canvas background ${color}`} onPress={() => changeBackground(color)} style={[styles.backgroundSwatch, { backgroundColor: color, borderColor: background === color ? colors.primary : colors.border }]} />)}</ScrollView>
        </> : <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI sketch prompt</Text>
          <TextInput accessibilityLabel="AI sketch prompt" value={prompt} onChangeText={setPrompt} multiline style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Describe the sketch you want" placeholderTextColor={colors.mutedForeground} />
          <TextInput accessibilityLabel="AI sketch style" value={style} onChangeText={setStyle} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Style, for example pencil sketch" placeholderTextColor={colors.mutedForeground} />
          <Pressable accessibilityRole="button" accessibilityLabel="Generate AI sketch" disabled={busy || !prompt.trim()} onPress={generate} style={[styles.generateButton, { backgroundColor: colors.primary, opacity: busy || !prompt.trim() ? 0.6 : 1 }]}><Feather name={busy ? 'loader' : 'zap'} size={18} color={colors.primaryForeground} /><Text style={[styles.generateText, { color: colors.primaryForeground }]}>{busy ? 'Generating…' : 'Generate Sketch'}</Text></Pressable>
          <View accessible accessibilityRole="summary" style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Gateway security</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>The app sends requests only to the configured REST gateway. Hugging Face credentials stay server-side; no token is embedded in the mobile app.</Text></View>
          {aiAsset && <View accessible accessibilityRole="image" accessibilityLabel="Generated AI sketch asset" style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Generated asset ready</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>{aiAsset.startsWith('<svg') ? 'SVG sketch returned by the gateway.' : 'Image asset returned by the gateway.'}</Text></View>}
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17, marginTop: 6 }, modeRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, marginTop: 18 }, modeButton: { flex: 1, minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, modeText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 18, marginBottom: 9 }, toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, toolButton: { width: '31%', minHeight: 43, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, gap: 4 }, toolText: { fontSize: 9, fontFamily: 'Inter_700Bold' }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, colorSwatch: { width: 31, height: 31, borderRadius: 16, borderWidth: 2 }, colorEditor: { flexDirection: 'row', gap: 8, marginTop: 9 }, hexInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 12 }, smallButton: { minWidth: 92, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, smallButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, sizeRow: { gap: 8 }, sizeButton: { minWidth: 74, minHeight: 54, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 3 }, sizeDot: { borderRadius: 20 }, sizeText: { fontSize: 9 }, opacityRow: { flexDirection: 'row', gap: 8 }, opacityButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, opacityText: { fontSize: 10, fontFamily: 'Inter_700Bold' }, canvasWrap: { alignSelf: 'center', borderWidth: 1, borderRadius: 18, padding: 7 }, canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, overflow: 'hidden', borderRadius: 12 }, actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, actionButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, backgroundRow: { gap: 9 }, backgroundSwatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2 }, input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, marginBottom: 10 }, generateButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }, generateText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, infoCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 }, resultCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10 }, infoTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 5 }, infoText: { fontSize: 11, lineHeight: 17 }
});
