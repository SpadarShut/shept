package expo.modules.sheptnative

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import org.json.JSONObject

class ConfigReader(private val context: Context) {
  private val prefs by lazy {
    val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    EncryptedSharedPreferences.create(
      "shept_settings",
      masterKeyAlias,
      context,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
  }

  private fun getJson(): JSONObject? {
    val raw = prefs.getString("data", null) ?: return null
    return try {
      JSONObject(raw)
    } catch (e: Exception) {
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
