package expo.modules.sheptnative

import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ApplicationProvider
import io.mockk.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class AccessibilityBridgeTest {

    private val focusEvents = mutableListOf<Pair<Boolean, String>>()
    private val testObserver = object : AccessibilityBridge.FocusObserver {
        override fun onFocusChanged(hasFocus: Boolean, packageName: String) {
            focusEvents.add(hasFocus to packageName)
        }
    }

    @Before
    fun setUp() {
        focusEvents.clear()
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.addObserver(testObserver)
    }

    @After
    fun tearDown() {
        AccessibilityBridge.removeObserver(testObserver)
        AccessibilityBridge.focusedNode = null
    }

    @Test
    fun `notifyFocusChanged delivers hasFocus true to observer`() {
        AccessibilityBridge.notifyFocusChanged(true, "com.example")
        assertTrue(focusEvents.contains(true to "com.example"))
    }

    @Test
    fun `notifyFocusChanged delivers hasFocus false to observer`() {
        AccessibilityBridge.notifyFocusChanged(false, "com.example")
        assertTrue(focusEvents.contains(false to "com.example"))
    }

    @Test
    fun `notifyFocusChanged does not deliver to removed observer`() {
        AccessibilityBridge.removeObserver(testObserver)
        AccessibilityBridge.notifyFocusChanged(true, "com.example")
        assertTrue(focusEvents.isEmpty())
    }

    @Test
    fun `focusedNode setter recycles the previous node when replaced`() {
        val oldNode = mockk<AccessibilityNodeInfo>(relaxed = true)
        val newNode = mockk<AccessibilityNodeInfo>(relaxed = true)

        AccessibilityBridge.focusedNode = oldNode
        AccessibilityBridge.focusedNode = newNode

        verify(exactly = 1) { oldNode.recycle() }
    }

    @Test
    fun `focusedNode setter does not recycle when previous node is null`() {
        val newNode = mockk<AccessibilityNodeInfo>(relaxed = true)
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.focusedNode = newNode
        // no exception = pass
    }

    @Test
    fun `focusedNode setter does not recycle when same node reassigned`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        AccessibilityBridge.focusedNode = node
        AccessibilityBridge.focusedNode = node
        verify(exactly = 0) { node.recycle() }
    }

    @Test
    fun `injectText returns false when no focused node`() {
        AccessibilityBridge.focusedNode = null
        assertFalse(AccessibilityBridge.injectText("hello"))
    }

    @Test
    fun `injectText uses paste and preserves existing text at cursor`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        AccessibilityBridge.clipboardContext = context
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns true

        AccessibilityBridge.focusedNode = node

        assertTrue(AccessibilityBridge.injectText("world"))

        verify { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) }
        // Should NOT fall through to ACTION_SET_TEXT
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
    }

    @Test
    fun `injectText restores clipboard after paste`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        AccessibilityBridge.clipboardContext = context
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(android.content.ClipData.newPlainText("user", "original"))

        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.injectText("dictated")

        assertEquals("original", clipboard.primaryClip?.getItemAt(0)?.text?.toString())
    }

    @Test
    fun `injectText falls back to SET_TEXT with merged text when paste fails`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.text } returns "hello "
        every { node.textSelectionStart } returns 6
        every { node.textSelectionEnd } returns 6
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.clipboardContext = null
        AccessibilityBridge.focusedNode = node

        assertTrue(AccessibilityBridge.injectText("world"))

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals("hello world", slot.captured.getCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
        ).toString())
    }

    @Test
    fun `injectText SET_TEXT fallback inserts at cursor in middle of text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.text } returns "helo world"
        every { node.textSelectionStart } returns 3
        every { node.textSelectionEnd } returns 3
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.clipboardContext = null
        AccessibilityBridge.focusedNode = node

        assertTrue(AccessibilityBridge.injectText("l"))

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals("hello world", slot.captured.getCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
        ).toString())
    }

    @Test
    fun `injectText SET_TEXT fallback replaces selection`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.text } returns "hello REPLACE world"
        every { node.textSelectionStart } returns 6
        every { node.textSelectionEnd } returns 13
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.clipboardContext = null
        AccessibilityBridge.focusedNode = node

        assertTrue(AccessibilityBridge.injectText("beautiful"))

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals("hello beautiful world", slot.captured.getCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
        ).toString())
    }

    @Test
    fun `injectText SET_TEXT fallback works on empty field`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.text } returns null
        every { node.textSelectionStart } returns -1
        every { node.textSelectionEnd } returns -1
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.clipboardContext = null
        AccessibilityBridge.focusedNode = node

        assertTrue(AccessibilityBridge.injectText("hello"))

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals("hello", slot.captured.getCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
        ).toString())
    }

    @Test
    fun `injectText SET_TEXT fallback positions cursor after inserted text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.refresh() } returns true
        every { node.text } returns "hello "
        every { node.textSelectionStart } returns 6
        every { node.textSelectionEnd } returns 6
        every { node.performAction(AccessibilityNodeInfo.ACTION_PASTE) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.clipboardContext = null
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.injectText("world")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, capture(slot)) }
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT))
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT))
    }

    @Test
    fun `notifyFocusChanged notifies multiple observers`() {
        val secondEvents = mutableListOf<Boolean>()
        val secondObserver = object : AccessibilityBridge.FocusObserver {
            override fun onFocusChanged(hasFocus: Boolean, packageName: String) { secondEvents.add(hasFocus) }
        }
        AccessibilityBridge.addObserver(secondObserver)

        AccessibilityBridge.notifyFocusChanged(true, "pkg")

        assertTrue(focusEvents.isNotEmpty())
        assertTrue(secondEvents.isNotEmpty())

        AccessibilityBridge.removeObserver(secondObserver)
    }
}
