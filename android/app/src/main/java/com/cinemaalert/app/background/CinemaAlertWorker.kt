package com.cinemaalert.app.background

import android.content.Context
import android.util.Log
import androidx.work.*
import com.cinemaalert.app.data.AppDatabase
import com.cinemaalert.app.notifications.NotificationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

/**
 * CinemaAlertWorker: Periodic Background Worker using Android Jetpack WorkManager.
 *
 * Runs automatically when app is minimized, screen is locked, or phone is idle.
 * Enforces NetworkType.CONNECTED so no checks run without active internet.
 */
class CinemaAlertWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val TAG = "CinemaAlertWorker"
        const val UNIQUE_WORK_NAME = "cinema_alert_periodic_work"

        /**
         * Schedules periodic background monitoring according to user frequency preference.
         * Enforces Android's minimum WorkManager interval of 15 minutes.
         */
        fun schedule(context: Context, intervalMinutes: Long = 15) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(false)
                .build()

            val periodicRequest = PeriodicWorkRequestBuilder<CinemaAlertWorker>(
                intervalMinutes.coerceAtLeast(15), TimeUnit.MINUTES,
                5, TimeUnit.MINUTES // 5-minute flex window
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .addTag(TAG)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                periodicRequest
            )
            Log.d(TAG, "Scheduled periodic background radar every $intervalMinutes minutes.")
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_WORK_NAME)
            Log.d(TAG, "Cancelled periodic background monitoring.")
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.d(TAG, "Executing background cinema radar check...")
        val db = AppDatabase.getInstance(context)
        val trackerDao = db.trackerDao()

        val activeTrackers = trackerDao.getActiveTrackers()
        if (activeTrackers.isEmpty()) {
            Log.d(TAG, "No active cinema trackers configured. Skipping cycle.")
            return@withContext Result.success()
        }

        val notificationHelper = NotificationHelper(context)

        for (tracker in activeTrackers) {
            try {
                // Query booking providers for BookMyShow and District
                // Compare new shows and seat availability snapshots
                Log.d(TAG, "Checking shows for: ${tracker.movieName} in ${tracker.city}")

                // Update lastChecked timestamp
                trackerDao.updateLastChecked(tracker.id, System.currentTimeMillis())
            } catch (e: Exception) {
                Log.e(TAG, "Error checking tracker ${tracker.id}: ${e.message}", e)
            }
        }

        Result.success()
    }
}
