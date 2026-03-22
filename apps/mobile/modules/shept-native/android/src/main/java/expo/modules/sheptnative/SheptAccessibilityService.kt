package expo.modules.sheptnative

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

open class SheptAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SheptA11yService"
        private const val FOCUS_POLL_MS = 500L
        private const val HIDE_GRACE_MS = 600L
    }

    private val handler = Handler(Looper.getMainLooper())
    private var focusPollRunnable: Runnable? = null
    private var pendingHideRunnable: Runnable? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        AccessibilityBridge.isServiceRunning = true
        AccessibilityBridge.clipboardContext = applicationContext
        Log.d(TAG, "Accessibility service connected")
    }

    override fun onDestroy() {
        super.onDestroy()
        stopFocusPolling()
        cancelPendingHide()
        AccessibilityBridge.isServiceRunning = false
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.clipboardContext = null
        Log.d(TAG, "Accessibility service destroyed")
    }

    private fun cancelPendingHide() {
        pendingHideRunnable?.let { handler.removeCallbacks(it) }
        pendingHideRunnable = null
    }

    private fun scheduleHide(pkg: String) {
        if (pendingHideRunnable != null) return
        pendingHideRunnable = Runnable {
            pendingHideRunnable = null
            if (AccessibilityBridge.focusedNode != null) return@Runnable
            AccessibilityBridge.notifyFocusChanged(false, pkg)
            Log.d(TAG, "Grace period elapsed, hiding overlay: $pkg")
        }
        handler.postDelayed(pendingHideRunnable!!, HIDE_GRACE_MS)
    }

    private fun startFocusPolling() {
        if (focusPollRunnable != null) return
        focusPollRunnable = object : Runnable {
            override fun run() {
                val node = AccessibilityBridge.focusedNode
                if (node != null) {
                    val stillValid = try { node.refresh() && node.isFocused } catch (_: Exception) { false }
                    if (!stillValid) {
                        Log.d(TAG, "Focus poll: node lost focus")
                        AccessibilityBridge.focusedNode = null
                        scheduleHide("")
                        stopFocusPolling()
                        return
                    }
                    handler.postDelayed(this, FOCUS_POLL_MS)
                } else {
                    stopFocusPolling()
                }
            }
        }
        handler.postDelayed(focusPollRunnable!!, FOCUS_POLL_MS)
    }

    private fun stopFocusPolling() {
        focusPollRunnable?.let { handler.removeCallbacks(it) }
        focusPollRunnable = null
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                val source = event.source ?: return
                if (isTextField(source)) {
                    cancelPendingHide()
                    AccessibilityBridge.focusedNode = source
                    val pkg = event.packageName?.toString() ?: ""
                    AccessibilityBridge.notifyFocusChanged(true, pkg)
                    startFocusPolling()
                    Log.d(TAG, "Text field focused in: $pkg")
                } else if (AccessibilityBridge.focusedNode != null) {
                    AccessibilityBridge.focusedNode = null
                    stopFocusPolling()
                    val pkg = event.packageName?.toString() ?: ""
                    scheduleHide(pkg)
                    Log.d(TAG, "Non-text focus, grace period started: $pkg")
                }
            }
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                val source = event.source ?: return
                if (isTextField(source)) {
                    AccessibilityBridge.focusedNode = source
                }
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                val subtypes = event.contentChangeTypes
                val isText = (subtypes and AccessibilityEvent.CONTENT_CHANGE_TYPE_TEXT) != 0
                if (!isText) return

                // Only act when we have no currently tracked node
                if (AccessibilityBridge.focusedNode != null) return

                val foundNode = findFocusedInputFromWindows()

                if (foundNode != null && isTextField(foundNode)) {
                    cancelPendingHide()
                    AccessibilityBridge.focusedNode = foundNode
                    val pkg = event.packageName?.toString() ?: ""
                    AccessibilityBridge.notifyFocusChanged(true, pkg)
                    startFocusPolling()
                    Log.d(TAG, "Content-change focus recovery: $pkg")
                } else {
                    try { foundNode?.recycle() } catch (_: Exception) {}
                }
            }
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val existing = AccessibilityBridge.focusedNode
                if (existing != null) {
                    val stillValid = try { existing.refresh() } catch (_: Exception) { false }
                    if (!stillValid) {
                        AccessibilityBridge.focusedNode = null
                        stopFocusPolling()
                        val pkg = event.packageName?.toString() ?: ""
                        scheduleHide(pkg)
                        Log.d(TAG, "Window changed, node stale, grace period: $pkg")
                    }
                }
            }
        }
    }

    protected open fun findFocusedInputFromWindows(): AccessibilityNodeInfo? {
        return try {
            windows?.firstNotNullOfOrNull { window ->
                window.root?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
            }
        } catch (e: Exception) {
            Log.w(TAG, "findFocus failed: ${e.message}")
            null
        }
    }

    override fun onInterrupt() {
        // no-op
    }

    private fun isTextField(node: AccessibilityNodeInfo): Boolean {
        val actions = node.actionList
        for (action in actions) {
            if (action.id == AccessibilityNodeInfo.ACTION_SET_TEXT) {
                return true
            }
        }
        val className = node.className?.toString() ?: ""
        if (className.contains("EditText")) {
            return true
        }
        if (node.isEditable) {
            return true
        }
        return false
    }
}
