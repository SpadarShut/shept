package expo.modules.sheptnative

import android.content.Context
import android.os.Build
import android.util.Log
import android.view.inputmethod.InputMethodManager

object KeyboardLanguageDetector {

    private const val TAG = "KeyboardLangDetector"

    fun detectCurrentLanguage(context: Context): String? {
        return try {
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                ?: return null
            val subtype = imm.currentInputMethodSubtype ?: return null

            val languageTag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                subtype.languageTag.ifEmpty { @Suppress("DEPRECATION") subtype.locale }
            } else {
                @Suppress("DEPRECATION")
                subtype.locale
            }

            if (languageTag.isNullOrEmpty()) return null

            val primary = languageTag.split('-', '_').firstOrNull()?.lowercase()
            if (primary.isNullOrEmpty() || primary.length < 2) return null

            Log.d(TAG, "Detected keyboard language: $primary (raw: $languageTag)")
            primary
        } catch (e: Exception) {
            Log.w(TAG, "Keyboard language detection failed", e)
            null
        }
    }
}
