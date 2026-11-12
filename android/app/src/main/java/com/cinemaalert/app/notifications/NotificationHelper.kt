package com.cinemaalert.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.cinemaalert.app.MainActivity

class NotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_SHOWS = "cinema_shows_channel"
        const val CHANNEL_SEATS = "cinema_seats_channel"
        const val CHANNEL_SYSTEM = "cinema_system_channel"
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val showsChannel = NotificationChannel(
                CHANNEL_SHOWS,
                "New Show Releases",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent alerts when newly opened shows become bookable."
                enableVibration(true)
            }

            val seatsChannel = NotificationChannel(
                CHANNEL_SEATS,
                "Seat Availability Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Immediate alerts when previously sold-out or blocked seats open up."
                enableVibration(true)
            }

            val systemChannel = NotificationChannel(
                CHANNEL_SYSTEM,
                "Background Radar Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing status of the background monitoring radar."
            }

            notificationManager.createNotificationChannel(showsChannel)
            notificationManager.createNotificationChannel(seatsChannel)
            notificationManager.createNotificationChannel(systemChannel)
        }
    }

    fun sendShowReleaseAlert(title: String, body: String, bookingUrl: String?) {
        val intent = if (!bookingUrl.isNullOrEmpty()) {
            Intent(Intent.ACTION_VIEW, Uri.parse(bookingUrl))
        } else {
            Intent(context, MainActivity::class.java)
        }

        val pendingIntent = PendingIntent.getActivity(
            context, System.currentTimeMillis().toInt(), intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_SHOWS)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_view, "View booking", pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    fun sendSeatAvailabilityAlert(title: String, body: String, bookingUrl: String?, seatsCount: Int) {
        val intent = if (!bookingUrl.isNullOrEmpty()) {
            Intent(Intent.ACTION_VIEW, Uri.parse(bookingUrl))
        } else {
            Intent(context, MainActivity::class.java)
        }

        val pendingIntent = PendingIntent.getActivity(
            context, System.currentTimeMillis().toInt(), intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_SEATS)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSmallIcon(android.R.drawable.btn_star_big_on)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_agenda, "Book now", pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
