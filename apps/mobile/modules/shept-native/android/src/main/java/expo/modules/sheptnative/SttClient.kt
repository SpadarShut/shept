package expo.modules.sheptnative

import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File
import java.net.UnknownHostException
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

class SttException(message: String, val httpCode: Int = 0) : Exception(message)

object SttClient {

    private const val TAG = "SttClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    fun transcribe(file: File, apiKey: String, language: String): String {
        val mediaType = if (file.extension == "ogg") {
            "audio/ogg".toMediaType()
        } else {
            "audio/3gpp".toMediaType()
        }

        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", file.name, file.asRequestBody(mediaType))
            .addFormDataPart("model_id", "scribe_v2")
            .addFormDataPart("language_code", language)
            .addFormDataPart("tag_audio_events", "false")
            .build()

        val request = Request.Builder()
            .url("https://api.elevenlabs.io/v1/speech-to-text")
            .header("xi-api-key", apiKey)
            .post(body)
            .build()

        val response = try {
            client.newCall(request).execute()
        } catch (e: UnknownHostException) {
            throw SttException("No network connection")
        } catch (e: SocketTimeoutException) {
            throw SttException("No network connection")
        }
        val responseBody = response.body?.string() ?: throw SttException("Empty response from ElevenLabs")

        if (!response.isSuccessful) {
            Log.e(TAG, "ElevenLabs error ${response.code}: $responseBody")
            throw SttException("ElevenLabs STT failed with code ${response.code}", response.code)
        }

        val json = JSONObject(responseBody)
        return json.getString("text")
    }
}
