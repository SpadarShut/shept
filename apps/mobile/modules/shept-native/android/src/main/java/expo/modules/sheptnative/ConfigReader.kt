package expo.modules.sheptnative

import android.content.Context
import org.json.JSONObject

class ConfigReader(private val context: Context) {
  private val prefs
    get() = context.getSharedPreferences("shept_settings", Context.MODE_PRIVATE)

  private fun getJson(): JSONObject? {
    val raw = prefs.getString("data", null) ?: return null
    return try {
      JSONObject(raw)
    } catch (e: Exception) {
      null
    }
  }

  fun getProvider(): String {
    return getJson()?.optString("sttProvider", "elevenlabs") ?: "elevenlabs"
  }

  fun getApiKey(): String {
    val json = getJson() ?: return ""
    val provider = json.optString("sttProvider", "elevenlabs")
    return if (provider == "google") {
      json.optString("googleCloudApiKey", "")
    } else {
      json.optString("elevenLabsApiKey", "")
    }
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
}
