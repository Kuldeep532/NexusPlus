import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { announceClean } from '@/features/accessibility/spokenAnnouncement';
import { VideoView } from 'expo-video';
import { scanLocalMedia, buildCollections } from './library';
import { createPlaylist, loadDevicePlaylists } from './playlists';
import { isYouTubeMusicInstalled, openYouTubeMusicSearch, searchYouTubeMusic, handoffYouTubeMusic, type YouTubeMusicSearchResult } from './youtubeMusic';
import { vocalRemoverService } from './vocal-remover/VocalRemoverService';
import { findActiveCue, formatTime, parseSrt } from './subtitles';
import { useMediaPlayer } from './useMediaPlayer';
import type { MediaItemModel, SubtitleCue } from './types';
import { DEFAULT_MEDIA_PLAYER_PREFERENCES, readMediaPlayerPreferences, type MediaPlayerPreferences } from '@/features/media-player/mediaPlayerPreferences';
import { videoDescriptionAnalyzer } from './videoDescription';
import { detectVideoDescriptionLanguage, speakVideoDescription } from './videoDescriptionTts';
import { getNativeVideoDescriptionModule } from './videoDescriptionNative';
import { ensureOpenCvWasm } from './opencvWasm';
import { AUDIO_EFFECT_PRESETS, type AudioEffectPreset } from './audioEffects';
import { readMediaBrowserPreferences, type MediaSort, type MediaBrowserPreferences } from './mediaBrowserPreferences';
import { validateStreamUri } from './streamCapability';
import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import { usePersistentMedia } from './PersistentMediaController';

type Props = { initialItems?: MediaItemModel[]; onBack?: () => void };
type LibraryTab = 'tracks' | 'albums' | 'playlists';
type MediaTab = 'audio' | 'video';
type Screen = 'library' | 'player';

function Button({ label, hint, onPress, text, selected = false }: { label: string; hint?: string; onPress: () => void; text: string; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} style={({ pressed }) => [styles.button, selected && styles.selectedButton, pressed && styles.pressed]}><Text accessible={false} style={styles.buttonText}>{text}</Text></Pressable>;
}

