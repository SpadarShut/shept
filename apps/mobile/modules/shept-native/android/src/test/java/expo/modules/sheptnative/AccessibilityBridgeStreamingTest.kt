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
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        // Verify by calling updatePartialText and checking the SET_TEXT target starts at offset 7.
        // The field text at [7, 7] is empty string which matches lastPartialText="", so no disable.
        every { node.text } returns "prefix "  // length 7, so [7,7] == ""
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
        // Must not throw
        AccessibilityBridge.beginStreamingSession()
    }

    @Test
    fun `beginStreamingSession treats textSelectionEnd of -1 as offset 0`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns -1
        every { node.text } returns ""
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
        // Arrange: simulate a dirty streaming state left over from a previous session
        // by running a session, then beginning a new one and confirming clean state.
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        // First session — inject something so state is dirty
        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("old")

        // Second session — fresh node at cursor 0 with empty text
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        AccessibilityBridge.beginStreamingSession()

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
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
    fun `updatePartialText second call replaces first partial not appends`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        // After first call the field contains "hel" at [0,3]
        every { node.text } returns ""
        AccessibilityBridge.updatePartialText("hel")

        // Simulate the field now holds "hel" (what the impl wrote)
        every { node.text } returns "hel"

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        every { node.text } returns "hel"

        AccessibilityBridge.updatePartialText("hello")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        // "hel" is replaced by "hello", not appended → result is "hello" not "helhello"
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
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, capture(slot)) }
        // cursor should be at 6 + 5 = 11
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT))
        assertEquals(11, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT))
    }

    @Test
    fun `updatePartialText safety check disables injection when user modified field`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()

        // First update: partial "hi" written at [0,2]
        every { node.text } returns ""
        AccessibilityBridge.updatePartialText("hi")

        // User typed extra chars — field now reads "hi there" instead of "hi"
        every { node.text } returns "hi there"

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        every { node.text } returns "hi there"

        // Safety check should detect mismatch at [0,2] ("hi" vs "hi") — wait, "hi" does match
        // but the full slice [0, partialLength=2] of "hi there" is "hi" which matches lastPartialText="hi".
        // So the mismatch case: simulate partialLength=2, field text[0..2]="HI" (case change)
        // Let's redo: first partial is "hi", user changes it to "HI there"
        every { node.text } returns "HI there"

        AccessibilityBridge.updatePartialText("hello")

        // ACTION_SET_TEXT must NOT be called — injection is disabled
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
    }

    @Test
    fun `updatePartialText sets partialInjectionDisabled when ACTION_SET_TEXT fails`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")

        // Second call — partialInjectionDisabled should now be true → no ACTION_SET_TEXT again
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
        // Fail on first call to trigger the disable
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("hello")  // this disables partial injection

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.performAction(any<Int>(), any()) } returns true

        AccessibilityBridge.updatePartialText("hello world")

        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) }
        verify(exactly = 0) { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) }
    }

    // ─── commitPartialText ────────────────────────────────────────────────────

    @Test
    fun `commitPartialText writes final text same as updatePartialText`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
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
    fun `commitPartialText resets tracking state so next session starts clean`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.updatePartialText("partial")
        // Now field holds "partial" at [0,7]

        every { node.text } returns "partial"
        AccessibilityBridge.commitPartialText("partial final")

        // After commit, state is reset. A new beginStreamingSession + updatePartialText should
        // behave as if starting fresh (partialLength=0, lastPartialText="").
        every { node.textSelectionEnd } returns 0
        every { node.text } returns ""
        AccessibilityBridge.beginStreamingSession()

        clearMocks(node, answers = false, recordedCalls = true, verificationMarks = true)
        every { node.text } returns ""
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true

        AccessibilityBridge.updatePartialText("new partial")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, capture(slot)) }
        // partialStartOffset=0, partialLength=0 after reset on empty field → just the new text
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
        // Fail ACTION_SET_TEXT to trigger disable
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns false
        every { node.refresh() } returns true
        AccessibilityBridge.focusedNode = node
        // No clipboardContext → injectText will also use ACTION_SET_TEXT (paste path skipped),
        // but what we verify is that injectText() is attempted (i.e. it calls refresh() which
        // is part of injectText's normal path, unlike updatePartialText which does not call refresh).

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

        // injectText calls node.refresh() — verify it was invoked (distinguishes injectText path)
        verify { node.refresh() }
    }

    @Test
    fun `commitPartialText places cursor after final text`() {
        val node = mockk<AccessibilityNodeInfo>(relaxed = true)
        every { node.textSelectionEnd } returns 3
        every { node.text } returns "hi "
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, any()) } returns true
        every { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, any()) } returns true
        AccessibilityBridge.focusedNode = node

        AccessibilityBridge.beginStreamingSession()
        AccessibilityBridge.commitPartialText("world")

        val slot = slot<Bundle>()
        verify { node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, capture(slot)) }
        // cursor at 3 + 5 = 8
        assertEquals(8, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT))
        assertEquals(8, slot.captured.getInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT))
    }
}
