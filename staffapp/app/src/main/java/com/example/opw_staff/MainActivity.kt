package com.example.opw_staff

import android.util.Patterns
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import android.os.Bundle
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.opw_staff.data.AdminDashboardSnapshot
import com.example.opw_staff.data.AdminSession
import com.example.opw_staff.data.ApiException
import com.example.opw_staff.data.CreateStaffRequest
import com.example.opw_staff.data.StaffApiService
import com.example.opw_staff.data.StaffApplication
import com.example.opw_staff.data.StaffPermission
import com.example.opw_staff.data.StaffSessionStore
import com.example.opw_staff.data.StaffUser
import com.example.opw_staff.data.defaultStaffPermissions
import com.example.opw_staff.ui.theme.OpwBlue
import com.example.opw_staff.ui.theme.OpwAqua
import com.example.opw_staff.ui.theme.OpwBorder
import com.example.opw_staff.ui.theme.OpwCard
import com.example.opw_staff.ui.theme.OpwDanger
import com.example.opw_staff.ui.theme.OpwFrost
import com.example.opw_staff.ui.theme.OpwInk
import com.example.opw_staff.ui.theme.OpwMist
import com.example.opw_staff.ui.theme.OpwNavy
import com.example.opw_staff.ui.theme.OpwSky
import com.example.opw_staff.ui.theme.OpwStaffTheme
import com.example.opw_staff.ui.theme.OpwSuccess
import com.example.opw_staff.ui.theme.OpwWarning
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            OpwStaffTheme {
                StaffAdminApp()
            }
        }
    }
}

private enum class AppRoute {
    Loading,
    Login,
    Dashboard,
}

private enum class AdminTab(val label: String, val adminOnly: Boolean = false) {
    Overview("Dashboard"),
    Patients("Patients"),
    Appointments("Appointments"),
    Treatment("Treatment"),
    Services("Services"),
    Therapy("Therapy"),
    Shop("Shop"),
    Feedback("Feedback", adminOnly = true),
    Jobs("Job Requirements", adminOnly = true),
    Reports("Report", adminOnly = true),
    Mailbox("Mailbox"),
    Chat("Chat"),
    Team("Staff"),
    Create("Create Staff", adminOnly = true),
    Profile("Profile"),
}

private data class DashboardUiState(
    val loading: Boolean = false,
    val admin: StaffUser? = null,
    val users: List<StaffUser> = emptyList(),
    val applications: List<StaffApplication> = emptyList(),
    val patients: List<JSONObject> = emptyList(),
    val appointments: List<JSONObject> = emptyList(),
    val mailboxItems: List<JSONObject> = emptyList(),
    val services: List<JSONObject> = emptyList(),
    val therapyResources: List<JSONObject> = emptyList(),
    val shopProducts: List<JSONObject> = emptyList(),
    val shopOrders: List<JSONObject> = emptyList(),
    val feedbackItems: List<JSONObject> = emptyList(),
    val jobRequirements: List<JSONObject> = emptyList(),
    val reports: JSONObject? = null,
    val chatConversations: List<JSONObject> = emptyList(),
    val treatmentTracker: JSONObject? = null,
    val moduleErrors: Map<String, String> = emptyMap(),
    val error: String = "",
)

private data class JobFormState(
    val title: String = "",
    val department: String = "",
    val employmentType: String = "",
    val experience: String = "",
    val location: String = "",
    val openings: String = "1",
    val summary: String = "",
    val responsibilities: String = "",
    val requirements: String = "",
    val benefits: String = "",
    val status: String = "Active",
    val isPublished: Boolean = true,
)

private data class StaffFormState(
    val name: String = "",
    val email: String = "",
    val mobile: String = "",
    val role: String = "Staff",
    val status: String = "Active",
    val chatEnabled: Boolean = false,
    val workType: String = "",
    val password: String = "",
    val permissions: List<StaffPermission> = defaultStaffPermissions(),
)

private fun emptyStaffForm() = StaffFormState()

private fun emptyJobForm() = JobFormState()

private fun appBackgroundBrush(): Brush =
    Brush.verticalGradient(
        colors = listOf(
            Color(0xFFE8F2FF),
            Color(0xFFF7FBFF),
            Color(0xFFF8FAFC),
        ),
    )

private fun drawerBrush(): Brush =
    Brush.verticalGradient(
        colors = listOf(
            Color(0xFF03111F),
            Color(0xFF081B2E),
            Color(0xFF0F172A),
        ),
    )

private fun moduleAccent(tab: AdminTab): Color =
    when (tab) {
        AdminTab.Overview -> OpwBlue
        AdminTab.Patients -> Color(0xFF0EA5E9)
        AdminTab.Appointments -> OpwAqua
        AdminTab.Treatment -> Color(0xFF7C3AED)
        AdminTab.Services -> Color(0xFF0284C7)
        AdminTab.Therapy -> Color(0xFF0891B2)
        AdminTab.Shop -> Color(0xFFEA580C)
        AdminTab.Feedback -> Color(0xFFEAB308)
        AdminTab.Jobs -> Color(0xFF16A34A)
        AdminTab.Reports -> Color(0xFF4F46E5)
        AdminTab.Mailbox -> Color(0xFFE11D48)
        AdminTab.Chat -> Color(0xFF10B981)
        AdminTab.Team -> Color(0xFF2563EB)
        AdminTab.Create -> Color(0xFF9333EA)
        AdminTab.Profile -> Color(0xFF475569)
    }

private fun moduleCaption(tab: AdminTab): String =
    when (tab) {
        AdminTab.Overview -> "Command centre for clinic operations"
        AdminTab.Patients -> "Patient records, contact details, and care history"
        AdminTab.Appointments -> "Requests, approvals, completion, and cancellations"
        AdminTab.Treatment -> "Today sessions, follow-ups, and active plans"
        AdminTab.Services -> "Treatments available across the clinic"
        AdminTab.Therapy -> "Exercise files and therapy resources"
        AdminTab.Shop -> "Products, stock, and patient orders"
        AdminTab.Feedback -> "Approve public testimonials"
        AdminTab.Jobs -> "Career openings published to the website"
        AdminTab.Reports -> "Date-wise patients, sessions, and payments"
        AdminTab.Mailbox -> "Career and contact inbox"
        AdminTab.Chat -> "Website visitor conversations"
        AdminTab.Team -> "Staff records, access, and availability"
        AdminTab.Create -> "Create staff accounts with module access"
        AdminTab.Profile -> "Current staff profile and account details"
    }

