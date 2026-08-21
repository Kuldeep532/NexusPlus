import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";

export function StopwatchScreen({ onBack }: { onBack: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((e) => e + 100), 100);
    return () => window.clearInterval(id);
  }, [running]);
  const totalSeconds = Math.floor(elapsed / 1000);
  const ms = String(elapsed % 1000).padStart(3, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6"><div className="mx-auto max-w-2xl">
    <header className="flex items-center gap-3 mb-6"><button onClick={onBack} aria-label="Back to Clock" className="p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"><ArrowLeft /></button><h1 className="text-2xl font-semibold">Stopwatch</h1></header>
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center"><div aria-live="polite" className="text-5xl sm:text-7xl tabular-nums font-semibold">{hours}:{minutes}:{seconds}<span className="text-2xl text-slate-400">.{ms}</span></div>
      <div className="mt-8 grid grid-cols-3 gap-2"><button type="button" onClick={() => setRunning((v) => !v)} className="rounded-2xl bg-white text-slate-950 p-4 font-semibold flex items-center justify-center gap-2">{running ? <Pause /> : <Play />} {running ? "Pause" : "Start"}</button><button type="button" onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running} className="rounded-2xl bg-slate-800 p-4 font-semibold disabled:opacity-40">Lap</button><button type="button" onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }} className="rounded-2xl bg-slate-800 p-4 font-semibold flex items-center justify-center gap-2"><RotateCcw /> Reset</button></div></section>
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-medium">Laps</h2>{laps.length === 0 ? <p className="mt-2 text-sm text-slate-500">No laps yet.</p> : <ol className="mt-3 space-y-2">{laps.map((lap, index) => <li key={`${lap}-${index}`} className="flex justify-between border-b border-slate-800 py-2"><span>Lap {laps.length - index}</span><span>{(lap / 1000).toFixed(3)} s</span></li>)}</ol>}</section>
  </div></main>;
}

export default StopwatchScreen;
