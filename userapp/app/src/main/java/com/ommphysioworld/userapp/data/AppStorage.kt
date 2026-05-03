package com.ommphysioworld.userapp.data

import android.content.Context
import java.time.Instant

class AppStorage(context: Context) {
    private val preferences = context.getSharedPreferences("opw_native_store", Context.MODE_PRIVATE)

    fun shouldShowOnboarding(): Boolean {
        return !preferences.getBoolean(KEY_ONBOARDING_SEEN, false)
    }

    fun setOnboardingSeen() {
        preferences.edit().putBoolean(KEY_ONBOARDING_SEEN, true).apply()
    }

    fun getPatientUser(): JsonMap? {
        val raw = preferences.getString(KEY_PATIENT_USER, "").orEmpty().trim()
        return runCatching { JsonUtils.parseObject(raw) }.getOrNull()
    }

    fun savePatientUser(user: JsonMap) {
        preferences.edit().putString(KEY_PATIENT_USER, JsonUtils.toJsonString(user)).apply()
    }

    fun clearPatientUser() {
        preferences.edit().remove(KEY_PATIENT_USER).apply()
    }

    fun getNotificationsSeenAt(patientId: String): Instant? {
        val normalizedId = patientId.trim()
        if (normalizedId.isEmpty()) {
            return null
        }

        val raw = preferences.getString("$KEY_NOTIFICATIONS_SEEN_PREFIX$normalizedId", "").orEmpty()
        return raw.takeIf { it.isNotBlank() }?.let { runCatching { Instant.parse(it) }.getOrNull() }
    }

    fun saveNotificationsSeenAt(patientId: String, value: Instant) {
        val normalizedId = patientId.trim()
        if (normalizedId.isEmpty()) {
            return
        }

        preferences.edit()
            .putString("$KEY_NOTIFICATIONS_SEEN_PREFIX$normalizedId", value.toString())
            .apply()
    }

    fun getDismissedNotificationIds(patientId: String): Set<String> {
        val normalizedId = patientId.trim()
        if (normalizedId.isEmpty()) {
            return emptySet()
        }

        return preferences.getStringSet("$KEY_DISMISSED_NOTIFICATIONS_PREFIX$normalizedId", emptySet())
            ?.toSet()
            .orEmpty()
    }

    fun saveDismissedNotificationIds(patientId: String, ids: Set<String>) {
        val normalizedId = patientId.trim()
        if (normalizedId.isEmpty()) {
            return
        }

        preferences.edit()
            .putStringSet("$KEY_DISMISSED_NOTIFICATIONS_PREFIX$normalizedId", ids)
            .apply()
    }

    fun getCartItems(): List<JsonMap> {
        val raw = preferences.getString(KEY_CART_ITEMS, "").orEmpty().trim()
        return runCatching { JsonUtils.parseValue(raw).asJsonMapList() }.getOrDefault(emptyList())
    }

    fun saveCartItems(items: List<JsonMap>) {
        preferences.edit().putString(KEY_CART_ITEMS, JsonUtils.toJsonString(items)).apply()
    }

    fun clearCartItems() {
        preferences.edit().remove(KEY_CART_ITEMS).apply()
    }

    fun getConversationId(): String? {
        return preferences.getString(KEY_CONVERSATION_ID, "").orEmpty().trim().ifBlank { null }
    }

    fun saveConversationId(conversationId: String) {
        preferences.edit().putString(KEY_CONVERSATION_ID, conversationId.trim()).apply()
    }

    fun clearConversationId() {
        preferences.edit().remove(KEY_CONVERSATION_ID).apply()
    }

    private companion object {
        const val KEY_ONBOARDING_SEEN = "has_seen_onboarding"
        const val KEY_PATIENT_USER = "patient_user"
        const val KEY_NOTIFICATIONS_SEEN_PREFIX = "patient_notifications_seen_at_"
        const val KEY_DISMISSED_NOTIFICATIONS_PREFIX = "patient_dismissed_notifications_"
        const val KEY_CART_ITEMS = "shop_cart_items"
        const val KEY_CONVERSATION_ID = "public_chat_conversation_id"
    }
}