@Composable
private fun StaffAdminApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val sessionStore = remember { StaffSessionStore(context.applicationContext) }
    val api = remember { StaffApiService() }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var route by remember { mutableStateOf(AppRoute.Loading) }
    var session by remember { mutableStateOf<AdminSession?>(null) }
    var dashboardState by remember { mutableStateOf(DashboardUiState(loading = true)) }
    var selectedTab by remember { mutableStateOf(AdminTab.Overview) }
    var createForm by remember { mutableStateOf(emptyStaffForm()) }
    var createError by remember { mutableStateOf("") }
    var createLoading by remember { mutableStateOf(false) }
    var creationMessage by remember { mutableStateOf("") }
    var jobForm by remember { mutableStateOf(emptyJobForm()) }
    var jobEditingId by remember { mutableStateOf("") }
    var jobError by remember { mutableStateOf("") }
    var jobLoading by remember { mutableStateOf(false) }
    var jobMessage by remember { mutableStateOf("") }
    var reportFromDate by remember { mutableStateOf(monthStartDateKey()) }
    var reportToDate by remember { mutableStateOf(todayDateKey()) }
    var reportLoading by remember { mutableStateOf(false) }
    var reportError by remember { mutableStateOf("") }
    var loginLoading by remember { mutableStateOf(false) }
    var apiTestLoading by remember { mutableStateOf(false) }
    var apiTestMessage by remember { mutableStateOf("") }
    var apiTestIsSuccess by remember { mutableStateOf(false) }

    fun showMessage(message: String) {
        scope.launch {
            snackbarHostState.showSnackbar(message)
        }
    }

    fun clearToLogin(message: String? = null) {
        sessionStore.clearSession()
        session = null
        dashboardState = DashboardUiState()
        createForm = emptyStaffForm()
        createError = ""
        createLoading = false
        creationMessage = ""
        jobForm = emptyJobForm()
        jobEditingId = ""
        jobError = ""
        jobLoading = false
        jobMessage = ""
        reportFromDate = monthStartDateKey()
        reportToDate = todayDateKey()
        reportLoading = false
        reportError = ""
        route = AppRoute.Login
        selectedTab = AdminTab.Overview
        if (!message.isNullOrBlank()) {
            showMessage(message)
        }
    }

    suspend fun refreshDashboard(activeSession: AdminSession, showLoader: Boolean) {
        if (showLoader) {
            dashboardState = dashboardState.copy(loading = true, error = "")
        } else {
            dashboardState = dashboardState.copy(error = "")
        }

        try {
            val moduleErrors = mutableMapOf<String, String>()

            suspend fun <T> loadOptional(
                moduleName: String,
                fallback: T,
                loader: suspend () -> T,
            ): T =
                try {
                    loader()
                } catch (error: ApiException) {
                    moduleErrors[moduleName] = error.message
                    fallback
                } catch (error: Exception) {
                    moduleErrors[moduleName] = error.localizedMessage?.takeIf { it.isNotBlank() }
                        ?: "Failed to load $moduleName."
                    fallback
                }

            val resolvedAdmin = if (activeSession.user.role == "Admin") {
                loadOptional("profile", activeSession.user) {
                    api.getAdminProfile(activeSession.token)
                }
            } else {
                activeSession.user
            }
            val isAdmin = resolvedAdmin.role == "Admin"
            val snapshot = AdminDashboardSnapshot(
                admin = resolvedAdmin,
                users = loadOptional("staff", emptyList()) {
                    api.getUsers(activeSession.token)
                },
                applications = loadOptional("applications", emptyList()) {
                    api.getStaffApplications(activeSession.token)
                },
                patients = loadOptional("patients", emptyList()) {
                    api.getPatients(activeSession.token)
                },
                appointments = loadOptional("appointments", emptyList()) {
                    api.getAppointments(activeSession.token)
                },
                mailboxItems = loadOptional("mailbox", emptyList()) {
                    api.getMailbox(activeSession.token)
                },
                services = loadOptional("services", emptyList()) {
                    api.getServices(activeSession.token)
                },
                therapyResources = loadOptional("therapy", emptyList()) {
                    api.getTherapyResources(activeSession.token)
                },
                shopProducts = loadOptional("shop products", emptyList()) {
                    api.getShopProducts(activeSession.token)
                },
                shopOrders = loadOptional("shop orders", emptyList()) {
                    api.getShopOrders(activeSession.token)
                },
                feedbackItems = if (isAdmin) {
                    loadOptional("feedback", emptyList()) {
                        api.getFeedback(activeSession.token)
                    }
                } else {
                    emptyList()
                },
                jobRequirements = if (isAdmin) {
                    loadOptional("job requirements", emptyList()) {
                        api.getJobRequirements(activeSession.token)
                    }
                } else {
                    emptyList()
                },
                reports = if (isAdmin) {
                    loadOptional("reports", null) {
                        api.getReports(activeSession.token, reportFromDate, reportToDate)
                    }
                } else {
                    null
                },
                chatConversations = loadOptional("chat", emptyList()) {
                    api.getChatConversations(activeSession.token)
                },
                treatmentTracker = loadOptional("treatment tracker", null) {
                    api.getTreatmentTracker(activeSession.token)
                },
                moduleErrors = moduleErrors,
            )
            val updatedSession = activeSession.copy(user = snapshot.admin)
            session = updatedSession
            sessionStore.saveSession(updatedSession)
            dashboardState = DashboardUiState(
                loading = false,
                admin = snapshot.admin,
                users = snapshot.users,
                applications = snapshot.applications,
                patients = snapshot.patients,
                appointments = snapshot.appointments,
                mailboxItems = snapshot.mailboxItems,
                services = snapshot.services,
                therapyResources = snapshot.therapyResources,
                shopProducts = snapshot.shopProducts,
                shopOrders = snapshot.shopOrders,
                feedbackItems = snapshot.feedbackItems,
                jobRequirements = snapshot.jobRequirements,
                reports = snapshot.reports,
                chatConversations = snapshot.chatConversations,
                treatmentTracker = snapshot.treatmentTracker,
                moduleErrors = snapshot.moduleErrors,
                error = "",
            )
        } catch (error: ApiException) {
            if (error.statusCode == 401 || error.statusCode == 403) {
                clearToLogin("Your admin session ended. Please log in again.")
            } else {
                dashboardState = dashboardState.copy(
                    loading = false,
                    error = error.message,
                )
            }
        } catch (_: Exception) {
            dashboardState = dashboardState.copy(
                loading = false,
                error = "Unable to reach the OPW server. Check that the API is running.",
            )
        }
    }

    LaunchedEffect(Unit) {
        val storedSession = sessionStore.getSession()
        if (storedSession == null) {
            route = AppRoute.Login
            dashboardState = DashboardUiState(loading = false)
        } else {
            session = storedSession
            route = AppRoute.Dashboard
            refreshDashboard(storedSession, showLoader = true)
        }
    }

    fun updateFeedbackApproval(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) {
            showMessage("Feedback id is missing.")
            return
        }

        scope.launch {
            try {
                val updated = api.updateFeedbackApproval(
                    token = activeSession.token,
                    id = id,
                    isApproved = !item.optBoolean("isApproved"),
                )
                dashboardState = dashboardState.copy(
                    feedbackItems = dashboardState.feedbackItems.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                showMessage("Feedback updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteFeedback(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) {
            showMessage("Feedback id is missing.")
            return
        }

        scope.launch {
            try {
                api.deleteFeedback(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    feedbackItems = dashboardState.feedbackItems.filterNot { it.text("id") == id },
                )
                showMessage("Feedback deleted.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun saveJobRequirement() {
        val activeSession = session ?: return
        val validation = validateJobForm(jobForm)
        if (validation != null) {
            jobError = validation
            return
        }

        jobLoading = true
        jobError = ""
        jobMessage = ""

        scope.launch {
            try {
                val editingId = jobEditingId.ifBlank { null }
                val saved = api.saveJobRequirement(
                    token = activeSession.token,
                    id = editingId,
                    payload = jobForm.toJson(),
                )
                dashboardState = dashboardState.copy(
                    jobRequirements = if (editingId == null) {
                        listOf(saved) + dashboardState.jobRequirements
                    } else {
                        dashboardState.jobRequirements.map { current ->
                            if (current.text("id") == editingId) saved else current
                        }
                    },
                )
                jobForm = emptyJobForm()
                jobEditingId = ""
                jobMessage = if (editingId == null) {
                    "Job requirement posted."
                } else {
                    "Job requirement updated."
                }
                showMessage(jobMessage)
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    jobError = error.message
                }
            } catch (error: Exception) {
                jobError = networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error)
            } finally {
                jobLoading = false
            }
        }
    }

    fun editJobRequirement(item: JSONObject) {
        jobEditingId = item.text("id")
        jobForm = item.toJobFormState()
        jobError = ""
        jobMessage = ""
        selectedTab = AdminTab.Jobs
    }

    fun updateJobRequirementStatus(item: JSONObject, status: String) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) {
            showMessage("Job requirement id is missing.")
            return
        }

        scope.launch {
            try {
                val payload = item.toJobFormState()
                    .copy(status = status, isPublished = status == "Active")
                    .toJson()
                val updated = api.saveJobRequirement(activeSession.token, id, payload)
                dashboardState = dashboardState.copy(
                    jobRequirements = dashboardState.jobRequirements.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                if (jobEditingId == id) {
                    jobForm = updated.toJobFormState()
                }
                showMessage("Job status updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteJobRequirement(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) {
            showMessage("Job requirement id is missing.")
            return
        }

        scope.launch {
            try {
                api.deleteJobRequirement(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    jobRequirements = dashboardState.jobRequirements.filterNot { it.text("id") == id },
                )
                if (jobEditingId == id) {
                    jobForm = emptyJobForm()
                    jobEditingId = ""
                }
                showMessage("Job requirement deleted.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun applyReportFilter() {
        val activeSession = session ?: return
        if (reportFromDate.isNotBlank() && reportToDate.isNotBlank() && reportFromDate > reportToDate) {
            reportError = "From date cannot be after to date."
            return
        }

        reportLoading = true
        reportError = ""

        scope.launch {
            try {
                val report = api.getReports(activeSession.token, reportFromDate, reportToDate)
                dashboardState = dashboardState.copy(reports = report)
                showMessage("Report updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    reportError = error.message
                }
            } catch (error: Exception) {
                reportError = networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error)
            } finally {
                reportLoading = false
            }
        }
    }

    fun savePatient(id: String?, payload: JSONObject) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.savePatient(activeSession.token, id, payload)
                dashboardState = dashboardState.copy(
                    patients = if (id.isNullOrBlank()) {
                        listOf(saved) + dashboardState.patients
                    } else {
                        dashboardState.patients.map { current ->
                            if (current.text("id") == id) saved else current
                        }
                    },
                )
                showMessage(if (id.isNullOrBlank()) "Patient created." else "Patient updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun archivePatient(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.archivePatient(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    patients = dashboardState.patients.filterNot { it.text("id") == id },
                )
                showMessage("Patient archived.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun approveAppointment(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        val date = item.text("requestedDate", "confirmedDate").ifBlank { todayDateKey() }
        val time = item.text("requestedTime", "confirmedTime")
        if (id.isBlank()) return
        scope.launch {
            try {
                val updated = api.approveAppointment(activeSession.token, id, date, time, "Approved from mobile app.")
                dashboardState = dashboardState.copy(
                    appointments = dashboardState.appointments.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                showMessage("Appointment approved.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun updateAppointmentStatus(item: JSONObject, status: String) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateAppointmentStatus(
                    token = activeSession.token,
                    id = id,
                    status = status,
                    remark = "Updated from mobile app.",
                )
                dashboardState = dashboardState.copy(
                    appointments = dashboardState.appointments.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                showMessage("Appointment updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun updateMailboxRead(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        val type = item.text("type")
        if (id.isBlank() || type.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateMailboxRead(activeSession.token, type, id, !item.optBoolean("isRead"))
                dashboardState = dashboardState.copy(
                    mailboxItems = dashboardState.mailboxItems.map { current ->
                        if (current.text("id") == id && current.text("type") == type) updated else current
                    },
                )
                showMessage("Mailbox updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun saveService(id: String?, name: String) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.saveService(activeSession.token, id, name)
                dashboardState = dashboardState.copy(
                    services = if (id.isNullOrBlank()) {
                        listOf(saved) + dashboardState.services
                    } else {
                        dashboardState.services.map { current ->
                            if (current.text("id") == id) saved else current
                        }
                    },
                )
                showMessage(if (id.isNullOrBlank()) "Service created." else "Service updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteService(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deleteService(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    services = dashboardState.services.filterNot { it.text("id") == id },
                )
                showMessage("Service deleted.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteTherapyResource(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deleteTherapyResource(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    therapyResources = dashboardState.therapyResources.filterNot { it.text("id") == id },
                )
                showMessage("Therapy resource deleted.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun updateShopOrderStatus(item: JSONObject, status: String) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateShopOrderStatus(activeSession.token, id, status)
                dashboardState = dashboardState.copy(
                    shopOrders = dashboardState.shopOrders.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                showMessage("Shop order updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun saveShopProduct(id: String?, payload: JSONObject) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.saveShopProduct(activeSession.token, id, payload)
                dashboardState = dashboardState.copy(
                    shopProducts = if (id.isNullOrBlank()) {
                        listOf(saved) + dashboardState.shopProducts
                    } else {
                        dashboardState.shopProducts.map { current ->
                            if (current.text("id") == id) saved else current
                        }
                    },
                )
                showMessage(if (id.isNullOrBlank()) "Product created." else "Product updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteShopProduct(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deleteShopProduct(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    shopProducts = dashboardState.shopProducts.filterNot { it.text("id") == id },
                )
                showMessage("Product deleted.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    Scaffold(
        containerColor = OpwMist,
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when (route) {
                AppRoute.Loading -> LoadingScreen()
                AppRoute.Login -> LoginScreen(
                    loading = loginLoading,
                    testLoading = apiTestLoading,
                    apiTestMessage = apiTestMessage,
                    apiTestIsSuccess = apiTestIsSuccess,
                    onTestApi = {
                        apiTestLoading = true
                        apiTestMessage = ""
                        apiTestIsSuccess = false
                        scope.launch {
                            try {
                                val message = api.checkHealth()
                                apiTestMessage = message
                                apiTestIsSuccess = true
                            } catch (error: Exception) {
                                apiTestMessage = networkErrorMessage(
                                    StaffApiService.DEFAULT_BASE_URL,
                                    error,
                                )
                            } finally {
                                apiTestLoading = false
                            }
                        }
                    },
                    onLogin = { email, password ->
                        loginLoading = true
                        scope.launch {
                            try {
                                val nextSession = api.loginAdmin(email, password)
                                sessionStore.saveSession(nextSession)
                                session = nextSession
                                route = AppRoute.Dashboard
                                selectedTab = AdminTab.Overview
                                showMessage("Welcome back, ${nextSession.user.name}.")
                                refreshDashboard(nextSession, showLoader = true)
                            } catch (error: ApiException) {
                                showMessage(error.message)
                            } catch (error: Exception) {
                                showMessage(
                                    networkErrorMessage(
                                        StaffApiService.DEFAULT_BASE_URL,
                                        error,
                                    ),
                                )
                            } finally {
                                loginLoading = false
                            }
                        }
                    },
                )

                AppRoute.Dashboard -> DashboardScreen(
                    session = session,
                    state = dashboardState,
                    selectedTab = selectedTab,
                    formState = createForm,
                    formError = createError,
                    formLoading = createLoading,
                    creationMessage = creationMessage,
                    jobForm = jobForm,
                    jobEditingId = jobEditingId,
                    jobError = jobError,
                    jobLoading = jobLoading,
                    jobMessage = jobMessage,
                    reportFromDate = reportFromDate,
                    reportToDate = reportToDate,
                    reportLoading = reportLoading,
                    reportError = reportError,
                    onTabSelected = { selectedTab = it },
                    onRefresh = {
                        session?.let { activeSession ->
                            scope.launch { refreshDashboard(activeSession, showLoader = true) }
                        }
                    },
                    onLogout = {
                        val activeSession = session
                        scope.launch {
                            if (activeSession != null) {
                                runCatching {
                                    api.logoutSession(activeSession.token, activeSession.user.id)
                                }
                            }
                            clearToLogin("Logged out successfully.")
                        }
                    },
                    onFeedbackApprovalChange = ::updateFeedbackApproval,
                    onFeedbackDelete = ::deleteFeedback,
                    onJobFormChange = {
                        jobForm = it
                        jobError = ""
                        if (jobMessage.isNotBlank()) {
                            jobMessage = ""
                        }
                    },
                    onJobSave = ::saveJobRequirement,
                    onJobCancelEdit = {
                        jobForm = emptyJobForm()
                        jobEditingId = ""
                        jobError = ""
                        jobMessage = ""
                    },
                    onJobEdit = ::editJobRequirement,
                    onJobStatusChange = ::updateJobRequirementStatus,
                    onJobDelete = ::deleteJobRequirement,
                    onReportRangeChange = { fromDate, toDate ->
                        reportFromDate = fromDate
                        reportToDate = toDate
                        reportError = ""
                    },
                    onReportApply = ::applyReportFilter,
                    onPatientSave = ::savePatient,
                    onPatientArchive = ::archivePatient,
                    onAppointmentApprove = ::approveAppointment,
                    onAppointmentStatusChange = ::updateAppointmentStatus,
                    onMailboxReadChange = ::updateMailboxRead,
                    onServiceSave = ::saveService,
                    onServiceDelete = ::deleteService,
                    onTherapyDelete = ::deleteTherapyResource,
                    onShopOrderStatusChange = ::updateShopOrderStatus,
                    onShopProductSave = ::saveShopProduct,
                    onShopProductDelete = ::deleteShopProduct,
                    onFormChange = {
                        createForm = it
                        createError = ""
                        if (creationMessage.isNotBlank()) {
                            creationMessage = ""
                        }
                    },
                    onCreateStaff = {
                        val activeSession = session ?: return@DashboardScreen
                        val validationError = validateCreateStaffForm(createForm)
                        if (validationError != null) {
                            createError = validationError
                            return@DashboardScreen
                        }

                        createLoading = true
                        createError = ""
                        creationMessage = ""

                        scope.launch {
                            try {
                                api.createStaff(
                                    token = activeSession.token,
                                    payload = CreateStaffRequest(
                                        name = createForm.name.trim(),
                                        email = createForm.email.trim(),
                                        mobile = createForm.mobile.trim(),
                                        role = createForm.role,
                                        status = createForm.status,
                                        chatEnabled = createForm.chatEnabled,
                                        workType = createForm.workType.trim(),
                                        password = createForm.password,
                                        permissions = if (createForm.role == "Admin") {
                                            emptyList()
                                        } else {
                                            createForm.permissions
                                        },
                                    ),
                                )
                                creationMessage = "Staff member created successfully."
                                createForm = emptyStaffForm()
                                selectedTab = AdminTab.Team
                                showMessage("New staff member added.")
                                refreshDashboard(activeSession, showLoader = false)
                            } catch (error: ApiException) {
                                if (error.statusCode == 401 || error.statusCode == 403) {
                                    clearToLogin("Your admin session ended. Please log in again.")
                                } else {
                                    createError = error.message
                                }
                            } catch (_: Exception) {
                                createError = "Unable to reach the OPW server right now."
                            } finally {
                                createLoading = false
                            }
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(appBackgroundBrush()),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .background(Brush.linearGradient(listOf(OpwBlue, OpwAqua)), RoundedCornerShape(28.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text("OPW", color = Color.White, fontWeight = FontWeight.ExtraBold)
            }
            CircularProgressIndicator(color = OpwBlue)
            Text(
                text = "Preparing OPW staff workspace",
                style = MaterialTheme.typography.titleMedium,
                color = OpwInk,
            )
        }
    }
}

@Composable
private fun LoginScreen(
    loading: Boolean,
    testLoading: Boolean,
    apiTestMessage: String,
    apiTestIsSuccess: Boolean,
    onTestApi: () -> Unit,
    onLogin: (String, String) -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("contact@ommphysioworld.com") }
    var password by rememberSaveable { mutableStateOf("123456") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFFE8F2FF), Color(0xFFF8FBFF), Color(0xFFFFFFFF)),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .border(1.dp, Color.White.copy(alpha = 0.85f), RoundedCornerShape(36.dp)),
            shape = RoundedCornerShape(36.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 14.dp),
        ) {
            Column(
                modifier = Modifier
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.White, Color(0xFFF6FAFF)),
                        ),
                    )
                    .padding(horizontal = 22.dp, vertical = 26.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(Brush.linearGradient(listOf(OpwBlue, OpwAqua)), RoundedCornerShape(24.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("OPW", color = Color.White, fontWeight = FontWeight.ExtraBold)
                }
                Text(
                    text = "OPW Staff Admin",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = OpwInk,
                )
                Text(
                    text = "Sign in with an admin or staff account to check team activity, review staff applications, and create new staff records.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF475569),
                )

                if (apiTestMessage.isNotBlank()) {
                    StatusBanner(
                        message = apiTestMessage,
                        tone = if (apiTestIsSuccess) BannerTone.Success else BannerTone.Error,
                    )
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                )

                OutlinedButton(
                    onClick = onTestApi,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !loading && !testLoading,
                ) {
                    Text(if (testLoading) "Testing API..." else "Test API")
                }

                Button(
                    onClick = { onLogin(email, password) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !loading,
                ) {
                    Text(if (loading) "Signing in..." else "Open Admin Panel")
                }
            }
        }
    }
}

@Composable
private fun DashboardScreen(
    session: AdminSession?,
    state: DashboardUiState,
    selectedTab: AdminTab,
    formState: StaffFormState,
    formError: String,
    formLoading: Boolean,
    creationMessage: String,
    jobForm: JobFormState,
    jobEditingId: String,
    jobError: String,
    jobLoading: Boolean,
    jobMessage: String,
    reportFromDate: String,
    reportToDate: String,
    reportLoading: Boolean,
    reportError: String,
    onTabSelected: (AdminTab) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onFeedbackApprovalChange: (JSONObject) -> Unit,
    onFeedbackDelete: (JSONObject) -> Unit,
    onJobFormChange: (JobFormState) -> Unit,
    onJobSave: () -> Unit,
    onJobCancelEdit: () -> Unit,
    onJobEdit: (JSONObject) -> Unit,
    onJobStatusChange: (JSONObject, String) -> Unit,
    onJobDelete: (JSONObject) -> Unit,
    onReportRangeChange: (String, String) -> Unit,
    onReportApply: () -> Unit,
    onPatientSave: (String?, JSONObject) -> Unit,
    onPatientArchive: (JSONObject) -> Unit,
    onAppointmentApprove: (JSONObject) -> Unit,
    onAppointmentStatusChange: (JSONObject, String) -> Unit,
    onMailboxReadChange: (JSONObject) -> Unit,
    onServiceSave: (String?, String) -> Unit,
    onServiceDelete: (JSONObject) -> Unit,
    onTherapyDelete: (JSONObject) -> Unit,
    onShopOrderStatusChange: (JSONObject, String) -> Unit,
    onShopProductSave: (String?, JSONObject) -> Unit,
    onShopProductDelete: (JSONObject) -> Unit,
    onFormChange: (StaffFormState) -> Unit,
    onCreateStaff: () -> Unit,
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val isAdmin = (state.admin ?: session?.user)?.role == "Admin"
    val visibleTabs = AdminTab.entries.filter { tab -> !tab.adminOnly || isAdmin }
    val activeAdmins = state.users.count { it.role == "Admin" }
    val activeStaff = state.users.count { it.role != "Admin" && it.status != "Inactive" }
    val unreadMailbox = state.mailboxItems.count { !it.optBoolean("isRead") }
    val mailboxTotal = if (state.mailboxItems.isNotEmpty()) {
        state.mailboxItems.size
    } else {
        state.applications.size
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.Transparent,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(drawerBrush())
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(30.dp),
                        color = Color.White.copy(alpha = 0.08f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .background(
                                        Brush.linearGradient(listOf(OpwSky, OpwAqua)),
                                        RoundedCornerShape(18.dp),
                                    ),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "OPW",
                                    color = OpwNavy,
                                    fontWeight = FontWeight.ExtraBold,
                                    style = MaterialTheme.typography.labelLarge,
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Omm Physio World",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                )
                                Text(
                                    text = if (isAdmin) "Admin Suite" else "Staff Suite",
                                    color = Color.White.copy(alpha = 0.58f),
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                            }
                            StatusChip(
                                label = "LIVE",
                                background = OpwSuccess.copy(alpha = 0.18f),
                                foreground = Color(0xFFBBF7D0),
                            )
                        }
                    }

                    Text(
                        text = "WORKSPACE",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White.copy(alpha = 0.38f),
                        modifier = Modifier.padding(top = 10.dp, start = 8.dp),
                    )
                    visibleTabs.forEach { tab ->
                        val accent = moduleAccent(tab)
                        NavigationDrawerItem(
                            label = {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .background(accent, CircleShape),
                                        )
                                        Text(
                                            text = tab.label,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                    val count = moduleCount(tab, state)
                                    if (count > 0) {
                                        StatusChip(
                                            label = count.toString(),
                                            background = Color.White.copy(alpha = 0.12f),
                                            foreground = Color.White.copy(alpha = 0.84f),
                                        )
                                    }
                                }
                            },
                            selected = selectedTab == tab,
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = Color.White,
                                selectedTextColor = OpwInk,
                                unselectedContainerColor = Color.Transparent,
                                unselectedTextColor = Color.White.copy(alpha = 0.72f),
                            ),
                            onClick = {
                                onTabSelected(tab)
                                scope.launch { drawerState.close() }
                            },
                        )
                    }
                }
            }
        },
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(appBackgroundBrush()),
        ) {
            Scaffold(containerColor = Color.Transparent) { innerPadding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    HeroHeader(
                        selectedTab = selectedTab,
                        adminName = state.admin?.name ?: session?.user?.name.orEmpty(),
                        adminRole = state.admin?.role ?: session?.user?.role.orEmpty(),
                        teamCount = state.users.size,
                        mailboxCount = mailboxTotal,
                        onMenu = { scope.launch { drawerState.open() } },
                        onRefresh = onRefresh,
                        onLogout = onLogout,
                    )

                    if (state.loading) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color = moduleAccent(selectedTab),
                            trackColor = Color.White,
                        )
                    }

                    if (state.error.isNotBlank()) {
                        StatusBanner(message = state.error, tone = BannerTone.Error)
                    }

                    moduleErrorsForTab(selectedTab, state).forEach { error ->
                        StatusBanner(message = error, tone = BannerTone.Info)
                    }

                    when (selectedTab) {
                    AdminTab.Overview -> OverviewTab(
                        admin = state.admin ?: session?.user,
                        users = state.users,
                        applications = state.applications,
                        activeAdmins = activeAdmins,
                        activeStaff = activeStaff,
                        unreadApplications = unreadMailbox,
                        state = state,
                    )

                    AdminTab.Patients -> PatientsTab(
                        patients = state.patients,
                        onSave = onPatientSave,
                        onArchive = onPatientArchive,
                    )
                    AdminTab.Appointments -> AppointmentsTab(
                        appointments = state.appointments,
                        onApprove = onAppointmentApprove,
                        onStatusChange = onAppointmentStatusChange,
                    )
                    AdminTab.Treatment -> TreatmentTab(tracker = state.treatmentTracker)
                    AdminTab.Mailbox -> MailboxTab(
                        items = state.mailboxItems,
                        applications = state.applications,
                        onReadChange = onMailboxReadChange,
                    )
                    AdminTab.Services -> ServicesTab(
                        services = state.services,
                        onSave = onServiceSave,
                        onDelete = onServiceDelete,
                    )
                    AdminTab.Therapy -> TherapyTab(
                        resources = state.therapyResources,
                        onDelete = onTherapyDelete,
                    )
                    AdminTab.Shop -> ShopTab(
                        products = state.shopProducts,
                        orders = state.shopOrders,
                        onOrderStatusChange = onShopOrderStatusChange,
                        onProductSave = onShopProductSave,
                        onProductDelete = onShopProductDelete,
                    )
                    AdminTab.Feedback -> FeedbackTab(
                        items = state.feedbackItems,
                        onToggleApproval = onFeedbackApprovalChange,
                        onDelete = onFeedbackDelete,
                    )
                    AdminTab.Jobs -> JobRequirementsTab(
                        requirements = state.jobRequirements,
                        form = jobForm,
                        editingId = jobEditingId,
                        error = jobError,
                        loading = jobLoading,
                        message = jobMessage,
                        onFormChange = onJobFormChange,
                        onSave = onJobSave,
                        onCancelEdit = onJobCancelEdit,
                        onEdit = onJobEdit,
                        onStatusChange = onJobStatusChange,
                        onDelete = onJobDelete,
                    )
                    AdminTab.Reports -> ReportsTab(
                        report = state.reports,
                        fromDate = reportFromDate,
                        toDate = reportToDate,
                        loading = reportLoading,
                        error = reportError,
                        onRangeChange = onReportRangeChange,
                        onApply = onReportApply,
                    )
                    AdminTab.Chat -> ChatTab(conversations = state.chatConversations)
                    AdminTab.Team -> TeamTab(users = state.users)
                    AdminTab.Create -> CreateStaffTab(
                        formState = formState,
                        error = formError,
                        loading = formLoading,
                        creationMessage = creationMessage,
                        onFormChange = onFormChange,
                        onSubmit = onCreateStaff,
                    )

                    AdminTab.Profile -> ProfileTab(user = state.admin ?: session?.user)
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroHeader(
    selectedTab: AdminTab,
    adminName: String,
    adminRole: String,
    teamCount: Int,
    mailboxCount: Int,
    onMenu: () -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    val accent = moduleAccent(selectedTab)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color.White.copy(alpha = 0.26f), RoundedCornerShape(34.dp))
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF06131F), Color(0xFF0F2A44), accent),
                ),
                shape = RoundedCornerShape(34.dp),
            )
            .padding(22.dp),
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .background(Color.White.copy(alpha = 0.07f), CircleShape)
                .align(Alignment.TopEnd),
        )
        Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    StatusChip(
                        label = selectedTab.label.uppercase(),
                        background = Color.White.copy(alpha = 0.16f),
                        foreground = Color.White,
                    )
                    Text(
                        text = if (adminName.isBlank()) "Staff workspace" else "Welcome, $adminName",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                    )
                    Text(
                        text = moduleCaption(selectedTab),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.76f),
                    )
                }
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .background(Color.White.copy(alpha = 0.18f), RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = adminName.take(1).ifBlank { "S" }.uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        style = MaterialTheme.typography.titleLarge,
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                HeaderMetric(
                    label = "Role",
                    value = adminRole.ifBlank { "Staff" },
                    modifier = Modifier.weight(1f),
                )
                HeaderMetric(
                    label = "Team",
                    value = teamCount.toString(),
                    modifier = Modifier.weight(1f),
                )
                HeaderMetric(
                    label = "Mailbox",
                    value = mailboxCount.toString(),
                    modifier = Modifier.weight(1f),
                )
            }

            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                HeaderActionButton(label = "Menu", onClick = onMenu)
                HeaderActionButton(label = "Refresh", onClick = onRefresh)
                TextButton(onClick = onLogout) {
                    Text("Logout", color = Color.White.copy(alpha = 0.88f), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun HeaderMetric(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Color.White.copy(alpha = 0.12f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.14f)),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = label.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = Color.White.copy(alpha = 0.48f),
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
private fun HeaderActionButton(
    label: String,
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = Color.White.copy(alpha = 0.14f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f)),
        onClick = onClick,
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun ModuleHeader(
    title: String,
    subtitle: String,
    countLabel: String,
    accent: Color = OpwBlue,
) {
    Surface(
        shape = RoundedCornerShape(28.dp),
        color = OpwCard,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5EDF7)),
        shadowElevation = 4.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(accent.copy(alpha = 0.12f), RoundedCornerShape(18.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .background(accent, CircleShape),
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = OpwInk,
                )
                Text(
                    text = subtitle,
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            StatusChip(
                label = countLabel,
                background = accent.copy(alpha = 0.1f),
                foreground = accent,
            )
        }
    }
}

@Composable
private fun PremiumPanel(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, Color.White.copy(alpha = 0.72f), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp),
        color = Color.White.copy(alpha = 0.88f),
        shadowElevation = 4.dp,
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White, Color(0xFFF8FBFF)),
                    ),
                )
                .padding(18.dp),
        ) {
            content()
        }
    }
}

