package com.example.opw_staff.data

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
    private val baseUrl: String = "http://10.0.2.2:5000/api",
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
}