export function NexusMediaPlayer({ initialItems = [], onBack }: Props) {
  const [library, setLibrary] = useState<MediaItemModel[]>(initialItems);
  const [screen, setScreen] = useState<Screen>('library');
  const [mediaTab, setMediaTab] = useState<MediaTab>('audio');
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaBrowserPrefs, setMediaBrowserPrefs] = useState<MediaBrowserPreferences>({ sort: 'name', descending: false, compactGrid: false });
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('tracks');
  const [query, setQuery] = useState('');
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [youtubeInstalled, setYoutubeInstalled] = useState(false);
  const [playlists, setPlaylists] = useState<Awaited<ReturnType<typeof loadDevicePlaylists>>>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [vocalBusy, setVocalBusy] = useState(false);
  const [vocalProgress, setVocalProgress] = useState(0);
  const [vocalMode, setVocalMode] = useState<'instrumental' | 'vocals'>('instrumental');
  const [videoDescriptionEnabled, setVideoDescriptionEnabled] = useState(false);
  const [mediaPrefs, setMediaPrefs] = useState<MediaPlayerPreferences>(DEFAULT_MEDIA_PLAYER_PREFERENCES);
  const [videoDescriptionStatus, setVideoDescriptionStatus] = useState('');
  const [audioEffect, setAudioEffect] = useState<AudioEffectPreset>('normal');
  const [audioEffectBusy, setAudioEffectBusy] = useState(false);
  const [urlDialog, setUrlDialog] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const descriptionBusy = useRef(false);
  const player = useMediaPlayer(library);
  const persistent = usePersistentMedia();

  const refresh = useCallback(async () => {
    const result = await scanLocalMedia();
    const merged = [...result.audio, ...result.video];
    setLibrary(merged);
    player.updateQueue(merged);
    setPlaylists(await loadDevicePlaylists());
  }, [player]);

  useEffect(() => { void refresh(); void isYouTubeMusicInstalled().then(setYoutubeInstalled); void readMediaPlayerPreferences().then((prefs) => { setMediaPrefs(prefs); setVideoDescriptionEnabled(prefs.videoDescriptionEnabled); }); void readMediaBrowserPreferences().then(setMediaBrowserPrefs); }, [refresh]);
  useEffect(() => { if (player.state.current) void announceClean(`Playing ${player.state.current.title}`); }, [player.state.current?.id]);

  const audio = useMemo(() => library.filter((item) => item.kind === 'audio'), [library]);
  const video = useMemo(() => library.filter((item) => item.kind === 'video'), [library]);
  const collections = useMemo(() => buildCollections(audio, playlists), [audio, playlists]);
  const visibleTracks = useMemo(() => {
    const source = mediaTab === 'audio' ? audio : video;
    const needle = (query || mediaSearch).trim().toLowerCase();
    const filtered = needle ? source.filter((item) => [item.title, item.artist, item.album].some((v) => v?.toLowerCase().includes(needle))) : source;
    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      if (mediaBrowserPrefs.sort === 'duration') result = (a.durationMs || 0) - (b.durationMs || 0);
      else if (mediaBrowserPrefs.sort === 'date') result = a.id.localeCompare(b.id);
      else result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return mediaBrowserPrefs.descending ? -result : result;
    });
    return sorted;
  }, [audio, video, mediaTab, query, mediaSearch, mediaBrowserPrefs]);
  const current = persistent.current && persistent.current.kind === 'audio' ? persistent.current : player.state.current;
  const isRadio = current?.source === 'radio';
  const canVocalRemove = current?.kind === 'audio' && !isRadio && (current.source ?? 'local') === 'local';
  const activeCue = findActiveCue(subtitleCues, player.state.positionMs);

  useEffect(() => {
    const native = getNativeVideoDescriptionModule();
    if (!native?.describeVideoFrame) return;
    (videoDescriptionAnalyzer as unknown as { describeFrame: typeof videoDescriptionAnalyzer.describeFrame; isAvailable: () => Promise<boolean> }).describeFrame = async (uri, timestampMs, language) => {
      const result = await native.describeVideoFrame?.({ videoUri: uri, timestampMs, language });
      return result ? { timestampMs, text: result.text, language, confidence: result.confidence } : null;
    };
    (videoDescriptionAnalyzer as unknown as { isAvailable: () => Promise<boolean> }).isAvailable = async () => Boolean(await native.isOpenCvAvailable?.());
  }, []);

  useEffect(() => {
    if (!videoDescriptionEnabled || current?.kind !== 'video' || !current.uri || !player.state.isPlaying) return;
    if (descriptionBusy.current) return;
    const run = async () => {
      descriptionBusy.current = true;
      try {
        const nativeAvailable = await videoDescriptionAnalyzer.isAvailable();
        if (!nativeAvailable) {
          const wasm = await ensureOpenCvWasm();
          if (wasm.status !== 'ready') { setVideoDescriptionStatus(wasm.error || 'OpenCV visual description engine is unavailable.'); return; }
          setVideoDescriptionStatus(wasm.downloadedNow ? 'OpenCV visual engine downloaded and cached.' : 'OpenCV visual engine loaded from device cache.');
          return;
        }
        const language: 'hi' | 'en' = activeCue?.text ? detectVideoDescriptionLanguage(activeCue.text) : 'en';
        const description = await videoDescriptionAnalyzer.describeFrame(current.uri, player.state.positionMs, language);
        if (!description?.text) return;
        setVideoDescriptionStatus(description.text);
        await speakVideoDescription(description.text, description.language);
      } catch {
        setVideoDescriptionStatus('Video description unavailable');
      } finally { descriptionBusy.current = false; }
    };
    void run();
  }, [videoDescriptionEnabled, current?.id, current?.kind, current?.uri, player.state.isPlaying, Math.floor(player.state.positionMs / mediaPrefs.descriptionIntervalMs), mediaPrefs.descriptionIntervalMs]);

  const loadItem = useCallback((item: MediaItemModel, queue = library) => {
    if (item.kind === 'audio' && item.source !== 'radio') {
      void persistent.load(item, queue);
    } else {
      player.load(item, queue);
    }
    setScreen('player');
  }, [library, persistent, player]);

  const applyAudioEffect = useCallback(async (preset: AudioEffectPreset) => {
    if (!current || current.kind !== 'audio' || preset === 'normal' || audioEffectBusy) return;
    setAudioEffectBusy(true);
    try {
      const native = assertAudioEditorNative();
      const safeStem = current.uri.replace(/\.[^.\\/]+$/, '');
      const outputPath = safeStem + '.' + preset + '.' + Date.now() + '.wav';
      const result = await native.applyEffect({
        inputPath: current.uri,
        outputPath,
        effect: preset,
        startMs: 0,
        endMs: current.durationMs ?? 2147483647,
        amount: 0.65,
      });
      const derived: MediaItemModel = {
        ...current,
        id: current.id + ':' + preset + ':' + Date.now(),
        uri: result.outputPath,
        title: current.title + ' — ' + preset,
        source: 'local',
      };
      loadItem(derived, [derived]);
    } catch (error) {
      Alert.alert('Audio effect', error instanceof Error ? error.message : 'The selected audio effect could not be applied.');
    } finally {
      setAudioEffectBusy(false);
    }
  }, [audioEffectBusy, current, loadItem]);

  const loadRemoteUrl = useCallback(() => {
    const uri = mediaUrl.trim();
    if (!/^https:\/\//i.test(uri)) {
      Alert.alert('Get Audio from URL', 'Only secure HTTPS URLs are supported.');
      return;
    }
    const lower = uri.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('spotify.com')) {
      setUrlDialog(false);
      setMediaUrl('');
      Alert.alert('Protected provider', 'Use the official provider flow for protected platforms. Direct stream extraction is not supported.');
      return;
    }
    const kind: 'audio' | 'video' = /\.(mp4|m4v|webm|mov|mkv|m3u8)(?:\?|#|$)/i.test(uri) ? 'video' : 'audio';
    void validateStreamUri(uri, kind).then((capability) => {
      if (!capability.supported) { Alert.alert('Unsupported media', capability.message || (kind === 'audio' ? 'This audio URL is not supported.' : 'This video URL is not supported.')); return; }
      const item: MediaItemModel = {
      id: 'url:' + uri,
      uri,
      kind,
      source: 'local',
      title: uri,
    };
      loadItem(item, [item]);
      setUrlDialog(false);
      setMediaUrl('');
    });
  }, [loadItem, mediaUrl]);

  const runVocalRemoval = useCallback(async () => {
    if (!current || !canVocalRemove) return;
    setVocalBusy(true);
    try {
      const result = await vocalRemoverService.removeVocals(current, { outputStem: vocalMode, quality: 'studio' }, (job) => setVocalProgress(job.progress));
      const derived: MediaItemModel = { ...current, id: `${current.id}:${result.stem}:${Date.now()}`, uri: result.outputUri, title: `${current.title} — ${result.stem === 'instrumental' ? 'Instrumental' : 'Vocals'}`, source: 'local' };
      loadItem(derived, [derived]);
      void announceClean('Vocal separation completed');
    } catch (error) { Alert.alert('Vocal Remover', error instanceof Error ? error.message : 'Vocal separation failed.'); }
    finally { setVocalBusy(false); setVocalProgress(0); }
  }, [canVocalRemove, current, loadItem, vocalMode]);

  const savePlaylist = useCallback(async () => {
    try {
      const playlist = await createPlaylist(newPlaylistName);
      setPlaylists((items) => [...items, playlist]);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
      void announceClean(`Playlist ${playlist.name} created`);
    } catch (error) { Alert.alert('Playlist', error instanceof Error ? error.message : 'Could not create playlist.'); }
  }, [newPlaylistName]);

  const onLoadSrt = useCallback(async (uri: string) => { try { setSubtitleCues(parseSrt(await (await fetch(uri)).text())); } catch { setSubtitleCues([]); } }, []);
  const searchYT = useCallback(async () => setYoutubeResults(await searchYouTubeMusic(youtubeQuery)), [youtubeQuery]);

  if (screen === 'player') {
    return <View style={styles.root}>
      <View style={styles.header}><Button label="Back to media library" onPress={() => setScreen('library')} text="‹" /><View style={styles.headerText}><Text accessibilityRole="header" style={styles.title}>Now Playing</Text><Text style={styles.muted}>{isRadio ? 'Radio' : current?.kind?.toUpperCase() || 'Media'}</Text></View><Button label="Get Audio from URL" onPress={() => setUrlDialog(true)} text="URL" /><Button label="Close player and stop audio" onPress={() => { persistent.stop(); player.pause(); setScreen('library'); }} text="Close" /></View>
      {current?.kind === 'video' ? <View style={styles.video}><VideoView player={player.videoPlayer} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />{activeCue ? <View style={styles.subtitle}><Text style={styles.subtitleText}>{activeCue.text}</Text></View> : null}</View> : <View style={styles.artwork}>{current?.artworkUri ? <Image source={{ uri: current.artworkUri }} style={styles.artworkImage} /> : <Text style={styles.glyph}>♫</Text>}</View>}
      <View style={styles.nowPlaying}><Text accessibilityRole="header" numberOfLines={2} style={styles.trackTitle}>{current?.title || 'Nothing playing'}</Text><Text style={styles.muted}>{current?.artist || current?.album || ''}</Text></View>
      {!isRadio ? <View style={styles.progressRow}><Text style={styles.time}>{formatTime(current?.kind === 'audio' ? persistent.positionMs : player.state.positionMs)}</Text><Pressable accessibilityRole="adjustable" accessibilityLabel="Playback position" accessibilityValue={{ min: 0, max: Math.max(1, current?.kind === 'audio' ? persistent.durationMs : player.state.durationMs), now: current?.kind === 'audio' ? persistent.positionMs : player.state.positionMs }} onPress={() => { const pos=current?.kind==='audio'?persistent.positionMs:player.state.positionMs; const dur=current?.kind==='audio'?persistent.durationMs:player.state.durationMs; (current?.kind==='audio'?persistent.seekTo:player.seekTo)(Math.min(dur, pos + 10000)); }}} style={styles.progress}><View style={[styles.progressFill, { width: `${(current?.kind==='audio'?persistent.durationMs:player.state.durationMs) ? Math.min(100, (current?.kind==='audio'?persistent.positionMs:player.state.positionMs) / (current?.kind==='audio'?persistent.durationMs:player.state.durationMs) * 100) : 0}%` }]} /></Pressable><Text style={styles.time}>{formatTime(current?.kind==='audio'?persistent.durationMs:player.state.durationMs)}</Text></View> : <Text accessibilityRole="text" style={styles.live}>LIVE RADIO · SEEKING DISABLED</Text>}
      <View style={styles.controls}>{!isRadio ? <Button label="Previous" hint="Play previous track" onPress={current?.kind==='audio'?persistent.previous:player.previous} text="⏮" /> : null}<Button label={(current?.kind==='audio'?persistent.isPlaying:player.state.isPlaying) ? 'Pause' : 'Play'} onPress={current?.kind==='audio'?persistent.toggle:player.togglePlayPause} text={(current?.kind==='audio'?persistent.isPlaying:player.state.isPlaying) ? '❚❚' : '▶'} selected />{!isRadio ? <Button label="Next" hint="Play next track" onPress={current?.kind==='audio'?persistent.next:player.next} text="⏭" /> : null}</View>
      <View style={styles.controls}><Button label="Shuffle" onPress={player.toggleShuffle} text="🔀" selected={player.state.shuffle} /><Button label="Repeat" onPress={player.cycleRepeat} text="↻" /><Button label="Volume down" onPress={() => player.setVolume(player.state.volume - .1)} text="🔉" /><Button label="Volume up" onPress={() => player.setVolume(player.state.volume + .1)} text="🔊" /></View>
      {current?.kind === 'audio' ? <View style={styles.audioEffectCard}><Text style={styles.sectionTitle}>Audio playback mode</Text><View style={styles.rowButtons}>{AUDIO_EFFECT_PRESETS.map((preset) => <Button key={preset.id} label={preset.title} hint={preset.description} onPress={() => { setAudioEffect(preset.id); void applyAudioEffect(preset.id); }} text={preset.title} selected={audioEffect === preset.id} />)}</View><Text accessibilityLiveRegion="polite" style={styles.muted}>Selected: {audioEffectBusy ? 'Processing…' : audioEffect}</Text></View> : null}
      {current?.kind === 'video' ? <View style={styles.videoDescriptionCard} accessible><Text style={styles.sectionTitle}>Video Description</Text><Button label={videoDescriptionEnabled ? 'Disable live video description' : 'Enable live video description'} hint="Describe important visual changes while the video plays using on-device speech." onPress={() => { const next = !videoDescriptionEnabled; setVideoDescriptionEnabled(next); setVideoDescriptionStatus(next ? 'Live video description enabled' : 'Live video description disabled'); }} text={videoDescriptionEnabled ? 'On' : 'Off'} selected={videoDescriptionEnabled} />{videoDescriptionStatus ? <Text accessibilityLiveRegion="polite" style={styles.muted}>{videoDescriptionStatus}</Text> : null}</View> : null}
      {canVocalRemove ? <View style={styles.vocalCard} accessible accessibilityLabel="Vocal Remover"><Text style={styles.sectionTitle}>Vocal Remover</Text><Text style={styles.muted}>Vocal separation runs through the Android native audio engine.</Text><View style={styles.rowButtons}><Button label="Create instrumental" onPress={() => setVocalMode('instrumental')} text="Instrumental" selected={vocalMode === 'instrumental'} /><Button label="Extract vocals" onPress={() => setVocalMode('vocals')} text="Vocals" selected={vocalMode === 'vocals'} /><Button label={vocalBusy ? 'Processing' : 'Remove vocals'} onPress={() => { void runVocalRemoval(); }} text={vocalBusy ? `${Math.round(vocalProgress * 100)}%` : 'Process'} /></View></View> : null}
      {current?.subtitleTracks?.length ? <View style={styles.rowButtons}>{current.subtitleTracks.map((track) => <Button key={track.id} label={`Subtitle ${track.label}`} onPress={() => { if (track.uri) void onLoadSrt(track.uri); else setSubtitleCues(track.cues || []); }} text={track.label} />)}</View> : null}
    </View><Modal visible={urlDialog} transparent animationType="fade" onRequestClose={() => setUrlDialog(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text accessibilityRole="header" style={styles.modalTitle}>Get Audio from URL</Text><Text style={styles.muted}>Enter a secure HTTPS direct media URL.</Text><TextInput accessibilityLabel="Media URL" autoCapitalize="none" autoCorrect={false} value={mediaUrl} onChangeText={setMediaUrl} placeholder="https://..." placeholderTextColor="#7f8794" style={styles.search} /><View style={styles.rowButtons}><Button label="Next" onPress={loadRemoteUrl} text="Next" /><Button label="Cancel" onPress={() => { setUrlDialog(false); setMediaUrl(''); }} text="Cancel" /></View><Text accessibilityLiveRegion="polite" style={styles.muted}>Protected provider stream extraction is not supported.</Text></View></View></Modal>;
  }

  return <View style={styles.root}>
    <View style={styles.header}><Button label="Back" onPress={() => onBack?.()} text="‹" /><View style={styles.headerText}><Text accessibilityRole="header" style={styles.title}>Nexus Media</Text><Text style={styles.muted}>Library and player</Text></View><Button label="Refresh media" onPress={() => { void refresh(); }} text="↻" /></View>
    <View style={styles.tabs}><Button label="Audio" onPress={() => setMediaTab('audio')} text="Audio" selected={mediaTab === 'audio'} /><Button label="Videos" onPress={() => setMediaTab('video')} text="Videos" selected={mediaTab === 'video'} /></View><View style={styles.browserToolbar}><TextInput accessibilityLabel={mediaTab === 'audio' ? 'Search audio' : 'Search videos'} value={mediaSearch} onChangeText={setMediaSearch} placeholder={mediaTab === 'audio' ? 'Search audio' : 'Search videos'} placeholderTextColor="#7f8794" style={styles.search}/><View style={styles.rowButtons}><Button label="Sort by name" onPress={() => setMediaBrowserPrefs((p) => ({...p, sort: 'name'}))} text="Name" selected={mediaBrowserPrefs.sort === 'name'} /><Button label="Sort by duration" onPress={() => setMediaBrowserPrefs((p) => ({...p, sort: 'duration'}))} text="Length" selected={mediaBrowserPrefs.sort === 'duration'} /><Button label={mediaBrowserPrefs.descending ? 'Descending sort' : 'Ascending sort'} onPress={() => setMediaBrowserPrefs((p) => ({...p, descending: !p.descending}))} text={mediaBrowserPrefs.descending ? '↓' : '↑'} /></View></View>
    {mediaTab === 'audio' ? <View style={styles.tabs}><Button label="Tracks" onPress={() => setLibraryTab('tracks')} text="Tracks" selected={libraryTab === 'tracks'} /><Button label="Albums" onPress={() => setLibraryTab('albums')} text="Albums" selected={libraryTab === 'albums'} /><Button label="Playlists" onPress={() => setLibraryTab('playlists')} text="Playlists" selected={libraryTab === 'playlists'} /></View> : null}
    <View style={styles.searchWrap}><Button label={mediaTab === 'audio' ? 'Choose audio from device folder' : 'Choose video from device folder'} onPress={() => Alert.alert('Choose folder', 'The Android media picker will be used to select media from device storage.')} text={mediaTab === 'audio' ? 'Select Audio Folder' : 'Select Video Folder'} /></View>
    {mediaTab === 'audio' && youtubeInstalled ? <View style={styles.youtubeCard}><Text style={styles.sectionTitle}>YouTube Music</Text><View style={styles.rowButtons}><TextInput accessibilityLabel="YouTube Music search" value={youtubeQuery} onChangeText={setYoutubeQuery} placeholder="Search YouTube Music" placeholderTextColor="#7f8794" style={styles.searchSmall} /><Button label="Search YouTube Music" onPress={() => { void searchYT(); }} text="Search" /></View>{youtubeResults.map((result) => <Pressable key={result.uri} accessibilityRole="button" accessibilityLabel={`YouTube Music result ${result.title}`} onPress={() => { void handoffYouTubeMusic(result.uri); }} style={styles.ytResult}><Text style={styles.rowTitle}>{result.title}</Text><Text style={styles.muted}>Open in YouTube Music</Text></Pressable>)}<Button label="Open YouTube Music search" onPress={() => { void openYouTubeMusicSearch(youtubeQuery); }} text="Open in YouTube Music" /></View> : null}
    {mediaTab === 'audio' && libraryTab === 'albums' ? <FlatList data={collections.albums} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Album ${item.title}`} onPress={() => { setLibraryTab('tracks'); setQuery(item.title); }} style={styles.album}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.muted}>{item.artist || 'Unknown artist'} · {item.trackIds.length} tracks</Text></Pressable>} /> : null}
    {mediaTab === 'audio' && libraryTab === 'playlists' ? <View style={styles.list}><Button label="Show create playlist form" onPress={() => setShowCreatePlaylist((value) => !value)} text="＋ Create playlist" />{showCreatePlaylist ? <View style={styles.playlistForm}><TextInput accessibilityLabel="New playlist name" value={newPlaylistName} onChangeText={setNewPlaylistName} placeholder="Playlist name" placeholderTextColor="#7f8794" style={styles.search} /><Button label="Save playlist" onPress={() => { void savePlaylist(); }} text="Save" /></View> : null}{playlists.map((playlist) => <Pressable key={playlist.id} accessibilityRole="button" accessibilityLabel={`Playlist ${playlist.name}`} style={styles.album}><Text style={styles.rowTitle}>{playlist.name}</Text><Text style={styles.muted}>{playlist.itemIds.length} tracks{playlist.isDevicePlaylist ? ' · Device playlist' : ''}</Text></Pressable>)}</View> : null}
    {(mediaTab === 'video' || libraryTab === 'tracks') ? <FlatList data={visibleTracks} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.kind === 'video' ? 'Video' : 'Audio'} ${item.title}`} onPress={() => loadItem(item, visibleTracks)} style={styles.row}><View style={styles.thumbnail}>{item.artworkUri ? <Image source={{ uri: item.artworkUri }} style={styles.thumbImage} /> : <Text style={styles.glyphSmall}>{item.kind === 'video' ? '▶' : '♫'}</Text>}</View><View style={styles.rowText}><Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.muted}>{item.artist || item.album || item.kind}</Text></View><Text style={styles.muted}>{formatTime(item.durationMs || 0)}</Text></Pressable>} ListEmptyComponent={<Text style={styles.empty}>No media found.</Text>} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0f12' }, browserToolbar: { paddingHorizontal: 12, gap: 8 }, modalBackdrop: { flex: 1, backgroundColor: '#000b', justifyContent: 'center', padding: 18 }, modalCard: { backgroundColor: '#181c22', borderRadius: 20, padding: 18, gap: 10 }, modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' }, audioEffectCard: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#181c22', gap: 6 }, header: { flexDirection: 'row', alignItems: 'center', padding: 12 }, headerText: { flex: 1, paddingHorizontal: 8 }, title: { color: '#fff', fontSize: 21, fontWeight: '800' }, muted: { color: '#aeb4be', fontSize: 13, marginTop: 3 }, button: { minWidth: 52, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, selectedButton: { backgroundColor: '#26303d' }, buttonText: { color: '#fff', fontWeight: '700' }, pressed: { opacity: .65 }, tabs: { flexDirection: 'row', paddingHorizontal: 8, gap: 4 }, searchWrap: { padding: 12 }, search: { minHeight: 48, borderRadius: 14, backgroundColor: '#181c22', color: '#fff', paddingHorizontal: 16, fontSize: 16 }, searchSmall: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#181c22', color: '#fff', paddingHorizontal: 12 }, list: { padding: 10, paddingBottom: 30 }, row: { minHeight: 72, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center' }, rowText: { flex: 1, paddingHorizontal: 12 }, rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' }, thumbnail: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#262d37', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, thumbImage: { width: '100%', height: '100%' }, glyph: { color: '#aeb4be', fontSize: 90 }, glyphSmall: { color: '#aeb4be', fontSize: 20 }, video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }, subtitle: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' }, subtitleText: { color: '#fff', backgroundColor: '#000c', padding: 8, borderRadius: 7, fontSize: 16 }, artwork: { margin: 24, aspectRatio: 1, maxHeight: 340, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1b2028', alignItems: 'center', justifyContent: 'center' }, artworkImage: { width: '100%', height: '100%' }, nowPlaying: { paddingHorizontal: 24, paddingTop: 8 }, trackTitle: { color: '#fff', fontSize: 21, fontWeight: '800' }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18 }, time: { color: '#aeb4be', width: 44, textAlign: 'center' }, progress: { flex: 1, height: 36, justifyContent: 'center' }, progressFill: { height: 5, backgroundColor: '#fff', borderRadius: 3 }, controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 4 }, live: { textAlign: 'center', color: '#e4e7ec', fontSize: 12, padding: 12 }, vocalCard: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#181c22' }, videoDescriptionCard: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#181c22', gap: 8 }, sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 5 }, rowButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }, youtubeCard: { marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 18, backgroundColor: '#181c22' }, ytResult: { paddingVertical: 10 }, album: { padding: 16, marginBottom: 8, borderRadius: 14, backgroundColor: '#181c22' }, playlistForm: { padding: 10, gap: 6 }, empty: { color: '#aeb4be', textAlign: 'center', padding: 30 },
});
