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
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.ProgressBar
import androidx.core.app.NotificationCompat
import java.io.File

class OverlayService : Service() {

    companion object {
        private const val TAG = "OverlayService"
        private const val CHANNEL_ID = "shept_service"
        private const val NOTIFICATION_ID = 1

        @Volatile
        var currentStatus: String = "idle"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null

    private var micButton: ImageView? = null
    private var loadingSpinner: ProgressBar? = null

    // Drag state
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        showForegroundNotification()
        createOverlayButton()
        currentStatus = "idle"
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        if (currentStatus == "recording") {
            stopRecording()
        }
        removeOverlay()
        currentStatus = "idle"
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

        overlayView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isDragging = true
                    }
                    params.x = initialX + dx
                    params.y = initialY + dy
                    windowManager?.updateViewLayout(overlayView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
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
                // Transition to transcribing briefly, then back to idle
                // (STT will be wired in Task 4)
                applyTranscribingStyle()
                currentStatus = "transcribing"
                overlayView?.postDelayed({
                    applyIdleStyle()
                    currentStatus = "idle"
                }, 1000)
            }
        }
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

    private fun removeOverlay() {
        if (overlayView != null) {
            windowManager?.removeView(overlayView)
            overlayView = null
        }
    }
}
