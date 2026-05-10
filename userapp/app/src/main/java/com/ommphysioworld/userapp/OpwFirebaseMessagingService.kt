package com.ommphysioworld.userapp

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
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

internal const val OPW_PUSH_CHANNEL_ID = "opw_patient_updates"

class OpwFirebaseMessagingService : FirebaseMessagingService() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val storage = AppStorage(applicationContext)
        storage.saveFcmToken(token)
        val patientId = storage.getPatientUser().string("patientId")
        if (patientId.isBlank()) {
            return
        }

        serviceScope.launch {
            runCatching {
                AppApiService(storage).registerDeviceToken(patientId, token)
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title
            ?: message.data["title"]
            ?: "OPW update"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: "You have a new update from Omm Physio World."
        val notificationId = message.data["notificationId"].orEmpty().ifBlank {
            System.currentTimeMillis().toString()
        }

        showOpwPushNotification(
            context = applicationContext,
            title = title,
            body = body,
            notificationId = notificationId,
            unreadCount = message.data["badge"]?.toIntOrNull() ?: 1,
        )
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
        NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
        description = "Appointment, treatment, therapy, payment, and OPW custom updates."
        setShowBadge(true)
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
    val notification = NotificationCompat.Builder(context, OPW_PUSH_CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_launcher_foreground)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .setNumber(unreadCount)
        .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
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
