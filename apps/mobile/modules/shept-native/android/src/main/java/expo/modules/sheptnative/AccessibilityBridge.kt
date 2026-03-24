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
    var isStreaming: Boolean = false

    @Volatile
    var focusedNode: AccessibilityNodeInfo? = null
        @Synchronized set(value) {
            val old = field
            field = value
            if (old != null && old != value) {
                try { old.recycle() } catch (_: Exception) {}
            }
        }

    private val observers = mutableListOf<FocusObserver>()

    // Streaming partial text state
    private var partialStartOffset: Int = 0
    private var partialLength: Int = 0
    private var lastPartialText: String = ""
    private var partialInjectionDisabled: Boolean = false

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
        val snapshot = ArrayList(observers)
        for (observer in snapshot) {
            observer.onFocusChanged(hasFocus, packageName)
        }
    }

    fun beginStreamingSession() {
        val node = focusedNode ?: run {
            partialStartOffset = 0
            partialLength = 0
            lastPartialText = ""
            partialInjectionDisabled = false
            return
        }
        val sel = node.textSelectionEnd
        partialStartOffset = if (sel < 0) 0 else sel
        partialLength = 0
        lastPartialText = ""
        partialInjectionDisabled = false
        isStreaming = true
        Log.d(TAG, "Streaming session started at offset $partialStartOffset")
    }

    fun updatePartialText(text: String) {
        if (partialInjectionDisabled) return
        val node = focusedNode ?: return

        val existing = node.text?.toString() ?: ""

        // Safety check: verify last partial still matches
        if (partialLength > 0) {
            val end = (partialStartOffset + partialLength).coerceAtMost(existing.length)
            val start = partialStartOffset.coerceAtMost(end)
            val currentSlice = existing.substring(start, end)
            if (currentSlice != lastPartialText) {
                Log.w(TAG, "Field text changed externally, disabling partial injection")
                partialInjectionDisabled = true
                return
            }
        }

        // Build merged text: prefix + new partial + suffix
        val safeStart = partialStartOffset.coerceAtMost(existing.length)
        val safeEnd = (partialStartOffset + partialLength).coerceAtMost(existing.length)
        val prefix = existing.substring(0, safeStart)
        val suffix = existing.substring(safeEnd)
        val merged = prefix + text + suffix

        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, merged)
        }
        if (!node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
            Log.w(TAG, "ACTION_SET_TEXT failed during streaming, disabling partial injection")
            partialInjectionDisabled = true
            return
        }

        // Restore cursor position
        val cursorPos = partialStartOffset + text.length
        val selArgs = Bundle().apply {
            putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, cursorPos)
            putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, cursorPos)
        }
        node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, selArgs)

        partialLength = text.length
        lastPartialText = text
    }

    fun commitPartialText(finalText: String) {
        if (partialInjectionDisabled) {
            // Fall back to injectText for the final text
            injectText(finalText)
        } else {
            updatePartialText(finalText)
        }
        // Reset streaming state
        partialStartOffset = 0
        partialLength = 0
        lastPartialText = ""
        partialInjectionDisabled = false
        isStreaming = false
    }

    @Synchronized
    fun injectText(text: String): Boolean {
        val node = focusedNode ?: return false

        if (!node.refresh()) {
            Log.w(TAG, "Focused node is stale")
            focusedNode = null
            return false
        }

        // Primary: ACTION_PASTE inserts at cursor naturally
        val pasteResult = try {
            val ctx = clipboardContext
            if (ctx != null) {
                val clipboard = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val oldClip = clipboard.primaryClip
                clipboard.setPrimaryClip(ClipData.newPlainText("shept", text))
                val pasted = node.performAction(AccessibilityNodeInfo.ACTION_PASTE)
                if (oldClip != null) clipboard.setPrimaryClip(oldClip)
                else clipboard.clearPrimaryClip()
                if (pasted) Log.d(TAG, "Injected text via ACTION_PASTE")
                pasted
            } else false
        } catch (e: Exception) {
            Log.e(TAG, "Paste failed", e)
            false
        }

        if (pasteResult) return true

        // Fallback: ACTION_SET_TEXT with manual cursor-position merge
        val existing = node.text?.toString() ?: ""
        val selStart = node.textSelectionStart.coerceIn(0, existing.length)
        val selEnd = node.textSelectionEnd.coerceIn(selStart, existing.length)
        val merged = existing.substring(0, selStart) + text + existing.substring(selEnd)

        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, merged)
        }
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
            Log.d(TAG, "Injected text via ACTION_SET_TEXT (merged)")
            val newCursorPos = selStart + text.length
            val selArgs = Bundle().apply {
                putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, newCursorPos)
                putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, newCursorPos)
            }
            node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, selArgs)
            return true
        }

        Log.w(TAG, "Both ACTION_PASTE and ACTION_SET_TEXT failed")
        return false
    }

    @Volatile
    var clipboardContext: Context? = null
}
