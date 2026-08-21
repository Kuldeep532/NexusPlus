import { useMemo, useState } from "react";
import { AlarmClock, Globe2, ListRestart, Settings, Timer, Watch } from "lucide-react";
import { Alarm, defaultAlarms, formatTime, ringTones } from "./clockData";
import { AlarmScreen } from "./AlarmScreen";
import { StopwatchScreen } from "./StopwatchScreen";
import { WorldClockScreen } from "./WorldClockScreen";
import { RingtoneScreen } from "./RingtoneScreen";

export function Clock() {
  const [screen, setScreen] = useState<"clock" | "alarms" | "stopwatch" | "world" | "ringtones">("clock");
  const [alarms, setAlarms] = useState<Alarm[]>(defaultAlarms);
  const now = new Date();
  const [selectedRingtoneId, setSelectedRingtoneId] = useState("first-light-at-the-brook");
  const enabledCount = useMemo(() => alarms.filter((a) => a.enabled).length, [alarms]);
  const nextAlarm = alarms.find((a) => a.enabled);

  if (screen === "alarms") return <AlarmScreen alarms={alarms} setAlarms={setAlarms} onBack={() => setScreen("clock")} onRingtones={() => setScreen("ringtones")} />;
  if (screen === "stopwatch") return <StopwatchScreen onBack={() => setScreen("clock")} />;
  if (screen === "world") return <WorldClockScreen onBack={() => setScreen("clock")} />;
  if (screen === "ringtones") return <RingtoneScreen selected={selectedRingtoneId} onSelect={setSelectedRingtoneId} onBack={() => setScreen("alarms")} />;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="text-sm text-slate-400">Utilities</p>
          <h1 className="text-3xl font-semibold tracking-tight">Clock</h1>
        </header>

        <section aria-label="Current time" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 mb-4">
          <div className="text-sm text-slate-400">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          <div className="text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight mt-2">{formatTime(now.getHours(), now.getMinutes())}</div>
          <div className="mt-4 text-sm text-slate-300">{enabledCount} active alarm{enabledCount === 1 ? "" : "s"}{nextAlarm ? ` · Next: ${formatTime(nextAlarm.hour, nextAlarm.minute)}` : ""}</div>
        </section>

        <section aria-label="Clock features" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Set alarm", AlarmClock, () => setScreen("alarms")],
            ["Stopwatch", Timer, () => setScreen("stopwatch")],
            ["World clock", Globe2, () => setScreen("world")],
            ["Ringtones", Watch, () => setScreen("ringtones")],
          ].map(([label, Icon, onClick]) => {
            const IconComponent = Icon as typeof AlarmClock;
            return (
              <button key={String(label)} type="button" onClick={onClick as () => void} className="min-h-28 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white">
                <IconComponent aria-hidden="true" className="h-6 w-6 mb-5" />
                <span className="font-medium">{String(label)}</span>
              </button>
            );
          })}
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setScreen("alarms")} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left focus:outline-none focus:ring-2 focus:ring-white">
            <div className="flex items-center justify-between"><span className="font-medium">Daily alarms</span><span className="text-sm text-slate-400">{alarms.length}</span></div>
            <p className="mt-2 text-sm text-slate-400">Manage time, repeat days, sound, vibration and snooze.</p>
          </button>
          <button type="button" onClick={() => setScreen("world")} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left focus:outline-none focus:ring-2 focus:ring-white">
            <div className="flex items-center gap-2 font-medium"><Settings aria-hidden="true" className="h-5 w-5" /> Clock settings</div>
            <p className="mt-2 text-sm text-slate-400">12/24-hour display, default ringtone and accessibility options.</p>
          </button>
        </div>
      </div>
    </main>
  );
}

export default Clock;
