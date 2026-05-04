package com.example.opw_staff.data

import org.json.JSONArray
import org.json.JSONObject

data class StaffPermission(
    val module: String,
    val label: String,
    val view: Boolean,
    val add: Boolean,
    val edit: Boolean,
)

data class StaffUser(
    val id: String,
    val name: String,
    val email: String,
    val mobile: String,
    val role: String,
    val status: String,
    val chatEnabled: Boolean,
    val workType: String,
    val joiningDate: String,
    val joiningNotes: String,
    val permissions: List<StaffPermission>,
    val createdAt: String,
    val updatedAt: String,
)

data class StaffApplication(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val role: String,
    val experience: String,
    val message: String,
    val isRead: Boolean,
    val createdAt: String,
)

data class AdminSession(
    val token: String,
    val user: StaffUser,
)

data class CreateStaffRequest(
    val name: String,
    val email: String,
    val mobile: String,
    val role: String,
    val status: String,
    val chatEnabled: Boolean,
    val workType: String,
    val password: String,
    val permissions: List<StaffPermission>,
)

data class AdminDashboardSnapshot(
    val admin: StaffUser,
    val users: List<StaffUser>,
    val applications: List<StaffApplication>,
    val patients: List<JSONObject> = emptyList(),
    val appointments: List<JSONObject> = emptyList(),
    val mailboxItems: List<JSONObject> = emptyList(),
    val services: List<JSONObject> = emptyList(),
    val therapyResources: List<JSONObject> = emptyList(),
    val shopProducts: List<JSONObject> = emptyList(),
    val shopOrders: List<JSONObject> = emptyList(),
    val chatConversations: List<JSONObject> = emptyList(),
    val treatmentTracker: JSONObject? = null,
    val moduleErrors: Map<String, String> = emptyMap(),
)

data class ModuleTemplate(
    val module: String,
    val label: String,
    val view: Boolean,
    val add: Boolean,
    val edit: Boolean,
)

val staffModuleTemplates = listOf(
    ModuleTemplate("dashboard", "Dashboard", view = true, add = false, edit = false),
    ModuleTemplate("patients", "Patients", view = true, add = false, edit = false),
    ModuleTemplate("appointments", "Appointments", view = true, add = true, edit = true),
    ModuleTemplate("documents", "Documents", view = true, add = true, edit = false),
    ModuleTemplate("chat", "Live Chat", view = false, add = true, edit = true),
    ModuleTemplate("services", "Services", view = false, add = false, edit = false),
    ModuleTemplate("therapy", "Therapy", view = false, add = false, edit = false),
    ModuleTemplate("shop", "Shop", view = false, add = false, edit = false),
    ModuleTemplate("staff", "Staff", view = false, add = false, edit = false),
    ModuleTemplate("mailbox", "Mailbox", view = false, add = false, edit = false),
    ModuleTemplate("treatment_tracker", "Tracker", view = false, add = false, edit = false),
)

fun defaultStaffPermissions(): List<StaffPermission> =
    staffModuleTemplates.map { template ->
        StaffPermission(
            module = template.module,
            label = template.label,
            view = template.view,
            add = template.add,
            edit = template.edit,
        )
    }

fun moduleLabel(module: String): String =
    staffModuleTemplates.firstOrNull { it.module == module }?.label
        ?: module.replace('_', ' ').replaceFirstChar { char ->
            if (char.isLowerCase()) char.titlecase() else char.toString()
        }

private fun JSONObject.stringValue(key: String): String =
    optString(key).trim()

fun JSONObject.toStaffPermission(): StaffPermission =
    StaffPermission(
        module = stringValue("module"),
        label = moduleLabel(stringValue("module")),
        view = optBoolean("view"),
        add = optBoolean("add"),
        edit = optBoolean("edit"),
    )

fun JSONObject.toStaffUser(): StaffUser {
    val permissionsJson = optJSONArray("permissions") ?: JSONArray()
    return StaffUser(
        id = stringValue("id"),
        name = stringValue("name"),
        email = stringValue("email"),
        mobile = stringValue("mobile"),
        role = stringValue("role"),
        status = stringValue("status").ifBlank { "Active" },
        chatEnabled = optBoolean("chatEnabled"),
        workType = stringValue("workType"),
        joiningDate = stringValue("joiningDate"),
        joiningNotes = stringValue("joiningNotes"),
        permissions = List(permissionsJson.length()) { index ->
            permissionsJson.getJSONObject(index).toStaffPermission()
        },
        createdAt = stringValue("createdAt"),
        updatedAt = stringValue("updatedAt"),
    )
}

fun JSONObject.toStaffApplication(): StaffApplication =
    StaffApplication(
        id = stringValue("id"),
        name = stringValue("name"),
        email = stringValue("email"),
        phone = stringValue("phone"),
        role = stringValue("role"),
        experience = stringValue("experience"),
        message = stringValue("message"),
        isRead = optBoolean("isRead"),
        createdAt = stringValue("createdAt"),
    )

fun StaffPermission.toJson(): JSONObject =
    JSONObject()
        .put("module", module)
        .put("view", view)
        .put("add", add)
        .put("edit", edit)

fun StaffUser.toJson(): JSONObject {
    val permissionsJson = JSONArray()
    permissions.forEach { permission ->
        permissionsJson.put(permission.toJson())
    }

    return JSONObject()
        .put("id", id)
        .put("name", name)
        .put("email", email)
        .put("mobile", mobile)
        .put("role", role)
        .put("status", status)
        .put("chatEnabled", chatEnabled)
        .put("workType", workType)
        .put("joiningDate", joiningDate)
        .put("joiningNotes", joiningNotes)
        .put("permissions", permissionsJson)
        .put("createdAt", createdAt)
        .put("updatedAt", updatedAt)
}

fun CreateStaffRequest.toJson(): JSONObject {
    val permissionsJson = JSONArray()
    permissions.forEach { permission ->
        permissionsJson.put(permission.toJson())
    }

    return JSONObject()
        .put("name", name)
        .put("email", email)
        .put("mobile", mobile)
        .put("role", role)
        .put("status", status)
        .put("chatEnabled", chatEnabled)
        .put("workType", workType)
        .put("password", password)
        .put("permissions", permissionsJson)
}
