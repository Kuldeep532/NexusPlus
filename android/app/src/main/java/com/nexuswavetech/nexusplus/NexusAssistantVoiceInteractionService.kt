package com.nexuswavetech.nexusplus

import android.content.Intent
import android.os.Bundle
import android.service.voice.VoiceInteractionService

class NexusAssistantVoiceInteractionService : VoiceInteractionService() {
    override fun onReady() {
        super.onReady()
    }

    override fun onLaunchVoiceAssistFromKeyguard() {
        launchAssistant()
    }

    override fun onGetSupportedVoiceActions(voiceActions: MutableSet<String>) {
        super.onGetSupportedVoiceActions(voiceActions)
    }

    private fun launchAssistant() {
        val intent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_ASSIST
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("nexus_assistant_default_role", true)
        }
        startActivity(intent)
    }
}
