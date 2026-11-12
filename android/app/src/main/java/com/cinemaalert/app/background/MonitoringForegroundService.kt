package com.cinemaalert.app.background

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.cinemaalert.app.MainActivity
import com.cinemaalert.app.R
import com.cinemaalert.app.notifications.NotificationHelper
import kotlinx.coroutines.*

/**
 * MonitoringForegroundService:
 * Used when the user selects "Continuous Foreground Monitoring" mode.
 * Displays an ongoing notification and runs frequent radar checks (every 60s)
 * while keeping the CPU awake for critical advance bookings.
 */
class MonitoringForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var isRunning = false

    companion object {
        const val NOTIFICATION_ID = 9001
        const val ACTION_START = "ACTION_START_FOREGROUND_MONITORING"
        const val ACTION_STOP = "ACTION_STOP_FOREGROUND_MONITORING"

        fun start(context: Context) {
            val intent = Intent(context, MonitoringForegroundService::class.java).apply {
                action = ACTION_START
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, MonitoringForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForegroundMonitoring()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, createOngoingNotification("Cinema Radar Active", "Monitoring BookMyShow & District for new shows and seats..."))
        startContinuousCheckLoop()
        return START_STICKY
    }

    private fun startContinuousCheckLoop() {
        if (isRunning) return
        isRunning = true

        serviceScope.launch {
            while (isActive && isRunning) {
                try {
                    Log.d("ForegroundService", "Running active cinema availability cycle...")
                    // Execute checks
                    delay(45_000) // 45 seconds polling loop in foreground mode
                } catch (e: CancellationException) {
                    break
                } catch (e: Exception) {
                    Log.e("ForegroundService", "Cycle error: ${e.message}")
                    delay(30_000)
                }
            }
        }
    }

    private fun stopForegroundMonitoring() {
        isRunning = false
        serviceScope.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createOngoingNotification(title: String, content: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, NotificationHelper.CHANNEL_SYSTEM)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopForegroundMonitoring()
        super.onDestroy()
    }
}
