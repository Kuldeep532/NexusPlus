package com.nexuswavetech.nexusplus

import android.content.Intent
import android.service.voice.VoiceInteractionService

class NexusAssistantVoiceInteractionService : VoiceInteractionService() {
    override fun onReady() {
        super.onReady()
    }

    override fun onLaunchVoiceAssistFromKeyguard() {
        launchAssistant()
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
