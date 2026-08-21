package com.nexuswavetech.nexusplus

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class AlarmRingActivity : AppCompatActivity() {
    private var player: MediaPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
        )
        setContentView(R.layout.activity_alarm_ring)

        findViewById<Button>(R.id.stop_alarm).setOnClickListener {
            stopPlayback()
            finishAndRemoveTask()
        }
        startPlayback()
    }

    private fun startPlayback() {
        if (player != null) return
        try {
            val uri = Uri.parse("android.resource://$packageName/${R.raw.first_light_at_the_brook}")
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build(),
                )
                setOnErrorListener { _, _, _ ->
                    stopPlayback()
                    true
                }
                setDataSource(this@AlarmRingActivity, uri)
                isLooping = true
                prepare()
                start()
            }
        } catch (_: Exception) {
            stopPlayback()
        }
    }

    private fun stopPlayback() {
        player?.runCatching { stop() }
        player?.release()
        player = null
    }

    override fun onDestroy() {
        stopPlayback()
        super.onDestroy()
    }
}
