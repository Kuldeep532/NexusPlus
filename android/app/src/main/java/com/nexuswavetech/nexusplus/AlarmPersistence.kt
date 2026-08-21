package com.nexuswavetech.nexusplus

import org.json.JSONArray
import org.json.JSONObject

object AlarmPersistence {
    fun normalize(raw: String): String {
        val source = JSONArray(raw)
        val normalized = JSONArray()
        for (index in 0 until source.length()) {
            val item = source.optJSONObject(index) ?: continue
            val id = item.optString("id")
            val hour = item.optInt("hour", -1)
            val minute = item.optInt("minute", -1)
            val enabled = item.optBoolean("enabled", false)
            val soundId = item.optString("soundId")
            if (id.isBlank() || id.length > 128 || hour !in 0..23 || minute !in 0..59 || soundId.isBlank() || soundId.length > 128) continue
            normalized.put(
                JSONObject()
                    .put("id", id)
                    .put("hour", hour)
                    .put("minute", minute)
                    .put("enabled", enabled)
                    .put("soundId", soundId),
            )
        }
        return normalized.toString()
    }
}
