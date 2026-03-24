package expo.modules.sheptnative

import android.content.Context
import android.content.SharedPreferences
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import javax.crypto.AEADBadTagException

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class ConfigReaderTest {

    private val context = mockk<Context>(relaxed = true)

    private fun prefsWithData(json: String): SharedPreferences {
        val prefs = mockk<SharedPreferences>(relaxed = true)
        every { prefs.getString("data", null) } returns json
        return prefs
    }

    // ── happy path ─────────────────────────────────────────────────────────

    @Test
    fun `getApiKey returns stored key`() {
        val prefs = prefsWithData("""{"elevenLabsApiKey":"test-key-123"}""")
        val reader = ConfigReader(context, prefs)
        assertEquals("test-key-123", reader.getApiKey())
    }

    @Test
    fun `getRealtimeMode returns stored value`() {
        val prefs = prefsWithData("""{"realtimeMode":false}""")
        val reader = ConfigReader(context, prefs)
        assertEquals(false, reader.getRealtimeMode())
    }

    @Test
    fun `getPrimaryLanguage returns stored language`() {
        val prefs = prefsWithData("""{"primaryLanguage":"be"}""")
        val reader = ConfigReader(context, prefs)
        assertEquals("be", reader.getPrimaryLanguage())
    }

    @Test
    fun `getLanguages returns stored list`() {
        val prefs = prefsWithData("""{"languages":["en","be"]}""")
        val reader = ConfigReader(context, prefs)
        assertEquals(listOf("en", "be"), reader.getLanguages())
    }

    // ── defaults when no data ──────────────────────────────────────────────

    @Test
    fun `getApiKey returns empty string when no data`() {
        val prefs = prefsWithData("")
        every { prefs.getString("data", null) } returns null
        val reader = ConfigReader(context, prefs)
        assertEquals("", reader.getApiKey())
    }

    @Test
    fun `getRealtimeMode returns true when no data`() {
        val prefs = prefsWithData("")
        every { prefs.getString("data", null) } returns null
        val reader = ConfigReader(context, prefs)
        assertEquals(true, reader.getRealtimeMode())
    }

    // ── corruption recovery ────────────────────────────────────────────────

    @Test
    fun `getRealtimeMode returns default when getString throws AEADBadTagException`() {
        val prefs = mockk<SharedPreferences>(relaxed = true)
        every { prefs.getString("data", null) } throws AEADBadTagException("Signature/MAC verification failed")

        val editor = mockk<SharedPreferences.Editor>(relaxed = true)
        every { prefs.edit() } returns editor
        every { editor.clear() } returns editor

        val reader = ConfigReader(context, prefs)
        assertEquals(true, reader.getRealtimeMode())
    }

    @Test
    fun `getApiKey returns empty when getString throws AEADBadTagException`() {
        val prefs = mockk<SharedPreferences>(relaxed = true)
        every { prefs.getString("data", null) } throws AEADBadTagException("Signature/MAC verification failed")

        val editor = mockk<SharedPreferences.Editor>(relaxed = true)
        every { prefs.edit() } returns editor
        every { editor.clear() } returns editor

        val reader = ConfigReader(context, prefs)
        assertEquals("", reader.getApiKey())
    }

    @Test
    fun `corrupted prefs are cleared on read failure`() {
        val prefs = mockk<SharedPreferences>(relaxed = true)
        every { prefs.getString("data", null) } throws AEADBadTagException("corrupted")

        val editor = mockk<SharedPreferences.Editor>(relaxed = true)
        every { prefs.edit() } returns editor
        every { editor.clear() } returns editor

        val reader = ConfigReader(context, prefs)
        reader.getRealtimeMode() // triggers corruption handling

        verify { editor.clear() }
        verify { editor.apply() }
    }

    // ── malformed JSON ─────────────────────────────────────────────────────

    @Test
    fun `getRealtimeMode returns default for malformed JSON`() {
        val prefs = prefsWithData("not json at all")
        val reader = ConfigReader(context, prefs)
        assertEquals(true, reader.getRealtimeMode())
    }

    @Test
    fun `getApiKey returns empty for malformed JSON`() {
        val prefs = prefsWithData("not json")
        val reader = ConfigReader(context, prefs)
        assertEquals("", reader.getApiKey())
    }
}
