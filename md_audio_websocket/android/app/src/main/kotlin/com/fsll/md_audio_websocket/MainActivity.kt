package com.fsll.md_audio_websocket

import android.os.Bundle
import com.baseflow.permissionhandler.PermissionHandlerPlugin
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        flutterEngine!!.plugins.add(SoundStreamPlugin())
    }
}
