import * as Notifications from 'expo-notifications';
import type { ReminderItem } from './reminderTypes';
import { loadReminders, removeReminder, saveReminders, upsertReminder } from './reminderStore';
import { cancelReminder, scheduleReminder } from './reminderScheduler';
export type ReminderBackendSnapshot={reminders:ReminderItem[];scheduledNotificationIds:string[];reconciledAt:string};
export async function getReminderBackendSnapshot():Promise<ReminderBackendSnapshot>{const [reminders,scheduled]=await Promise.all([loadReminders(),Notifications.getAllScheduledNotificationsAsync()]);return{reminders,scheduledNotificationIds:scheduled.map(x=>x.identifier),reconciledAt:new Date().toISOString()};}
export async function reconcileReminderBackend():Promise<ReminderItem[]>{const reminders=await loadReminders();const scheduled=await Notifications.getAllScheduledNotificationsAsync();const ids=new Set(scheduled.map(x=>x.identifier));const now=Date.now();const next=reminders.filter(x=>!x.enabled||ids.has(x.notificationId)||['daily','weekly','interval'].includes(x.scheduleKind)||new Date(x.scheduledFor).getTime()>now);await saveReminders(next);return next;}
async function restore(r:ReminderItem,kind=r.scheduleKind,minutes=r.delayMinutes):Promise<ReminderItem[]>{const n=await scheduleReminder({title:r.title,body:r.body,delayMinutes:String(Math.max(1,minutes)),language:r.language as 'en-US'|'hi-IN',voiceId:r.voiceId,scheduleKind:kind,scheduledFor:['at','daily','weekly'].includes(kind)?r.scheduledFor:undefined,repeatEveryMinutes:r.repeatEveryMinutes,weekdays:r.weekdays});return upsertReminder({...n,id:r.id,createdAt:r.createdAt,enabled:true,snoozedUntil:kind==='delay'?new Date(Date.now()+Math.max(1,minutes)*60000).toISOString():undefined});}
export async function setReminderEnabled(r:ReminderItem,enabled:boolean):Promise<ReminderItem[]>{if(!enabled){await cancelReminder(r);return upsertReminder({...r,enabled:false});}return restore(r);}
export async function snoozeReminder(r:ReminderItem,minutes=10):Promise<ReminderItem[]>{await cancelReminder(r);return restore(r,'delay',minutes);}
export async function disableReminder(r:ReminderItem){return setReminderEnabled(r,false);}
export async function registerReminder(r:ReminderItem){return upsertReminder(r);}
export async function deleteReminder(r:ReminderItem){await cancelReminder(r);return removeReminder(r.id);}
export async function getPendingReminderCount(){const requests=await Notifications.getAllScheduledNotificationsAsync();return requests.filter(r=>(r.content.data as {type?:string})?.type==='nexus-reminder').length;}
