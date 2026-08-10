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

    /** Accumulated committed text across all VAD segments in this session. */
    var accumulatedText: String = ""
        private set

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
        audioCapture = null
        AccessibilityBridge.discardAndEndSession()
        sttClient?.close()
        sttClient = null
        Log.d(TAG, "Streaming session stopped, uncommitted partial discarded")
        onComplete?.invoke()
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
        accumulatedText += text
        AccessibilityBridge.advanceStreamingSegment(text)
        Log.d(TAG, "VAD committed segment: \"$text\", total: \"$accumulatedText\"")
    }

    override fun onError(message: String) {
        Log.e(TAG, "STT error: $message")
        audioCapture?.stop()
        audioCapture = null
        AccessibilityBridge.discardAndEndSession()
        onComplete?.invoke()
    }

    override fun onSessionEnded() {
        Log.d(TAG, "STT session ended")
        audioCapture = null
        sttClient = null
        onComplete?.invoke()
    }
}
