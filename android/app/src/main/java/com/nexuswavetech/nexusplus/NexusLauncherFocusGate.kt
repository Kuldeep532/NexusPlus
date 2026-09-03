package com.nexuswavetech.nexusplus

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import java.util.Calendar

/** Nexus Launcher-only opening guard and local wellness state. */
object NexusLauncherFocusGate {
    private const val PREFS = "nexus_launcher_focus_gate"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCKED = "blocked_packages"
    private const val KEY_WINDOWS = "focus_windows"
    private const val KEY_COOLDOWN_MINUTES = "cooldown_minutes"
    private const val KEY_COOLDOWNS = "cooldowns"
    private const val KEY_SAVED_TODAY = "saved_today"
    private const val KEY_SAVED_DAY = "saved_day"
    private const val KEY_MENTOR_PASSES = "mentor_passes"
    private const val KEY_ACTIVE_SESSION_STARTS = "active_session_starts"
    private const val SESSION_TIMEOUT_MILLIS = 30 * 60_000L
    private const val WINDOW_SEPARATOR = "|"
    private const val FIELD_SEPARATOR = ","
    private const val COOLDOWN_SEPARATOR = ";"

    data class Decision(val blocked: Boolean, val label: String, val message: String, val canGrantCooldown: Boolean = false, val remainingMinutes: Int = 0)