@Composable
private fun AccentOrb(
    accent: Color,
    label: String,
) {
    Box(
        modifier = Modifier
            .size(46.dp)
            .background(
                Brush.linearGradient(listOf(accent.copy(alpha = 0.95f), accent.copy(alpha = 0.55f))),
                RoundedCornerShape(17.dp),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label.take(1).uppercase(),
            color = Color.White,
            fontWeight = FontWeight.ExtraBold,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun CardActionRow(
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFFF8FAFC),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            content()
        }
    }
}

@Composable
private fun ModernFieldShell(
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(26.dp),
        color = Color.White.copy(alpha = 0.9f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5EDF7)),
        shadowElevation = 2.dp,
    ) {
        Box(modifier = Modifier.padding(14.dp)) {
            content()
        }
    }
}

@Composable
private fun OverviewTab(
    admin: StaffUser?,
    users: List<StaffUser>,
    applications: List<StaffApplication>,
    activeAdmins: Int,
    activeStaff: Int,
    unreadApplications: Int,
    state: DashboardUiState,
) {
    val chatReady = users.count { it.chatEnabled && it.status != "Inactive" }
    val newestApplication = applications.firstOrNull()

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Admins",
                value = activeAdmins.toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Active Staff",
                value = activeStaff.toString(),
                accent = OpwSuccess,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Chat Ready",
                value = chatReady.toString(),
                accent = OpwWarning,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Unread Mail",
                value = unreadApplications.toString(),
                accent = OpwDanger,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Patients",
                value = state.patients.size.toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Appointments",
                value = state.appointments.size.toString(),
                accent = OpwSuccess,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Shop Orders",
                value = state.shopOrders.size.toString(),
                accent = OpwWarning,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Therapy Files",
                value = state.therapyResources.size.toString(),
                accent = OpwDanger,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Pending Feedback",
                value = state.feedbackItems.count { !it.optBoolean("isApproved") }.toString(),
                accent = OpwWarning,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Active Jobs",
                value = state.jobRequirements.count {
                    it.text("status", fallback = "Active") == "Active" && it.optBoolean("isPublished", true)
                }.toString(),
                accent = OpwSuccess,
            )
        }

        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            shadowElevation = 4.dp,
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "Today at a glance",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OpwInk,
                )
                Text(
                    text = buildString {
                        append(admin?.name ?: "Admin")
                        append(" can use this mobile panel to check staff coverage, review incoming staff interest, and create new staff accounts on the go.")
                    },
                    color = Color(0xFF475569),
                )
                DividerLine()
                Text(
                    text = "Latest application",
                    fontWeight = FontWeight.Bold,
                    color = OpwInk,
                )
                if (newestApplication == null) {
                    Text("No staff applications yet.", color = Color(0xFF64748B))
                } else {
                    Text(
                        text = "${newestApplication.name} applied for ${newestApplication.role.ifBlank { "an open role" }}",
                        color = OpwInk,
                    )
                    Text(
                        text = formatTimestamp(newestApplication.createdAt),
                        color = Color(0xFF64748B),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}

@Composable
private fun TeamTab(users: List<StaffUser>) {
    var query by rememberSaveable { mutableStateOf("") }
    val filteredUsers = remember(users, query) {
        users.filter { user ->
            val keyword = query.trim().lowercase()
            keyword.isBlank() ||
                user.name.lowercase().contains(keyword) ||
                user.email.lowercase().contains(keyword) ||
                user.mobile.contains(keyword) ||
                user.workType.lowercase().contains(keyword) ||
                user.role.lowercase().contains(keyword)
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search staff") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )

        if (filteredUsers.isEmpty()) {
            EmptyStateCard(
                title = "No staff found",
                message = "Try another search term or add a new staff member from the Create tab.",
            )
        } else {
            filteredUsers.forEach { user ->
                StaffCard(user = user)
            }
        }
    }
}

@Composable
private fun PatientsTab(
    patients: List<JSONObject>,
    onSave: (String?, JSONObject) -> Unit,
    onArchive: (JSONObject) -> Unit,
) {
    var editingId by rememberSaveable { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var mobile by rememberSaveable { mutableStateOf("") }
    var disease by rememberSaveable { mutableStateOf("") }
    var notes by rememberSaveable { mutableStateOf("") }
    var formError by rememberSaveable { mutableStateOf("") }

    fun resetForm() {
        editingId = ""
        name = ""
        email = ""
        mobile = ""
        disease = ""
        notes = ""
        formError = ""
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Card(
            modifier = Modifier.border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    SectionTitle(if (editingId.isBlank()) "Add Patient" else "Edit Patient")
                    if (editingId.isNotBlank()) {
                        TextButton(onClick = ::resetForm) {
                            Text("Cancel")
                        }
                    }
                }
                if (formError.isNotBlank()) {
                    StatusBanner(message = formError, tone = BannerTone.Error)
                }
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        formError = ""
                    },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = {
                        email = it
                        formError = ""
                    },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                )
                OutlinedTextField(
                    value = mobile,
                    onValueChange = {
                        mobile = it.filter { char -> char.isDigit() }.take(10)
                        formError = ""
                    },
                    label = { Text("Mobile") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                )
                OutlinedTextField(
                    value = disease,
                    onValueChange = { disease = it },
                    label = { Text("Disease") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                )
                Button(
                    onClick = {
                        when {
                            name.trim().length < 2 -> formError = "Patient name must be at least 2 characters."
                            !Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches() -> formError = "Enter a valid email."
                            !mobile.trim().matches(Regex("\\d{10}")) -> formError = "Enter a valid 10-digit mobile."
                            else -> {
                                onSave(
                                    editingId.ifBlank { null },
                                    JSONObject()
                                        .put("name", name.trim())
                                        .put("email", email.trim())
                                        .put("mobile", mobile.trim())
                                        .put("disease", disease.trim())
                                        .put("notes", notes.trim()),
                                )
                                resetForm()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (editingId.isBlank()) "Create Patient" else "Update Patient")
                }
            }
        }

        JsonListTab(
            title = "Patients",
            emptyTitle = "No patients found",
            emptyMessage = "Patient records from the live admin API will appear here.",
            items = patients,
            searchableFields = listOf("name", "email", "mobile", "disease"),
        ) { patient ->
            RecordCard(
                title = patient.text("name", fallback = "Patient"),
                subtitle = patient.text("email", fallback = "No email"),
                status = patient.text("createdFrom", fallback = "Admin").createdFromLabel(),
                rows = listOf(
                    "Mobile" to patient.text("mobile", fallback = "Not provided"),
                    "Disease" to patient.text("disease", fallback = "Not set"),
                    "Appointments" to patient.array("appointments").length().toString(),
                    "Treatment plans" to patient.array("treatmentPlans").length().toString(),
                    "Updated" to formatTimestamp(patient.text("updatedAt")),
                ),
                actions = {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(
                            onClick = {
                                editingId = patient.text("id")
                                name = patient.text("name")
                                email = patient.text("email")
                                mobile = patient.text("mobile")
                                disease = patient.text("disease")
                                notes = patient.text("notes")
                                formError = ""
                            },
                        ) {
                            Text("Edit")
                        }
                        OutlinedButton(onClick = { onArchive(patient) }) {
                            Text("Archive")
                        }
                    }
                },
            )
        }
    }
}

@Composable
private fun AppointmentsTab(
    appointments: List<JSONObject>,
    onApprove: (JSONObject) -> Unit,
    onStatusChange: (JSONObject, String) -> Unit,
) {
    JsonListTab(
        title = "Appointment Requests",
        emptyTitle = "No appointment requests",
        emptyMessage = "New appointment requests and decisions will appear here.",
        items = appointments,
        searchableFields = listOf("name", "email", "phone", "service", "status"),
    ) { appointment ->
        val status = appointment.text("status", fallback = "pending")
        RecordCard(
            title = appointment.text("name", fallback = "Appointment"),
            subtitle = appointment.text("service", fallback = "Service not set"),
            status = status.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() },
            statusColor = statusColor(status),
            rows = listOf(
                "Phone" to appointment.text("phone", fallback = "Not provided"),
                "Requested" to scheduleLabel(
                    appointment.text("requestedDate"),
                    appointment.text("requestedTime"),
                ),
                "Confirmed" to scheduleLabel(
                    appointment.text("confirmedDate"),
                    appointment.text("confirmedTime"),
                ),
                "Note" to appointment.text("decisionNote", "message", fallback = "No note"),
                "Created" to formatTimestamp(appointment.text("createdAt")),
            ),
            actions = {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (status != "approved" && status != "completed" && status != "cancelled") {
                        OutlinedButton(onClick = { onApprove(appointment) }) {
                            Text("Approve")
                        }
                    }
                    if (status != "completed") {
                        OutlinedButton(onClick = { onStatusChange(appointment, "completed") }) {
                            Text("Done")
                        }
                    }
                    if (status != "cancelled") {
                        OutlinedButton(onClick = { onStatusChange(appointment, "cancelled") }) {
                            Text("Cancel")
                        }
                    }
                }
            },
        )
    }
}

