package expo.modules.sheptnative

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class SheptAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SheptA11yService"
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        AccessibilityBridge.isServiceRunning = true
        AccessibilityBridge.clipboardContext = applicationContext
        Log.d(TAG, "Accessibility service connected")
    }

    override fun onDestroy() {
        super.onDestroy()
        AccessibilityBridge.isServiceRunning = false
        AccessibilityBridge.focusedNode = null
        AccessibilityBridge.clipboardContext = null
        Log.d(TAG, "Accessibility service destroyed")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) {
            return
        }

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_FOCUSED,
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                val source = event.source ?: return
                if (isTextField(source)) {
                    AccessibilityBridge.focusedNode = source
                    val pkg = event.packageName?.toString() ?: ""
                    AccessibilityBridge.notifyFocusChanged(true, pkg)
                    Log.d(TAG, "Text field focused in: $pkg")
                }
            }
        }
    }

    override fun onInterrupt() {
        // no-op
    }

    private fun isTextField(node: AccessibilityNodeInfo): Boolean {
        // Check if node supports ACTION_SET_TEXT
        val actions = node.actionList
        for (action in actions) {
            if (action.id == AccessibilityNodeInfo.ACTION_SET_TEXT) {
                return true
            }
        }
        // Fallback: check class name for EditText
        val className = node.className?.toString() ?: ""
        if (className.contains("EditText")) {
            return true
        }
        return false
    }
}
