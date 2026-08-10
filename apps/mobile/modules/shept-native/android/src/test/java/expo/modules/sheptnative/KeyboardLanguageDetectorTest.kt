package expo.modules.sheptnative

import android.content.Context
import android.os.Build
import android.view.inputmethod.InputMethodManager
import android.view.inputmethod.InputMethodSubtype
import io.mockk.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class KeyboardLanguageDetectorTest {

    private fun mockContext(subtype: InputMethodSubtype?): Context {
        val imm = mockk<InputMethodManager>()
        every { imm.currentInputMethodSubtype } returns subtype
        val context = mockk<Context>()
        every { context.getSystemService(Context.INPUT_METHOD_SERVICE) } returns imm
        return context
    }

    private fun mockSubtype(languageTag: String, locale: String = ""): InputMethodSubtype {
        val subtype = mockk<InputMethodSubtype>()
        every { subtype.languageTag } returns languageTag
        @Suppress("DEPRECATION")
        every { subtype.locale } returns locale
        return subtype
    }

    @Test
    fun `detects en from en-US language tag`() {
        val context = mockContext(mockSubtype("en-US"))
        assertEquals("en", KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `detects ru from ru-RU language tag`() {
        val context = mockContext(mockSubtype("ru-RU"))
        assertEquals("ru", KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `detects be from plain be language tag`() {
        val context = mockContext(mockSubtype("be"))
        assertEquals("be", KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `detects en from underscore locale en_US`() {
        val context = mockContext(mockSubtype("", "en_US"))
        assertEquals("en", KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `falls back to locale when language tag is empty`() {
        val context = mockContext(mockSubtype("", "ru_RU"))
        assertEquals("ru", KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `returns null when subtype is null`() {
        val context = mockContext(null)
        assertNull(KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `returns null when both language tag and locale are empty`() {
        val context = mockContext(mockSubtype("", ""))
        assertNull(KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `returns null when InputMethodManager is not available`() {
        val context = mockk<Context>()
        every { context.getSystemService(Context.INPUT_METHOD_SERVICE) } returns null
        assertNull(KeyboardLanguageDetector.detectCurrentLanguage(context))
    }

    @Test
    fun `returns null for single character locale`() {
        val context = mockContext(mockSubtype("x"))
        assertNull(KeyboardLanguageDetector.detectCurrentLanguage(context))
    }
}
