package expo.modules.sheptnative

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log

class PcmAudioCapture(private val onChunk: (ByteArray) -> Unit) {

    companion object {
        private const val TAG = "PcmAudioCapture"
        private const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        // ~100ms at 16kHz, 16-bit mono = 16000 * 2 * 0.1 = 3200 bytes
        private const val CHUNK_SIZE = 3200
    }

    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null
    @Volatile private var running = false

    fun start() {
        val minBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val bufferSize = maxOf(minBuffer, CHUNK_SIZE * 2)

        val record = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT,
            bufferSize
        )

        if (record.state != AudioRecord.STATE_INITIALIZED) {
            Log.e(TAG, "AudioRecord failed to initialize")
            record.release()
            return
        }

        audioRecord = record
        running = true
        record.startRecording()

        captureThread = Thread {
            val buffer = ByteArray(CHUNK_SIZE)
            while (running) {
                val read = record.read(buffer, 0, buffer.size)
                if (read > 0) {
                    onChunk(buffer.copyOf(read))
                }
            }
        }.apply { start() }

        Log.d(TAG, "PCM capture started")
    }

    fun stop() {
        running = false
        try {
            captureThread?.join(1000)
        } catch (_: InterruptedException) {}
        captureThread = null

        try {
            audioRecord?.apply {
                stop()
                release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping AudioRecord", e)
        }
        audioRecord = null

        Log.d(TAG, "PCM capture stopped")
    }
}
