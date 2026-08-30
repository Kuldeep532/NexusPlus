package com.nexuswavetech.nexusplus

import android.media.AudioAttributes
import android.media.MediaPlayer
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
        // The bundled alarm cue was removed because it was not present in the
        // repository. Keep the alarm activity functional without a missing
        // raw resource; notification/alarm audio can be provided by the JS
        // alarm path when an actual asset is available.
        player = null
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
