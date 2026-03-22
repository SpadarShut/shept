package expo.modules.sheptnative

import android.view.accessibility.AccessibilityNodeInfo
import io.mockk.mockk
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

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
