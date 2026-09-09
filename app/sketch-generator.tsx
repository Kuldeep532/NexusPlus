import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { addStroke, clearSketch, createSketchDocument, createStroke, undoLastStroke, type Point, type SketchDocument } from '@/features/sketch/sketchEngine';
import { generateAiSketch } from '@/features/sketch/aiSketchGateway';

const CANVAS_SIZE = 320;

export default function SketchGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [document, setDocument] = useState<SketchDocument>(() => createSketchDocument());
  const [mode, setMode] = useState<'traditional' | 'ai'>('traditional');
  const [prompt, setPrompt] = useState('A simple mountain landscape with a sun');
  const [style, setStyle] = useState('pencil sketch');
  const [busy, setBusy] = useState(false);
  const [aiAsset, setAiAsset] = useState<string | null>(null);
  const drawing = useRef<Point[]>([]);

  const scale = CANVAS_SIZE / document.width;
  const previewPoints = useMemo(() => document.strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ x: point.x * scale, y: point.y * scale })) })), [document, scale]);

  const finishStroke = () => {
    if (drawing.current.length > 1) setDocument((current) => addStroke(current, createStroke(drawing.current)));
    drawing.current = [];
  };

  const startStroke = (x: number, y: number) => { drawing.current = [{ x: x / scale, y: y / scale }]; };
  const moveStroke = (x: number, y: number) => { drawing.current = [...drawing.current, { x: x / scale, y: y / scale }]; };

  const generate = async () => {
    setBusy(true);
    setAiAsset(null);
    try {
      const result = await generateAiSketch({ prompt, style, width: document.width, height: document.height });
      setAiAsset(result.imageUrl ?? result.svg ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Sketch Generator' }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Sketch Generator</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a sketch manually or generate one with the AI REST gateway.</Text>

        <View style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'traditional' }} onPress={() => setMode('traditional')} style={[styles.modeButton, mode === 'traditional' && { backgroundColor: colors.secondary }]}><Feather name="edit-3" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Traditional</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'ai' }} onPress={() => setMode('ai')} style={[styles.modeButton, mode === 'ai' && { backgroundColor: colors.secondary }]}><Feather name="cpu" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>AI Based</Text></Pressable>
        </View>

        {mode === 'traditional' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Drawing canvas</Text>
            <View style={[styles.canvasWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View
                accessibilityRole="image"
                accessibilityLabel="Sketch drawing canvas"
                onTouchStart={(event) => startStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)}
                onTouchMove={(event) => moveStroke(event.nativeEvent.locationX, event.nativeEvent.locationY)}
                onTouchEnd={finishStroke}
                style={styles.canvas}
              >
                <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
                  <Polyline points={`0,0 ${CANVAS_SIZE},0 ${CANVAS_SIZE},${CANVAS_SIZE} 0,${CANVAS_SIZE} 0,0`} fill="#ffffff" stroke={colors.border} strokeWidth={1} />
                  {previewPoints.map((stroke) => <Polyline key={stroke.id} points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={Math.max(1, stroke.width * scale)} strokeLinecap="round" strokeLinejoin="round" />)}
                </Svg>
              </View>
            </View>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Undo last stroke" disabled={document.strokes.length === 0} onPress={() => setDocument((current) => undoLastStroke(current))} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: document.strokes.length === 0 ? 0.5 : 1 }]}><Feather name="corner-up-left" size={17} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Undo</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Clear sketch" onPress={() => setDocument((current) => clearSketch(current))} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="trash-2" size={17} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Clear</Text></Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI sketch prompt</Text>
            <TextInput accessibilityLabel="AI sketch prompt" value={prompt} onChangeText={setPrompt} multiline style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Describe the sketch you want" placeholderTextColor={colors.mutedForeground} />
            <TextInput accessibilityLabel="AI sketch style" value={style} onChangeText={setStyle} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Style, for example pencil sketch" placeholderTextColor={colors.mutedForeground} />
            <Pressable accessibilityRole="button" accessibilityLabel="Generate AI sketch" disabled={busy || !prompt.trim()} onPress={generate} style={[styles.generateButton, { backgroundColor: colors.primary, opacity: busy || !prompt.trim() ? 0.6 : 1 }]}><Feather name={busy ? 'loader' : 'zap'} size={18} color={colors.primaryForeground} /><Text style={[styles.generateText, { color: colors.primaryForeground }]}>{busy ? 'Generating…' : 'Generate Sketch'}</Text></Pressable>
            <View accessible accessibilityRole="summary" style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Gateway security</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>The app sends requests only to the configured REST gateway. Hugging Face credentials stay server-side; no token is embedded in the mobile app.</Text></View>
            {aiAsset && <View accessible accessibilityRole="image" accessibilityLabel="Generated AI sketch asset" style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Generated asset ready</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>{aiAsset.startsWith('<svg') ? 'SVG sketch returned by the gateway.' : 'Image asset returned by the gateway.'}</Text></View>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17, marginTop: 6 }, modeRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, marginTop: 18 }, modeButton: { flex: 1, minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, modeText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 9 }, canvasWrap: { alignSelf: 'center', borderWidth: 1, borderRadius: 18, padding: 7 }, canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: 12 }, actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, actionButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, marginBottom: 10 }, generateButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }, generateText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, infoCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 }, resultCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10 }, infoTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 5 }, infoText: { fontSize: 11, lineHeight: 17 }
});
