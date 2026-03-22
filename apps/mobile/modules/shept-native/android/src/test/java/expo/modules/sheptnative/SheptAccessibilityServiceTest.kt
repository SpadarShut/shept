package expo.modules.sheptnative

import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import io.mockk.every
import io.mockk.mockk
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLooper
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class SheptAccessibilityServiceTest {

    private lateinit var service: TestableSheptService
    private val focusEvents = mutableListOf<Pair<Boolean, String>>()
    private val testObserver = object : AccessibilityBridge.FocusObserver {
        override fun onFocusChanged(hasFocus: Boolean, packageName: String) {
            focusEvents.add(hasFocus to packageName)
        }
    }

    /**
     * Subclass that allows injecting a mock window-search result,
     * removing the dependency on the real AccessibilityService.windows API.
     */
    class TestableSheptService : SheptAccessibilityService() {
        var mockWindowNode: AccessibilityNodeInfo? = null
        override fun findFocusedInputFromWindows(): AccessibilityNodeInfo? = mockWindowNode
    }

    @Before
    fun setUp() {
        focusEvents.clear()
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.isServiceRunning = false
        AccessibilityBridge.addObserver(testObserver)
        service = Robolectric.buildService(TestableSheptService::class.java).create().get()
        // Manually initialize bridge state (onServiceConnected is protected, called by system)
        AccessibilityBridge.isServiceRunning = true
        ShadowLooper.pauseMainLooper()
    }

    @After
    fun tearDown() {
        AccessibilityBridge.removeObserver(testObserver)
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.isServiceRunning = false
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private fun textFieldNode(): AccessibilityNodeInfo = mockk<AccessibilityNodeInfo>(relaxed = true).also {
        every { it.isEditable } returns true
        every { it.className } returns "android.widget.EditText"
        every { it.actionList } returns emptyList()
        every { it.refresh() } returns true
        every { it.isFocused } returns true
    }

    private fun nonTextNode(): AccessibilityNodeInfo = mockk<AccessibilityNodeInfo>(relaxed = true).also {
        every { it.isEditable } returns false
        every { it.className } returns "android.widget.Button"
        every { it.actionList } returns emptyList()
    }

    private fun focusedEvent(node: AccessibilityNodeInfo, pkg: String = "com.example"): AccessibilityEvent =
        mockk<AccessibilityEvent>(relaxed = true).also {
            every { it.eventType } returns AccessibilityEvent.TYPE_VIEW_FOCUSED
            every { it.source } returns node
            every { it.packageName } returns pkg
        }

    private fun contentChangedEvent(subtypes: Int, pkg: String = "com.example"): AccessibilityEvent =
        mockk<AccessibilityEvent>(relaxed = true).also {
            every { it.eventType } returns AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            every { it.contentChangeTypes } returns subtypes
            every { it.packageName } returns pkg
        }

    private fun windowStateChangedEvent(pkg: String = "com.example"): AccessibilityEvent =
        mockk<AccessibilityEvent>(relaxed = true).also {
            every { it.eventType } returns AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            every { it.packageName } returns pkg
        }

    private fun advanceLooperBy(ms: Long) {
        ShadowLooper.idleMainLooper(ms, TimeUnit.MILLISECONDS)
    }

    // ── TYPE_VIEW_FOCUSED ────────────────────────────────────────────────────

    @Test
    fun `text field focus notifies focus gained`() {
        service.onAccessibilityEvent(focusedEvent(textFieldNode()))
        assertTrue("Expected focus gained event", focusEvents.any { it.first && it.second == "com.example" })
    }

    @Test
    fun `non-text view focus does not immediately notify focus lost`() {
        service.onAccessibilityEvent(focusedEvent(textFieldNode()))
        focusEvents.clear()

        service.onAccessibilityEvent(focusedEvent(nonTextNode()))

        assertTrue("Hide must not fire within grace period", focusEvents.none { !it.first })
    }

    @Test
    fun `hide fires after grace period elapses following non-text focus`() {
        service.onAccessibilityEvent(focusedEvent(textFieldNode()))
        focusEvents.clear()

        service.onAccessibilityEvent(focusedEvent(nonTextNode()))
        advanceLooperBy(700)

        assertTrue("Expected hide after grace period", focusEvents.any { !it.first })
    }

    @Test
    fun `text field focus during grace period cancels the pending hide`() {
        service.onAccessibilityEvent(focusedEvent(textFieldNode()))
        service.onAccessibilityEvent(focusedEvent(nonTextNode()))
        focusEvents.clear()

        // New text field focus within grace period
        service.onAccessibilityEvent(focusedEvent(textFieldNode(), "com.example"))
        advanceLooperBy(700)

        assertTrue("Expected re-focus gained", focusEvents.any { it.first })
        assertTrue("Hide must be cancelled", focusEvents.none { !it.first })
    }

    // ── TYPE_WINDOW_CONTENT_CHANGED ──────────────────────────────────────────

    @Test
    fun `content changed with text subtype discovers focused node and notifies focus gained`() {
        service.mockWindowNode = textFieldNode()

        service.onAccessibilityEvent(
            contentChangedEvent(AccessibilityEvent.CONTENT_CHANGE_TYPE_TEXT)
        )

        assertTrue("Expected focus gained from content-change", focusEvents.any { it.first })
    }

    @Test
    fun `content changed with subtree-only subtype is ignored`() {
        service.mockWindowNode = textFieldNode()

        service.onAccessibilityEvent(
            contentChangedEvent(AccessibilityEvent.CONTENT_CHANGE_TYPE_SUBTREE)
        )

        assertTrue("No event expected for subtree-only change", focusEvents.isEmpty())
    }

    @Test
    fun `content changed is ignored when a node is already tracked`() {
        service.onAccessibilityEvent(focusedEvent(textFieldNode()))
        focusEvents.clear()

        service.mockWindowNode = textFieldNode()
        service.onAccessibilityEvent(
            contentChangedEvent(AccessibilityEvent.CONTENT_CHANGE_TYPE_TEXT)
        )

        assertTrue("Must not fire redundant focus event", focusEvents.isEmpty())
    }

    // ── TYPE_WINDOW_STATE_CHANGED ────────────────────────────────────────────

    @Test
    fun `window state change with stale node schedules hide not immediate`() {
        val node = textFieldNode()
        service.onAccessibilityEvent(focusedEvent(node))
        focusEvents.clear()

        // Mark node as stale
        every { node.refresh() } returns false
        service.onAccessibilityEvent(windowStateChangedEvent())

        assertTrue("Stale node hide must be deferred", focusEvents.none { !it.first })

        advanceLooperBy(700)
        assertTrue("Expected hide after grace period", focusEvents.any { !it.first })
    }

    @Test
    fun `window state change with valid node does not schedule hide`() {
        val node = textFieldNode()
        every { node.refresh() } returns true

        service.onAccessibilityEvent(focusedEvent(node))
        focusEvents.clear()

        service.onAccessibilityEvent(windowStateChangedEvent())
        advanceLooperBy(700)

        assertEquals("No hide expected for valid node", 0, focusEvents.count { !it.first })
    }
}
