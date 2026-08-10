package expo.modules.sheptnative

import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.TimeUnit

interface RealtimeSttListener {
    fun onConnected()
    fun onPartialTranscript(text: String)
    fun onCommittedTranscript(text: String)
    fun onError(message: String)
    fun onSessionEnded()
}

class RealtimeSttClient(
    private val apiKey: String,
    private val language: String,
    private val listener: RealtimeSttListener
) {
    companion object {
        private const val TAG = "RealtimeSttClient"
        private const val URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&encoding=pcm_s16le&sample_rate=16000&commit_strategy=vad&vad_silence_threshold_secs=1.5&vad_threshold=0.4"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    @Volatile private var sessionEnded = false

    fun connect() {
        val request = Request.Builder()
            .url("$URL&language=$language")
            .header("xi-api-key", apiKey)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                mainHandler.post { listener.onConnected() }
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    when (val type = json.optString("message_type")) {
                        "partial_transcript" -> {
                            val partial = json.optString("text", "")
                            if (partial.isNotEmpty()) {
                                mainHandler.post { listener.onPartialTranscript(partial) }
                            }
                        }
                        "committed_transcript" -> {
                            val committed = json.optString("text", "")
                            mainHandler.post { listener.onCommittedTranscript(committed) }
                        }
                        "session_started" -> {
                            val config = json.optJSONObject("config")
                            Log.d(TAG, "Session started, commit_strategy: ${config?.optString("commit_strategy")}")
                        }
                        else -> Log.d(TAG, "Unhandled message type: $type")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing message", e)
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure", t)
                mainHandler.post { listener.onError(t.message ?: "Connection failed") }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code $reason")
                if (!sessionEnded) {
                    sessionEnded = true
                    mainHandler.post { listener.onSessionEnded() }
                }
            }
        })
    }

    fun sendAudioChunk(pcm: ByteArray) {
        val encoded = Base64.encodeToString(pcm, Base64.NO_WRAP)
        val msg = JSONObject().apply {
            put("message_type", "input_audio_chunk")
            put("audio_base_64", encoded)
            put("commit", false)
            put("sample_rate", 16000)
        }
        webSocket?.send(msg.toString())
    }

    fun close() {
        webSocket?.close(1000, "done")
        webSocket = null
    }

    fun cancel() {
        sessionEnded = true
        webSocket?.cancel()
        webSocket = null
    }
}
