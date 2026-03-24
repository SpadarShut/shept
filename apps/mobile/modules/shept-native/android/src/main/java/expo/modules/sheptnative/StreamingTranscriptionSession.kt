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

    fun start() {
        val client = RealtimeSttClient(apiKey, language, this)
        sttClient = client
        client.connect()

        val capture = PcmAudioCapture { chunk ->
            client.sendAudioChunk(chunk)
        }
        audioCapture = capture
        capture.start()

        Log.d(TAG, "Streaming session started")
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
    }

    override fun onError(message: String) {
        Log.e(TAG, "STT error: $message")
        audioCapture?.stop()
        AccessibilityBridge.commitPartialText("")
    }

    override fun onSessionEnded() {
        Log.d(TAG, "STT session ended")
        audioCapture = null
        sttClient = null
    }
}
