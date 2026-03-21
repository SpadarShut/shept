package expo.modules.sheptnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SheptNativeModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

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

  override fun definition() = ModuleDefinition {
    Name("SheptNative")

    // --- Permission checks ---

    Function("isOverlayPermissionGranted") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        return@Function Settings.canDrawOverlays(context)
      }
      return@Function true
    }

    Function("requestOverlayPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    Function("isAccessibilityEnabled") {
      val serviceName = "${context.packageName}/expo.modules.sheptnative.SheptAccessibilityService"
      val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: ""
      val colonSplitter = TextUtils.SimpleStringSplitter(':')
      colonSplitter.setString(enabledServices)
      while (colonSplitter.hasNext()) {
        val componentName = colonSplitter.next()
        if (ComponentName.unflattenFromString(componentName)?.flattenToString() == serviceName) {
          return@Function true
        }
      }
      return@Function false
    }

    Function("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("isNotificationPermissionGranted") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        return@Function context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
          android.content.pm.PackageManager.PERMISSION_GRANTED
      }
      return@Function true
    }

    // --- Settings persistence ---

    Function("saveSettings") { json: String ->
      prefs.edit().putString("data", json).apply()
    }

    Function("getSettings") {
      return@Function prefs.getString("data", null)
    }

    // --- Service control ---

    Function("startOverlay") {
      val intent = Intent(context, OverlayService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    Function("stopOverlay") {
      context.stopService(Intent(context, OverlayService::class.java))
    }

    Function("getServiceStatus") {
      return@Function OverlayService.currentStatus
    }

    Function("getLastTranscription") {
      return@Function OverlayService.lastTranscription
    }

    Function("injectText") { text: String ->
      return@Function AccessibilityBridge.injectText(text)
    }
  }
}
