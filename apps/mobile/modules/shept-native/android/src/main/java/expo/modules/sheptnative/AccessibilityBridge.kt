package expo.modules.sheptnative

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import android.os.Bundle

object AccessibilityBridge {

    private const val TAG = "AccessibilityBridge"

    interface FocusObserver {
        fun onFocusChanged(hasFocus: Boolean, packageName: String)
    }

    @Volatile
    var isServiceRunning: Boolean = false

    @Volatile
    var focusedNode: AccessibilityNodeInfo? = null
        @Synchronized set

    private val observers = mutableListOf<FocusObserver>()

    @Synchronized
    fun addObserver(observer: FocusObserver) {
        observers.add(observer)
    }

    @Synchronized
    fun removeObserver(observer: FocusObserver) {
        observers.remove(observer)
    }

    @Synchronized
    fun notifyFocusChanged(hasFocus: Boolean, packageName: String) {
        for (observer in observers) {
            observer.onFocusChanged(hasFocus, packageName)
        }
    }

    fun injectText(text: String): Boolean {
        val node = focusedNode ?: return false

        if (!node.refresh()) {
            Log.w(TAG, "Focused node is stale")
            focusedNode = null
            return false
        }

        // Try ACTION_SET_TEXT first
        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
            Log.d(TAG, "Injected text via ACTION_SET_TEXT")
            return true
        }

        // Fallback: ACTION_PASTE via clipboard
        return try {
            val ctx = clipboardContext ?: run {
                Log.e(TAG, "No context for clipboard fallback")
                return false
            }
            val clipboard = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("shept", text))
            if (node.performAction(AccessibilityNodeInfo.ACTION_PASTE)) {
                Log.d(TAG, "Injected text via ACTION_PASTE")
                true
            } else {
                Log.w(TAG, "Both ACTION_SET_TEXT and ACTION_PASTE failed")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Paste fallback failed", e)
            false
        }
    }

    @Volatile
    var clipboardContext: Context? = null
}
