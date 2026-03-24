package expo.modules.sheptnative

import android.util.Log

class StreamingTranscriptionSession(
    private val apiKey: String,
    private val language: String
) : RealtimeSttListener {

    companion object {
        private const val TAG = "StreamingSession"
    }

    private var sttClient: RealtimeSttClient? = null
    private var audioCapture: PcmAudioCapture? = null
    var onComplete: (() -> Unit)? = null

    fun start() {
        val client = RealtimeSttClient(apiKey, language, this)
        sttClient = client
        client.connect()
        Log.d(TAG, "Streaming session connecting...")
    }

    override fun onConnected() {
        val client = sttClient ?: return
        val capture = PcmAudioCapture { chunk ->
            client.sendAudioChunk(chunk)
        }
        audioCapture = capture
        capture.start()
        Log.d(TAG, "WebSocket connected, audio capture started")
    }

    fun stop() {
        audioCapture?.stop()
        sttClient?.commitAndClose()
        Log.d(TAG, "Streaming session stopping, waiting for final transcript")
    }

    fun cancel() {
        audioCapture?.stop()
        audioCapture = null
        sttClient?.cancel()
        sttClient = null
        Log.d(TAG, "Streaming session cancelled")
    }

    override fun onPartialTranscript(text: String) {
        AccessibilityBridge.updatePartialText(text)
    }

    override fun onCommittedTranscript(text: String) {
        AccessibilityBridge.commitPartialText(text)
        sttClient?.close()
    }

    override fun onError(message: String) {
        Log.e(TAG, "STT error: $message")
        audioCapture?.stop()
        AccessibilityBridge.commitPartialText("")
        onComplete?.invoke()
    }

    override fun onSessionEnded() {
        Log.d(TAG, "STT session ended")
        audioCapture = null
        sttClient = null
        onComplete?.invoke()
    }
}
