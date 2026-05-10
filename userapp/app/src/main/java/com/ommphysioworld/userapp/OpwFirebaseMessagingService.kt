package com.ommphysioworld.userapp

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.ommphysioworld.userapp.data.ApiException
import com.ommphysioworld.userapp.data.AppApiService
import com.ommphysioworld.userapp.data.AppStorage
import com.ommphysioworld.userapp.data.string
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

internal const val OPW_PUSH_CHANNEL_ID = "opw_patient_alerts"
private const val OPW_FCM_LOG_TAG = "OPW_FCM"

class OpwFirebaseMessagingService : FirebaseMessagingService() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(OPW_FCM_LOG_TAG, "New FCM token received.")
        val storage = AppStorage(applicationContext)
        storage.saveFcmToken(token)
        val patientId = storage.getPatientUser().string("patientId")
        if (patientId.isBlank()) {
            Log.i(OPW_FCM_LOG_TAG, "FCM token saved locally; patient session is not available yet.")
            return
        }

        serviceScope.launch {
            val result = runCatching {
                AppApiService(storage).registerDeviceToken(patientId, token)
            }
            Log.i(OPW_FCM_LOG_TAG, "FCM token registration result: ${result.isSuccess}.")
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.i(
            OPW_FCM_LOG_TAG,
            "FCM message received. from=${message.from.orEmpty()} dataKeys=${message.data.keys.joinToString()}",
        )
        val title = message.notification?.title
            ?: message.data["title"]
            ?: "OPW update"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: "You have a new update from Omm Physio World."
        val notificationId = message.data["notificationId"].orEmpty().ifBlank {
            System.currentTimeMillis().toString()
        }
        val storage = AppStorage(applicationContext)
        val patientId = message.data["patientId"].orEmpty().ifBlank {
            storage.getPatientUser().string("patientId")
        }

        if (patientId.isNotBlank() && notificationId in storage.getShownSystemNotificationIds(patientId)) {
            Log.i(OPW_FCM_LOG_TAG, "FCM notification already shown. id=$notificationId")
            return
        }

        showOpwPushNotification(
            context = applicationContext,
            title = title,
            body = body,
            notificationId = notificationId,
            unreadCount = message.data["badge"]?.toIntOrNull() ?: 1,
        )
        if (patientId.isNotBlank()) {
            val shownIds = storage.getShownSystemNotificationIds(patientId).toMutableSet()
            shownIds += notificationId
            storage.saveShownSystemNotificationIds(patientId, shownIds.toList().takeLast(200).toSet())
        }
        Log.i(OPW_FCM_LOG_TAG, "System notification requested for id=$notificationId.")
    }
}

internal fun ensureOpwPushChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return
    }

    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val channel = NotificationChannel(
        OPW_PUSH_CHANNEL_ID,
        "OPW patient updates",
        NotificationManager.IMPORTANCE_HIGH,
    ).apply {
        description = "Appointment, treatment, therapy, payment, and OPW custom updates."
        setShowBadge(true)
        enableVibration(true)
    }
    manager.createNotificationChannel(channel)
}

@Suppress("MissingPermission")
internal fun showOpwPushNotification(
    context: Context,
    title: String,
    body: String,
    notificationId: String,
    unreadCount: Int = 1,
) {
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
        return
    }

    ensureOpwPushChannel(context)
    val intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val pendingIntent = PendingIntent.getActivity(
        context,
        1001,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val largeIcon = BitmapFactory.decodeResource(context.resources, R.drawable.opw_notification_large)
    val notification = NotificationCompat.Builder(context, OPW_PUSH_CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_stat_opw)
        .setLargeIcon(largeIcon)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .setNumber(unreadCount)
        .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
        .setCategory(NotificationCompat.CATEGORY_REMINDER)
        .setDefaults(NotificationCompat.DEFAULT_ALL)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .build()

    NotificationManagerCompat.from(context).notify(notificationId.hashCode(), notification)
}

internal fun syncFcmTokenWithServer(
    context: Context,
    storage: AppStorage,
    apiService: AppApiService,
    patientId: String,
) {
    if (patientId.isBlank()) {
        return
    }

    com.google.firebase.messaging.FirebaseMessaging.getInstance().token
        .addOnSuccessListener { token ->
            if (token.isBlank()) {
                return@addOnSuccessListener
            }
            storage.saveFcmToken(token)
            CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
                try {
                    apiService.registerDeviceToken(patientId, token)
                } catch (_: ApiException) {
                    // The token is saved locally and will be retried next app open.
                } catch (_: Exception) {
                    // Network may be unavailable; retry happens during the next dashboard sync.
                }
            }
        }
        .addOnFailureListener {
            val savedToken = storage.getFcmToken()
            if (savedToken.isNotBlank()) {
                CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
                    runCatching { apiService.registerDeviceToken(patientId, savedToken) }
                }
            }
        }
}
