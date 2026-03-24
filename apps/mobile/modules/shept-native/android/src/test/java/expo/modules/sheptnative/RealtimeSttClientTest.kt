package expo.modules.sheptnative

import android.util.Base64
import io.mockk.*
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLooper

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class RealtimeSttClientTest {

    private lateinit var listener: RealtimeSttListener
    private lateinit var mockWebSocket: WebSocket
    private lateinit var mockOkHttpClient: OkHttpClient
    private lateinit var client: RealtimeSttClient

    // Captured WebSocketListener from OkHttpClient.newWebSocket call
    private lateinit var wsListener: WebSocketListener

    @Before
    fun setUp() {
        listener = mockk(relaxed = true)
        mockWebSocket = mockk(relaxed = true)
        mockOkHttpClient = mockk(relaxed = true)

        // Intercept OkHttpClient.Builder construction to return our mock client
        mockkConstructor(OkHttpClient.Builder::class)
        val mockBuilder = mockk<OkHttpClient.Builder>(relaxed = true)
        every { anyConstructed<OkHttpClient.Builder>().connectTimeout(any(), any()) } returns mockBuilder
        every { anyConstructed<OkHttpClient.Builder>().readTimeout(any(), any()) } returns mockBuilder
        every { mockBuilder.connectTimeout(any(), any()) } returns mockBuilder
        every { mockBuilder.readTimeout(any(), any()) } returns mockBuilder
        every { anyConstructed<OkHttpClient.Builder>().build() } returns mockOkHttpClient
        every { mockBuilder.build() } returns mockOkHttpClient

        // Capture the WebSocketListener when newWebSocket is called
        every { mockOkHttpClient.newWebSocket(any(), any()) } answers {
            wsListener = secondArg()
            mockWebSocket
        }

        // Force class initialization before mocking to avoid __staticInitializer__ inconsistency
        try { Base64.encodeToString(byteArrayOf(), Base64.NO_WRAP) } catch (_: Exception) {}
        mockkStatic(Base64::class)
        every { Base64.encodeToString(any<ByteArray>(), any<Int>()) } answers {
            java.util.Base64.getEncoder().encodeToString(firstArg<ByteArray>())
        }

        client = RealtimeSttClient("test-api-key", "en", listener)
        client.connect()

        // Drain main looper after connect in case anything was posted
        ShadowLooper.idleMainLooper()
    }

    @After
    fun tearDown() {
        unmockkAll()
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private fun sendMessage(type: String, extras: Map<String, String> = emptyMap()) {
        val json = JSONObject().apply {
            put("type", type)
            extras.forEach { (k, v) -> put(k, v) }
        }
        wsListener.onMessage(mockWebSocket, json.toString())
    }

    private fun drainMain() = ShadowLooper.idleMainLooper()

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    fun `partial_transcript with text calls onPartialTranscript`() {
        sendMessage("partial_transcript", mapOf("text" to "hello"))
        drainMain()

        verify(exactly = 1) { listener.onPartialTranscript("hello") }
        verify(exactly = 0) { listener.onCommittedTranscript(any()) }
    }

    @Test
    fun `partial_transcript with empty text does not call onPartialTranscript`() {
        sendMessage("partial_transcript", mapOf("text" to ""))
        drainMain()

        verify(exactly = 0) { listener.onPartialTranscript(any()) }
    }

    @Test
    fun `committed_transcript calls onCommittedTranscript`() {
        sendMessage("committed_transcript", mapOf("text" to "final result"))
        drainMain()

        verify(exactly = 1) { listener.onCommittedTranscript("final result") }
        verify(exactly = 0) { listener.onPartialTranscript(any()) }
    }

    @Test
    fun `session_ended message calls onSessionEnded`() {
        sendMessage("session.ended")
        drainMain()

        verify(exactly = 1) { listener.onSessionEnded() }
    }

    @Test
    fun `WebSocket failure calls onError with throwable message`() {
        val error = RuntimeException("connection refused")
        wsListener.onFailure(mockWebSocket, error, null)
        drainMain()

        verify(exactly = 1) { listener.onError("connection refused") }
    }

    @Test
    fun `WebSocket failure with null message calls onError with fallback`() {
        val error = RuntimeException(null as String?)
        wsListener.onFailure(mockWebSocket, error, null)
        drainMain()

        verify(exactly = 1) { listener.onError("Connection failed") }
    }

    @Test
    fun `WebSocket closed without prior session_ended calls onSessionEnded`() {
        wsListener.onClosed(mockWebSocket, 1000, "normal")
        drainMain()

        verify(exactly = 1) { listener.onSessionEnded() }
    }

    @Test
    fun `WebSocket closed after session_ended does not double-call onSessionEnded`() {
        sendMessage("session.ended")
        drainMain()

        wsListener.onClosed(mockWebSocket, 1000, "normal")
        drainMain()

        // onSessionEnded must be called exactly once total
        verify(exactly = 1) { listener.onSessionEnded() }
    }

    @Test
    fun `sendAudioChunk sends base64-encoded JSON with correct type`() {
        val pcm = byteArrayOf(0x01, 0x02, 0x03)
        client.sendAudioChunk(pcm)

        val slot = slot<String>()
        verify { mockWebSocket.send(capture(slot)) }

        val json = JSONObject(slot.captured)
        assertEquals("input_audio_chunk", json.getString("type"))

        val expectedBase64 = java.util.Base64.getEncoder().encodeToString(pcm)
        assertEquals(expectedBase64, json.getString("audio"))
    }

    @Test
    fun `commitAndClose sends commit then end_of_stream messages`() {
        client.commitAndClose()

        val messages = mutableListOf<String>()
        verify { mockWebSocket.send(capture(messages)) }

        val types = messages.map { JSONObject(it).getString("type") }
        assertTrue("commit must be sent", "commit" in types)
        assertTrue("end_of_stream must be sent", "end_of_stream" in types)
        assertEquals("commit", types[0])
        assertEquals("end_of_stream", types[1])
    }

    @Test
    fun `cancel prevents listener callbacks from subsequent WebSocket events`() {
        client.cancel()

        // onClosed fired after cancel — should NOT call onSessionEnded again
        // (sessionEnded is already true; onClosed guard prevents double-call)
        wsListener.onClosed(mockWebSocket, 1000, "normal")
        drainMain()

        verify(exactly = 0) { listener.onSessionEnded() }
        verify(exactly = 0) { listener.onError(any()) }
    }
}
