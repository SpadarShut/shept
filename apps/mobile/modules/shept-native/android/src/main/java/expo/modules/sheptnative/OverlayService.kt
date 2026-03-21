package expo.modules.sheptnative

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.GradientDrawable
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.widget.Toast
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.ProgressBar
import androidx.core.app.NotificationCompat
import java.io.File

class OverlayService : Service(), AccessibilityBridge.FocusObserver {

    companion object {
        private const val TAG = "OverlayService"
        private const val CHANNEL_ID = "shept_service"
        private const val NOTIFICATION_ID = 1
        private const val SNOOZE_DURATION_MS = 10L * 60 * 1000 // 10 minutes

        @Volatile
        var currentStatus: String = "idle"

        @Volatile
        var lastTranscription: String = ""
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var dismissZoneView: View? = null
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null

    private var micButton: ImageView? = null
    private var loadingSpinner: ProgressBar? = null

    private var snoozed = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var configReader: ConfigReader
    private var snoozeRunnable: Runnable? = null

    // Drag state
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private var isOverDismissZone = false

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        configReader = ConfigReader(this)
        AccessibilityBridge.addObserver(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        showForegroundNotification()
        if (overlayView == null) {
            createOverlayButton()
        }
        currentStatus = "idle"
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        AccessibilityBridge.removeObserver(this)
        snoozeRunnable?.let { mainHandler.removeCallbacks(it) }
        if (currentStatus == "recording") {
            stopRecording()
        }
        removeOverlay()
        removeDismissZone()
        currentStatus = "idle"
    }

    override fun onFocusChanged(hasFocus: Boolean, packageName: String) {
        if (hasFocus) {
            Log.d(TAG, "Text field focused in: $packageName")
            if (!snoozed) {
                mainHandler.post { overlayView?.visibility = View.VISIBLE }
            }
        } else {
            Log.d(TAG, "Text field focus lost")
            if (currentStatus == "idle") {
                mainHandler.post { overlayView?.visibility = View.GONE }
            }
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Shept Voice Service",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps the floating mic button active"
        }
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(channel)
    }

    private fun showForegroundNotification() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Shept is ready")
            .setContentText("Tap the floating mic to record")
            .setSmallIcon(R.drawable.ic_mic)
            .setOngoing(true)
            .build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun createOverlayButton() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val inflater = LayoutInflater.from(this)
        overlayView = inflater.inflate(R.layout.overlay_button, null)

        micButton = overlayView?.findViewById(R.id.mic_button)
        loadingSpinner = overlayView?.findViewById(R.id.loading_spinner)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 300
        }

        applyIdleStyle()
        overlayView?.visibility = View.GONE

        overlayView?.setOnTouchListener { view, event ->
            val screenHeight = resources.displayMetrics.heightPixels
            val dismissThreshold = screenHeight - 200 // bottom 200px is dismiss zone

            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    isOverDismissZone = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        if (!isDragging) {
                            isDragging = true
                            showDismissZone()
                        }
                    }
                    params.x = initialX + dx
                    params.y = initialY + dy
                    windowManager?.updateViewLayout(overlayView, params)

