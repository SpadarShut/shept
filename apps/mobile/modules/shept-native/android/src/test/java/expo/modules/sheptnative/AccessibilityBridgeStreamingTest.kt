package expo.modules.sheptnative

import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo
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
class AccessibilityBridgeStreamingTest {

    @Before
    fun setUp() {
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.clipboardContext = null
    }

    @After
    fun tearDown() {
        AccessibilityBridge.focusedNode = null
    }

    // ─── beginStreamingSession ────────────────────────────────────────────────

    @Test
    fun `beginStreamingSession snapshots cursor position from focusedNode`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 7
        every { node.refresh() } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        every { node.text } returns "prefix "
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true

        AccessibilityBridge.updatePartialText("hi")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "prefix hi",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `beginStreamingSession with no focused node does not crash`() {
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.beginStreamingSession()
    }

    @Test
    fun `beginStreamingSession treats textSelectionEnd of -1 as offset 0`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns -1
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "hello",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `beginStreamingSession resets tracking state`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("old")

        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        AccessibilityBridge.beginStreamingSession()

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true

        AccessibilityBridge.updatePartialText("new")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "new",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    // ─── updatePartialText ────────────────────────────────────────────────────

    @Test
    fun `updatePartialText sends ACTION_SET_TEXT with correct merged text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        val result = AccessibilityBridge.updatePartialText("hello")

        assertTrue(result)
        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "hello",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `updatePartialText returns false when focusedNode is null`() {
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.beginStreamingSession()

        val result = AccessibilityBridge.updatePartialText("hello")

        assertFalse(result)
    }

    @Test
    fun `updatePartialText returns false when refresh fails`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.refresh() } returns false
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        val result = AccessibilityBridge.updatePartialText("hello")

        assertFalse(result)
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
    }

    @Test
    fun `updatePartialText second call replaces first partial not appends`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        every { node.text } returns ""
        AccessibilityBridge.updatePartialText("hel")

        every { node.text } returns "hel"

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        every { node.text } returns "hel"

        AccessibilityBridge.updatePartialText("hello")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "hello",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `updatePartialText places cursor at end of injected partial text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 6
        every { node.text } returns "prefix"
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, capture(slot)) }
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT))
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT))
    }

    @Test
    fun `updatePartialText safety check disables injection when user modified field`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        every { node.text } returns ""
        AccessibilityBridge.updatePartialText("hi")

        every { node.text } returns "hi there"

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        every { node.text } returns "HI there"

        val result = AccessibilityBridge.updatePartialText("hello")

        assertFalse(result)
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
    }

    @Test
    fun `updatePartialText sets partialInjectionDisabled when ACTION_SET_TEXT fails`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false

        AccessibilityBridge.updatePartialText("hello world")

        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
    }

    @Test
    fun `updatePartialText when partialInjectionDisabled does nothing`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.performAction(any<Int>(), any()) } returns true

        AccessibilityBridge.updatePartialText("hello world")

        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) }
    }

    @Test
    fun `updatePartialText ignores hint text treating field as empty`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns "Type a message"
        every { node.hintText } returns "Type a message"
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        val result = AccessibilityBridge.updatePartialText("hello")

        assertTrue(result)
        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "hello",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    // ─── commitPartialText ────────────────────────────────────────────────────

    @Test
    fun `commitPartialText writes final text same as updatePartialText`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.commitPartialText("final text")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "final text",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `commitPartialText falls back to injectText when updatePartialText returns false`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        // Simulate node becoming null mid-session
        AccessibilityBridge.focusedNode = null

        // Set a new node for injectText fallback
        val newNode = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { newNode.refresh() } returns true
        every { newNode.text } returns ""
        every { newNode.textSelectionStart } returns 0
        every { newNode.textSelectionEnd } returns 0
        every { newNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { newNode.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = newNode

        AccessibilityBridge.commitPartialText("final text")

        // injectText calls node.refresh() — distinguishes from updatePartialText path
        verify { newNode.refresh() }
        val slot = slot<Bundle>()
        verify { newNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "final text",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `commitPartialText resets tracking state so next session starts clean`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("partial")

        every { node.text } returns "partial"
        AccessibilityBridge.commitPartialText("partial final")

        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        AccessibilityBridge.beginStreamingSession()

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true

        AccessibilityBridge.updatePartialText("new partial")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        assertEquals(
            "new partial",
            slot.captured.getCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE
            ).toString()
        )
    }

    @Test
    fun `commitPartialText when partialInjectionDisabled falls back to injectText`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hi")  // fails → partialInjectionDisabled = true

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.refresh() } returns true
        every { node.text } returns ""
        every { node.textSelectionStart } returns 0
        every { node.textSelectionEnd } returns 0
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true

        AccessibilityBridge.commitPartialText("final")

        verify { node.refresh() }
    }

    @Test
    fun `commitPartialText places cursor after final text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 3
        every { node.text } returns "hi "
        every { node.refresh() } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.commitPartialText("world")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, capture(slot)) }
        assertEquals(8, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT))
        assertEquals(8, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT))
    }
}
