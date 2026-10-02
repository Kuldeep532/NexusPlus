package com.nexuswavetech.nexusplus

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.service.voice.VoiceInteractionSessionService

class NexusAssistantSessionService : VoiceInteractionSessionService() {
    override fun onNewSession(args: Bundle?): VoiceInteractionSession {
        return NexusAssistantSession(this)
    }
}

class NexusAssistantSession(private val appContext: Context) : VoiceInteractionSession(appContext) {
    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
        val intent = Intent(appContext, MainActivity::class.java).apply {
            action = Intent.ACTION_ASSIST
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("nexus_assistant_default_role", true)
        }
        appContext.startActivity(intent)
        hide()
    }
}
