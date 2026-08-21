import { useRef, useState } from "react";
import { ArrowLeft, Check, Pause, Play, Volume2 } from "lucide-react";
import { ringTones } from "./clockData";

export function RingtoneScreen({ selected, onSelect, onBack }: { selected: string; onSelect: (id: string) => void; onBack: () => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customTones = ringTones.filter((r) => r.source === "custom");
  function preview(id: string, fileName?: string) {
    if (!fileName) return;
    if (playing === id) { audioRef.current?.pause(); setPlaying(null); return; }
    audioRef.current?.pause();
    const audio = new Audio(`/audio/${fileName}`);
    audioRef.current = audio;
    void audio.play().then(() => setPlaying(id)).catch(() => setPlaying(null));
    audio.onended = () => setPlaying(null);
  }
  return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6"><div className="mx-auto max-w-2xl">
    <header className="flex items-center gap-3 mb-6"><button onClick={onBack} aria-label="Back" className="p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"><ArrowLeft /></button><div><h1 className="text-2xl font-semibold">Alarm ringtone</h1><p className="text-sm text-slate-400">Choose a system sound or one of the custom alarm sounds.</p></div></header>
    <section aria-labelledby="system-ringtones"><h2 id="system-ringtones" className="text-sm font-medium text-slate-400 mb-2">System</h2><button type="button" onClick={() => onSelect("system")} className="w-full flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left focus:outline-none focus:ring-2 focus:ring-white"><Volume2 className="h-5 w-5" /><span className="flex-1">System ringtone</span>{selected === "system" && <Check className="h-5 w-5" aria-label="Selected" />}</button></section>
    <section aria-labelledby="custom-ringtones" className="mt-6"><h2 id="custom-ringtones" className="text-sm font-medium text-slate-400 mb-2">NexusPlus sounds</h2><div className="space-y-2">{customTones.map((tone) => <div key={tone.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"><button type="button" onClick={() => preview(tone.id, tone.fileName)} aria-label={playing === tone.id ? `Pause ${tone.label}` : `Preview ${tone.label}`} className="p-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white">{playing === tone.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button><button type="button" onClick={() => onSelect(tone.id)} className="flex-1 text-left rounded-xl focus:outline-none focus:ring-2 focus:ring-white"><div className="font-medium">{tone.label}</div><div className="text-xs text-slate-500">{tone.fileName}</div></button>{selected === tone.id && <Check className="h-5 w-5" aria-label="Selected" />}</div>)}</div></section>
  </div></main>;
}

export default RingtoneScreen;
