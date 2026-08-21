import { useEffect, useState } from "react";
import { ArrowLeft, Globe2, Plus, Trash2 } from "lucide-react";

type City = { id: string; name: string; zone: string };
const defaultCities: City[] = [
  { id: "delhi", name: "New Delhi", zone: "Asia/Kolkata" },
  { id: "london", name: "London", zone: "Europe/London" },
  { id: "new-york", name: "New York", zone: "America/New_York" },
];

export function WorldClockScreen({ onBack }: { onBack: () => void }) {
  const [cities, setCities] = useState(defaultCities);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id); }, []);
  const addCity = () => {
    const candidates = [{ id: "tokyo", name: "Tokyo", zone: "Asia/Tokyo" }, { id: "sydney", name: "Sydney", zone: "Australia/Sydney" }, { id: "singapore", name: "Singapore", zone: "Asia/Singapore" }];
    const next = candidates.find((c) => !cities.some((x) => x.id === c.id));
    if (next) setCities((c) => [...c, next]);
  };
  return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6"><div className="mx-auto max-w-2xl">
    <header className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><button onClick={onBack} aria-label="Back to Clock" className="p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"><ArrowLeft /></button><div><h1 className="text-2xl font-semibold">World clock</h1><p className="text-sm text-slate-400">Local times across selected cities</p></div></div><button type="button" onClick={addCity} className="p-3 rounded-xl bg-white text-slate-950" aria-label="Add city"><Plus /></button></header>
    <div className="space-y-3">{cities.map((city) => <article key={city.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center gap-4"><Globe2 className="h-6 w-6" aria-hidden="true" /><div className="flex-1"><div className="font-medium">{city.name}</div><div className="text-sm text-slate-400">{city.zone}</div></div><div className="text-2xl font-semibold tabular-nums">{now.toLocaleTimeString(undefined, { timeZone: city.zone, hour: "numeric", minute: "2-digit" })}</div>{city.id !== "delhi" && <button type="button" aria-label={`Remove ${city.name}`} onClick={() => setCities((c) => c.filter((x) => x.id !== city.id))} className="p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"><Trash2 className="h-5 w-5" /></button>}</article>)}</div>
  </div></main>;
}

export default WorldClockScreen;