    fun isLauncherDefault(context: Context): Boolean {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val role = context.getSystemService(RoleManager::class.java)
            if (role?.isRoleAvailable(RoleManager.ROLE_HOME) == true) return role.isRoleHeld(RoleManager.ROLE_HOME)
        }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        return context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo?.packageName == context.packageName
    }

    fun setEnabled(context: Context, enabled: Boolean) { prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply() }
    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)
    fun setBlockedPackages(context: Context, packages: Set<String>) { prefs(context).edit().putString(KEY_BLOCKED, packages.filter{it.isNotBlank()}.distinct().joinToString(WINDOW_SEPARATOR)).apply() }
    fun getBlockedPackages(context: Context): Set<String> = prefs(context).getString(KEY_BLOCKED, "")?.split(WINDOW_SEPARATOR)?.filter{it.isNotBlank()}?.toSet().orEmpty()
    fun setFocusWindows(context: Context, windows: List<Pair<Int,Int>>) { prefs(context).edit().putString(KEY_WINDOWS, windows.filter{it.first in 0..23 && it.second in 0..23}.distinct().joinToString(WINDOW_SEPARATOR){"${it.first}$FIELD_SEPARATOR${it.second}"}).apply() }
    fun getFocusWindows(context: Context): List<Pair<Int,Int>> = prefs(context).getString(KEY_WINDOWS, "")?.split(WINDOW_SEPARATOR)?.mapNotNull{e->val p=e.split(FIELD_SEPARATOR);if(p.size!=2)null else {val s=p[0].toIntOrNull();val f=p[1].toIntOrNull();if(s!=null&&f!=null&&s in 0..23&&f in 0..23)s to f else null}}.orEmpty()
    fun setCooldownMinutes(context: Context, minutes: Int) { prefs(context).edit().putInt(KEY_COOLDOWN_MINUTES, minutes.coerceIn(1,60)).apply() }
    fun getCooldownMinutes(context: Context): Int = prefs(context).getInt(KEY_COOLDOWN_MINUTES,5).coerceIn(1,60)
    fun grantCooldown(context: Context, packageName: String, now: Long=System.currentTimeMillis()) { if(packageName.isBlank())return; val map=loadCooldowns(context).toMutableMap(); map[packageName]=now+getCooldownMinutes(context)*60_000L; saveCooldowns(context,map) }
    fun allowTemporarily(context: Context, packageName: String, now: Long=System.currentTimeMillis())=grantCooldown(context,packageName,now)
    fun isCooldownActive(context: Context, packageName: String, now: Long=System.currentTimeMillis()):Boolean { val until=loadCooldowns(context)[packageName]?:return false; if(until>now)return true; val m=loadCooldowns(context).toMutableMap();m.remove(packageName);saveCooldowns(context,m);return false }

    fun evaluate(context: Context, packageName: String, currentMillis: Long=System.currentTimeMillis()): Decision {
        if(!isLauncherDefault(context)||!isEnabled(context)||packageName.isBlank()||packageName==context.packageName)return allow()
        if(packageName !in getBlockedPackages(context)||isCooldownActive(context,packageName,currentMillis)||!isInsideFocusWindow(getFocusWindows(context),currentMillis))return allow()
        return Decision(true,"Nexus Focus Gate","You chose to protect this app during your focus window.",true,remainingMinutesInFocusWindow(getFocusWindows(context),currentMillis))
    }

    fun startProtectedSession(context: Context, packageName: String, now: Long=System.currentTimeMillis()) { if(packageName.isBlank())return; val m=loadSessions(context).toMutableMap();m[packageName]=now;saveSessions(context,m) }
    fun finishProtectedSessionAndCheck(context: Context, packageName: String, now: Long=System.currentTimeMillis()):Boolean { val m=loadSessions(context).toMutableMap();val started=m.remove(packageName)?:return false;saveSessions(context,m);return now-started>=SESSION_TIMEOUT_MILLIS }
    fun recordMentorPass(context: Context, packageName: String){ val p=prefs(context);val day=dayKey();val current=p.getString(KEY_MENTOR_PASSES,"")?.split("|")?.filter{it.isNotBlank()}.orEmpty().filter{it.startsWith("$day,")};p.edit().putString(KEY_MENTOR_PASSES,(current+"$day,$packageName").takeLast(200).joinToString("|")).apply() }
    fun recordSavedDistraction(context: Context){val p=prefs(context);val day=dayKey();val n=if(p.getString(KEY_SAVED_DAY,null)==day)p.getInt(KEY_SAVED_TODAY,0)else 0;p.edit().putString(KEY_SAVED_DAY,day).putInt(KEY_SAVED_TODAY,n+1).apply()}
    fun getSavedDistractionsToday(context: Context):Int{val p=prefs(context);return if(p.getString(KEY_SAVED_DAY,null)==dayKey())p.getInt(KEY_SAVED_TODAY,0)else 0}

    private fun isInsideFocusWindow(windows:List<Pair<Int,Int>>,now:Long):Boolean{if(windows.isEmpty())return false;val h=Calendar.getInstance().apply{timeInMillis=now}.get(Calendar.HOUR_OF_DAY);return windows.any{(s,e)->when{ s==e->h==s;s<e->h in s until e;else->h>=s||h<e }}}
    private fun remainingMinutesInFocusWindow(windows:List<Pair<Int,Int>>,now:Long):Int{val c=Calendar.getInstance().apply{timeInMillis=now};val total=c.get(Calendar.HOUR_OF_DAY)*60+c.get(Calendar.MINUTE);val w=windows.firstOrNull{isInsideFocusWindow(listOf(it),now)}?:return 0;val end=w.second*60;return (if(w.first<w.second)end-total else if(total<end)end-total else 1440-total+end).coerceAtLeast(0)}
    private fun loadCooldowns(context:Context):Map<String,Long>=prefs(context).getString(KEY_COOLDOWNS,"")?.split(COOLDOWN_SEPARATOR)?.mapNotNull{e->val p=e.split(FIELD_SEPARATOR,limit=2);if(p.size==2){val t=p[1].toLongOrNull();if(t!=null)p[0] to t else null}else null}?.toMap().orEmpty()
    private fun saveCooldowns(context:Context,m:Map<String,Long>){prefs(context).edit().putString(KEY_COOLDOWNS,m.entries.joinToString(COOLDOWN_SEPARATOR){"${it.key}$FIELD_SEPARATOR${it.value}"}).apply()}
    private fun loadSessions(context:Context):Map<String,Long>=prefs(context).getString(KEY_ACTIVE_SESSION_STARTS,"")?.split(";")?.mapNotNull{e->val p=e.split(FIELD_SEPARATOR,limit=2);if(p.size==2){val t=p[1].toLongOrNull();if(t!=null)p[0] to t else null}else null}?.toMap().orEmpty()
    private fun saveSessions(context:Context,m:Map<String,Long>){prefs(context).edit().putString(KEY_ACTIVE_SESSION_STARTS,m.entries.joinToString(";"){"${it.key}$FIELD_SEPARATOR${it.value}"}).apply()}
    private fun dayKey():String{val c=Calendar.getInstance();return "${c.get(Calendar.YEAR)}-${c.get(Calendar.DAY_OF_YEAR)}"}
    private fun allow()=Decision(false,"","")
    private fun prefs(context:Context)=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE)
}