@Composable
private fun TreatmentTab(tracker: JSONObject?) {
    if (tracker == null) {
        EmptyStateCard(
            title = "Treatment tracker unavailable",
            message = "Refresh after login to load appointments, sessions, and follow-up records.",
        )
        return
    }

    val todaysSessions = tracker.array("todaysSessions").toJsonObjects()
    val todaysAppointments = tracker.array("todaysAppointments").toJsonObjects()
    val followUps = tracker.array("followUpNeeded").toJsonObjects()
    val activeSessions = tracker.array("activeSessions").toJsonObjects()

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Today Sessions",
                value = todaysSessions.size.toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Follow Ups",
                value = followUps.size.toString(),
                accent = OpwWarning,
            )
        }

        SectionTitle("Today's Sessions")
        if (todaysSessions.isEmpty()) {
            EmptyStateCard("No sessions today", "Treatment sessions scheduled for today will appear here.")
        } else {
            todaysSessions.take(12).forEach { session ->
                RecordCard(
                    title = session.text("patientName", fallback = "Patient"),
                    subtitle = session.text("treatmentTypes", "service", fallback = "Treatment session"),
                    status = session.text("status", fallback = "not_done").sessionStatusLabel(),
                    rows = listOf(
                        "Mobile" to session.text("patientMobile", fallback = "Not provided"),
                        "Date" to session.text("date", fallback = "Not set"),
                    ),
                )
            }
        }

        SectionTitle("Today's Appointments")
        todaysAppointments.take(8).forEach { appointment ->
            RecordCard(
                title = appointment.text("name", fallback = "Appointment"),
                subtitle = appointment.text("service", fallback = "Service"),
                status = appointment.text("status", fallback = "pending"),
                rows = listOf(
                    "Phone" to appointment.text("phone", fallback = "Not provided"),
                    "Schedule" to scheduleLabel(appointment.text("confirmedDate"), appointment.text("confirmedTime")),
                ),
            )
        }

        SectionTitle("Active Treatment")
        activeSessions.take(8).forEach { patient ->
            val plan = patient.objectValue("activeTreatmentPlan")
            RecordCard(
                title = patient.text("patientName", "name", fallback = "Patient"),
                subtitle = plan?.array("treatmentTypes")?.joinLabels().orEmpty().ifBlank { "Active plan" },
                status = "Active",
                rows = listOf(
                    "From" to (plan?.text("fromDate", fallback = "Not set") ?: "Not set"),
                    "To" to (plan?.text("toDate", fallback = "Not set") ?: "Not set"),
                    "Balance" to formatMoney(plan?.opt("balanceAmount")),
                ),
            )
        }
    }
}