                    // Check if over dismiss zone
                    val nowOverDismiss = event.rawY > dismissThreshold
                    if (nowOverDismiss != isOverDismissZone) {
                        isOverDismissZone = nowOverDismiss
                        updateDismissZoneHighlight(isOverDismissZone)
                        if (isOverDismissZone) {
                            // Scale down the bubble to indicate it will be dismissed
                            overlayView?.scaleX = 0.7f
                            overlayView?.scaleY = 0.7f
                        } else {
                            overlayView?.scaleX = 1f
                            overlayView?.scaleY = 1f
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    hideDismissZone()
                    overlayView?.scaleX = 1f
                    overlayView?.scaleY = 1f

                    if (isOverDismissZone && isDragging) {
                        snoozeOverlay()
                    } else if (!isDragging) {
                        onButtonTap()
                    }
                    true
                }
                else -> false
            }
        }

        windowManager?.addView(overlayView, params)
    }

    private fun onButtonTap() {
        when (currentStatus) {
            "idle" -> {

                startRecording()
            }
            "recording" -> {
                stopRecording()
                applyTranscribingStyle()
                currentStatus = "transcribing"
                val file = outputFile
                if (file == null || !file.exists()) {
                    Log.e(TAG, "No recording file available for STT")
                    applyIdleStyle()
                    currentStatus = "idle"

                    return
                }
                Thread {
                    try {
                        val provider = configReader.getProvider()
                        val apiKey = configReader.getApiKey()
                        val language = configReader.getPrimaryLanguage().ifEmpty { "en" }
                        if (apiKey.isEmpty()) {
                            throw SttException("No API key configured", 0)
                        }
                        Log.d(TAG, "Starting STT: provider=$provider, language=$language")
                        val text = SttClient.transcribe(file, provider, apiKey, language)
                        Log.d(TAG, "STT result: $text")
                        lastTranscription = text
                        if (text.isNotEmpty()) {
                            val injected = AccessibilityBridge.injectText(text)
                            if (!injected) {
                                Log.w(TAG, "No focused input to inject text into")
                            }
                            Log.d(TAG, "Text injection result: $injected")
                        }
                    } catch (e: SttException) {
                        Log.e(TAG, "STT failed", e)
                        val errorMsg = when {
                            e.httpCode == 401 -> "Error: Invalid API key"
                            e.httpCode == 429 -> "Error: Rate limit exceeded"
                            e.message?.contains("No network") == true -> "Error: No network connection"
                            else -> "Error: ${e.message}"
                        }
                        lastTranscription = errorMsg
                        mainHandler.post {
                            Toast.makeText(this@OverlayService, errorMsg, Toast.LENGTH_SHORT).show()
                            flashError()
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "STT failed", e)
                        lastTranscription = "Error: ${e.message}"
                        mainHandler.post {
                            Toast.makeText(this@OverlayService, lastTranscription, Toast.LENGTH_SHORT).show()
                            flashError()
                        }
                    } finally {
                        try {
                            file.delete()
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to delete recording file", e)
                        }
                        overlayView?.post {
                            applyIdleStyle()
                            currentStatus = "idle"
        
                        }
                    }
                }.start()
            }
        }
    }

    private fun flashError() {
        val root = overlayView?.findViewById<View>(R.id.overlay_root) ?: return
        val errorBg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#FF9800"))
        }
        root.background = errorBg
        mainHandler.postDelayed({
            if (currentStatus == "idle") {
                applyIdleStyle()
            }
        }, 600)
    }

    private fun startRecording() {
        try {
            val ext = if (Build.VERSION.SDK_INT >= 29) { "ogg" } else { "3gp" }
            outputFile = File(cacheDir, "shept_recording_${System.currentTimeMillis()}.$ext")

            mediaRecorder = (if (Build.VERSION.SDK_INT >= 31) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }).apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                if (Build.VERSION.SDK_INT >= 29) {
                    setOutputFormat(MediaRecorder.OutputFormat.OGG)
                    setAudioEncoder(MediaRecorder.AudioEncoder.OPUS)
                } else {
                    setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
                }
                setOutputFile(outputFile?.absolutePath)
                prepare()
                start()
            }

            currentStatus = "recording"
            applyRecordingStyle()
            Log.d(TAG, "Recording started: ${outputFile?.absolutePath}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            currentStatus = "idle"
            applyIdleStyle()
        }
    }

    private fun stopRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            Log.d(TAG, "Recording saved: ${outputFile?.absolutePath}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop recording", e)
            mediaRecorder?.release()
            mediaRecorder = null
            outputFile = null
        }
    }

    private fun applyIdleStyle() {
        micButton?.visibility = View.VISIBLE
        loadingSpinner?.visibility = View.GONE
        micButton?.colorFilter = null

        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#333333"))
        }
        overlayView?.findViewById<View>(R.id.overlay_root)?.background = bg
    }

    private fun applyRecordingStyle() {
        micButton?.visibility = View.VISIBLE
        loadingSpinner?.visibility = View.GONE
        micButton?.colorFilter = PorterDuffColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN)

        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#D32F2F"))
        }
        overlayView?.findViewById<View>(R.id.overlay_root)?.background = bg
    }

    private fun applyTranscribingStyle() {
        micButton?.visibility = View.GONE
        loadingSpinner?.visibility = View.VISIBLE

        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#FF9800"))
        }
        overlayView?.findViewById<View>(R.id.overlay_root)?.background = bg
    }

    private fun showDismissZone() {
        if (dismissZoneView != null) return
        val wm = windowManager ?: return

        val inflater = LayoutInflater.from(this)
        dismissZoneView = inflater.inflate(R.layout.dismiss_zone, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM
        }

        dismissZoneView?.alpha = 0f
        wm.addView(dismissZoneView, params)
        dismissZoneView?.animate()?.alpha(1f)?.setDuration(200)?.start()
    }

    private fun hideDismissZone() {
        val view = dismissZoneView ?: return
        view.animate()
            .alpha(0f)
            .setDuration(150)
            .withEndAction { removeDismissZone() }
            .start()
    }

    private fun removeDismissZone() {
        if (dismissZoneView != null) {
            try {
                windowManager?.removeView(dismissZoneView)
            } catch (e: Exception) {
                Log.w(TAG, "Dismiss zone already removed", e)
            }
            dismissZoneView = null
        }
    }

    private fun updateDismissZoneHighlight(highlighted: Boolean) {
        val root = dismissZoneView?.findViewById<View>(R.id.dismiss_zone_root) ?: return
        if (highlighted) {
            root.setBackgroundColor(Color.parseColor("#CCD32F2F"))
        } else {
            root.setBackgroundColor(Color.parseColor("#80000000"))
        }
    }

    private fun snoozeOverlay() {
        Log.d(TAG, "Overlay snoozed for 10 minutes")
        snoozed = true
        overlayView?.visibility = View.GONE

        snoozeRunnable?.let { mainHandler.removeCallbacks(it) }
        snoozeRunnable = Runnable {
            Log.d(TAG, "Snooze ended, overlay visible again")
            snoozed = false
            overlayView?.visibility = View.VISIBLE
        }
        mainHandler.postDelayed(snoozeRunnable!!, SNOOZE_DURATION_MS)
    }

    private fun removeOverlay() {
        if (overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (e: Exception) {
                Log.w(TAG, "Overlay already removed", e)
            }
            overlayView = null
        }
    }
}
