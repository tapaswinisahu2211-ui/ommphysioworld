package com.ommphysioworld.userapp.data

import com.ommphysioworld.userapp.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.DataOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.nio.charset.StandardCharsets
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLException

class ApiException(
    message: String,
    val statusCode: Int? = null,
) : Exception(message)

data class UploadFile(
    val name: String,
    val bytes: ByteArray,
    val mimeType: String? = null,
)

class AppApiService(
    private val storage: AppStorage,
) {
    suspend fun login(email: String, password: String): JsonMap {
        return postJson(
            "/auth/login",
            mapOf(
                "email" to email,
                "password" to password,
            ),
        )
    }

    suspend fun register(name: String, email: String, mobile: String, password: String): JsonMap {
        return postJson(
            "/auth/register",
            mapOf(
                "name" to name,
                "email" to email,
                "mobile" to mobile,
                "password" to password,
                "createdFrom" to "mobile_app",
            ),
        )
    }

    suspend fun requestPasswordReset(email: String): JsonMap {
        return postJson(
            "/auth/forgot-password",
            mapOf("email" to email),
        )
    }

    suspend fun submitAppointment(
        name: String,
        email: String,
        phone: String,
        patientId: String,
        service: String,
        date: String,
        time: String,
        message: String,
        documents: List<UploadFile>,
    ): JsonMap {
        return postMultipart(
            "/appointments",
            fields = mapOf(
                "name" to name,
                "email" to email,
                "phone" to phone,
                "patientId" to patientId,
                "service" to service,
                "date" to date,
                "time" to time,
                "message" to message,
            ),
            files = documents,
            fileFieldName = "files",
        )
    }

    suspend fun getPatient(patientId: String): JsonMap {
        return getJson("/patients/$patientId")
    }

    suspend fun updatePatientProfile(
        patientId: String,
        name: String,
        mobile: String,
        disease: String,
    ): JsonMap {
        return putJson(
            "/patients/$patientId",
            mapOf(
                "name" to name,
                "mobile" to mobile,
                "disease" to disease,
            ),
        )
    }

    suspend fun changePassword(oldPassword: String, newPassword: String, confirmPassword: String): JsonMap {
        return postJson(
            "/auth/change-password",
            mapOf(
                "oldPassword" to oldPassword,
                "newPassword" to newPassword,
                "confirmPassword" to confirmPassword,
            ),
        )
    }

    suspend fun uploadPatientProfileImage(patientId: String, image: UploadFile): JsonMap {
        return postMultipart(
            "/patients/$patientId/profile-image",
            fields = emptyMap(),
            files = listOf(image),
            fileFieldName = "image",
        )
    }

    suspend fun getServices(): List<JsonMap> = extractList(getJson("/services"))

    suspend fun getShopProducts(): List<JsonMap> = extractList(getJson("/shop/products"))

    suspend fun getPatientAppointmentRequests(patientId: String): List<JsonMap> {
        return extractList(getJson("/patients/$patientId/appointment-requests"))
    }

    suspend fun getMyShopOrders(): List<JsonMap> = extractList(getJson("/shop/orders/my"))

    suspend fun placeShopOrder(items: List<JsonMap>, note: String): JsonMap {
        return postJson(
            "/shop/orders",
            mapOf(
                "items" to items,
                "note" to note,
            ),
        )
    }

    suspend fun getPublicChatAgents(): List<JsonMap> = extractList(getJson("/public-chat-agents"))

    suspend fun getPublicChatConversation(conversationId: String): JsonMap {
        return getJson("/public-chat/conversations/$conversationId")
    }

    suspend fun startPublicChatConversation(
        agentId: String,
        visitorName: String,
        visitorContact: String,
        text: String,
        attachments: List<UploadFile>,
    ): JsonMap {
        return postMultipart(
            "/public-chat/conversations",
            fields = mapOf(
                "agentId" to agentId,
                "visitorName" to visitorName,
                "visitorContact" to visitorContact,
                "text" to text,
            ),
            files = attachments,
            fileFieldName = "attachments",
        )
    }

    suspend fun sendPublicChatMessage(
        conversationId: String,
        visitorName: String,
        text: String,
        attachments: List<UploadFile>,
    ): JsonMap {
        return postMultipart(
            "/public-chat/conversations/$conversationId/messages",
            fields = mapOf(
                "visitorName" to visitorName,
                "text" to text,
            ),
            files = attachments,
            fileFieldName = "attachments",
        )
    }

    fun resolveResourceUrl(pathOrUrl: String): String {
        val trimmed = pathOrUrl.trim()
        if (trimmed.isEmpty()) {
            return ""
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
        }

        val baseUrl = resolveBaseUrl()
        return if (trimmed.startsWith("/")) {
            baseUrl + trimmed
        } else {
            "$baseUrl/$trimmed"
        }
    }

    private suspend fun getJson(path: String): JsonMap = requestJson("GET", path, null)

    private suspend fun postJson(path: String, payload: JsonMap): JsonMap = requestJson("POST", path, payload)

    private suspend fun putJson(path: String, payload: JsonMap): JsonMap = requestJson("PUT", path, payload)

    private suspend fun requestJson(method: String, path: String, payload: JsonMap?): JsonMap {
        return guardRequest {
            withContext(Dispatchers.IO) {
                val connection = openConnection(method, path)
                connection.setRequestProperty("Content-Type", "application/json")
                if (payload != null) {
                    connection.doOutput = true
                    DataOutputStream(connection.outputStream).use { output ->
                        output.write(JsonUtils.toJsonString(payload).toByteArray(StandardCharsets.UTF_8))
                    }
                }

                readJsonResponse(connection)
            }
        }
    }

    private suspend fun postMultipart(
        path: String,
        fields: Map<String, String>,
        files: List<UploadFile>,
        fileFieldName: String = "documents",
    ): JsonMap {
        return guardRequest {
            withContext(Dispatchers.IO) {
                val boundary = "----ommphysio${System.currentTimeMillis()}"
                val connection = openConnection("POST", path)
                connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                connection.doOutput = true

                DataOutputStream(connection.outputStream).use { output ->
                    fields.forEach { (name, value) ->
                        output.writeBytes("--$boundary\r\n")
                        output.writeBytes("Content-Disposition: form-data; name=\"${escapeMultipartValue(name)}\"\r\n\r\n")
                        output.write(value.toByteArray(StandardCharsets.UTF_8))
                        output.writeBytes("\r\n")
                    }

                    files.forEach { file ->
                        output.writeBytes("--$boundary\r\n")
                        output.writeBytes(
                            "Content-Disposition: form-data; name=\"${escapeMultipartValue(fileFieldName)}\"; " +
                                "filename=\"${escapeMultipartValue(file.name)}\"\r\n"
                        )
                        output.writeBytes("Content-Type: ${file.mimeType ?: guessMimeType(file.name)}\r\n\r\n")
                        output.write(file.bytes)
                        output.writeBytes("\r\n")
                    }

                    output.writeBytes("--$boundary--\r\n")
                    output.flush()
                }

                readJsonResponse(connection)
            }
        }
    }

    private suspend fun guardRequest(block: suspend () -> JsonMap): JsonMap {
        return try {
            block()
        } catch (error: ApiException) {
            throw error
        } catch (_: SocketTimeoutException) {
            throw ApiException("OPW is taking too long to respond. Please try again in a moment.")
        } catch (_: SSLException) {
            throw ApiException("Secure connection failed. Please try again shortly.")
        } catch (_: IOException) {
            throw ApiException("Unable to reach OPW right now. Please check your network and try again.")
        } catch (_: Exception) {
            throw ApiException("Unexpected response from OPW. Please try again.")
        }
    }

    private fun openConnection(method: String, path: String): HttpURLConnection {
        val connection = (URL(resolveBaseUrl() + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = REQUEST_TIMEOUT_MS
            readTimeout = REQUEST_TIMEOUT_MS
            doInput = true
            setRequestProperty("Accept", "application/json")
        }

        val token = storage.getPatientUser()?.string("token").orEmpty()
        if (token.isNotBlank()) {
            connection.setRequestProperty("Authorization", "Bearer $token")
        }

        if (connection is HttpsURLConnection) {
            connection.instanceFollowRedirects = true
        }

        return connection
    }

    private fun readJsonResponse(connection: HttpURLConnection): JsonMap {
        val statusCode = connection.responseCode
        val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.use { input ->
            BufferedInputStream(input).readBytes().toString(StandardCharsets.UTF_8)
        }.orEmpty()

        val parsed = decodeBody(body)
        if (statusCode !in 200..299) {
            val message = parsed["message"]?.toString()
                ?: "Request failed with status $statusCode."
            throw ApiException(message, statusCode)
        }

        return parsed
    }

    private fun decodeBody(body: String): JsonMap {
        val trimmed = body.trim()
        if (trimmed.isEmpty()) {
            return emptyMap()
        }

        return when {
            trimmed.startsWith("{") -> JsonUtils.fromJsonObject(JSONObject(trimmed))
            trimmed.startsWith("[") -> mapOf("data" to JsonUtils.fromJsonArray(JSONArray(trimmed)))
            else -> throw ApiException("Unexpected response from OPW. Please try again.")
        }
    }

    private fun extractList(response: JsonMap): List<JsonMap> = response["data"].asJsonMapList()

    private fun resolveBaseUrl(): String {
        return BuildConfig.API_BASE_URL.trim().trimEnd('/')
    }

    private fun escapeMultipartValue(value: String): String = value.replace("\"", "\\\"")

    private fun guessMimeType(fileName: String): String {
        val lowerName = fileName.lowercase()
        return when {
            lowerName.endsWith(".pdf") -> "application/pdf"
            lowerName.endsWith(".png") -> "image/png"
            lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") -> "image/jpeg"
            lowerName.endsWith(".webp") -> "image/webp"
            lowerName.endsWith(".doc") -> "application/msword"
            lowerName.endsWith(".docx") -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            else -> "application/octet-stream"
        }
    }

    private companion object {
        const val REQUEST_TIMEOUT_MS = 25_000
    }
}