@Composable
private fun MailboxTab(
    items: List<JSONObject>,
    applications: List<StaffApplication>,
    onReadChange: (JSONObject) -> Unit,
) {
    if (items.isEmpty()) {
        InboxTab(applications = applications)
        return
    }

    JsonListTab(
        title = "Mailbox",
        emptyTitle = "No messages",
        emptyMessage = "Career and contact messages will appear here.",
        items = items,
        searchableFields = listOf("title", "senderName", "senderEmail", "subject", "summary", "type"),
    ) { item ->
        RecordCard(
            title = item.text("title", fallback = "Message"),
            subtitle = item.text("subject", fallback = item.text("type", fallback = "Mailbox")),
            status = if (item.optBoolean("isRead")) "Read" else "New",
            statusColor = if (item.optBoolean("isRead")) Color(0xFF64748B) else OpwBlue,
            rows = listOf(
                "Sender" to item.text("senderName", fallback = "Unknown"),
                "Email" to item.text("senderEmail", fallback = "Not provided"),
                "Phone" to item.text("senderPhone", fallback = "Not provided"),
                "Summary" to item.text("summary", "message", fallback = "No message"),
                "Created" to formatTimestamp(item.text("createdAt")),
            ),
            actions = {
                OutlinedButton(onClick = { onReadChange(item) }) {
                    Text(if (item.optBoolean("isRead")) "Mark Unread" else "Mark Read")
                }
            },
        )
    }
}

@Composable
private fun ServicesTab(
    services: List<JSONObject>,
    onSave: (String?, String) -> Unit,
    onDelete: (JSONObject) -> Unit,
) {
    var editingId by rememberSaveable { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf("") }

    fun resetForm() {
        editingId = ""
        name = ""
        error = ""
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Card(
            modifier = Modifier.border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    SectionTitle(if (editingId.isBlank()) "Add Service" else "Edit Service")
                    if (editingId.isNotBlank()) {
                        TextButton(onClick = ::resetForm) {
                            Text("Cancel")
                        }
                    }
                }
                if (error.isNotBlank()) {
                    StatusBanner(message = error, tone = BannerTone.Error)
                }
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        error = ""
                    },
                    label = { Text("Service name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Button(
                    onClick = {
                        if (name.trim().length < 2) {
                            error = "Service name must be at least 2 characters."
                        } else {
                            onSave(editingId.ifBlank { null }, name.trim())
                            resetForm()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (editingId.isBlank()) "Create Service" else "Update Service")
                }
            }
        }

        JsonListTab(
            title = "Services",
            emptyTitle = "No services",
            emptyMessage = "Clinic services managed on the web admin will appear here.",
            items = services,
            searchableFields = listOf("name"),
        ) { service ->
            RecordCard(
                title = service.text("name", fallback = "Service"),
                subtitle = "Clinic service",
                status = "Live",
                rows = listOf(
                    "Created" to formatTimestamp(service.text("createdAt")),
                    "Updated" to formatTimestamp(service.text("updatedAt")),
                ),
                actions = {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(
                            onClick = {
                                editingId = service.text("id")
                                name = service.text("name")
                                error = ""
                            },
                        ) {
                            Text("Edit")
                        }
                        OutlinedButton(onClick = { onDelete(service) }) {
                            Text("Delete")
                        }
                    }
                },
            )
        }
    }
}

@Composable
private fun TherapyTab(
    resources: List<JSONObject>,
    onDelete: (JSONObject) -> Unit,
) {
    JsonListTab(
        title = "Therapy Library",
        emptyTitle = "No therapy resources",
        emptyMessage = "Uploaded exercise files and therapy resources will appear here.",
        items = resources,
        searchableFields = listOf("title", "serviceName", "description", "fileName", "resourceType"),
    ) { resource ->
        RecordCard(
            title = resource.text("title", fallback = "Therapy resource"),
            subtitle = resource.text("serviceName", fallback = "General therapy"),
            status = resource.text("resourceType", fallback = "file").uppercase(),
            rows = listOf(
                "File" to resource.text("fileName", fallback = "Not provided"),
                "Type" to resource.text("mimeType", fallback = "Unknown"),
                "Size" to formatBytes(resource.optLong("sizeBytes", 0)),
                "Updated" to formatTimestamp(resource.text("updatedAt")),
            ),
            actions = {
                OutlinedButton(onClick = { onDelete(resource) }) {
                    Text("Delete")
                }
            },
        )
    }
}

