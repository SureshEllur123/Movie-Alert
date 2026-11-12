package com.cinemaalert.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.cinemaalert.app.background.CinemaAlertWorker

/**
 * BootReceiver: Restores scheduled WorkManager tasks when device restarts.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            Log.d("BootReceiver", "Device reboot detected. Rescheduling Cinema Alert background worker...")
            CinemaAlertWorker.schedule(context, intervalMinutes = 15)
        }
    }
}
