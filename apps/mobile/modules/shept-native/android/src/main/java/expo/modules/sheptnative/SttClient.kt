package expo.modules.sheptnative

import android.util.Base64
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

object SttClient {

    private const val TAG = "SttClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val googleLanguageMap = mapOf(
        "en" to "en-US",
        "be" to "be-BY",
        "ru" to "ru-RU",
        "uk" to "uk-UA",
        "pl" to "pl-PL",
        "de" to "de-DE",
        "fr" to "fr-FR",
        "es" to "es-ES",
        "it" to "it-IT",
        "pt" to "pt-PT",
        "ja" to "ja-JP",
        "zh" to "zh-CN",
        "ko" to "ko-KR",
        "ar" to "ar-SA",
        "hi" to "hi-IN",
        "tr" to "tr-TR",
        "nl" to "nl-NL",
        "sv" to "sv-SE",
        "cs" to "cs-CZ",
        "da" to "da-DK",
        "fi" to "fi-FI",
        "el" to "el-GR",
        "he" to "he-IL",
        "hu" to "hu-HU",
        "no" to "no-NO",
        "ro" to "ro-RO",
        "sk" to "sk-SK",
        "th" to "th-TH",
        "vi" to "vi-VN"
    )

    fun toGoogleLanguageCode(lang: String): String {
        return googleLanguageMap[lang] ?: "$lang-${lang.uppercase()}"
    }

    fun transcribe(file: File, provider: String, apiKey: String, language: String): String {
        return if (provider == "google") {
            transcribeGoogle(file, apiKey, language)
        } else {
            transcribeElevenLabs(file, apiKey, language)
        }
    }

    private fun transcribeElevenLabs(file: File, apiKey: String, language: String): String {
        val mediaType = if (file.extension == "ogg") {
            "audio/ogg".toMediaType()
        } else {
            "audio/3gpp".toMediaType()
        }

        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", file.name, file.asRequestBody(mediaType))
            .addFormDataPart("model_id", "scribe_v1")
            .addFormDataPart("language_code", language)
            .build()

        val request = Request.Builder()
            .url("https://api.elevenlabs.io/v1/speech-to-text")
            .header("xi-api-key", apiKey)
            .post(body)
            .build()

        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Empty response from ElevenLabs")

        if (!response.isSuccessful) {
            Log.e(TAG, "ElevenLabs error ${response.code}: $responseBody")
            throw Exception("ElevenLabs STT failed with code ${response.code}")
        }

        val json = JSONObject(responseBody)
        return json.getString("text")
    }

    private fun transcribeGoogle(file: File, apiKey: String, language: String): String {
        val audioBytes = file.readBytes()
        val audioBase64 = Base64.encodeToString(audioBytes, Base64.NO_WRAP)
        val googleLang = toGoogleLanguageCode(language)

        val encoding = if (file.extension == "ogg") { "OGG_OPUS" } else { "AMR" }
        val sampleRate = if (file.extension == "ogg") { 48000 } else { 8000 }

        val jsonBody = JSONObject().apply {
            put("config", JSONObject().apply {
                put("encoding", encoding)
                put("sampleRateHertz", sampleRate)
                put("languageCode", googleLang)
            })
            put("audio", JSONObject().apply {
                put("content", audioBase64)
            })
        }

        val request = Request.Builder()
            .url("https://speech.googleapis.com/v1/speech:recognize?key=$apiKey")
            .header("Content-Type", "application/json")
            .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Empty response from Google STT")

        if (!response.isSuccessful) {
            Log.e(TAG, "Google STT error ${response.code}: $responseBody")
            throw Exception("Google STT failed with code ${response.code}")
        }

        val json = JSONObject(responseBody)
        val results = json.optJSONArray("results")
        if (results == null || results.length() == 0) {
            return ""
        }

        val alternatives = results.getJSONObject(0).optJSONArray("alternatives")
        if (alternatives == null || alternatives.length() == 0) {
            return ""
        }

        return alternatives.getJSONObject(0).getString("transcript")
    }
}
