import { Dispatch, SetStateAction, useState } from "react";
import { ArrowLeft, Bell, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Alarm, formatTime, ringTones } from "./clockData";

type Props = { alarms: Alarm[]; setAlarms: Dispatch<SetStateAction<Alarm[]>>; onBack: () => void; onRingtones: () => void };

export function AlarmScreen({ alarms, setAlarms, onBack, onRingtones }: Props) {
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [dialog, setDialog] = useState<"repeat" | "snooze" | null>(null);
  const ringtoneName = (id: string) => ringTones.find((r) => r.id === id)?.label ?? "System ringtone";

  function toggle(id: string) {
    setAlarms((current) => current.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }
  function save(alarm: Alarm) {
    setAlarms((current) => current.some((a) => a.id === alarm.id) ? current.map((a) => a.id === alarm.id ? alarm : a) : [...current, alarm]);
    setEditing(null);
  }
  function remove(id: string) { setAlarms((current) => current.filter((a) => a.id !== id)); }

  if (editing) {
    return <AlarmEditor value={editing} onSave={save} onCancel={() => setEditing(null)} onRingtones={onRingtones} onDialog={setDialog} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center gap-3 mb-6"><button aria-label="Back to Clock" onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white"><ArrowLeft /></button><div><h1 className="text-2xl font-semibold">Set alarm</h1><p className="text-sm text-slate-400">Everyday and custom alarms</p></div></header>
        <div className="space-y-3">
          {alarms.map((alarm) => <article key={alarm.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-4">
              <button type="button" role="switch" aria-checked={alarm.enabled} aria-label={`${alarm.label} alarm`} onClick={() => toggle(alarm.id)} className={`relative h-7 w-12 rounded-full transition ${alarm.enabled ? "bg-white" : "bg-slate-700"} focus:outline-none focus:ring-2 focus:ring-white`}><span className={`absolute top-1 h-5 w-5 rounded-full ${alarm.enabled ? "right-1 bg-slate-950" : "left-1 bg-slate-300"}`} /></button>
              <button type="button" onClick={() => setEditing(alarm)} className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-white rounded-xl">
                <div className="text-4xl font-semibold tabular-nums">{formatTime(alarm.hour, alarm.minute)}</div>
                <div className="text-sm text-slate-300 mt-1">{alarm.label} · {alarm.repeat.length === 7 ? "Every day" : alarm.repeat.join(" ")}</div>
                <div className="text-xs text-slate-500 mt-1">{ringtoneName(alarm.ringtoneId)}</div>
              </button>
              <button aria-label={`Delete ${alarm.label}`} onClick={() => remove(alarm.id)} className="p-2 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white"><Trash2 className="h-5 w-5" /></button>
            </div>
          </article>)}
        </div>
        <button type="button" onClick={() => setEditing({ id: crypto.randomUUID(), hour: 7, minute: 0, label: "Alarm", repeat: ["Mon", "Tue", "Wed", "Thu", "Fri"], enabled: true, ringtoneId: "first-light-at-the-brook" })} className="mt-5 w-full rounded-2xl bg-white text-slate-950 p-4 font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white"><Plus className="h-5 w-5" /> Add alarm</button>
        {dialog && <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4"><div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-xl font-semibold">{dialog === "repeat" ? "Repeat days" : "Snooze"}</h2><p className="text-slate-400 mt-2">Use this compact dialog for the related alarm setting.</p><button onClick={() => setDialog(null)} className="mt-5 w-full rounded-2xl bg-white text-slate-950 p-3 font-medium">Done</button></div></div>}
      </div>
    </main>
  );
}

function AlarmEditor({ value, onSave, onCancel, onRingtones, onDialog }: { value: Alarm; onSave: (a: Alarm) => void; onCancel: () => void; onRingtones: () => void; onDialog: (v: "repeat" | "snooze") => void }) {
  const [alarm, setAlarm] = useState(value);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function toggleDay(day: string) { setAlarm((a) => ({ ...a, repeat: a.repeat.includes(day) ? a.repeat.filter((d) => d !== day) : [...a.repeat, day] })); }
  return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6"><div className="mx-auto max-w-2xl">
    <header className="flex items-center justify-between mb-6"><button onClick={onCancel} className="p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white" aria-label="Cancel"><ArrowLeft /></button><h1 className="text-2xl font-semibold">Edit alarm</h1><button onClick={() => onSave(alarm)} className="font-semibold px-3 py-2 rounded-xl bg-white text-slate-950">Save</button></header>
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex gap-3 items-end"><label className="flex-1"><span className="sr-only">Hour</span><input aria-label="Hour" type="number" min="0" max="23" value={alarm.hour} onChange={(e) => setAlarm({ ...alarm, hour: Number(e.target.value) })} className="w-full rounded-2xl bg-slate-800 p-4 text-4xl" /></label><span className="text-4xl pb-3">:</span><label className="flex-1"><span className="sr-only">Minute</span><input aria-label="Minute" type="number" min="0" max="59" value={alarm.minute} onChange={(e) => setAlarm({ ...alarm, minute: Number(e.target.value) })} className="w-full rounded-2xl bg-slate-800 p-4 text-4xl" /></label></div>
      <label className="block mt-6"><span className="text-sm text-slate-400">Label</span><input value={alarm.label} onChange={(e) => setAlarm({ ...alarm, label: e.target.value })} className="mt-1 w-full rounded-2xl bg-slate-800 p-3" /></label>
      <div className="mt-6"><div className="text-sm text-slate-400 mb-2">Repeat</div><div className="flex flex-wrap gap-2">{days.map((day) => <button key={day} type="button" onClick={() => toggleDay(day)} aria-pressed={alarm.repeat.includes(day)} className={`rounded-xl px-3 py-2 ${alarm.repeat.includes(day) ? "bg-white text-slate-950" : "bg-slate-800"}`}>{day}</button>)}</div></div>
      <button type="button" onClick={() => onRingtones()} className="mt-6 w-full flex items-center gap-3 rounded-2xl bg-slate-800 p-4 text-left"><Bell className="h-5 w-5" /><span className="flex-1">Ringtone<div className="text-sm text-slate-400">{ringTones.find((r) => r.id === alarm.ringtoneId)?.label}</div></span><ChevronRight /></button>
      <button type="button" onClick={() => onDialog("snooze")} className="mt-2 w-full flex items-center gap-3 rounded-2xl bg-slate-800 p-4 text-left"><ListRestart className="h-5 w-5" /><span className="flex-1">Snooze</span><ChevronRight /></button>
    </section></div></main>;
}

export default AlarmScreen;
