package expo.modules.sheptnative

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import org.json.JSONObject

class ConfigReader(
  private val context: Context,
  prefsOverride: SharedPreferences? = null
) {
  companion object {
    private const val TAG = "ConfigReader"
    private const val PREFS_NAME = "shept_settings"

    @Volatile
    private var sharedInstance: SharedPreferences? = null

    fun getSharedPrefs(context: Context): SharedPreferences {
      sharedInstance?.let { return it }
      synchronized(this) {
        sharedInstance?.let { return it }
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        return EncryptedSharedPreferences.create(
          PREFS_NAME,
          masterKeyAlias,
          context.applicationContext,
          EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
          EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        ).also { sharedInstance = it }
      }
    }

  }

  private var prefs: SharedPreferences? = prefsOverride

  private fun getPrefs(): SharedPreferences? {
    prefs?.let { return it }
    return try {
      getSharedPrefs(context).also { prefs = it }
    } catch (e: Exception) {
      Log.w(TAG, "EncryptedSharedPreferences corrupted, resetting", e)
      try { context.deleteSharedPreferences(PREFS_NAME) } catch (_: Exception) {}
      try {
        sharedInstance = null
        getSharedPrefs(context).also { prefs = it }
      } catch (e2: Exception) {
        Log.e(TAG, "Failed to recreate EncryptedSharedPreferences", e2)
        null
      }
    }
  }

  private fun getJson(): JSONObject? {
    val p = getPrefs() ?: return null
    return try {
      val raw = p.getString("data", null) ?: return null
      JSONObject(raw)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to read config", e)
      try { p.edit().clear().apply() } catch (_: Exception) {}
      prefs = null
      null
    }
  }

  fun getApiKey(): String {
    return getJson()?.optString("elevenLabsApiKey", "") ?: ""
  }

  fun getLanguages(): List<String> {
    val json = getJson() ?: return emptyList()
    val arr = json.optJSONArray("languages") ?: return emptyList()
    val result = mutableListOf<String>()
    for (i in 0 until arr.length()) {
      result.add(arr.getString(i))
    }
    return result
  }

  fun getPrimaryLanguage(): String {
    return getJson()?.optString("primaryLanguage", "") ?: ""
  }

  fun getRealtimeMode(): Boolean {
    return getJson()?.optBoolean("realtimeMode", true) ?: true
  }
}
