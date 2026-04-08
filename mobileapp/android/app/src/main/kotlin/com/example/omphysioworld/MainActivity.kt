package com.example.omphysioworld

import android.media.AudioManager
import android.media.ToneGenerator
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val chatSoundChannel = "omphysioworld/chat_sound"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            chatSoundChannel,
        ).setMethodCallHandler { call, result ->
            if (call.method == "playIncomingChatSound") {
                playIncomingChatSound()
                result.success(true)
            } else {
                result.notImplemented()
            }
        }
    }

    private fun playIncomingChatSound() {
        val toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
        toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 220)
        window.decorView.postDelayed(
            { toneGenerator.release() },
            300,
        )
    }
}