@Composable
private fun ShopTab(
    products: List<JSONObject>,
    orders: List<JSONObject>,
    onOrderStatusChange: (JSONObject, String) -> Unit,
    onProductSave: (String?, JSONObject) -> Unit,
    onProductDelete: (JSONObject) -> Unit,
) {
    var editingProductId by rememberSaveable { mutableStateOf("") }
    var productName by rememberSaveable { mutableStateOf("") }
    var productCategory by rememberSaveable { mutableStateOf("") }
    var productDescription by rememberSaveable { mutableStateOf("") }
    var productPrice by rememberSaveable { mutableStateOf("") }
    var productStock by rememberSaveable { mutableStateOf("0") }
    var productActive by rememberSaveable { mutableStateOf(true) }
    var productError by rememberSaveable { mutableStateOf("") }

    fun resetProductForm() {
        editingProductId = ""
        productName = ""
        productCategory = ""
        productDescription = ""
        productPrice = ""
        productStock = "0"
        productActive = true
        productError = ""
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Products",
                value = products.size.toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Orders",
                value = orders.size.toString(),
                accent = OpwWarning,
            )
        }

        Card(
            modifier = Modifier.border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    SectionTitle(if (editingProductId.isBlank()) "Add Product" else "Edit Product")
                    if (editingProductId.isNotBlank()) {
                        TextButton(onClick = ::resetProductForm) {
                            Text("Cancel")
                        }
                    }
                }
                if (productError.isNotBlank()) {
                    StatusBanner(message = productError, tone = BannerTone.Error)
                }
                OutlinedTextField(
                    value = productName,
                    onValueChange = {
                        productName = it
                        productError = ""
                    },
                    label = { Text("Product name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = productCategory,
                    onValueChange = { productCategory = it },
                    label = { Text("Category") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = productDescription,
                    onValueChange = { productDescription = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                )
                OutlinedTextField(
                    value = productPrice,
                    onValueChange = {
                        productPrice = it.filter { char -> char.isDigit() || char == '.' }
                        productError = ""
                    },
                    label = { Text("Price") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                )
                OutlinedTextField(
                    value = productStock,
                    onValueChange = { productStock = it.filter { char -> char.isDigit() }.ifBlank { "0" } },
                    label = { Text("Stock quantity") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Visible in shop", color = OpwInk, fontWeight = FontWeight.Bold)
                    Switch(checked = productActive, onCheckedChange = { productActive = it })
                }
                Button(
                    onClick = {
                        val price = productPrice.trim().toDoubleOrNull()
                        when {
                            productName.trim().length < 2 -> productError = "Product name must be at least 2 characters."
                            price == null || price <= 0.0 -> productError = "Product price must be greater than zero."
                            else -> {
                                onProductSave(
                                    editingProductId.ifBlank { null },
                                    JSONObject()
                                        .put("name", productName.trim())
                                        .put("category", productCategory.trim())
                                        .put("description", productDescription.trim())
                                        .put("price", price)
                                        .put("stockQuantity", productStock.toIntOrNull() ?: 0)
                                        .put("isActive", productActive),
                                )
                                resetProductForm()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (editingProductId.isBlank()) "Create Product" else "Update Product")
                }
                Text(
                    text = "Image upload remains available on web admin; mobile product save updates text, price, stock, and visibility.",
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }

        SectionTitle("Recent Orders")
        if (orders.isEmpty()) {
            EmptyStateCard("No shop orders", "New shop orders from patients will appear here.")
        } else {
            orders.take(10).forEach { order ->
                RecordCard(
                    title = order.text("orderNumber", fallback = "Shop order"),
                    subtitle = order.text("customerName", fallback = "Customer"),
                    status = order.text("status", fallback = "pending"),
                    statusColor = statusColor(order.text("status")),
                    rows = listOf(
                        "Mobile" to order.text("customerMobile", fallback = "Not provided"),
                        "Items" to order.optInt("totalQuantity", 0).toString(),
                        "Amount" to formatMoney(order.opt("totalAmount")),
                        "Created" to formatTimestamp(order.text("createdAt")),
                    ),
                    actions = {
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            listOf("pending", "confirmed", "completed", "cancelled").forEach { status ->
                                if (order.text("status", fallback = "pending") != status) {
                                    OutlinedButton(onClick = { onOrderStatusChange(order, status) }) {
                                        Text(status.replaceFirstChar { it.titlecase() })
                                    }
                                }
                            }
                        }
                    },
                )
            }
        }

        SectionTitle("Products")
        products.take(12).forEach { product ->
            RecordCard(
                title = product.text("name", fallback = "Product"),
                subtitle = product.text("category", fallback = "Shop"),
                status = if (product.optBoolean("isActive", true)) "Active" else "Hidden",
                rows = listOf(
                    "Price" to formatMoney(product.opt("price")),
                    "Stock" to product.optInt("stockQuantity", 0).toString(),
                    "Updated" to formatTimestamp(product.text("updatedAt")),
                ),
                actions = {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(
                            onClick = {
                                editingProductId = product.text("id")
                                productName = product.text("name")
                                productCategory = product.text("category")
                                productDescription = product.text("description")
                                productPrice = product.opt("price")?.toString().orEmpty()
                                productStock = product.optInt("stockQuantity", 0).toString()
                                productActive = product.optBoolean("isActive", true)
                                productError = ""
                            },
                        ) {
                            Text("Edit")
                        }
                        OutlinedButton(onClick = { onProductDelete(product) }) {
                            Text("Delete")
                        }
                    }
                },
            )
        }
    }
}

@Composable
private fun FeedbackTab(
    items: List<JSONObject>,
    onToggleApproval: (JSONObject) -> Unit,
    onDelete: (JSONObject) -> Unit,
) {
    val pending = items.count { !it.optBoolean("isApproved") }
    val approved = items.count { it.optBoolean("isApproved") }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Pending",
                value = pending.toString(),
                accent = OpwWarning,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Published",
                value = approved.toString(),
                accent = OpwSuccess,
            )
        }

        JsonListTab(
            title = "Feedback Approval",
            emptyTitle = "No feedback",
            emptyMessage = "Website feedback submissions will appear here for approval.",
            items = items,
            searchableFields = listOf("name", "email", "comment"),
        ) { item ->
            val approvedItem = item.optBoolean("isApproved")
            RecordCard(
                title = item.text("name", fallback = "Visitor"),
                subtitle = item.text("email", fallback = "No email"),
                status = if (approvedItem) "Approved" else "Pending",
                statusColor = if (approvedItem) OpwSuccess else OpwWarning,
                rows = listOf(
                    "Stars" to "${item.optInt("stars", 0)}/5",
                    "Comment" to item.text("comment", fallback = "No comment"),
                    "Submitted" to formatTimestamp(item.text("createdAt")),
                ),
                actions = {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(onClick = { onToggleApproval(item) }) {
                            Text(if (approvedItem) "Unapprove" else "Approve")
                        }
                        OutlinedButton(onClick = { onDelete(item) }) {
                            Text("Delete")
                        }
                    }
                },
            )
        }
    }
}

