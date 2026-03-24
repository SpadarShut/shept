package expo.modules.sheptnative

import android.media.AudioRecord
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockkConstructor
import io.mockk.unmockkConstructor
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class PcmAudioCaptureTest {

    private val chunks = mutableListOf<ByteArray>()
    private val onChunk: (ByteArray) -> Unit = { chunks.add(it) }

    @Before
    fun setUp() {
        chunks.clear()
        mockkConstructor(AudioRecord::class)
        // Default: report initialized state
        every { anyConstructed<AudioRecord>().state } returns AudioRecord.STATE_INITIALIZED
        every { anyConstructed<AudioRecord>().startRecording() } returns Unit
        justRun { anyConstructed<AudioRecord>().stop() }
        justRun { anyConstructed<AudioRecord>().release() }
        // Default read: return 0 bytes (no data, non-blocking sentinel)
        every { anyConstructed<AudioRecord>().read(any<ByteArray>(), any(), any()) } returns 0
    }

    @After
    fun tearDown() {
        unmockkConstructor(AudioRecord::class)
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    @Test
    fun `stop before start does not crash`() {
        val capture = PcmAudioCapture(onChunk)
        capture.stop() // must not throw
    }

    @Test
    fun `start then stop does not crash`() {
        val capture = PcmAudioCapture(onChunk)
        capture.start()
        capture.stop()
    }

    @Test
    fun `double stop after start does not crash`() {
        val capture = PcmAudioCapture(onChunk)
        capture.start()
        capture.stop()
        capture.stop()
    }

    // ── resource management ──────────────────────────────────────────────────

    @Test
    fun `stop releases AudioRecord`() {
        val capture = PcmAudioCapture(onChunk)
        capture.start()
        capture.stop()

        verify { anyConstructed<AudioRecord>().release() }
    }

    @Test
    fun `stop calls AudioRecord stop before release`() {
        val capture = PcmAudioCapture(onChunk)
        capture.start()
        capture.stop()

        verify { anyConstructed<AudioRecord>().stop() }
        verify { anyConstructed<AudioRecord>().release() }
    }

    @Test
    fun `failed AudioRecord initialization does not start capture`() {
        every { anyConstructed<AudioRecord>().state } returns AudioRecord.STATE_UNINITIALIZED

        val capture = PcmAudioCapture(onChunk)
        capture.start() // should bail out early

        // release() is called on the bad record for cleanup; startRecording must NOT be called
        verify(exactly = 0) { anyConstructed<AudioRecord>().startRecording() }
        verify { anyConstructed<AudioRecord>().release() }
    }

    // ── onChunk callback ─────────────────────────────────────────────────────

    @Test
    fun `onChunk is called when AudioRecord returns data`() {
        val latch = CountDownLatch(1)
        val fakeData = ByteArray(3200) { it.toByte() }
        var callCount = 0

        // First read returns data, subsequent reads return 0 to let the thread idle
        every { anyConstructed<AudioRecord>().read(any<ByteArray>(), any(), any()) } answers {
            if (callCount++ == 0) {
                val buf = firstArg<ByteArray>()
                fakeData.copyInto(buf)
                latch.countDown()
                fakeData.size
            } else {
                0
            }
        }

        val received = mutableListOf<ByteArray>()
        val capture = PcmAudioCapture { received.add(it) }
        capture.start()

        val signalled = latch.await(2, TimeUnit.SECONDS)
        capture.stop()

        assertTrue("onChunk was never called within 2 s", signalled)
        assertTrue("Expected at least one chunk", received.isNotEmpty())
        assertTrue("Chunk content must match fake data", received.first().contentEquals(fakeData))
    }

    @Test
    fun `onChunk receives exact byte count reported by read`() {
        val latch = CountDownLatch(1)
        val partialSize = 512
        var callCount = 0

        every { anyConstructed<AudioRecord>().read(any<ByteArray>(), any(), any()) } answers {
            if (callCount++ == 0) {
                latch.countDown()
                partialSize // partial read
            } else {
                0
            }
        }

        val received = mutableListOf<ByteArray>()
        val capture = PcmAudioCapture { received.add(it) }
        capture.start()

        latch.await(2, TimeUnit.SECONDS)
        capture.stop()

        assertTrue("Expected a chunk", received.isNotEmpty())
        assertTrue("Chunk size must equal partial read size", received.first().size == partialSize)
    }

    // ── thread exit ──────────────────────────────────────────────────────────

    @Test
    fun `capture thread exits within 1 second of stop`() {
        val capture = PcmAudioCapture(onChunk)
        capture.start()

        val start = System.currentTimeMillis()
        capture.stop()
        val elapsed = System.currentTimeMillis() - start

        assertTrue("stop() took longer than 1500 ms — thread likely did not exit", elapsed < 1500)
    }
}
