package com.example.opw_staff.data

import android.content.Context
import org.json.JSONObject

class StaffSessionStore(context: Context) {
    private val preferences =
        context.getSharedPreferences("opw_staff_session", Context.MODE_PRIVATE)

    fun getSession(): AdminSession? {
        val token = preferences.getString(KEY_TOKEN, "").orEmpty()
        val userJson = preferences.getString(KEY_USER, "").orEmpty()

        if (token.isBlank() || userJson.isBlank()) {
            return null
        }

        return runCatching {
            AdminSession(
                token = token,
                user = JSONObject(userJson).toStaffUser(),
            )
        }.getOrNull()
    }

    fun saveSession(session: AdminSession) {
        preferences.edit()
            .putString(KEY_TOKEN, session.token)
            .putString(KEY_USER, session.user.toJson().toString())
            .apply()
    }

    fun getApiBaseUrl(): String =
        StaffApiService.normalizeBaseUrl(
            preferences.getString(KEY_API_BASE_URL, StaffApiService.DEFAULT_BASE_URL).orEmpty(),
        )

    fun saveApiBaseUrl(baseUrl: String) {
        preferences.edit()
            .putString(KEY_API_BASE_URL, StaffApiService.normalizeBaseUrl(baseUrl))
            .apply()
    }

    fun clearSession() {
        preferences.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USER)
            .apply()
    }

    private companion object {
        const val KEY_TOKEN = "token"
        const val KEY_USER = "user"
        const val KEY_API_BASE_URL = "api_base_url"
    }
}