@Composable
private fun JobRequirementsTab(
    requirements: List<JSONObject>,
    form: JobFormState,
    editingId: String,
    error: String,
    loading: Boolean,
    message: String,
    onFormChange: (JobFormState) -> Unit,
    onSave: () -> Unit,
    onCancelEdit: () -> Unit,
    onEdit: (JSONObject) -> Unit,
    onStatusChange: (JSONObject, String) -> Unit,
    onDelete: (JSONObject) -> Unit,
) {
    val active = requirements.count { it.text("status", fallback = "Active") == "Active" }
    val published = requirements.count { it.optBoolean("isPublished", true) }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Active",
                value = active.toString(),
                accent = OpwSuccess,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Published",
                value = published.toString(),
                accent = OpwBlue,
            )
        }

        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        if (message.isNotBlank()) {
            StatusBanner(message = message, tone = BannerTone.Success)
        }

        Card(
            modifier = Modifier.border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    SectionTitle(if (editingId.isBlank()) "Post New Requirement" else "Edit Requirement")
                    if (editingId.isNotBlank()) {
                        TextButton(onClick = onCancelEdit) {
                            Text("Cancel")
                        }
                    }
                }

                OutlinedTextField(
                    value = form.title,
                    onValueChange = { onFormChange(form.copy(title = it)) },
                    label = { Text("Job title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = form.department,
                    onValueChange = { onFormChange(form.copy(department = it)) },
                    label = { Text("Department") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = form.employmentType,
                    onValueChange = { onFormChange(form.copy(employmentType = it)) },
                    label = { Text("Employment type") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = form.experience,
                    onValueChange = { onFormChange(form.copy(experience = it)) },
                    label = { Text("Experience") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = form.location,
                    onValueChange = { onFormChange(form.copy(location = it)) },
                    label = { Text("Location") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = form.openings,
                    onValueChange = { value ->
                        onFormChange(form.copy(openings = value.filter { char -> char.isDigit() }.ifBlank { "1" }))
                    },
                    label = { Text("Openings") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                OutlinedTextField(
                    value = form.summary,
                    onValueChange = { onFormChange(form.copy(summary = it)) },
                    label = { Text("Summary") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )
                OutlinedTextField(
                    value = form.responsibilities,
                    onValueChange = { onFormChange(form.copy(responsibilities = it)) },
                    label = { Text("Responsibilities, one per line") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )
                OutlinedTextField(
                    value = form.requirements,
                    onValueChange = { onFormChange(form.copy(requirements = it)) },
                    label = { Text("Requirements, one per line") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )
                OutlinedTextField(
                    value = form.benefits,
                    onValueChange = { onFormChange(form.copy(benefits = it)) },
                    label = { Text("Benefits, one per line") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )
                ChoiceChipRow(
                    options = listOf("Active", "Completed", "Unpublished"),
                    selected = form.status,
                    onSelected = { status ->
                        onFormChange(
                            form.copy(
                                status = status,
                                isPublished = if (status == "Unpublished") false else form.isPublished,
                            ),
                        )
                    },
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Show on website", color = OpwInk, fontWeight = FontWeight.Bold)
                    Switch(
                        checked = form.isPublished,
                        enabled = form.status == "Active",
                        onCheckedChange = { onFormChange(form.copy(isPublished = it)) },
                    )
                }
                Button(
                    onClick = onSave,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (loading) "Saving..." else if (editingId.isBlank()) "Post Requirement" else "Update Requirement")
                }
            }
        }

        JsonListTab(
            title = "Posted Requirements",
            emptyTitle = "No job requirements",
            emptyMessage = "Create a requirement above to publish openings on the career page.",
            items = requirements,
            searchableFields = listOf("title", "department", "location", "employmentType", "experience"),
        ) { item ->
            val status = item.text("status", fallback = "Active")
            RecordCard(
                title = item.text("title", fallback = "Job requirement"),
                subtitle = listOf(
                    item.text("department"),
                    item.text("location"),
                    item.text("employmentType"),
                ).filter { it.isNotBlank() }.joinToString(" | ").ifBlank { "Career opening" },
                status = if (item.optBoolean("isPublished", true)) status else "Hidden",
                statusColor = statusColor(status),
                rows = listOf(
                    "Openings" to item.optInt("openings", 1).toString(),
                    "Experience" to item.text("experience", fallback = "Not set"),
                    "Summary" to item.text("summary", fallback = "No summary"),
                    "Updated" to formatTimestamp(item.text("updatedAt")),
                ),
                actions = {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        if (status != "Active") {
                            OutlinedButton(onClick = { onStatusChange(item, "Active") }) {
                                Text("Active")
                            }
                        }
                        if (status != "Completed") {
                            OutlinedButton(onClick = { onStatusChange(item, "Completed") }) {
                                Text("Completed")
                            }
                        }
                        if (status != "Unpublished") {
                            OutlinedButton(onClick = { onStatusChange(item, "Unpublished") }) {
                                Text("Unpublish")
                            }
                        }
                        OutlinedButton(onClick = { onEdit(item) }) {
                            Text("Edit")
                        }
                        OutlinedButton(onClick = { onDelete(item) }) {
                            Text("Delete")
                        }
                    }
                },
            )
        }
    }
}

@Composable
private fun ReportsTab(
    report: JSONObject?,
    fromDate: String,
    toDate: String,
    loading: Boolean,
    error: String,
    onRangeChange: (String, String) -> Unit,
    onApply: () -> Unit,
) {
    val summary = report?.objectValue("summary") ?: JSONObject()
    val appointments = report?.array("appointments")?.toJsonObjects().orEmpty()
    val sessions = report?.array("sessions")?.toJsonObjects().orEmpty()
    val payments = report?.array("payments")?.toJsonObjects().orEmpty()

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }

        Card(
            modifier = Modifier.border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = OpwCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SectionTitle("Report Date Range")
                OutlinedTextField(
                    value = fromDate,
                    onValueChange = { onRangeChange(it, toDate) },
                    label = { Text("From date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = toDate,
                    onValueChange = { onRangeChange(fromDate, it) },
                    label = { Text("To date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Button(
                    onClick = onApply,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (loading) "Loading..." else "Apply Report")
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Patients",
                value = summary.optInt("patientsCovered", 0).toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Payments",
                value = formatMoney(summary.opt("paymentAmount")),
                accent = OpwWarning,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Appointments",
                value = summary.optInt("appointmentCount", appointments.size).toString(),
                accent = OpwSuccess,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Sessions",
                value = summary.optInt("sessionCount", sessions.size).toString(),
                accent = OpwDanger,
            )
        }

        ReportRecordsSection(
            title = "Appointments",
            emptyMessage = "No appointments found for this date range.",
            items = appointments,
        ) { appointment ->
            RecordCard(
                title = appointment.text("patientName", fallback = "Patient"),
                subtitle = appointment.text("service", fallback = "Service"),
                status = appointment.text("status", fallback = "scheduled"),
                statusColor = statusColor(appointment.text("status")),
                rows = listOf(
                    "Mobile" to appointment.text("patientMobile", fallback = "Not provided"),
                    "Schedule" to scheduleLabel(appointment.text("date"), appointment.text("time")),
                    "Remark" to appointment.text("remark", fallback = "No remark"),
                ),
            )
        }

        ReportRecordsSection(
            title = "Sessions",
            emptyMessage = "No session records found for this date range.",
            items = sessions,
        ) { session ->
            RecordCard(
                title = session.text("patientName", fallback = "Patient"),
                subtitle = session.text("treatmentTypes", fallback = "Treatment session"),
                status = session.text("status", fallback = "not_done").sessionStatusLabel(),
                statusColor = statusColor(session.text("status")),
                rows = listOf(
                    "Mobile" to session.text("patientMobile", fallback = "Not provided"),
                    "Date" to session.text("date", fallback = "Not set"),
                    "Plan" to "${session.text("fromDate", fallback = "-")} to ${session.text("toDate", fallback = "-")}",
                ),
            )
        }

        ReportRecordsSection(
            title = "Payments",
            emptyMessage = "No payment records found for this date range.",
            items = payments,
        ) { payment ->
            RecordCard(
                title = payment.text("patientName", fallback = "Patient"),
                subtitle = payment.text("source", fallback = "Payment"),
                status = formatMoney(payment.opt("amount")),
                statusColor = OpwSuccess,
                rows = listOf(
                    "Mobile" to payment.text("patientMobile", fallback = "Not provided"),
                    "Date" to payment.text("date", fallback = "Not set"),
                    "Method" to payment.text("method", fallback = "Not set"),
                    "Treatment" to payment.text("treatmentTypes", fallback = "Not linked"),
                ),
            )
        }
    }
}

@Composable
private fun ReportRecordsSection(
    title: String,
    emptyMessage: String,
    items: List<JSONObject>,
    itemContent: @Composable (JSONObject) -> Unit,
) {
    SectionTitle(title)
    if (items.isEmpty()) {
        EmptyStateCard(title = "No $title", message = emptyMessage)
    } else {
        items.take(20).forEach { item ->
            itemContent(item)
        }
    }
}

@Composable
private fun ChatTab(conversations: List<JSONObject>) {
    JsonListTab(
        title = "Live Chat",
        emptyTitle = "No chat conversations",
        emptyMessage = "Assigned website chat conversations will appear here.",
        items = conversations,
        searchableFields = listOf("visitorName", "visitorContact"),
    ) { conversation ->
        val messages = conversation.array("messages")
        RecordCard(
            title = conversation.text("visitorName", fallback = "Visitor"),
            subtitle = conversation.text("visitorContact", fallback = "No contact"),
            status = if (conversation.optBoolean("isClosed")) "Closed" else "Open",
            statusColor = if (conversation.optBoolean("unreadForAgent")) OpwDanger else OpwSuccess,
            rows = listOf(
                "Messages" to messages.length().toString(),
                "Unread" to if (conversation.optBoolean("unreadForAgent")) "Yes" else "No",
                "Updated" to formatTimestamp(conversation.text("updatedAt")),
            ),
        )
    }
}

@Composable
private fun CreateStaffTab(
    formState: StaffFormState,
    error: String,
    loading: Boolean,
    creationMessage: String,
    onFormChange: (StaffFormState) -> Unit,
    onSubmit: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        if (creationMessage.isNotBlank()) {
            StatusBanner(message = creationMessage, tone = BannerTone.Success)
        }

        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(
                    text = "Create staff member",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = OpwInk,
                )
                Text(
                    text = "This flow creates a real staff or admin account in the OPW backend.",
                    color = Color(0xFF475569),
                )

                OutlinedTextField(
                    value = formState.name,
                    onValueChange = { onFormChange(formState.copy(name = it)) },
                    label = { Text("Full name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                OutlinedTextField(
                    value = formState.email,
                    onValueChange = { onFormChange(formState.copy(email = it)) },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                )

                OutlinedTextField(
                    value = formState.mobile,
                    onValueChange = { onFormChange(formState.copy(mobile = it.filter(Char::isDigit).take(10))) },
                    label = { Text("Mobile number") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = ImeAction.Next,
                    ),
                )

                OutlinedTextField(
                    value = formState.workType,
                    onValueChange = { onFormChange(formState.copy(workType = it)) },
                    label = { Text("Work type") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                Text("Role", fontWeight = FontWeight.Bold, color = OpwInk)
                ChoiceChipRow(
                    options = listOf("Staff", "Admin"),
                    selected = formState.role,
                    onSelected = { role ->
                        onFormChange(
                            formState.copy(
                                role = role,
                                permissions = if (role == "Admin") emptyList() else {
                                    if (formState.permissions.isEmpty()) defaultStaffPermissions()
                                    else formState.permissions
                                },
                            ),
                        )
                    },
                )

                Text("Status", fontWeight = FontWeight.Bold, color = OpwInk)
                ChoiceChipRow(
                    options = listOf("Active", "Inactive"),
                    selected = formState.status,
                    onSelected = { status -> onFormChange(formState.copy(status = status)) },
                )

                Surface(
                    color = OpwMist,
                    shape = RoundedCornerShape(20.dp),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Website chat access", fontWeight = FontWeight.Bold, color = OpwInk)
                            Text(
                                text = "Turn on if this staff member should appear for public chat work.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF64748B),
                            )
                        }
                        Switch(
                            checked = formState.chatEnabled,
                            onCheckedChange = { onFormChange(formState.copy(chatEnabled = it)) },
                        )
                    }
                }

                OutlinedTextField(
                    value = formState.password,
                    onValueChange = { onFormChange(formState.copy(password = it)) },
                    label = { Text("Temporary password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                )

                if (formState.role == "Staff") {
                    Text("Module permissions", fontWeight = FontWeight.Bold, color = OpwInk)
                    formState.permissions.forEachIndexed { index, permission ->
                        PermissionCard(
                            permission = permission,
                            onPermissionChange = { updated ->
                                val nextPermissions = formState.permissions.toMutableList()
                                nextPermissions[index] = updated
                                onFormChange(formState.copy(permissions = nextPermissions))
                            },
                        )
                    }
                } else {
                    StatusBanner(
                        message = "Admin accounts receive full access automatically.",
                        tone = BannerTone.Info,
                    )
                }

                Button(
                    onClick = onSubmit,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (loading) "Creating..." else "Create Staff Account")
                }
            }
        }
    }
}

@Composable
private fun InboxTab(applications: List<StaffApplication>) {
    if (applications.isEmpty()) {
        EmptyStateCard(
            title = "No applications yet",
            message = "Incoming staff applications from the public career page will appear here.",
        )
        return
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        applications.forEach { application ->
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = application.name.ifBlank { "Applicant" },
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = OpwInk,
                            )
                            Text(
                                text = application.role.ifBlank { "Role not specified" },
                                color = Color(0xFF475569),
                            )
                        }
                        StatusChip(
                            label = if (application.isRead) "Checked" else "New",
                            background = if (application.isRead) Color(0xFFE2E8F0) else Color(0xFFDBEAFE),
                            foreground = if (application.isRead) Color(0xFF334155) else OpwBlue,
                        )
                    }

                    DividerLine()
                    DetailRow("Email", application.email.ifBlank { "Not provided" })
                    DetailRow("Phone", application.phone.ifBlank { "Not provided" })
                    DetailRow("Experience", application.experience.ifBlank { "Not provided" })
                    DetailRow("Submitted", formatTimestamp(application.createdAt))

                    if (application.message.isNotBlank()) {
                        Surface(
                            color = OpwMist,
                            shape = RoundedCornerShape(18.dp),
                        ) {
                            Text(
                                text = application.message,
                                modifier = Modifier.padding(14.dp),
                                color = OpwInk,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileTab(user: StaffUser?) {
    if (user == null) {
        EmptyStateCard(
            title = "Profile unavailable",
            message = "Refresh the dashboard to load the current admin details.",
        )
        return
    }

    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(66.dp)
                    .background(OpwBlue.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = user.name.take(1).ifBlank { "A" },
                    style = MaterialTheme.typography.headlineMedium,
                    color = OpwBlue,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
            Text(
                text = user.name,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = OpwInk,
            )
            DetailRow("Role", user.role)
            DetailRow("Email", user.email)
            DetailRow("Mobile", user.mobile)
            DetailRow("Work type", user.workType.ifBlank { "Not set" })
            DetailRow("Chat enabled", if (user.chatEnabled) "Yes" else "No")
            DetailRow("Created", formatTimestamp(user.createdAt))
            DetailRow("Updated", formatTimestamp(user.updatedAt))
        }
    }
}

@Composable
private fun JsonListTab(
    title: String,
    emptyTitle: String,
    emptyMessage: String,
    items: List<JSONObject>,
    searchableFields: List<String>,
    itemContent: @Composable (JSONObject) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    val filteredItems = remember(items, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            items
        } else {
            items.filter { item ->
                searchableFields.any { field ->
                    item.text(field).lowercase().contains(keyword)
                }
            }
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        ModuleHeader(
            title = title,
            subtitle = emptyMessage,
            countLabel = "${filteredItems.size}/${items.size}",
            accent = OpwBlue,
        )
        ModernFieldShell {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search $title") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
        }
        if (filteredItems.isEmpty()) {
            EmptyStateCard(title = emptyTitle, message = emptyMessage)
        } else {
            filteredItems.forEach { item ->
                itemContent(item)
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(OpwBlue, CircleShape),
        )
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = OpwInk,
        )
    }
}

@Composable
private fun RecordCard(
    title: String,
    subtitle: String,
    status: String,
    rows: List<Pair<String, String>>,
    statusColor: Color = OpwBlue,
    actions: @Composable (() -> Unit)? = null,
) {
    val shape = RoundedCornerShape(28.dp)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = OpwCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AccentOrb(accent = statusColor, label = title)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = OpwInk,
                        )
                        Text(
                            text = subtitle,
                            color = Color(0xFF64748B),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
                StatusChip(
                    label = status.ifBlank { "Open" },
                    background = statusColor.copy(alpha = 0.12f),
                    foreground = statusColor,
                )
            }
            DividerLine()
            rows.filter { (_, value) -> value.isNotBlank() }.forEach { (label, value) ->
                DetailRow(label = label, value = value)
            }
            if (actions != null) {
                DividerLine()
                CardActionRow {
                    actions()
                }
            }
        }
    }
}

@Composable
private fun PermissionCard(
    permission: StaffPermission,
    onPermissionChange: (StaffPermission) -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(26.dp),
        color = Color(0xFFF8FBFF),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5EDF7)),
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = permission.label,
                fontWeight = FontWeight.Bold,
                color = OpwInk,
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                PermissionToggleChip(
                    label = "View",
                    checked = permission.view,
                    onCheckedChange = { onPermissionChange(permission.copy(view = it)) },
                )
                PermissionToggleChip(
                    label = "Add",
                    checked = permission.add,
                    onCheckedChange = { onPermissionChange(permission.copy(add = it)) },
                )
                PermissionToggleChip(
                    label = "Edit",
                    checked = permission.edit,
                    onCheckedChange = { onPermissionChange(permission.copy(edit = it)) },
                )
            }
        }
    }
}

@Composable
private fun PermissionToggleChip(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    FilterChip(
        selected = checked,
        onClick = { onCheckedChange(!checked) },
        label = { Text(label) },
    )
}

@Composable
private fun ChoiceChipRow(
    options: List<String>,
    selected: String,
    onSelected: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEach { option ->
            FilterChip(
                selected = selected == option,
                onClick = { onSelected(option) },
                label = { Text(option) },
            )
        }
    }
}

@Composable
private fun StaffCard(user: StaffUser) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(28.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = OpwCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = OpwInk,
                    )
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF475569),
                    )
                }
                StatusChip(
                    label = user.status,
                    background = if (user.status == "Inactive") Color(0xFFFEE2E2) else Color(0xFFDCFCE7),
                    foreground = if (user.status == "Inactive") OpwDanger else OpwSuccess,
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusChip(
                    label = user.role,
                    background = Color(0xFFDBEAFE),
                    foreground = OpwBlue,
                )
                if (user.chatEnabled) {
                    StatusChip(
                        label = "Chat enabled",
                        background = Color(0xFFFFEDD5),
                        foreground = OpwWarning,
                    )
                }
            }

            DividerLine()
            DetailRow("Mobile", user.mobile)
            DetailRow("Work type", user.workType.ifBlank { "Not set" })
            DetailRow("Permissions", permissionSummary(user))
            DetailRow("Updated", formatTimestamp(user.updatedAt))
        }
    }
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    accent: Color,
) {
    val shape = RoundedCornerShape(28.dp)
    Card(
        modifier = modifier
            .border(1.dp, Color.White.copy(alpha = 0.86f), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = OpwCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White, accent.copy(alpha = 0.045f)),
                    ),
                )
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .background(accent.copy(alpha = 0.12f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(accent, CircleShape),
                    )
                }
                Box(
                    modifier = Modifier
                        .height(3.dp)
                        .fillMaxWidth(0.32f)
                        .background(accent.copy(alpha = 0.22f), RoundedCornerShape(999.dp)),
                )
            }
            Text(
                text = label.uppercase(),
                color = Color(0xFF64748B),
                style = MaterialTheme.typography.labelLarge,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = OpwInk,
            )
        }
    }
}

