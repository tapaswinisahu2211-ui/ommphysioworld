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

    suspend fun getArchivedPatients(token: String): List<JSONObject> =
        getJsonArray(token, "/patients/archive")

    suspend fun getPatient(token: String, id: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("GET", "/patients/$id", token = token))
        }

    suspend fun getPatientAppointmentRequests(token: String, id: String): List<JSONObject> =
        getJsonArray(token, "/patients/$id/appointment-requests")

    suspend fun savePatient(token: String, id: String?, payload: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            if (id.isNullOrBlank()) {
                JSONObject(request("POST", "/patients", token = token, body = payload))
            } else {
                JSONObject(request("PUT", "/patients/$id", token = token, body = payload))
            }
        }

    suspend fun archivePatient(token: String, id: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("DELETE", "/patients/$id", token = token))
        }

    suspend fun restorePatient(token: String, id: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("PATCH", "/patients/$id/restore", token = token))
        }

    suspend fun permanentlyDeletePatient(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/patients/$id/permanent", token = token)
        }
    }

    suspend fun getAppointments(token: String): List<JSONObject> =
        getJsonArray(token, "/appointments")

    suspend fun approveAppointment(token: String, id: String, date: String, time: String, note: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("date", date)
                .put("time", time)
                .put("note", note)
            JSONObject(request("PATCH", "/appointments/$id/approve", token = token, body = body))
        }

    suspend fun rescheduleAppointmentRequest(token: String, id: String, date: String, time: String, note: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("date", date)
                .put("time", time)
                .put("note", note)
            JSONObject(request("PATCH", "/appointments/$id/reschedule", token = token, body = body))
        }

    suspend fun updateAppointmentStatus(token: String, id: String, status: String, remark: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("status", status)
                .put("remark", remark)
            JSONObject(request("PATCH", "/appointments/$id/status", token = token, body = body))
        }

    suspend fun saveTreatmentPlan(token: String, patientId: String, planId: String?, payload: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            if (planId.isNullOrBlank()) {
                JSONObject(request("POST", "/patients/$patientId/treatment-plans", token = token, body = payload))
            } else {
                JSONObject(request("PUT", "/patients/$patientId/treatment-plans/$planId", token = token, body = payload))
            }
        }

    suspend fun updateTreatmentPlanStatus(token: String, patientId: String, planId: String, status: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("status", status)
            JSONObject(request("PATCH", "/patients/$patientId/treatment-plans/$planId/status", token = token, body = body))
        }

    suspend fun updateSessionDayStatus(
        token: String,
        patientId: String,
        planId: String,
        dayId: String,
        status: String,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("status", status)
            JSONObject(
                request(
                    "PATCH",
                    "/patients/$patientId/treatment-plans/$planId/session-days/$dayId",
                    token = token,
                    body = body,
                ),
            )
        }

    suspend fun addTreatmentPayment(token: String, patientId: String, planId: String, amount: Double, method: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("amount", amount)
                .put("method", method)
            JSONObject(request("POST", "/patients/$patientId/treatment-plans/$planId/payments", token = token, body = body))
        }

    suspend fun deleteTreatmentPlan(token: String, patientId: String, planId: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("DELETE", "/patients/$patientId/treatment-plans/$planId", token = token))
        }

    suspend fun addClinicalNote(token: String, patientId: String, title: String, note: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(
                requestMultipartFields(
                    path = "/patients/$patientId/clinical-notes",
                    token = token,
                    fields = mapOf(
                        "title" to title,
                        "note" to note,
                        "addedByType" to "opw",
                        "addedByLabel" to "OPW",
                    ),
                ),
            )
        }

    suspend fun deleteClinicalNote(token: String, patientId: String, noteId: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("DELETE", "/patients/$patientId/clinical-notes/$noteId", token = token))
        }

    suspend fun saveTherapyRecommendation(
        token: String,
        patientId: String,
        serviceId: String,
        note: String,
        itemIds: List<String>,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            val itemArray = JSONArray()
            itemIds.forEach { itemArray.put(it) }
            val body = JSONObject()
                .put("serviceId", serviceId)
                .put("note", note)
                .put("itemIds", itemArray)
            JSONObject(request("POST", "/patients/$patientId/therapy-recommendations", token = token, body = body))
        }

    suspend fun deleteTherapyRecommendation(token: String, patientId: String, recommendationId: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("DELETE", "/patients/$patientId/therapy-recommendations/$recommendationId", token = token))
        }

    suspend fun addPatientAppointment(token: String, patientId: String, date: String, time: String, service: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("date", date)
                .put("time", time)
                .put("service", service)
            JSONObject(request("POST", "/patients/$patientId/appointments", token = token, body = body))
        }

    suspend fun updatePatientAppointment(
        token: String,
        patientId: String,
        appointmentId: String,
        status: String,
        date: String,
        time: String,
        remark: String,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("status", status)
                .put("date", date)
                .put("time", time)
                .put("remark", remark)
            JSONObject(request("PATCH", "/patients/$patientId/appointments/$appointmentId", token = token, body = body))
        }

    suspend fun getMailbox(token: String): List<JSONObject> =
        getJsonArray(token, "/mailbox")

    suspend fun getNotificationHistory(token: String): List<JSONObject> =
        getJsonArray(token, "/notifications/admin?limit=1000")

    suspend fun sendCustomNotification(
        token: String,
        title: String,
        body: String,
        audience: String,
        patientIds: List<String>,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            val ids = JSONArray()
            patientIds.forEach { ids.put(it) }
            val payload = JSONObject()
                .put("title", title)
                .put("body", body)
                .put("audience", audience)
                .put("patientIds", ids)
            JSONObject(request("POST", "/notifications/custom", token = token, body = payload))
        }

    suspend fun deleteNotification(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/notifications/admin/$id", token = token)
        }
    }

    suspend fun deleteNotifications(token: String, ids: List<String>): JSONObject =
        withContext(Dispatchers.IO) {
            val payload = JSONArray()
            ids.forEach { payload.put(it) }
            JSONObject(
                request(
                    "POST",
                    "/notifications/admin/delete",
                    token = token,
                    body = JSONObject().put("notificationIds", payload),
                ),
            )
        }

    suspend fun updateMailboxRead(token: String, type: String, id: String, isRead: Boolean): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("isRead", isRead)
            JSONObject(request("PATCH", "/mailbox/$type/$id/read", token = token, body = body))
        }

    suspend fun deleteMailboxItem(token: String, type: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/mailbox/$type/$id", token = token)
        }
    }

    suspend fun getServices(token: String): List<JSONObject> =
        getJsonArray(token, "/services")

    suspend fun saveService(token: String, id: String?, name: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("name", name)
            if (id.isNullOrBlank()) {
                JSONObject(request("POST", "/services", token = token, body = body))
            } else {
                JSONObject(request("PUT", "/services/$id", token = token, body = body))
            }
        }

    suspend fun deleteService(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/services/$id", token = token)
        }
    }

    suspend fun getTherapyResources(token: String): List<JSONObject> =
        getJsonArray(token, "/therapy-resources")

    suspend fun saveTherapyResource(
        token: String,
        id: String?,
        serviceId: String,
        title: String,
        description: String,
        fileName: String?,
        mimeType: String?,
        fileBytes: ByteArray?,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(
                requestMultipart(
                    method = if (id.isNullOrBlank()) "POST" else "PUT",
                    path = if (id.isNullOrBlank()) "/therapy-resources" else "/therapy-resources/$id",
                    token = token,
                    fields = mapOf(
                        "serviceId" to serviceId,
                        "title" to title,
                        "description" to description,
                    ),
                    fileField = "file",
                    fileName = fileName,
                    mimeType = mimeType,
                    fileBytes = fileBytes,
                ),
            )
        }

    suspend fun deleteTherapyResource(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/therapy-resources/$id", token = token)
        }
    }

    suspend fun getShopProducts(token: String): List<JSONObject> =
        getJsonArray(token, "/admin/shop/products")

    suspend fun getShopOrders(token: String): List<JSONObject> =
        getJsonArray(token, "/admin/shop/orders")

    suspend fun updateShopOrderStatus(token: String, id: String, status: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("status", status)
            JSONObject(request("PATCH", "/admin/shop/orders/$id/status", token = token, body = body))
        }

    suspend fun saveShopProduct(token: String, id: String?, payload: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            if (id.isNullOrBlank()) {
                JSONObject(request("POST", "/admin/shop/products", token = token, body = payload))
            } else {
                JSONObject(request("PUT", "/admin/shop/products/$id", token = token, body = payload))
            }
        }

    suspend fun deleteShopProduct(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/admin/shop/products/$id", token = token)
        }
    }

    suspend fun getMarketingSources(token: String): List<JSONObject> =
        getJsonArray(token, "/marketing/sources")

    suspend fun saveMarketingSource(
        token: String,
        id: String?,
        payload: JSONObject,
        photoName: String?,
        photoMimeType: String?,
        photoBytes: ByteArray?,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            val fields = mutableMapOf<String, String>()
            listOf(
                "sourceType",
                "name",
                "contactPerson",
                "doctorName",
                "mobile",
                "alternateMobile",
                "email",
                "area",
                "city",
                "address",
                "visitDate",
                "nextFollowUpDate",
                "assignedTo",
                "pitchStatus",
                "expectedDailyPatients",
                "notes",
                "removePhotoIds",
            ).forEach { key ->
                fields[key] = payload.optString(key).trim()
            }

            JSONObject(
                requestMultipart(
                    method = if (id.isNullOrBlank()) "POST" else "PUT",
                    path = if (id.isNullOrBlank()) "/marketing/sources" else "/marketing/sources/$id",
                    token = token,
                    fields = fields,
                    fileField = if (photoBytes != null) "photos" else null,
                    fileName = photoName,
                    mimeType = photoMimeType,
                    fileBytes = photoBytes,
                ),
            )
        }

    suspend fun deleteMarketingSource(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/marketing/sources/$id", token = token)
        }
    }

    suspend fun addMarketingReferral(token: String, sourceId: String, payload: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("POST", "/marketing/sources/$sourceId/referrals", token = token, body = payload))
        }

    suspend fun deleteMarketingReferral(token: String, sourceId: String, referralId: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("DELETE", "/marketing/sources/$sourceId/referrals/$referralId", token = token))
        }

    suspend fun getFeedback(token: String): List<JSONObject> =
        getJsonArray(token, "/feedback")

    suspend fun updateFeedbackApproval(token: String, id: String, isApproved: Boolean): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("isApproved", isApproved)
            JSONObject(request("PATCH", "/feedback/$id/approve", token = token, body = body))
        }

    suspend fun deleteFeedback(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/feedback/$id", token = token)
        }
    }

    suspend fun getJobRequirements(token: String): List<JSONObject> =
        getJsonArray(token, "/job-requirements")

    suspend fun saveJobRequirement(token: String, id: String?, payload: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            if (id.isNullOrBlank()) {
                JSONObject(request("POST", "/job-requirements", token = token, body = payload))
            } else {
                JSONObject(request("PUT", "/job-requirements/$id", token = token, body = payload))
            }
        }

    suspend fun deleteJobRequirement(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/job-requirements/$id", token = token)
        }
    }

    suspend fun getReports(token: String, fromDate: String, toDate: String): JSONObject =
        withContext(Dispatchers.IO) {
            val from = java.net.URLEncoder.encode(fromDate.trim(), "UTF-8")
            val to = java.net.URLEncoder.encode(toDate.trim(), "UTF-8")
            JSONObject(request("GET", "/reports?from=$from&to=$to", token = token))
        }

    suspend fun getChatConversations(token: String): List<JSONObject> =
        getJsonArray(token, "/chat/conversations")

    suspend fun markChatRead(token: String, id: String): JSONObject =
        withContext(Dispatchers.IO) {
            JSONObject(request("PATCH", "/chat/conversations/$id/read", token = token, body = JSONObject()))
        }

    suspend fun sendChatMessage(token: String, id: String, text: String): JSONObject =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("text", text)
            JSONObject(request("POST", "/chat/conversations/$id/messages", token = token, body = body))
        }

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

    suspend fun updateStaff(token: String, id: String, payload: CreateStaffRequest): StaffUser =
        withContext(Dispatchers.IO) {
            JSONObject(
                request(
                    method = "PUT",
                    path = "/users/$id",
                    token = token,
                    body = payload.toJson(),
                ),
            ).toStaffUser()
        }

    suspend fun deleteStaff(token: String, id: String) {
        withContext(Dispatchers.IO) {
            request("DELETE", "/users/$id", token = token)
        }
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

    private fun requestMultipartFields(
        path: String,
        token: String,
        fields: Map<String, String>,
    ): String =
        requestMultipart(
            method = "POST",
            path = path,
            token = token,
            fields = fields,
            fileField = null,
            fileName = null,
            mimeType = null,
            fileBytes = null,
        )

    private fun requestMultipart(
        method: String,
        path: String,
        token: String,
        fields: Map<String, String>,
        fileField: String?,
        fileName: String?,
        mimeType: String?,
        fileBytes: ByteArray?,
    ): String {
        val boundary = "----OPWStaff${System.currentTimeMillis()}"
        val connection = (URL("${baseUrl.trimEnd('/')}$path").openConnection() as HttpURLConnection)
            .apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 15_000
                doInput = true
                doOutput = true
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
            }

        try {
            connection.outputStream.use { output ->
                fields.forEach { (name, value) ->
                    output.write("--$boundary\r\n".toByteArray(Charsets.UTF_8))
                    output.write(
                        "Content-Disposition: form-data; name=\"$name\"\r\n\r\n".toByteArray(Charsets.UTF_8),
                    )
                    output.write(value.toByteArray(Charsets.UTF_8))
                    output.write("\r\n".toByteArray(Charsets.UTF_8))
                }
                if (fileField != null && fileName != null && fileBytes != null) {
                    output.write("--$boundary\r\n".toByteArray(Charsets.UTF_8))
                    output.write(
                        "Content-Disposition: form-data; name=\"$fileField\"; filename=\"$fileName\"\r\n".toByteArray(Charsets.UTF_8),
                    )
                    output.write(
                        "Content-Type: ${mimeType?.ifBlank { "application/octet-stream" } ?: "application/octet-stream"}\r\n\r\n".toByteArray(Charsets.UTF_8),
                    )
                    output.write(fileBytes)
                    output.write("\r\n".toByteArray(Charsets.UTF_8))
                }
                output.write("--$boundary--\r\n".toByteArray(Charsets.UTF_8))
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
