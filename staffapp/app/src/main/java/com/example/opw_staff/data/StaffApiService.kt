package com.example.opw_staff.data

import com.example.opw_staff.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

class ApiException(
    val statusCode: Int,
    override val message: String,
) : IOException(message)

class StaffApiService(
    private val baseUrl: String = DEFAULT_BASE_URL,
) {
    suspend fun loginAdmin(email: String, password: String): AdminSession =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("email", email.trim())
                .put("password", password)
            val response = JSONObject(request("POST", "/admin/login", body = body))
            AdminSession(
                token = response.optString("token").trim(),
                user = response.getJSONObject("user").toStaffUser(),
            )
        }

    suspend fun checkHealth(): String =
        withContext(Dispatchers.IO) {
            val response = JSONObject(request("GET", "/health"))
            response.optString("message").trim()
                .ifBlank { response.optString("status").trim() }
                .ifBlank { "Server is reachable." }
        }

    suspend fun getAdminProfile(token: String): StaffUser =
        withContext(Dispatchers.IO) {
            JSONObject(request("GET", "/admin/profile", token = token)).toStaffUser()
        }

    suspend fun getUsers(token: String): List<StaffUser> =
        withContext(Dispatchers.IO) {
            val response = JSONArray(request("GET", "/users", token = token))
            List(response.length()) { index ->
                response.getJSONObject(index).toStaffUser()
            }
        }

    suspend fun getStaffApplications(token: String): List<StaffApplication> =
        withContext(Dispatchers.IO) {
            val response = JSONArray(request("GET", "/staff-applications", token = token))
            List(response.length()) { index ->
                response.getJSONObject(index).toStaffApplication()
            }
        }

    suspend fun getPatients(token: String): List<JSONObject> =
        getJsonArray(token, "/patients")

    suspend fun getAppointments(token: String): List<JSONObject> =
        getJsonArray(token, "/appointments")

    suspend fun getMailbox(token: String): List<JSONObject> =
        getJsonArray(token, "/mailbox")

    suspend fun getServices(token: String): List<JSONObject> =
        getJsonArray(token, "/services")

    suspend fun getTherapyResources(token: String): List<JSONObject> =
        getJsonArray(token, "/therapy-resources")

    suspend fun getShopProducts(token: String): List<JSONObject> =
        getJsonArray(token, "/admin/shop/products")

    suspend fun getShopOrders(token: String): List<JSONObject> =
        getJsonArray(token, "/admin/shop/orders")

    suspend fun getChatConversations(token: String): List<JSONObject> =
        getJsonArray(token, "/chat/conversations")

    suspend fun getTreatmentTracker(token: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("GET", "/treatment-tracker", token = token))
        }

    suspend fun createStaff(token: String, payload: CreateStaffRequest): StaffUser =
        withContext(Dispatchers.IO) {
            JSONObject(
                request(
                    method = "POST",
                    path = "/users",
                    token = token,
                    body = payload.toJson(),
                ),
            ).toStaffUser()
        }

    suspend fun logoutSession(token: String, userId: String) {
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("userId", userId)
            request("POST", "/session/logout", token = token, body = body)
        }
    }

    private suspend fun getJsonArray(token: String, path: String): List<JSONObject> =
        withContext(Dispatchers.IO) {
            val response = JSONArray(request("GET", path, token = token))
            List(response.length()) { index -> response.getJSONObject(index) }
        }

    private fun request(
        method: String,
        path: String,
        token: String? = null,
        body: JSONObject? = null,
    ): String {
        val connection = (URL("${baseUrl.trimEnd('/')}$path").openConnection() as HttpURLConnection)
            .apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 15_000
                doInput = true
                setRequestProperty("Accept", "application/json")

                if (token != null) {
                    setRequestProperty("Authorization", "Bearer $token")
                }

                if (body != null) {
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                }
            }

        try {
            if (body != null) {
                connection.outputStream.use { output ->
                    output.write(body.toString().toByteArray(Charsets.UTF_8))
                }
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream ?: connection.inputStream
            }
            val responseBody = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

            if (statusCode !in 200..299) {
                val message = runCatching {
                    JSONObject(responseBody).optString("message").trim()
                }.getOrDefault("")
                throw ApiException(
                    statusCode = statusCode,
                    message = message.ifBlank { "Request failed with status $statusCode." },
                )
            }

            return responseBody
        } finally {
            connection.disconnect()
        }
    }

    companion object {
        val DEFAULT_BASE_URL: String = BuildConfig.OPW_STAFF_API_BASE_URL

        fun normalizeBaseUrl(value: String): String {
            val raw = value.trim()
            if (raw.isBlank()) {
                return normalizeBaseUrl(DEFAULT_BASE_URL)
            }

            val withScheme = if (
                raw.startsWith("http://", ignoreCase = true) ||
                raw.startsWith("https://", ignoreCase = true)
            ) {
                raw
            } else {
                "https://$raw"
            }
            val cleaned = withScheme
                .substringBefore("?")
                .substringBefore("#")
                .trimEnd('/')
            val apiIndex = cleaned.indexOf("/api", ignoreCase = true)

            return if (apiIndex >= 0) cleaned.substring(0, apiIndex + 4) else "$cleaned/api"
        }
    }
}