@Composable
private fun EmptyStateCard(
    title: String,
    message: String,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = OpwCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White, Color(0xFFF8FBFF)),
                    ),
                )
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .background(OpwBlue.copy(alpha = 0.1f), RoundedCornerShape(22.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "0",
                    color = OpwBlue,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.titleLarge,
                )
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = OpwInk,
                textAlign = TextAlign.Center,
            )
            Text(
                text = message,
                color = Color(0xFF64748B),
                textAlign = TextAlign.Center,
            )
        }
    }
}

private enum class BannerTone {
    Info,
    Success,
    Error,
}

@Composable
private fun StatusBanner(
    message: String,
    tone: BannerTone,
) {
    val background = when (tone) {
        BannerTone.Info -> Color(0xFFDBEAFE)
        BannerTone.Success -> Color(0xFFDCFCE7)
        BannerTone.Error -> Color(0xFFFEE2E2)
    }
    val foreground = when (tone) {
        BannerTone.Info -> OpwBlue
        BannerTone.Success -> OpwSuccess
        BannerTone.Error -> OpwDanger
    }

    Surface(
        shape = RoundedCornerShape(22.dp),
        color = background,
        border = androidx.compose.foundation.BorderStroke(1.dp, foreground.copy(alpha = 0.12f)),
        shadowElevation = 2.dp,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(foreground, CircleShape),
            )
            Text(
                text = message,
                color = foreground,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun StatusChip(
    label: String,
    background: Color,
    foreground: Color,
) {
    Box(
        modifier = Modifier
            .background(background, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        Text(
            text = label,
            color = foreground,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun DetailRow(
    label: String,
    value: String,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            text = label,
            color = Color(0xFF64748B),
            modifier = Modifier.weight(0.38f),
        )
        Text(
            text = value,
            color = OpwInk,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.End,
            modifier = Modifier.weight(0.62f),
        )
    }
}

@Composable
private fun DividerLine() {
    Spacer(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(OpwBorder),
    )
}

private fun moduleCount(tab: AdminTab, state: DashboardUiState): Int =
    when (tab) {
        AdminTab.Overview -> 0
        AdminTab.Patients -> state.patients.size
        AdminTab.Appointments -> state.appointments.size
        AdminTab.Treatment -> state.treatmentTracker?.array("todaysSessions")?.length() ?: 0
        AdminTab.Mailbox -> if (state.mailboxItems.isNotEmpty()) {
            state.mailboxItems.count { !it.optBoolean("isRead") }
        } else {
            state.applications.count { !it.isRead }
        }
        AdminTab.Services -> state.services.size
        AdminTab.Therapy -> state.therapyResources.size
        AdminTab.Shop -> state.shopOrders.size
        AdminTab.Feedback -> state.feedbackItems.count { !it.optBoolean("isApproved") }
        AdminTab.Jobs -> state.jobRequirements.count {
            it.text("status", fallback = "Active") == "Active" && it.optBoolean("isPublished", true)
        }
        AdminTab.Reports -> state.reports?.objectValue("summary")?.optInt("paymentCount", 0) ?: 0
        AdminTab.Chat -> state.chatConversations.count { it.optBoolean("unreadForAgent") }
        AdminTab.Team -> state.users.size
        AdminTab.Create -> 0
        AdminTab.Profile -> 0
    }

private fun moduleErrorsForTab(tab: AdminTab, state: DashboardUiState): List<String> {
    val keys = when (tab) {
        AdminTab.Overview -> state.moduleErrors.keys.toList()
        AdminTab.Patients -> listOf("patients")
        AdminTab.Appointments -> listOf("appointments")
        AdminTab.Treatment -> listOf("treatment tracker")
        AdminTab.Mailbox -> listOf("mailbox", "applications")
        AdminTab.Services -> listOf("services")
        AdminTab.Therapy -> listOf("therapy")
        AdminTab.Shop -> listOf("shop products", "shop orders")
        AdminTab.Feedback -> listOf("feedback")
        AdminTab.Jobs -> listOf("job requirements")
        AdminTab.Reports -> listOf("reports")
        AdminTab.Chat -> listOf("chat")
        AdminTab.Team -> listOf("staff")
        AdminTab.Create -> emptyList()
        AdminTab.Profile -> listOf("profile")
    }

    return keys.mapNotNull { key -> state.moduleErrors[key] }.distinct()
}

private fun JSONObject.text(vararg keys: String, fallback: String = ""): String {
    keys.forEach { key ->
        if (!has(key) || isNull(key)) {
            return@forEach
        }

        val value = opt(key)
        val text = when (value) {
            is JSONArray -> value.joinLabels()
            is JSONObject -> value.text("name", "title", "label", fallback = value.toString())
            else -> value?.toString().orEmpty()
        }.trim()

        if (text.isNotBlank() && text != "null") {
            return text
        }
    }

    return fallback
}

private fun JSONObject.array(key: String): JSONArray =
    optJSONArray(key) ?: JSONArray()

private fun JSONObject.objectValue(key: String): JSONObject? =
    optJSONObject(key)

private fun JSONArray.toJsonObjects(): List<JSONObject> =
    List(length()) { index -> optJSONObject(index) }.filterNotNull()

private fun JSONArray.joinLabels(): String =
    (0 until length())
        .mapNotNull { index ->
            val value = opt(index)
            when (value) {
                is JSONObject -> value.text("label", "name", "title", "service", fallback = "")
                is JSONArray -> value.joinLabels()
                else -> value?.toString().orEmpty()
            }.trim().takeIf { it.isNotBlank() && it != "null" }
        }
        .joinToString(", ")

private fun String.createdFromLabel(): String =
    when (trim().lowercase()) {
        "website" -> "Website"
        "mobile", "app" -> "Mobile"
        "import" -> "Imported"
        "admin" -> "Admin"
        else -> ifBlank { "Admin" }
    }

private fun String.sessionStatusLabel(): String =
    when (trim().lowercase()) {
        "done", "completed" -> "Done"
        "not_done", "pending" -> "Pending"
        "missed" -> "Missed"
        "cancelled", "canceled" -> "Cancelled"
        else -> replace('_', ' ').replaceFirstChar { char ->
            if (char.isLowerCase()) char.titlecase() else char.toString()
        }.ifBlank { "Pending" }
    }

private fun scheduleLabel(date: String, time: String): String {
    val cleanDate = date.trim()
    val cleanTime = time.trim()

    return when {
        cleanDate.isNotBlank() && cleanTime.isNotBlank() -> "$cleanDate, $cleanTime"
        cleanDate.isNotBlank() -> cleanDate
        cleanTime.isNotBlank() -> cleanTime
        else -> "Not set"
    }
}

private fun formatMoney(value: Any?): String {
    val amount = when (value) {
        is Number -> value.toDouble()
        is String -> value.trim().toDoubleOrNull()
        else -> null
    } ?: return "Rs. 0"

    return if (amount % 1.0 == 0.0) {
        "Rs. ${amount.toLong()}"
    } else {
        "Rs. ${"%.2f".format(amount)}"
    }
}

private fun formatBytes(value: Long): String =
    when {
        value <= 0 -> "0 B"
        value < 1024 -> "$value B"
        value < 1024L * 1024L -> "${value / 1024L} KB"
        else -> "${value / (1024L * 1024L)} MB"
    }

private fun statusColor(status: String): Color =
    when (status.trim().lowercase()) {
        "approved", "confirmed", "completed", "done", "active", "delivered", "paid" -> OpwSuccess
        "rejected", "cancelled", "canceled", "failed", "missed", "inactive" -> OpwDanger
        "pending", "processing", "not_done" -> OpwWarning
        else -> OpwBlue
    }

private fun todayDateKey(): String =
    LocalDate.now().toString()

private fun monthStartDateKey(): String =
    LocalDate.now().withDayOfMonth(1).toString()

private fun validateJobForm(form: JobFormState): String? {
    if (form.title.trim().length < 2) {
        return "Job title must be at least 2 characters."
    }

    val openings = form.openings.trim().toIntOrNull()
    if (openings == null || openings < 1) {
        return "Openings must be at least 1."
    }

    return null
}

private fun JobFormState.toJson(): JSONObject =
    JSONObject()
        .put("title", title.trim())
        .put("department", department.trim())
        .put("employmentType", employmentType.trim())
        .put("experience", experience.trim())
        .put("location", location.trim())
        .put("openings", openings.trim().toIntOrNull() ?: 1)
        .put("summary", summary.trim())
        .put("responsibilities", responsibilities.trim())
        .put("requirements", requirements.trim())
        .put("benefits", benefits.trim())
        .put("status", status)
        .put("isPublished", isPublished && status == "Active")

private fun JSONObject.toJobFormState(): JobFormState =
    JobFormState(
        title = text("title"),
        department = text("department"),
        employmentType = text("employmentType"),
        experience = text("experience"),
        location = text("location"),
        openings = optInt("openings", 1).coerceAtLeast(1).toString(),
        summary = text("summary"),
        responsibilities = array("responsibilities").joinLines(),
        requirements = array("requirements").joinLines(),
        benefits = array("benefits").joinLines(),
        status = text("status", fallback = "Active"),
        isPublished = optBoolean("isPublished", true),
    )

private fun JSONArray.joinLines(): String =
    (0 until length())
        .mapNotNull { index -> optString(index).trim().takeIf { it.isNotBlank() } }
        .joinToString("\n")

private fun validateCreateStaffForm(form: StaffFormState): String? {
    if (form.name.trim().length < 2) {
        return "Staff name must be at least 2 characters."
    }

    if (!Patterns.EMAIL_ADDRESS.matcher(form.email.trim()).matches()) {
        return "Please enter a valid email address."
    }

    if (!form.mobile.trim().matches(Regex("\\d{10}"))) {
        return "Please enter a valid 10-digit mobile number."
    }

    if (form.password.length < 6) {
        return "Password must be at least 6 characters."
    }

    return null
}

private fun permissionSummary(user: StaffUser): String {
    if (user.role == "Admin") {
        return "Full admin access"
    }

    val visibleModules = user.permissions.filter { it.view || it.add || it.edit }
    return if (visibleModules.isEmpty()) {
        "No special access"
    } else {
        "${visibleModules.size} modules enabled"
    }
}

private fun formatTimestamp(value: String): String {
    if (value.isBlank()) {
        return "Not available"
    }

    return runCatching {
        val instant = Instant.parse(value)
        instant.atZone(ZoneId.systemDefault())
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
    }.getOrDefault(value.take(19))
}

private fun networkErrorMessage(baseUrl: String, error: Exception): String {
    val detail = error.localizedMessage?.takeIf { it.isNotBlank() }
        ?: error::class.java.simpleName
    return "Unable to reach $baseUrl. $detail"
}
