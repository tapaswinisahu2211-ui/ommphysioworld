package com.example.opw_staff

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.util.Patterns
import androidx.core.content.FileProvider
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import android.os.Bundle
import android.provider.OpenableColumns
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.rememberTimePickerState
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
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
import com.example.opw_staff.data.toJson
import com.example.opw_staff.data.toStaffApplication
import com.example.opw_staff.data.toStaffUser
import com.example.opw_staff.ui.theme.OpwBlue
import com.example.opw_staff.ui.theme.OpwAqua
import com.example.opw_staff.ui.theme.OpwBorder
import com.example.opw_staff.ui.theme.OpwCard
import com.example.opw_staff.ui.theme.OpwDanger
import com.example.opw_staff.ui.theme.OpwInk
import com.example.opw_staff.ui.theme.OpwMist
import com.example.opw_staff.ui.theme.OpwNavy
import com.example.opw_staff.ui.theme.OpwSky
import com.example.opw_staff.ui.theme.OpwSlate
import com.example.opw_staff.ui.theme.OpwStaffTheme
import com.example.opw_staff.ui.theme.OpwSuccess
import com.example.opw_staff.ui.theme.OpwWarning
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.net.URL
import java.io.File
import java.io.ByteArrayOutputStream
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt

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
    Treatment("Treatment Tracker"),
    Services("Services"),
    Therapy("Therapy"),
    Shop("Shop"),
    Marketing("Marketing"),
    Feedback("Feedback"),
    Jobs("Career"),
    Reports("Report"),
    Finance("Finance"),
    Payroll("Payroll"),
    Mailbox("Mailbox"),
    Notifications("Notifications"),
    Chat("Chat"),
    Team("Staff"),
    Create("Create Staff", adminOnly = true),
    Profile("Edit Profile"),
}

private data class DashboardUiState(
    val loading: Boolean = false,
    val admin: StaffUser? = null,
    val users: List<StaffUser> = emptyList(),
    val applications: List<StaffApplication> = emptyList(),
    val patients: List<JSONObject> = emptyList(),
    val archivedPatients: List<JSONObject> = emptyList(),
    val appointments: List<JSONObject> = emptyList(),
    val mailboxItems: List<JSONObject> = emptyList(),
    val notificationItems: List<JSONObject> = emptyList(),
    val services: List<JSONObject> = emptyList(),
    val therapyResources: List<JSONObject> = emptyList(),
    val shopProducts: List<JSONObject> = emptyList(),
    val shopOrders: List<JSONObject> = emptyList(),
    val marketingSources: List<JSONObject> = emptyList(),
    val feedbackItems: List<JSONObject> = emptyList(),
    val jobRequirements: List<JSONObject> = emptyList(),
    val reports: JSONObject? = null,
    val finance: JSONObject? = null,
    val payroll: JSONObject? = null,
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
    val monthlySalary: String = "",
    val password: String = "",
    val permissions: List<StaffPermission> = defaultStaffPermissions(),
)

private data class PickedUploadFile(
    val name: String,
    val mimeType: String,
    val bytes: ByteArray,
)

private data class TreatmentBilling(
    val homeVisitCharge: Double,
    val clinicVisitCharge: Double,
    val firstConsultationCharge: Double,
    val discountType: String,
    val discountValue: Double,
    val extraSessionDays: Int,
    val sessionCount: Int,
    val sessionRate: Double,
    val sessionSubtotal: Double,
    val consultationCharge: Double,
    val discountAmount: Double,
    val payableAmount: Double,
    val paidAmount: Double,
    val balanceAmount: Double,
    val availableBalance: Double,
    val availableSessionDays: Int,
)

private fun emptyStaffForm() = StaffFormState()

private fun StaffUser.toStaffFormState(): StaffFormState =
    StaffFormState(
        name = name,
        email = email,
        mobile = mobile,
        role = role.ifBlank { "Staff" },
        status = status.ifBlank { "Active" },
        chatEnabled = chatEnabled,
        workType = workType,
        monthlySalary = if (this.monthlySalary > 0.0) this.monthlySalary.toString().removeSuffix(".0") else "",
        password = "",
        permissions = if (role == "Admin") emptyList() else permissions.ifEmpty { defaultStaffPermissions() },
    )

private fun StaffFormState.toStaffRequest(): CreateStaffRequest =
    CreateStaffRequest(
        name = name.trim(),
        email = email.trim(),
        mobile = mobile.trim(),
        role = role,
        status = status,
        chatEnabled = chatEnabled,
        workType = workType.trim(),
        monthlySalary = monthlySalary.toDoubleOrNull() ?: 0.0,
        password = password,
        permissions = if (role == "Admin") emptyList() else permissions,
    )

private fun emptyJobForm() = JobFormState()

private fun appBackgroundBrush(): Brush =
    Brush.verticalGradient(
        colors = listOf(
            Color(0xFFFFFEFA),
            Color(0xFFF8FCFF),
            Color(0xFFFFFEFA),
        ),
    )

private fun drawerBrush(): Brush =
    Brush.verticalGradient(
        colors = listOf(
            Color(0xFFFFFEFA),
            Color(0xFFFFFEFA),
            Color(0xFFF8FCFF),
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
        AdminTab.Marketing -> OpwAqua
        AdminTab.Feedback -> Color(0xFFEAB308)
        AdminTab.Jobs -> Color(0xFF16A34A)
        AdminTab.Reports -> Color(0xFF4F46E5)
        AdminTab.Finance -> Color(0xFF059669)
        AdminTab.Payroll -> Color(0xFF0D9488)
        AdminTab.Mailbox -> Color(0xFFE11D48)
        AdminTab.Notifications -> Color(0xFF0F766E)
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
        AdminTab.Treatment -> "Upcoming appointments, active sessions, and follow-up cases"
        AdminTab.Services -> "Treatments available across the clinic"
        AdminTab.Therapy -> "Exercise files and therapy resources"
        AdminTab.Shop -> "Products, stock, and patient orders"
        AdminTab.Marketing -> "Marketing visits, partners, and generated leads"
        AdminTab.Feedback -> "Approve public testimonials"
        AdminTab.Jobs -> "Career openings published to the website"
        AdminTab.Reports -> "Date-wise patients, sessions, and payments"
        AdminTab.Finance -> "Income and expense tracking"
        AdminTab.Payroll -> "Monthly staff salary, bonus, and commission"
        AdminTab.Mailbox -> "Career and contact inbox"
        AdminTab.Notifications -> "Custom patient notification center"
        AdminTab.Chat -> "Website visitor conversations"
        AdminTab.Team -> "Staff records, access, and availability"
        AdminTab.Create -> "Create staff accounts with module access"
        AdminTab.Profile -> "Current staff profile and account details"
    }

private data class StaffFloatingCardMotion(
    val lift: androidx.compose.ui.unit.Dp,
    val elevation: androidx.compose.ui.unit.Dp,
)

@Composable
private fun rememberStaffFloatingCardMotion(delayMillis: Int = 0): StaffFloatingCardMotion {
    val transition = rememberInfiniteTransition(label = "staff-floating-card")
    val lift = transition.animateFloat(
        initialValue = 0f,
        targetValue = -3.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 2200,
                delayMillis = delayMillis,
                easing = FastOutSlowInEasing,
            ),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "staff-card-lift",
    )
    val elevation = transition.animateFloat(
        initialValue = 5f,
        targetValue = 13f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 2200,
                delayMillis = delayMillis,
                easing = FastOutSlowInEasing,
            ),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "staff-card-elevation",
    )
    return StaffFloatingCardMotion(
        lift = lift.value.dp,
        elevation = elevation.value.dp,
    )
}

@Composable
private fun StaffPastelBackground() {
    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .offset(x = (-92).dp, y = (-112).dp)
                .size(275.dp)
                .background(Color(0xFFC7F8D9).copy(alpha = 0.78f), CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 72.dp, y = 82.dp)
                .size(220.dp)
                .background(Color(0xFFF3F8C8).copy(alpha = 0.56f), CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .offset(x = (-118).dp, y = 96.dp)
                .size(210.dp)
                .background(Color(0xFFD9FBE7).copy(alpha = 0.7f), CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .offset(x = 126.dp)
                .size(170.dp)
                .background(Color(0xFFEAF7FF).copy(alpha = 0.76f), CircleShape),
        )
    }
}

@Composable
private fun OpwLogoMark(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(cornerRadius),
        color = Color.White.copy(alpha = 0.96f),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder.copy(alpha = 0.7f)),
        shadowElevation = 4.dp,
    ) {
        Image(
            painter = painterResource(id = R.drawable.opw_logo),
            contentDescription = "Omm Physio World logo",
            modifier = Modifier
                .fillMaxSize()
                .padding(5.dp),
            contentScale = ContentScale.Fit,
        )
    }
}

@Composable
private fun StaffAdminApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val focusManager = LocalFocusManager.current
    val sessionStore = remember { StaffSessionStore(context.applicationContext) }
    val offlineStore = remember { StaffOfflineStore(context.applicationContext) }
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
    var payrollMonth by remember { mutableStateOf(todayDateKey().take(7)) }
    var reportLoading by remember { mutableStateOf(false) }
    var reportError by remember { mutableStateOf("") }
    var loginLoading by remember { mutableStateOf(false) }
    var apiTestLoading by remember { mutableStateOf(false) }
    var apiTestMessage by remember { mutableStateOf("") }
    var apiTestIsSuccess by remember { mutableStateOf(false) }
    var lastBackPressAt by remember { mutableStateOf(0L) }
    var pendingOfflineCount by remember { mutableStateOf(0) }

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
        payrollMonth = todayDateKey().take(7)
        reportLoading = false
        reportError = ""
        route = AppRoute.Login
        selectedTab = AdminTab.Overview
        if (!message.isNullOrBlank()) {
            showMessage(message)
        }
    }

    fun cacheCurrentDashboard() {
        val activeSession = session ?: return
        offlineStore.saveDashboard(activeSession.user.id, dashboardState)
    }

    fun applyUpdatedPatient(updated: JSONObject) {
        val id = updated.text("id")
        if (id.isBlank()) return

        dashboardState = dashboardState.copy(
            patients = if (dashboardState.patients.any { it.text("id") == id }) {
                dashboardState.patients.map { current ->
                    if (current.text("id") == id) updated else current
                }
            } else {
                listOf(updated) + dashboardState.patients
            },
            archivedPatients = dashboardState.archivedPatients.filterNot { it.text("id") == id },
        )
    }

    fun updateLocalTreatmentPlan(patientId: String, planId: String, transform: (JSONObject) -> JSONObject) {
        val current = dashboardState.patients.firstOrNull { it.text("id") == patientId } ?: return
        val updatedPatient = JSONObject(current.toString())
        val plans = updatedPatient.array("treatmentPlans")
        val updatedPlans = JSONArray()
        var changed = false
        for (index in 0 until plans.length()) {
            val plan = plans.optJSONObject(index)
            if (plan != null && plan.text("id") == planId) {
                updatedPlans.put(transform(JSONObject(plan.toString())))
                changed = true
            } else if (plan != null) {
                updatedPlans.put(plan)
            }
        }
        if (!changed) return
        updatedPatient.put("treatmentPlans", updatedPlans)
        val id = updatedPatient.text("id")
        val nextState = dashboardState.copy(
            patients = if (dashboardState.patients.any { it.text("id") == id }) {
                dashboardState.patients.map { current ->
                    if (current.text("id") == id) updatedPatient else current
                }
            } else {
                listOf(updatedPatient) + dashboardState.patients
            },
            archivedPatients = dashboardState.archivedPatients.filterNot { it.text("id") == id },
        )
        dashboardState = nextState
        offlineStore.saveDashboard(session?.user?.id.orEmpty(), nextState)
    }

    fun enqueueOfflineMutation(type: String, payload: JSONObject, message: String) {
        val activeSession = session ?: return
        offlineStore.enqueueMutation(activeSession.user.id, type, payload)
        pendingOfflineCount = offlineStore.pendingCount(activeSession.user.id)
        cacheCurrentDashboard()
        showMessage(message)
    }

    suspend fun syncPendingOfflineMutations(activeSession: AdminSession) {
        val pending = offlineStore.pendingMutations(activeSession.user.id)
        if (pending.isEmpty()) {
            pendingOfflineCount = 0
            return
        }

        val remaining = mutableListOf<JSONObject>()
        var syncedCount = 0
        for (mutation in pending) {
            try {
                val payload = mutation.objectValue("payload") ?: JSONObject()
                val updated = when (mutation.text("type")) {
                    "addTreatmentSessionEntry" -> api.addTreatmentSessionEntry(
                        activeSession.token,
                        payload.text("patientId"),
                        payload.text("planId"),
                        payload.text("date"),
                        payload.text("treatmentType"),
                        payload.text("doneByStaffId"),
                    )
                    "deleteTreatmentSessionEntry" -> api.deleteTreatmentSessionEntry(
                        activeSession.token,
                        payload.text("patientId"),
                        payload.text("planId"),
                        payload.text("dayId"),
                    )
                    "addTreatmentPayment" -> api.addTreatmentPayment(
                        activeSession.token,
                        payload.text("patientId"),
                        payload.text("planId"),
                        payload.optDouble("amount", 0.0),
                        payload.text("method", fallback = "cash"),
                        payload.text("paymentDate"),
                    )
                    "updateTreatmentPayment" -> api.updateTreatmentPayment(
                        activeSession.token,
                        payload.text("patientId"),
                        payload.text("planId"),
                        payload.text("paymentId"),
                        payload.optDouble("amount", 0.0),
                        payload.text("method", fallback = "cash"),
                        payload.text("paymentDate"),
                    )
                    else -> null
                }
                if (updated != null) {
                    applyUpdatedPatient(updated)
                    syncedCount += 1
                }
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    remaining.add(mutation)
                    clearToLogin("Your session ended. Please log in again.")
                    break
                }
                remaining.add(mutation)
            } catch (_: Exception) {
                remaining.add(mutation)
            }
        }

        offlineStore.replaceMutations(activeSession.user.id, remaining)
        pendingOfflineCount = remaining.size
        if (syncedCount > 0) {
            showMessage("$syncedCount offline change synced.")
        }
    }

    suspend fun refreshDashboard(activeSession: AdminSession, showLoader: Boolean) {
        if (showLoader) {
            val cached = offlineStore.loadDashboard(activeSession.user.id)
            dashboardState = (cached ?: dashboardState).copy(loading = true, error = "")
        } else {
            dashboardState = dashboardState.copy(error = "")
        }

        try {
            syncPendingOfflineMutations(activeSession)
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

            val resolvedAdmin = loadOptional("profile", activeSession.user) {
                api.getAdminProfile(activeSession.token)
            }
            val isAdmin = resolvedAdmin.role == "Admin"
            fun canView(tab: AdminTab): Boolean = canOpenAdminTab(resolvedAdmin, tab)
            val needsStaffDirectory =
                canView(AdminTab.Team) ||
                    canView(AdminTab.Patients) ||
                    canView(AdminTab.Treatment) ||
                    canView(AdminTab.Reports) ||
                    canView(AdminTab.Finance) ||
                    canView(AdminTab.Payroll) ||
                    hasModulePermission(resolvedAdmin, "treatment_plans", "add") ||
                    hasModulePermission(resolvedAdmin, "treatment_plans", "edit") ||
                    hasModulePermission(resolvedAdmin, "payments", "add")
            val snapshot = AdminDashboardSnapshot(
                admin = resolvedAdmin,
                users = if (needsStaffDirectory) loadOptional("staff", emptyList()) {
                    api.getUsers(activeSession.token)
                } else emptyList(),
                applications = if (hasModulePermission(resolvedAdmin, "staff_applications")) loadOptional("applications", emptyList()) {
                    api.getStaffApplications(activeSession.token)
                } else emptyList(),
                patients = if (canView(AdminTab.Patients) || canView(AdminTab.Notifications)) loadOptional("patients", emptyList()) {
                    api.getPatients(activeSession.token)
                } else emptyList(),
                archivedPatients = if (isAdmin || hasModulePermission(resolvedAdmin, "archived_patients")) {
                    loadOptional("archived patients", emptyList()) {
                        api.getArchivedPatients(activeSession.token)
                    }
                } else {
                    emptyList()
                },
                appointments = if (canView(AdminTab.Treatment)) loadOptional("appointments", emptyList()) {
                    api.getAppointments(activeSession.token)
                } else emptyList(),
                mailboxItems = if (canView(AdminTab.Mailbox)) loadOptional("mailbox", emptyList()) {
                    api.getMailbox(activeSession.token)
                } else emptyList(),
                notificationItems = if (canView(AdminTab.Notifications)) loadOptional("notifications", emptyList()) {
                    api.getNotificationHistory(activeSession.token)
                } else emptyList(),
                services = if (canView(AdminTab.Services) || canView(AdminTab.Therapy) || canView(AdminTab.Patients)) loadOptional("services", emptyList()) {
                    api.getServices(activeSession.token)
                } else emptyList(),
                therapyResources = if (canView(AdminTab.Therapy) || canView(AdminTab.Patients)) loadOptional("therapy", emptyList()) {
                    api.getTherapyResources(activeSession.token)
                } else emptyList(),
                shopProducts = if (canView(AdminTab.Shop)) loadOptional("shop products", emptyList()) {
                    api.getShopProducts(activeSession.token)
                } else emptyList(),
                shopOrders = if (canView(AdminTab.Shop)) loadOptional("shop orders", emptyList()) {
                    api.getShopOrders(activeSession.token)
                } else emptyList(),
                marketingSources = if (canView(AdminTab.Marketing)) loadOptional("marketing", emptyList()) {
                    api.getMarketingSources(activeSession.token)
                } else emptyList(),
                feedbackItems = if (canView(AdminTab.Feedback)) {
                    loadOptional("feedback", emptyList()) {
                        api.getFeedback(activeSession.token)
                    }
                } else {
                    emptyList()
                },
                jobRequirements = if (canView(AdminTab.Jobs)) {
                    loadOptional("job requirements", emptyList()) {
                        api.getJobRequirements(activeSession.token)
                    }
                } else {
                    emptyList()
                },
                reports = if (canView(AdminTab.Reports)) {
                    loadOptional("reports", null) {
                        api.getReports(activeSession.token, reportFromDate, reportToDate)
                    }
                } else {
                    null
                },
                finance = if (canView(AdminTab.Finance)) {
                    loadOptional("finance", null) {
                        api.getFinance(activeSession.token, reportFromDate, reportToDate)
                    }
                } else {
                    null
                },
                payroll = if (canView(AdminTab.Payroll)) {
                    loadOptional("payroll", null) {
                        api.getPayroll(activeSession.token, payrollMonth)
                    }
                } else {
                    null
                },
                chatConversations = if (canView(AdminTab.Chat)) loadOptional("chat", emptyList()) {
                    api.getChatConversations(activeSession.token)
                } else emptyList(),
                treatmentTracker = if (canView(AdminTab.Treatment)) loadOptional("treatment tracker", null) {
                    api.getTreatmentTracker(activeSession.token)
                } else null,
                moduleErrors = moduleErrors,
            )
            val updatedSession = activeSession.copy(user = snapshot.admin)
            session = updatedSession
            sessionStore.saveSession(updatedSession)
            val nextState = DashboardUiState(
                loading = false,
                admin = snapshot.admin,
                users = snapshot.users,
                applications = snapshot.applications,
                patients = snapshot.patients,
                archivedPatients = snapshot.archivedPatients,
                appointments = snapshot.appointments,
                mailboxItems = snapshot.mailboxItems,
                notificationItems = snapshot.notificationItems,
                services = snapshot.services,
                therapyResources = snapshot.therapyResources,
                shopProducts = snapshot.shopProducts,
                shopOrders = snapshot.shopOrders,
                marketingSources = snapshot.marketingSources,
                feedbackItems = snapshot.feedbackItems,
                jobRequirements = snapshot.jobRequirements,
                reports = snapshot.reports,
                finance = snapshot.finance,
                payroll = snapshot.payroll,
                chatConversations = snapshot.chatConversations,
                treatmentTracker = snapshot.treatmentTracker,
                moduleErrors = snapshot.moduleErrors,
                error = "",
            )
            dashboardState = nextState
            offlineStore.saveDashboard(updatedSession.user.id, nextState)
        } catch (error: ApiException) {
            if (error.statusCode == 401 || error.statusCode == 403) {
                clearToLogin("Your admin session ended. Please log in again.")
            } else {
                dashboardState = dashboardState.copy(
                    loading = false,
                    error = error.message,
                )
            }
        } catch (error: Exception) {
            val cached = offlineStore.loadDashboard(activeSession.user.id)
            dashboardState = if (cached != null) {
                cached.copy(
                    loading = false,
                    error = "Offline mode: showing saved data. ${error.localizedMessage ?: ""}".trim(),
                )
            } else {
                dashboardState.copy(
                    loading = false,
                    error = "Unable to reach the OPW server. Check that the API is running.",
                )
            }
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
            pendingOfflineCount = offlineStore.pendingCount(storedSession.user.id)
            offlineStore.loadDashboard(storedSession.user.id)?.let { cached ->
                dashboardState = cached.copy(loading = true, error = "")
            }
            refreshDashboard(storedSession, showLoader = true)
        }
    }

    LaunchedEffect(route, session?.token) {
        while (route == AppRoute.Dashboard && session != null) {
            delay(15_000)
            session?.let { activeSession ->
                refreshDashboard(activeSession, showLoader = false)
            }
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
                    "Career opening posted."
                } else {
                    "Career opening updated."
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
            showMessage("Career opening id is missing.")
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
            showMessage("Career opening id is missing.")
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
                showMessage("Career opening deleted.")
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

    fun reloadFinance() {
        val activeSession = session ?: return
        scope.launch {
            try {
                val finance = api.getFinance(activeSession.token, reportFromDate, reportToDate)
                dashboardState = dashboardState.copy(finance = finance)
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun saveFinanceEntry(id: String?, payload: JSONObject) {
        val activeSession = session ?: return
        scope.launch {
            try {
                api.saveFinanceEntry(activeSession.token, id, payload)
                reloadFinance()
                showMessage("Finance entry saved.")
            } catch (error: ApiException) {
                showMessage(error.message)
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun deleteFinanceEntry(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deleteFinanceEntry(activeSession.token, id)
                reloadFinance()
                showMessage("Finance entry deleted.")
            } catch (error: ApiException) {
                showMessage(error.message)
            } catch (error: Exception) {
                showMessage(networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error))
            }
        }
    }

    fun reloadPayroll(targetMonth: String = payrollMonth) {
        val activeSession = session ?: return
        val month = targetMonth.ifBlank { todayDateKey().take(7) }
        payrollMonth = month
        scope.launch {
            try {
                val payroll = api.getPayroll(activeSession.token, month)
                dashboardState = dashboardState.copy(
                    payroll = payroll,
                    moduleErrors = dashboardState.moduleErrors - "payroll",
                )
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    dashboardState = dashboardState.copy(
                        moduleErrors = dashboardState.moduleErrors + ("payroll" to error.message),
                    )
                }
            } catch (error: Exception) {
                dashboardState = dashboardState.copy(
                    moduleErrors = dashboardState.moduleErrors + (
                        "payroll" to networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error)
                    ),
                )
            }
        }
    }

    fun savePayrollPayment(id: String?, payload: JSONObject) {
        val activeSession = session ?: return
        scope.launch {
            try {
                api.savePayrollPayment(activeSession.token, id, payload)
                val payroll = api.getPayroll(activeSession.token, payrollMonth)
                val finance = if (canOpenAdminTab(dashboardState.admin ?: activeSession.user, AdminTab.Finance)) {
                    runCatching {
                        api.getFinance(activeSession.token, reportFromDate, reportToDate)
                    }.getOrNull()
                } else {
                    dashboardState.finance
                }
                dashboardState = dashboardState.copy(
                    payroll = payroll,
                    finance = finance,
                    moduleErrors = dashboardState.moduleErrors - "payroll",
                )
                showMessage("Payroll saved and added to finance expense.")
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

    fun deletePayrollPayment(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deletePayrollPayment(activeSession.token, id)
                val payroll = api.getPayroll(activeSession.token, payrollMonth)
                val finance = if (canOpenAdminTab(dashboardState.admin ?: activeSession.user, AdminTab.Finance)) {
                    runCatching {
                        api.getFinance(activeSession.token, reportFromDate, reportToDate)
                    }.getOrNull()
                } else {
                    dashboardState.finance
                }
                dashboardState = dashboardState.copy(
                    payroll = payroll,
                    finance = finance,
                    moduleErrors = dashboardState.moduleErrors - "payroll",
                )
                showMessage("Payroll payment deleted.")
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

    suspend fun refreshPatientFromServer(activeSession: AdminSession, patientId: String) {
        if (patientId.isBlank()) return
        val updated = api.getPatient(activeSession.token, patientId)
        applyUpdatedPatient(updated)
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

    fun saveTreatmentPlan(patientId: String, planId: String?, payload: JSONObject) {
        val activeSession = session ?: return
        if (patientId.isBlank()) return
        scope.launch {
            try {
                val updated = api.saveTreatmentPlan(activeSession.token, patientId, planId, payload)
                applyUpdatedPatient(updated)
                showMessage(if (planId.isNullOrBlank()) "Treatment session started." else "Treatment session updated.")
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

    fun updateTreatmentPlanStatus(patientId: String, planId: String, status: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateTreatmentPlanStatus(activeSession.token, patientId, planId, status)
                applyUpdatedPatient(updated)
                showMessage("Treatment status updated.")
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

    fun updateSessionDayStatus(patientId: String, planId: String, dayId: String, status: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank() || dayId.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateSessionDayStatus(activeSession.token, patientId, planId, dayId, status)
                applyUpdatedPatient(updated)
                showMessage("Session day updated.")
                runCatching {
                    dashboardState = dashboardState.copy(
                        treatmentTracker = api.getTreatmentTracker(activeSession.token),
                    )
                }
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

    fun addTreatmentSessionEntry(patientId: String, planId: String, date: String, treatmentType: String, doneByStaffId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank()) return
        scope.launch {
            try {
                val updated = api.addTreatmentSessionEntry(
                    activeSession.token,
                    patientId,
                    planId,
                    date,
                    treatmentType,
                    doneByStaffId,
                )
                applyUpdatedPatient(updated)
                showMessage("Treatment done details added.")
                runCatching {
                    dashboardState = dashboardState.copy(
                        treatmentTracker = api.getTreatmentTracker(activeSession.token),
                    )
                }
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                val doneByStaff = dashboardState.users.firstOrNull { it.id == doneByStaffId } ?: activeSession.user
                updateLocalTreatmentPlan(patientId, planId) { plan ->
                    val updatedDays = JSONArray(plan.array("sessionDays").toString())
                    updatedDays.put(
                        JSONObject()
                            .put("id", "offline-${System.currentTimeMillis()}")
                            .put("date", date)
                            .put("status", "done")
                            .put("treatmentType", treatmentType)
                            .put("doneByStaffId", doneByStaffId)
                            .put("doneByStaffName", doneByStaff.name.ifBlank { "Staff" })
                            .put("offlinePending", true)
                            .put("createdAt", Instant.now().toString()),
                    )
                    plan.put("sessionDays", updatedDays)
                }
                enqueueOfflineMutation(
                    "addTreatmentSessionEntry",
                    JSONObject()
                        .put("patientId", patientId)
                        .put("planId", planId)
                        .put("date", date)
                        .put("treatmentType", treatmentType)
                        .put("doneByStaffId", doneByStaffId),
                    "Network is slow. Treatment saved offline and will sync automatically.",
                )
            }
        }
    }

    fun deleteTreatmentSessionEntry(patientId: String, planId: String, dayId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank() || dayId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteTreatmentSessionEntry(activeSession.token, patientId, planId, dayId)
                applyUpdatedPatient(updated)
                showMessage("Treatment done details deleted.")
                runCatching {
                    dashboardState = dashboardState.copy(
                        treatmentTracker = api.getTreatmentTracker(activeSession.token),
                    )
                }
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                updateLocalTreatmentPlan(patientId, planId) { plan ->
                    val updatedDays = JSONArray()
                    val sessionDays = plan.array("sessionDays")
                    for (index in 0 until sessionDays.length()) {
                        val day = sessionDays.optJSONObject(index)
                        if (day != null && day.text("id") != dayId) {
                            updatedDays.put(day)
                        }
                    }
                    plan.put("sessionDays", updatedDays)
                }
                enqueueOfflineMutation(
                    "deleteTreatmentSessionEntry",
                    JSONObject().put("patientId", patientId).put("planId", planId).put("dayId", dayId),
                    "Network is slow. Delete saved offline and will sync automatically.",
                )
            }
        }
    }

    fun addTreatmentPayment(patientId: String, planId: String, amount: Double, method: String, paymentDate: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank()) return
        scope.launch {
            try {
                val updated = api.addTreatmentPayment(activeSession.token, patientId, planId, amount, method, paymentDate)
                applyUpdatedPatient(updated)
                showMessage("Payment added.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                updateLocalTreatmentPlan(patientId, planId) { plan ->
                    val updatedPayments = JSONArray(plan.array("payments").toString())
                    updatedPayments.put(
                        JSONObject()
                            .put("id", "offline-payment-${System.currentTimeMillis()}")
                            .put("amount", amount)
                            .put("method", method)
                            .put("paymentDate", paymentDate)
                            .put("date", paymentDate)
                            .put("offlinePending", true)
                            .put("createdAt", Instant.now().toString()),
                    )
                    plan.put("payments", updatedPayments)
                }
                enqueueOfflineMutation(
                    "addTreatmentPayment",
                    JSONObject()
                        .put("patientId", patientId)
                        .put("planId", planId)
                        .put("amount", amount)
                        .put("method", method)
                        .put("paymentDate", paymentDate),
                    "Network is slow. Payment saved offline and will sync automatically.",
                )
            }
        }
    }

    fun updateTreatmentPayment(patientId: String, planId: String, paymentId: String, amount: Double, method: String, paymentDate: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank() || paymentId.isBlank()) return
        scope.launch {
            try {
                val updated = api.updateTreatmentPayment(activeSession.token, patientId, planId, paymentId, amount, method, paymentDate)
                applyUpdatedPatient(updated)
                showMessage("Payment updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    showMessage(error.message)
                }
            } catch (error: Exception) {
                updateLocalTreatmentPlan(patientId, planId) { plan ->
                    val updatedPayments = JSONArray()
                    val payments = plan.array("payments")
                    for (index in 0 until payments.length()) {
                        val payment = payments.optJSONObject(index)
                        if (payment != null && payment.text("id") == paymentId) {
                            updatedPayments.put(
                                JSONObject(payment.toString())
                                    .put("amount", amount)
                                    .put("method", method)
                                    .put("paymentDate", paymentDate)
                                    .put("date", paymentDate)
                                    .put("offlinePending", true),
                            )
                        } else if (payment != null) {
                            updatedPayments.put(payment)
                        }
                    }
                    plan.put("payments", updatedPayments)
                }
                enqueueOfflineMutation(
                    "updateTreatmentPayment",
                    JSONObject()
                        .put("patientId", patientId)
                        .put("planId", planId)
                        .put("paymentId", paymentId)
                        .put("amount", amount)
                        .put("method", method)
                        .put("paymentDate", paymentDate),
                    "Network is slow. Payment edit saved offline and will sync automatically.",
                )
            }
        }
    }

    fun deleteTreatmentPlan(patientId: String, planId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || planId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteTreatmentPlan(activeSession.token, patientId, planId)
                applyUpdatedPatient(updated)
                showMessage("Treatment session deleted.")
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

    fun saveClinicalNote(patientId: String, noteId: String?, title: String, note: String) {
        val activeSession = session ?: return
        if (patientId.isBlank()) return
        scope.launch {
            try {
                val updated = if (noteId.isNullOrBlank()) {
                    api.addClinicalNote(activeSession.token, patientId, title, note)
                } else {
                    api.updateClinicalNote(activeSession.token, patientId, noteId, title, note)
                }
                applyUpdatedPatient(updated)
                showMessage(if (noteId.isNullOrBlank()) "Clinical note added." else "Clinical note updated.")
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

    fun saveClinicalDocument(patientId: String, document: PickedUploadFile) {
        val activeSession = session ?: return
        if (patientId.isBlank()) return
        scope.launch {
            try {
                val updated = api.addClinicalDocument(
                    activeSession.token,
                    patientId,
                    document.name,
                    document.mimeType,
                    document.bytes,
                )
                applyUpdatedPatient(updated)
                showMessage("Clinical document uploaded.")
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

    fun deleteClinicalNote(patientId: String, noteId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || noteId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteClinicalNote(activeSession.token, patientId, noteId)
                applyUpdatedPatient(updated)
                showMessage("Clinical note deleted.")
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

    fun deleteClinicalDocument(patientId: String, documentId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || documentId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteClinicalDocument(activeSession.token, patientId, documentId)
                applyUpdatedPatient(updated)
                showMessage("Clinical document deleted.")
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

    fun saveTherapyRecommendation(patientId: String, serviceId: String, note: String, itemIds: List<String>) {
        val activeSession = session ?: return
        if (patientId.isBlank()) return
        scope.launch {
            try {
                val updated = api.saveTherapyRecommendation(activeSession.token, patientId, serviceId, note, itemIds)
                applyUpdatedPatient(updated)
                showMessage("Therapy recommendation saved.")
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

    fun deleteTherapyRecommendation(patientId: String, recommendationId: String) {
        val activeSession = session ?: return
        if (patientId.isBlank() || recommendationId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteTherapyRecommendation(activeSession.token, patientId, recommendationId)
                applyUpdatedPatient(updated)
                showMessage("Therapy recommendation deleted.")
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

    fun addPatientAppointment(patientId: String, date: String, time: String, service: String) {
        val activeSession = session ?: return
        if (patientId.isBlank()) return
        scope.launch {
            try {
                val updated = api.addPatientAppointment(activeSession.token, patientId, date, time, service)
                applyUpdatedPatient(updated)
                showMessage("Appointment added.")
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

    fun updatePatientAppointment(patientId: String, appointment: JSONObject, status: String, date: String, time: String, remark: String) {
        val activeSession = session ?: return
        val appointmentId = appointment.text("id")
        if (patientId.isBlank() || appointmentId.isBlank()) return
        scope.launch {
            try {
                val updated = api.updatePatientAppointment(
                    token = activeSession.token,
                    patientId = patientId,
                    appointmentId = appointmentId,
                    status = status,
                    date = date,
                    time = time,
                    remark = remark,
                )
                applyUpdatedPatient(updated)
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

    fun decidePatientAppointmentRequest(patientId: String, request: JSONObject, action: String, date: String, time: String, note: String) {
        val activeSession = session ?: return
        val requestId = request.text("id")
        if (requestId.isBlank()) return
        scope.launch {
            try {
                val updatedRequest = if (action == "reschedule") {
                    api.rescheduleAppointmentRequest(activeSession.token, requestId, date, time, note)
                } else {
                    api.approveAppointment(activeSession.token, requestId, date, time, note)
                }
                val tracker = api.getTreatmentTracker(activeSession.token)
                dashboardState = dashboardState.copy(
                    appointments = dashboardState.appointments.map { current ->
                        if (current.text("id") == requestId) updatedRequest else current
                    },
                    treatmentTracker = tracker,
                )
                if (patientId.isNotBlank()) {
                    refreshPatientFromServer(activeSession, patientId)
                }
                showMessage(if (action == "reschedule") "Request rescheduled." else "Request approved.")
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
                val response = api.archivePatient(activeSession.token, id)
                val archivedPatient = response.optJSONObject("patient") ?: item
                dashboardState = dashboardState.copy(
                    patients = dashboardState.patients.filterNot { it.text("id") == id },
                    archivedPatients = listOf(archivedPatient) +
                        dashboardState.archivedPatients.filterNot { it.text("id") == id },
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

    fun restorePatient(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                val response = api.restorePatient(activeSession.token, id)
                val restoredPatient = response.optJSONObject("patient")
                dashboardState = dashboardState.copy(
                    archivedPatients = dashboardState.archivedPatients.filterNot { it.text("id") == id },
                    patients = if (restoredPatient != null) {
                        listOf(restoredPatient) + dashboardState.patients.filterNot { it.text("id") == id }
                    } else {
                        dashboardState.patients
                    },
                )
                showMessage("Patient restored.")
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

    fun permanentlyDeletePatient(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.permanentlyDeletePatient(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    archivedPatients = dashboardState.archivedPatients.filterNot { it.text("id") == id },
                )
                showMessage("Archived patient deleted permanently.")
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
                val tracker = api.getTreatmentTracker(activeSession.token)
                dashboardState = dashboardState.copy(
                    appointments = dashboardState.appointments.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                    treatmentTracker = tracker,
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
                val tracker = api.getTreatmentTracker(activeSession.token)
                dashboardState = dashboardState.copy(
                    appointments = dashboardState.appointments.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                    treatmentTracker = tracker,
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

    fun deleteMailboxItem(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        val type = item.text("type")
        if (id.isBlank() || type.isBlank()) return
        scope.launch {
            try {
                api.deleteMailboxItem(activeSession.token, type, id)
                dashboardState = dashboardState.copy(
                    mailboxItems = dashboardState.mailboxItems.filterNot { current ->
                        current.text("id") == id && current.text("type") == type
                    },
                )
                showMessage("Mail deleted.")
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

    fun sendCustomNotification(title: String, body: String, audience: String, patientIds: List<String>) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val response = api.sendCustomNotification(
                    token = activeSession.token,
                    title = title,
                    body = body,
                    audience = audience,
                    patientIds = patientIds,
                )
                val history = api.getNotificationHistory(activeSession.token)
                dashboardState = dashboardState.copy(notificationItems = history)
                showMessage(response.optString("message").ifBlank { "Notification sent." })
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

    fun deleteNotificationHistory(ids: List<String>) {
        val activeSession = session ?: return
        val notificationIds = ids.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        if (notificationIds.isEmpty()) return
        scope.launch {
            try {
                if (notificationIds.size == 1) {
                    api.deleteNotification(activeSession.token, notificationIds.first())
                } else {
                    api.deleteNotifications(activeSession.token, notificationIds)
                }
                dashboardState = dashboardState.copy(
                    notificationItems = dashboardState.notificationItems.filterNot { item ->
                        item.text("id") in notificationIds
                    },
                )
                showMessage("${notificationIds.size} notification(s) deleted.")
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

    fun saveTherapyResource(
        id: String?,
        serviceId: String,
        title: String,
        description: String,
        file: PickedUploadFile?,
    ) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.saveTherapyResource(
                    token = activeSession.token,
                    id = id,
                    serviceId = serviceId,
                    title = title,
                    description = description,
                    fileName = file?.name,
                    mimeType = file?.mimeType,
                    fileBytes = file?.bytes,
                )
                dashboardState = dashboardState.copy(
                    therapyResources = if (id.isNullOrBlank()) {
                        listOf(saved) + dashboardState.therapyResources
                    } else {
                        dashboardState.therapyResources.map { current ->
                            if (current.text("id") == id) saved else current
                        }
                    },
                )
                showMessage(if (id.isNullOrBlank()) "Therapy file added." else "Therapy file updated.")
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

    fun saveMarketingSource(id: String?, payload: JSONObject, photo: PickedUploadFile?) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.saveMarketingSource(
                    token = activeSession.token,
                    id = id,
                    payload = payload,
                    photoName = photo?.name,
                    photoMimeType = photo?.mimeType,
                    photoBytes = photo?.bytes,
                )
                val nextSources = if (id.isNullOrBlank()) {
                    listOf(saved) + dashboardState.marketingSources
                } else {
                    dashboardState.marketingSources.map { current ->
                        if (current.text("id") == id) saved else current
                    }
                }
                dashboardState = dashboardState.copy(marketingSources = sortMarketingSources(nextSources))
                showMessage(if (id.isNullOrBlank()) "Marketing source added." else "Marketing source updated.")
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

    fun deleteMarketingSource(item: JSONObject) {
        val activeSession = session ?: return
        val id = item.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                api.deleteMarketingSource(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    marketingSources = dashboardState.marketingSources.filterNot { it.text("id") == id },
                )
                showMessage("Marketing source deleted.")
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

    fun addMarketingReferral(source: JSONObject, payload: JSONObject) {
        val activeSession = session ?: return
        val sourceId = source.text("id")
        if (sourceId.isBlank()) return
        scope.launch {
            try {
                val updated = api.addMarketingReferral(activeSession.token, sourceId, payload)
                dashboardState = dashboardState.copy(
                    marketingSources = sortMarketingSources(
                        dashboardState.marketingSources.map { current ->
                            if (current.text("id") == sourceId) updated else current
                        },
                    ),
                )
                showMessage("Lead data generated.")
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

    fun deleteMarketingReferral(source: JSONObject, referral: JSONObject) {
        val activeSession = session ?: return
        val sourceId = source.text("id")
        val referralId = referral.text("id")
        if (sourceId.isBlank() || referralId.isBlank()) return
        scope.launch {
            try {
                val updated = api.deleteMarketingReferral(activeSession.token, sourceId, referralId)
                dashboardState = dashboardState.copy(
                    marketingSources = sortMarketingSources(
                        dashboardState.marketingSources.map { current ->
                            if (current.text("id") == sourceId) updated else current
                        },
                    ),
                )
                showMessage("Lead data deleted.")
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

    fun saveStaffMember(id: String?, form: StaffFormState) {
        val activeSession = session ?: return
        val validationError = validateCreateStaffForm(form, requirePassword = id.isNullOrBlank())
        if (validationError != null) {
            createError = validationError
            return
        }

        createLoading = true
        createError = ""
        creationMessage = ""

        scope.launch {
            try {
                val saved = if (id.isNullOrBlank()) {
                    api.createStaff(activeSession.token, form.toStaffRequest())
                } else {
                    api.updateStaff(activeSession.token, id, form.toStaffRequest())
                }

                val nextUsers = if (id.isNullOrBlank()) {
                    listOf(saved) + dashboardState.users
                } else {
                    dashboardState.users.map { current ->
                        if (current.id == id) saved else current
                    }
                }
                val nextAdmin = if ((dashboardState.admin ?: activeSession.user).id == saved.id) {
                    saved
                } else {
                    dashboardState.admin
                }
                dashboardState = dashboardState.copy(users = nextUsers, admin = nextAdmin)
                if (activeSession.user.id == saved.id) {
                    val updatedSession = activeSession.copy(user = saved)
                    session = updatedSession
                    sessionStore.saveSession(updatedSession)
                }
                createForm = emptyStaffForm()
                creationMessage = if (id.isNullOrBlank()) "Staff member created successfully." else "Staff member updated successfully."
                selectedTab = AdminTab.Team
                showMessage(if (id.isNullOrBlank()) "New staff member added." else "Staff member updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your admin session ended. Please log in again.")
                } else {
                    createError = error.message
                }
            } catch (error: Exception) {
                createError = networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error)
            } finally {
                createLoading = false
            }
        }
    }

    fun saveOwnProfile(user: StaffUser, form: StaffFormState) {
        val activeSession = session ?: return
        val validationError = validateCreateStaffForm(form, requirePassword = false)
        if (validationError != null) {
            createError = validationError
            return
        }

        createLoading = true
        createError = ""
        scope.launch {
            try {
                val saved = api.updateMyProfile(activeSession.token, form.name, form.email, form.mobile)
                dashboardState = dashboardState.copy(
                    admin = saved,
                    users = dashboardState.users.map { current -> if (current.id == saved.id) saved else current },
                )
                val updatedSession = activeSession.copy(user = saved)
                session = updatedSession
                sessionStore.saveSession(updatedSession)
                showMessage("Profile updated.")
            } catch (error: ApiException) {
                if (error.statusCode == 401 || error.statusCode == 403) {
                    clearToLogin("Your session ended. Please log in again.")
                } else {
                    createError = error.message
                }
            } catch (error: Exception) {
                createError = networkErrorMessage(StaffApiService.DEFAULT_BASE_URL, error)
            } finally {
                createLoading = false
            }
        }
    }

    fun uploadOwnProfileImage(user: StaffUser, photo: PickedUploadFile) {
        val activeSession = session ?: return
        scope.launch {
            try {
                val saved = api.uploadProfileImage(
                    activeSession.token,
                    user.id,
                    photo.name,
                    photo.mimeType,
                    photo.bytes,
                )
                dashboardState = dashboardState.copy(
                    admin = saved,
                    users = dashboardState.users.map { current -> if (current.id == saved.id) saved else current },
                )
                val updatedSession = activeSession.copy(user = saved)
                session = updatedSession
                sessionStore.saveSession(updatedSession)
                showMessage("Profile picture updated.")
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

    fun deleteStaffMember(user: StaffUser) {
        val activeSession = session ?: return
        if (user.id.isBlank()) return
        scope.launch {
            try {
                api.deleteStaff(activeSession.token, user.id)
                dashboardState = dashboardState.copy(
                    users = dashboardState.users.filterNot { it.id == user.id },
                )
                showMessage("Staff member deleted.")
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

    fun updateStaffMemberStatus(user: StaffUser, status: String) {
        saveStaffMember(user.id, user.toStaffFormState().copy(status = status))
    }

    fun markChatRead(conversation: JSONObject) {
        val activeSession = session ?: return
        val id = conversation.text("id")
        if (id.isBlank()) return
        scope.launch {
            try {
                val updated = api.markChatRead(activeSession.token, id)
                dashboardState = dashboardState.copy(
                    chatConversations = dashboardState.chatConversations.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
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

    fun sendChatReply(conversation: JSONObject, text: String) {
        val activeSession = session ?: return
        val id = conversation.text("id")
        if (id.isBlank() || text.trim().isBlank()) return
        scope.launch {
            try {
                val updated = api.sendChatMessage(activeSession.token, id, text.trim())
                dashboardState = dashboardState.copy(
                    chatConversations = dashboardState.chatConversations.map { current ->
                        if (current.text("id") == id) updated else current
                    },
                )
                showMessage("Reply sent.")
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

    BackHandler(enabled = route == AppRoute.Dashboard) {
        if (selectedTab != AdminTab.Overview) {
            selectedTab = AdminTab.Overview
            return@BackHandler
        }

        val now = System.currentTimeMillis()
        if (now - lastBackPressAt < 1800) {
            (context as? ComponentActivity)?.finish()
        } else {
            lastBackPressAt = now
            showMessage("Press back again to exit.")
        }
    }

    Scaffold(
        containerColor = OpwMist,
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .pointerInput(focusManager) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Final)
                            if (event.type == PointerEventType.Release && event.changes.none { it.isConsumed }) {
                                focusManager.clearFocus()
                            }
                        }
                    }
                },
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
                    payrollMonth = payrollMonth,
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
                    onFinanceApply = ::reloadFinance,
                    onFinanceSave = ::saveFinanceEntry,
                    onFinanceDelete = ::deleteFinanceEntry,
                    onPayrollMonthChange = { payrollMonth = it },
                    onPayrollApply = ::reloadPayroll,
                    onPayrollSave = ::savePayrollPayment,
                    onPayrollDelete = ::deletePayrollPayment,
                    onPatientSave = ::savePatient,
                    onPatientArchive = ::archivePatient,
                    onPatientRestore = ::restorePatient,
                    onPatientPermanentDelete = ::permanentlyDeletePatient,
                    onTreatmentPlanSave = ::saveTreatmentPlan,
                    onTreatmentPlanStatusChange = ::updateTreatmentPlanStatus,
                    onSessionDayStatusChange = ::updateSessionDayStatus,
                    onTreatmentSessionEntryAdd = ::addTreatmentSessionEntry,
                    onTreatmentSessionEntryDelete = ::deleteTreatmentSessionEntry,
                    onTreatmentPaymentAdd = ::addTreatmentPayment,
                    onTreatmentPaymentUpdate = ::updateTreatmentPayment,
                    onTreatmentPlanDelete = ::deleteTreatmentPlan,
                    onClinicalNoteSave = ::saveClinicalNote,
                    onClinicalDocumentSave = ::saveClinicalDocument,
                    onClinicalNoteDelete = ::deleteClinicalNote,
                    onClinicalDocumentDelete = ::deleteClinicalDocument,
                    onTherapyRecommendationSave = ::saveTherapyRecommendation,
                    onTherapyRecommendationDelete = ::deleteTherapyRecommendation,
                    onPatientAppointmentAdd = ::addPatientAppointment,
                    onPatientAppointmentUpdate = ::updatePatientAppointment,
                    onPatientAppointmentRequestDecision = ::decidePatientAppointmentRequest,
                    onAppointmentApprove = ::approveAppointment,
                    onAppointmentStatusChange = ::updateAppointmentStatus,
                    onMailboxReadChange = ::updateMailboxRead,
                    onMailboxDelete = ::deleteMailboxItem,
                    onCustomNotificationSend = ::sendCustomNotification,
                    onNotificationHistoryDelete = ::deleteNotificationHistory,
                    onServiceSave = ::saveService,
                    onServiceDelete = ::deleteService,
                    onTherapySave = ::saveTherapyResource,
                    onTherapyDelete = ::deleteTherapyResource,
                    onShopOrderStatusChange = ::updateShopOrderStatus,
                    onShopProductSave = ::saveShopProduct,
                    onShopProductDelete = ::deleteShopProduct,
                    onMarketingSave = ::saveMarketingSource,
                    onMarketingDelete = ::deleteMarketingSource,
                    onMarketingReferralAdd = ::addMarketingReferral,
                    onMarketingReferralDelete = ::deleteMarketingReferral,
                    onFormChange = {
                        createForm = it
                        createError = ""
                        if (creationMessage.isNotBlank()) {
                            creationMessage = ""
                        }
                    },
                    onProfileSave = ::saveOwnProfile,
                    onProfileImageUpload = ::uploadOwnProfileImage,
                    onStaffSave = ::saveStaffMember,
                    onStaffStatusChange = ::updateStaffMemberStatus,
                    onStaffDelete = ::deleteStaffMember,
                    onChatRead = ::markChatRead,
                    onChatReply = ::sendChatReply,
                    onCreateStaff = {
                        saveStaffMember(null, createForm)
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
            OpwLogoMark(modifier = Modifier.size(82.dp), cornerRadius = 28.dp)
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
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(appBackgroundBrush()),
        contentAlignment = Alignment.Center,
    ) {
        StaffPastelBackground()
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
                OpwLogoMark(modifier = Modifier.size(76.dp), cornerRadius = 24.dp)
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
    payrollMonth: String,
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
    onFinanceApply: () -> Unit,
    onFinanceSave: (String?, JSONObject) -> Unit,
    onFinanceDelete: (JSONObject) -> Unit,
    onPayrollMonthChange: (String) -> Unit,
    onPayrollApply: (String) -> Unit,
    onPayrollSave: (String?, JSONObject) -> Unit,
    onPayrollDelete: (JSONObject) -> Unit,
    onPatientSave: (String?, JSONObject) -> Unit,
    onPatientArchive: (JSONObject) -> Unit,
    onPatientRestore: (JSONObject) -> Unit,
    onPatientPermanentDelete: (JSONObject) -> Unit,
    onTreatmentPlanSave: (String, String?, JSONObject) -> Unit,
    onTreatmentPlanStatusChange: (String, String, String) -> Unit,
    onSessionDayStatusChange: (String, String, String, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    onTreatmentSessionEntryDelete: (String, String, String) -> Unit,
    onTreatmentPaymentAdd: (String, String, Double, String, String) -> Unit,
    onTreatmentPaymentUpdate: (String, String, String, Double, String, String) -> Unit,
    onTreatmentPlanDelete: (String, String) -> Unit,
    onClinicalNoteSave: (String, String?, String, String) -> Unit,
    onClinicalDocumentSave: (String, PickedUploadFile) -> Unit,
    onClinicalNoteDelete: (String, String) -> Unit,
    onClinicalDocumentDelete: (String, String) -> Unit,
    onTherapyRecommendationSave: (String, String, String, List<String>) -> Unit,
    onTherapyRecommendationDelete: (String, String) -> Unit,
    onPatientAppointmentAdd: (String, String, String, String) -> Unit,
    onPatientAppointmentUpdate: (String, JSONObject, String, String, String, String) -> Unit,
    onPatientAppointmentRequestDecision: (String, JSONObject, String, String, String, String) -> Unit,
    onAppointmentApprove: (JSONObject) -> Unit,
    onAppointmentStatusChange: (JSONObject, String) -> Unit,
    onMailboxReadChange: (JSONObject) -> Unit,
    onMailboxDelete: (JSONObject) -> Unit,
    onCustomNotificationSend: (String, String, String, List<String>) -> Unit,
    onNotificationHistoryDelete: (List<String>) -> Unit,
    onServiceSave: (String?, String) -> Unit,
    onServiceDelete: (JSONObject) -> Unit,
    onTherapySave: (String?, String, String, String, PickedUploadFile?) -> Unit,
    onTherapyDelete: (JSONObject) -> Unit,
    onShopOrderStatusChange: (JSONObject, String) -> Unit,
    onShopProductSave: (String?, JSONObject) -> Unit,
    onShopProductDelete: (JSONObject) -> Unit,
    onMarketingSave: (String?, JSONObject, PickedUploadFile?) -> Unit,
    onMarketingDelete: (JSONObject) -> Unit,
    onMarketingReferralAdd: (JSONObject, JSONObject) -> Unit,
    onMarketingReferralDelete: (JSONObject, JSONObject) -> Unit,
    onFormChange: (StaffFormState) -> Unit,
    onProfileSave: (StaffUser, StaffFormState) -> Unit,
    onProfileImageUpload: (StaffUser, PickedUploadFile) -> Unit,
    onStaffSave: (String?, StaffFormState) -> Unit,
    onStaffStatusChange: (StaffUser, String) -> Unit,
    onStaffDelete: (StaffUser) -> Unit,
    onChatRead: (JSONObject) -> Unit,
    onChatReply: (JSONObject, String) -> Unit,
    onCreateStaff: () -> Unit,
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val currentUser = state.admin ?: session?.user
    val context = LocalContext.current
    val isAdmin = currentUser?.role == "Admin"
    val visibleTabs = AdminTab.entries.filter { tab ->
        tab !in listOf(AdminTab.Appointments, AdminTab.Create, AdminTab.Profile) &&
            canOpenAdminTab(currentUser, tab)
    }
    val activeTab = if (canOpenAdminTab(currentUser, selectedTab)) {
        selectedTab
    } else {
        visibleTabs.firstOrNull() ?: AdminTab.Profile
    }
    var headerSearchOpen by rememberSaveable { mutableStateOf(false) }
    var headerAddRequest by rememberSaveable { mutableStateOf(0) }
    val headerHasSearch = activeTab in listOf(
        AdminTab.Mailbox,
        AdminTab.Notifications,
        AdminTab.Services,
        AdminTab.Therapy,
        AdminTab.Shop,
        AdminTab.Marketing,
        AdminTab.Feedback,
        AdminTab.Jobs,
        AdminTab.Finance,
        AdminTab.Payroll,
        AdminTab.Chat,
        AdminTab.Team,
    )
    val headerHasAdd = activeTab in listOf(
        AdminTab.Services,
        AdminTab.Notifications,
        AdminTab.Therapy,
        AdminTab.Shop,
        AdminTab.Marketing,
        AdminTab.Jobs,
        AdminTab.Finance,
        AdminTab.Payroll,
        AdminTab.Team,
    ) && canAddAdminTab(currentUser, activeTab)
    val activeAdmins = state.users.count { it.role == "Admin" }
    val activeStaff = state.users.count { it.role != "Admin" && it.status != "Inactive" }
    val unreadMailbox = state.mailboxItems.count { !it.optBoolean("isRead") }
    val contentScrollState = rememberScrollState()
    val mailboxTotal = if (state.mailboxItems.isNotEmpty()) {
        state.mailboxItems.size
    } else {
        state.applications.size
    }

    LaunchedEffect(activeTab, selectedTab) {
        if (activeTab != selectedTab) {
            onTabSelected(activeTab)
        }
    }

    LaunchedEffect(activeTab) {
        headerSearchOpen = false
        headerAddRequest = 0
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(304.dp),
                drawerShape = RoundedCornerShape(0.dp),
                drawerContainerColor = Color.Transparent,
                windowInsets = WindowInsets(0.dp),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(drawerBrush()),
                ) {
                    StaffPastelBackground()
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 18.dp, vertical = 22.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            OpwLogoMark(modifier = Modifier.size(58.dp), cornerRadius = 18.dp)
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentUser?.name?.takeIf { it.isNotBlank() } ?: "Omm Physio World",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = OpwInk,
                                    fontWeight = FontWeight.Black,
                                )
                                Text(
                                    text = if (isAdmin) "Admin account" else "Staff account",
                                    color = OpwSlate,
                                    style = MaterialTheme.typography.bodyLarge,
                                )
                            }
                            DrawerProfileButton(
                                user = currentUser,
                                token = session?.token,
                                onClick = {
                                    onTabSelected(AdminTab.Profile)
                                    scope.launch { drawerState.close() }
                                },
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
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
                                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(18.dp),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(if (activeTab == tab) 10.dp else 8.dp)
                                                        .background(accent, CircleShape),
                                                )
                                            }
                                            Text(
                                                text = tab.label,
                                                fontWeight = FontWeight.Black,
                                                style = MaterialTheme.typography.titleMedium,
                                            )
                                        }
                                        val count = moduleCount(tab, state)
                                        if (count > 0) {
                                            StatusChip(
                                                label = count.toString(),
                                                background = accent.copy(alpha = 0.12f),
                                                foreground = accent,
                                            )
                                        }
                                    }
                                },
                                selected = activeTab == tab,
                                shape = RoundedCornerShape(14.dp),
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = Color(0xFFDDFBEA),
                                    selectedTextColor = OpwBlue,
                                    unselectedContainerColor = Color.Transparent,
                                    unselectedTextColor = OpwInk,
                                ),
                                onClick = {
                                    onTabSelected(tab)
                                    scope.launch { drawerState.close() }
                                },
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        DividerLine()
                        NavigationDrawerItem(
                            label = {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(18.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(9.dp)
                                                .background(OpwDanger, CircleShape),
                                        )
                                    }
                                    Text(
                                        "Logout",
                                        fontWeight = FontWeight.Black,
                                        style = MaterialTheme.typography.titleMedium,
                                    )
                                }
                            },
                            selected = false,
                            shape = RoundedCornerShape(14.dp),
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = Color(0xFFFFE4E6),
                                selectedTextColor = OpwDanger,
                                unselectedContainerColor = Color.Transparent,
                                unselectedTextColor = OpwDanger,
                            ),
                            onClick = {
                                scope.launch { drawerState.close() }
                                onLogout()
                            },
                        )
                        Spacer(modifier = Modifier.height(22.dp))
                        TextButton(
                            onClick = {
                                openExternalUrl(context, "http://ommphysioworld.com/")
                                scope.launch { drawerState.close() }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                text = "Check our website",
                                color = OpwBlue,
                                fontWeight = FontWeight.Black,
                                style = MaterialTheme.typography.titleMedium,
                                textAlign = TextAlign.Center,
                            )
                        }
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
            StaffPastelBackground()
            Scaffold(containerColor = Color.Transparent) { innerPadding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    if (activeTab != AdminTab.Patients) {
                        ModulePlainHeader(
                            selectedTab = activeTab,
                            onMenu = { scope.launch { drawerState.open() } },
                            searchOpen = headerSearchOpen,
                            onSearchToggle = if (headerHasSearch) {
                                { headerSearchOpen = !headerSearchOpen }
                            } else {
                                null
                            },
                            onRefresh = onRefresh,
                            onAdd = if (headerHasAdd) {
                                { headerAddRequest += 1 }
                            } else {
                                null
                            },
                        )
                    }

                    if (state.loading) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color = moduleAccent(activeTab),
                            trackColor = Color.White,
                        )
                    }

                    if (state.error.isNotBlank()) {
                        StatusBanner(message = state.error, tone = BannerTone.Error)
                    }

                    moduleErrorsForTab(activeTab, state).forEach { error ->
                        StatusBanner(message = error, tone = BannerTone.Info)
                    }

                    if (activeTab == AdminTab.Patients) {
                        Box(modifier = Modifier.weight(1f)) {
                            PatientsTab(
                                token = session?.token,
                                patients = state.patients,
                                archivedPatients = state.archivedPatients,
                                users = state.users,
                                services = state.services,
                                therapyResources = state.therapyResources,
                                appointmentRequests = state.appointments,
                                onMenu = { scope.launch { drawerState.open() } },
                                onSave = onPatientSave,
                                onArchive = onPatientArchive,
                                onRestore = onPatientRestore,
                                onPermanentDelete = onPatientPermanentDelete,
                                canAddPatient = hasModulePermission(currentUser, "patients", "add"),
                                canEditPatient = hasModulePermission(currentUser, "patients", "edit"),
                                canViewArchive = hasModulePermission(currentUser, "archived_patients", "view"),
                                canEditArchive = hasModulePermission(currentUser, "archived_patients", "edit"),
                                canAddTreatmentPlan = hasModulePermission(currentUser, "treatment_plans", "add"),
                                canEditTreatmentPlan = hasModulePermission(currentUser, "treatment_plans", "edit"),
                                canAddClinicalNote = hasModulePermission(currentUser, "clinical_notes", "add"),
                                canEditClinicalNote = hasModulePermission(currentUser, "clinical_notes", "edit"),
                                canAddTherapyRecommendation = hasModulePermission(currentUser, "therapy_recommendations", "add"),
                                canEditTherapyRecommendation = hasModulePermission(currentUser, "therapy_recommendations", "edit"),
                                canAddPayment = hasModulePermission(currentUser, "payments", "add"),
                                canEditPayment = hasModulePermission(currentUser, "payments", "edit"),
                                canAddAppointment = hasModulePermission(currentUser, "appointments", "add"),
                                canEditAppointment = hasModulePermission(currentUser, "appointments", "edit"),
                                onTreatmentPlanSave = onTreatmentPlanSave,
                                onTreatmentPlanStatusChange = onTreatmentPlanStatusChange,
                                onSessionDayStatusChange = onSessionDayStatusChange,
                                onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                                onTreatmentSessionEntryDelete = onTreatmentSessionEntryDelete,
                                onTreatmentPaymentAdd = onTreatmentPaymentAdd,
                                onTreatmentPaymentUpdate = onTreatmentPaymentUpdate,
                                onTreatmentPlanDelete = onTreatmentPlanDelete,
                                onClinicalNoteSave = onClinicalNoteSave,
                                onClinicalDocumentSave = onClinicalDocumentSave,
                                onClinicalNoteDelete = onClinicalNoteDelete,
                                onClinicalDocumentDelete = onClinicalDocumentDelete,
                                onTherapyRecommendationSave = onTherapyRecommendationSave,
                                onTherapyRecommendationDelete = onTherapyRecommendationDelete,
                                onPatientAppointmentAdd = onPatientAppointmentAdd,
                                onPatientAppointmentUpdate = onPatientAppointmentUpdate,
                                onPatientAppointmentRequestDecision = onPatientAppointmentRequestDecision,
                            )
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .verticalScroll(contentScrollState),
                            verticalArrangement = Arrangement.spacedBy(18.dp),
                        ) {
                    when (activeTab) {
                    AdminTab.Overview -> OverviewTab(
                        admin = state.admin ?: session?.user,
                        users = state.users,
                        applications = state.applications,
                        activeAdmins = activeAdmins,
                        activeStaff = activeStaff,
                        unreadApplications = unreadMailbox,
                        state = state,
                        token = session?.token,
                        onOpenTab = onTabSelected,
                    )

                    AdminTab.Patients -> Unit
                    AdminTab.Appointments -> AppointmentsTab(
                        appointments = state.appointments,
                        onApprove = onAppointmentApprove,
                        onStatusChange = onAppointmentStatusChange,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Appointments),
                    )
                    AdminTab.Treatment -> TreatmentTab(
                        tracker = state.treatmentTracker,
                        users = state.users,
                        onAppointmentRequestDecision = onPatientAppointmentRequestDecision,
                        onAppointmentStatusChange = onAppointmentStatusChange,
                        onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                        canEdit = canAddAdminTab(currentUser, AdminTab.Treatment) ||
                            canEditAdminTab(currentUser, AdminTab.Treatment),
                    )
                    AdminTab.Mailbox -> MailboxTab(
                        items = state.mailboxItems,
                        applications = state.applications,
                        onReadChange = onMailboxReadChange,
                        onDelete = onMailboxDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Mailbox),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                    )
                    AdminTab.Notifications -> NotificationsTab(
                        items = state.notificationItems,
                        patients = state.patients,
                        onSend = onCustomNotificationSend,
                        onDelete = onNotificationHistoryDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Notifications),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Services -> ServicesTab(
                        services = state.services,
                        onSave = onServiceSave,
                        onDelete = onServiceDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Services),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Therapy -> TherapyTab(
                        resources = state.therapyResources,
                        services = state.services,
                        onSave = onTherapySave,
                        onDelete = onTherapyDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Therapy),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Shop -> ShopTab(
                        products = state.shopProducts,
                        orders = state.shopOrders,
                        onOrderStatusChange = onShopOrderStatusChange,
                        onProductSave = onShopProductSave,
                        onProductDelete = onShopProductDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Shop),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Marketing -> MarketingTab(
                        sources = state.marketingSources,
                        token = session?.token,
                        onSave = onMarketingSave,
                        onDelete = onMarketingDelete,
                        onReferralAdd = onMarketingReferralAdd,
                        onReferralDelete = onMarketingReferralDelete,
                        canAdd = canAddAdminTab(currentUser, AdminTab.Marketing),
                        canEdit = canEditAdminTab(currentUser, AdminTab.Marketing),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Feedback -> FeedbackTab(
                        items = state.feedbackItems,
                        onToggleApproval = onFeedbackApprovalChange,
                        onDelete = onFeedbackDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Feedback),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
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
                        canEdit = canEditAdminTab(currentUser, AdminTab.Jobs),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Reports -> ReportsTab(
                        report = state.reports,
                        users = state.users,
                        fromDate = reportFromDate,
                        toDate = reportToDate,
                        loading = reportLoading,
                        error = reportError,
                        onRangeChange = onReportRangeChange,
                        onApply = onReportApply,
                    )
                    AdminTab.Finance -> FinanceTab(
                        finance = state.finance,
                        users = state.users,
                        fromDate = reportFromDate,
                        toDate = reportToDate,
                        onRangeChange = onReportRangeChange,
                        onApply = onFinanceApply,
                        onSave = onFinanceSave,
                        onDelete = onFinanceDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Finance),
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Payroll -> PayrollTab(
                        payroll = state.payroll,
                        month = payrollMonth,
                        onMonthChange = onPayrollMonthChange,
                        onApply = onPayrollApply,
                        onSave = onPayrollSave,
                        onDelete = onPayrollDelete,
                        canAdd = canAddAdminTab(currentUser, AdminTab.Payroll),
                        canEdit = canEditAdminTab(currentUser, AdminTab.Payroll),
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Chat -> ChatTab(
                        conversations = state.chatConversations,
                        currentUser = currentUser,
                        onRead = onChatRead,
                        onReply = onChatReply,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Chat),
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                    )
                    AdminTab.Team -> TeamTab(
                        users = state.users,
                        formState = formState,
                        error = formError,
                        loading = formLoading,
                        creationMessage = creationMessage,
                        onFormChange = onFormChange,
                        onSave = onStaffSave,
                        onStatusChange = onStaffStatusChange,
                        onDelete = onStaffDelete,
                        canEdit = canEditAdminTab(currentUser, AdminTab.Team),
                        canManageSalary = currentUser?.role == "Admin",
                        searchOpen = headerSearchOpen,
                        onSearchOpenChange = { headerSearchOpen = it },
                        addRequest = headerAddRequest,
                    )
                    AdminTab.Create -> CreateStaffTab(
                        formState = formState,
                        error = formError,
                        loading = formLoading,
                        creationMessage = creationMessage,
                        onFormChange = onFormChange,
                        onSubmit = onCreateStaff,
                        canManageSalary = currentUser?.role == "Admin",
                    )

                    AdminTab.Profile -> ProfileTab(
                        user = state.admin ?: session?.user,
                        token = session?.token,
                        error = formError,
                        loading = formLoading,
                        onSave = onProfileSave,
                        onUploadImage = onProfileImageUpload,
                    )
                    }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ModulePlainHeader(
    selectedTab: AdminTab,
    onMenu: () -> Unit,
    searchOpen: Boolean,
    onSearchToggle: (() -> Unit)? = null,
    onRefresh: (() -> Unit)? = null,
    onAdd: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PatientMenuButton(onClick = onMenu)
        Text(
            text = selectedTab.label,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold,
            color = OpwInk,
        )
        Spacer(modifier = Modifier.weight(1f))
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onRefresh != null) {
                RefreshCircleButton(onClick = onRefresh)
            }
            if (onSearchToggle != null) {
                SearchCircleButton(active = searchOpen, onClick = onSearchToggle)
            }
            if (onAdd != null) {
                AddCircleButton(onClick = onAdd)
            }
        }
    }
}

@Composable
private fun ProfileAvatarButton(
    user: StaffUser?,
    token: String?,
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 3.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(48.dp),
            contentAlignment = Alignment.Center,
        ) {
            ProfilePhotoContent(user = user, token = token, modifier = Modifier.size(48.dp))
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(18.dp)
                    .background(OpwBlue, CircleShape)
                    .border(2.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                TinyEditGlyph(Color.White)
            }
        }
    }
}

@Composable
private fun DrawerProfileButton(
    user: StaffUser?,
    token: String?,
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.94f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD9EAF8)),
        shadowElevation = 2.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(56.dp),
            contentAlignment = Alignment.Center,
        ) {
            ProfilePhotoContent(user = user, token = token, modifier = Modifier.size(52.dp))
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(20.dp)
                    .background(OpwBlue, CircleShape)
                    .border(2.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                TinyEditGlyph(Color.White)
            }
        }
    }
}

@Composable
private fun ProfilePhotoContent(
    user: StaffUser?,
    token: String?,
    modifier: Modifier = Modifier,
) {
    val imageUrl = remember(user?.profileImageUrl) {
        absoluteProfileImageUrl(user?.profileImageUrl.orEmpty())
    }
    var imageBitmap by remember(imageUrl, token) { mutableStateOf<ImageBitmap?>(null) }

    LaunchedEffect(imageUrl, token) {
        imageBitmap = if (imageUrl.isBlank()) null else loadProfileImage(imageUrl, token)
    }

    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(Brush.linearGradient(listOf(OpwSky, OpwAqua))),
        contentAlignment = Alignment.Center,
    ) {
        if (imageBitmap != null) {
            Image(
                bitmap = imageBitmap!!,
                contentDescription = "Profile picture",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Text(
                text = user?.name?.take(1)?.ifBlank { "S" }?.uppercase() ?: "S",
                color = OpwNavy,
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium,
            )
        }
    }
}

@Composable
private fun TinyEditGlyph(color: Color) {
    Canvas(modifier = Modifier.size(10.dp)) {
        drawLine(
            color = color,
            start = Offset(2.dp.toPx(), 8.dp.toPx()),
            end = Offset(8.dp.toPx(), 2.dp.toPx()),
            strokeWidth = 1.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(6.8.dp.toPx(), 1.3.dp.toPx()),
            end = Offset(8.8.dp.toPx(), 3.3.dp.toPx()),
            strokeWidth = 1.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
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
                HeaderMenuButton(onClick = onMenu)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 12.dp),
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
private fun HeaderMenuButton(
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = Color.White.copy(alpha = 0.14f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f)),
        onClick = onClick,
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .size(width = 24.dp, height = 18.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            repeat(3) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(2.dp)
                        .background(Color.White, RoundedCornerShape(999.dp)),
                )
            }
        }
    }
}

@Composable
private fun PatientMenuButton(
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = OpwCard,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 2.dp,
        onClick = onClick,
    ) {
        Column(
            modifier = Modifier
                .padding(11.dp)
                .size(width = 22.dp, height = 16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            repeat(3) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(2.dp)
                        .background(OpwInk, RoundedCornerShape(999.dp)),
                )
            }
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
    action: @Composable (() -> Unit)? = null,
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
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StatusChip(
                    label = countLabel,
                    background = accent.copy(alpha = 0.1f),
                    foreground = accent,
                )
                action?.invoke()
            }
        }
    }
}

@Composable
private fun AddCircleButton(
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.96f),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBlue.copy(alpha = 0.16f)),
        shadowElevation = 6.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(46.dp),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .background(OpwBlue.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                PlusGlyph(OpwBlue)
            }
        }
    }
}

@Composable
private fun PlusGlyph(color: Color) {
    Canvas(modifier = Modifier.size(18.dp)) {
        drawLine(
            color,
            Offset(size.width / 2f, 3.dp.toPx()),
            Offset(size.width / 2f, size.height - 3.dp.toPx()),
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color,
            Offset(3.dp.toPx(), size.height / 2f),
            Offset(size.width - 3.dp.toPx(), size.height / 2f),
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun RefreshCircleButton(
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 3.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(44.dp),
            contentAlignment = Alignment.Center,
        ) {
            RefreshGlyph(color = OpwBlue)
        }
    }
}

@Composable
private fun ArchiveCircleButton(
    count: Int,
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color(0xFF334155),
        shadowElevation = 3.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(44.dp),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 21.dp, height = 4.dp)
                        .background(Color.White, RoundedCornerShape(999.dp)),
                )
                Box(
                    modifier = Modifier
                        .size(width = 24.dp, height = 15.dp)
                        .border(2.dp, Color.White, RoundedCornerShape(4.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Box(
                        modifier = Modifier
                            .size(width = 8.dp, height = 2.dp)
                            .background(Color.White, RoundedCornerShape(999.dp)),
                    )
                }
            }
            if (count > 0) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(16.dp)
                        .background(OpwWarning, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = count.coerceAtMost(9).toString(),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold,
                    )
                }
            }
        }
    }
}

@Composable
private fun SearchCircleButton(
    active: Boolean,
    onClick: () -> Unit,
) {
    val foreground = if (active) Color.White else OpwInk
    Surface(
        shape = CircleShape,
        color = if (active) OpwBlue else Color.White,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (active) OpwBlue else OpwBorder,
        ),
        shadowElevation = 3.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(44.dp),
            contentAlignment = Alignment.Center,
        ) {
            SearchGlyph(color = foreground)
        }
    }
}

@Composable
private fun BackCircleButton(
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 3.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(44.dp),
            contentAlignment = Alignment.Center,
        ) {
            BackGlyph(color = OpwInk)
        }
    }
}

private enum class PatientActionIcon {
    View,
    Edit,
    Archive,
}

@Composable
private fun PatientIconActionButton(
    icon: PatientActionIcon,
    onClick: () -> Unit,
) {
    val color = when (icon) {
        PatientActionIcon.View -> OpwBlue
        PatientActionIcon.Edit -> OpwSuccess
        PatientActionIcon.Archive -> OpwWarning
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.28f)),
        shadowElevation = 2.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(44.dp),
            contentAlignment = Alignment.Center,
        ) {
            when (icon) {
                PatientActionIcon.View -> ViewGlyph(color)
                PatientActionIcon.Edit -> EditGlyph(color)
                PatientActionIcon.Archive -> ArchiveGlyph(color)
            }
        }
    }
}

@Composable
private fun SearchGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        val stroke = Stroke(width = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawCircle(
            color = color,
            radius = 7.dp.toPx(),
            center = Offset(9.dp.toPx(), 9.dp.toPx()),
            style = stroke,
        )
        drawLine(
            color = color,
            start = Offset(14.5.dp.toPx(), 14.5.dp.toPx()),
            end = Offset(20.dp.toPx(), 20.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun RefreshGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        val stroke = Stroke(width = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawArc(
            color = color,
            startAngle = 38f,
            sweepAngle = 278f,
            useCenter = false,
            topLeft = Offset(4.dp.toPx(), 4.dp.toPx()),
            size = Size(14.dp.toPx(), 14.dp.toPx()),
            style = stroke,
        )
        drawLine(
            color = color,
            start = Offset(16.dp.toPx(), 4.5.dp.toPx()),
            end = Offset(18.dp.toPx(), 9.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(16.dp.toPx(), 4.5.dp.toPx()),
            end = Offset(11.5.dp.toPx(), 5.4.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun BackGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        drawLine(
            color = color,
            start = Offset(14.dp.toPx(), 4.dp.toPx()),
            end = Offset(7.dp.toPx(), 11.dp.toPx()),
            strokeWidth = 2.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(7.dp.toPx(), 11.dp.toPx()),
            end = Offset(14.dp.toPx(), 18.dp.toPx()),
            strokeWidth = 2.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun CloseGlyph(color: Color) {
    Canvas(modifier = Modifier.size(20.dp)) {
        drawLine(
            color = color,
            start = Offset(5.dp.toPx(), 5.dp.toPx()),
            end = Offset(15.dp.toPx(), 15.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(15.dp.toPx(), 5.dp.toPx()),
            end = Offset(5.dp.toPx(), 15.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun ViewGlyph(color: Color) {
    Canvas(modifier = Modifier.size(24.dp)) {
        val stroke = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawOval(
            color = color,
            topLeft = Offset(3.dp.toPx(), 6.dp.toPx()),
            size = Size(18.dp.toPx(), 12.dp.toPx()),
            style = stroke,
        )
        drawCircle(
            color = color,
            radius = 3.2.dp.toPx(),
            center = Offset(12.dp.toPx(), 12.dp.toPx()),
        )
    }
}

@Composable
private fun EditGlyph(color: Color) {
    Canvas(modifier = Modifier.size(24.dp)) {
        drawLine(
            color = color,
            start = Offset(7.dp.toPx(), 17.dp.toPx()),
            end = Offset(17.dp.toPx(), 7.dp.toPx()),
            strokeWidth = 2.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(15.dp.toPx(), 5.dp.toPx()),
            end = Offset(19.dp.toPx(), 9.dp.toPx()),
            strokeWidth = 2.8.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color.copy(alpha = 0.7f),
            start = Offset(5.dp.toPx(), 19.dp.toPx()),
            end = Offset(11.dp.toPx(), 18.dp.toPx()),
            strokeWidth = 2.2.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun ArchiveGlyph(color: Color) {
    Canvas(modifier = Modifier.size(24.dp)) {
        val stroke = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawRoundRect(
            color = color,
            topLeft = Offset(4.dp.toPx(), 8.dp.toPx()),
            size = Size(16.dp.toPx(), 12.dp.toPx()),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(3.dp.toPx(), 3.dp.toPx()),
            style = stroke,
        )
        drawLine(
            color = color,
            start = Offset(3.dp.toPx(), 6.dp.toPx()),
            end = Offset(21.dp.toPx(), 6.dp.toPx()),
            strokeWidth = 2.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = Offset(9.dp.toPx(), 12.dp.toPx()),
            end = Offset(15.dp.toPx(), 12.dp.toPx()),
            strokeWidth = 2.2.dp.toPx(),
            cap = StrokeCap.Round,
        )
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
    size: Dp = 46.dp,
) {
    Box(
        modifier = Modifier
            .size(size)
            .background(
                Brush.linearGradient(listOf(accent.copy(alpha = 0.95f), accent.copy(alpha = 0.55f))),
                CircleShape,
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
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
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
    token: String?,
    onOpenTab: (AdminTab) -> Unit,
) {
    val chatReady = users.count { it.chatEnabled && it.status != "Inactive" }
    val newestApplication = applications.firstOrNull()
    val pendingAppointments = state.appointments.count { it.text("status", fallback = "pending").lowercase() == "pending" }
    val todayAppointments = state.treatmentTracker?.array("todaysAppointments")?.length() ?: 0
    val todaySessions = state.treatmentTracker?.array("todaysSessions")?.length() ?: 0
    val openOrders = state.shopOrders.count {
        it.text("status", fallback = "pending").lowercase() !in listOf("delivered", "cancelled", "canceled")
    }
    val newChats = state.chatConversations.count { it.optBoolean("unreadForAgent") }
    val newestPatient = state.patients.firstOrNull()
    val latestMailbox = state.mailboxItems.firstOrNull()
    val latestAppointment = state.appointments.firstOrNull()
    val canPatients = canOpenAdminTab(admin, AdminTab.Patients)
    val canTreatment = canOpenAdminTab(admin, AdminTab.Treatment)
    val canChat = canOpenAdminTab(admin, AdminTab.Chat)
    val canMailbox = canOpenAdminTab(admin, AdminTab.Mailbox)
    val canShop = canOpenAdminTab(admin, AdminTab.Shop)
    val canTeam = canOpenAdminTab(admin, AdminTab.Team)
    val canJobs = canOpenAdminTab(admin, AdminTab.Jobs)
    val canReports = canOpenAdminTab(admin, AdminTab.Reports)

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        DashboardWelcomeCard(
            admin = admin,
            token = token,
            todayAppointments = todayAppointments,
            todaySessions = todaySessions,
            pendingAppointments = pendingAppointments,
        )

        if (canPatients || canTreatment) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (canPatients) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Patients",
                        value = state.patients.size.toString(),
                        detail = "Open patient list",
                        accent = OpwBlue,
                        onClick = { onOpenTab(AdminTab.Patients) },
                    )
                }
                if (canTreatment) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Pending",
                        value = pendingAppointments.toString(),
                        detail = "Appointment requests",
                        accent = OpwSuccess,
                        onClick = { onOpenTab(AdminTab.Treatment) },
                    )
                }
            }
        }

        if (canChat || canMailbox) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (canChat) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "New Chats",
                        value = newChats.toString(),
                        detail = "$chatReady staff online-ready",
                        accent = OpwWarning,
                        onClick = { onOpenTab(AdminTab.Chat) },
                    )
                }
                if (canMailbox) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Unread Mail",
                        value = unreadApplications.toString(),
                        detail = "Career/contact inbox",
                        accent = OpwDanger,
                        onClick = { onOpenTab(AdminTab.Mailbox) },
                    )
                }
            }
        }

        if (canTreatment || canShop) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (canTreatment) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Sessions",
                        value = todaySessions.toString(),
                        detail = "Due today",
                        accent = OpwBlue,
                        onClick = { onOpenTab(AdminTab.Treatment) },
                    )
                }
                if (canShop) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Orders",
                        value = openOrders.toString(),
                        detail = "Open shop orders",
                        accent = OpwSuccess,
                        onClick = { onOpenTab(AdminTab.Shop) },
                    )
                }
            }
        }

        if (canPatients || canTreatment || canReports) {
            DashboardActionStrip(
                showPatients = canPatients,
                showTreatment = canTreatment,
                showReports = canReports,
                onPatients = { onOpenTab(AdminTab.Patients) },
                onTreatment = { onOpenTab(AdminTab.Treatment) },
                onReports = { onOpenTab(AdminTab.Reports) },
            )
        }

        if (canTeam || canJobs) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (canTeam) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Staff",
                        value = activeStaff.toString(),
                        detail = "$activeAdmins admin",
                        accent = OpwWarning,
                        onClick = { onOpenTab(AdminTab.Team) },
                    )
                }
                if (canJobs) {
                    InteractiveMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Active Jobs",
                        value = state.jobRequirements.count {
                            it.text("status", fallback = "Active") == "Active" && it.optBoolean("isPublished", true)
                        }.toString(),
                        detail = "Published openings",
                        accent = OpwSuccess,
                        onClick = { onOpenTab(AdminTab.Jobs) },
                    )
                }
            }
        }

        if (canTreatment || canMailbox || canPatients) {
            SectionTitle("Live Activity")
        }
        if (canTreatment) {
            DashboardActivityCard(
                title = latestAppointment?.text("name", fallback = "Appointment request") ?: "No appointment requests",
                subtitle = latestAppointment?.let { scheduleLabel(it.text("requestedDate", "date"), it.text("requestedTime", "time")) }
                    ?: "New booking requests will appear here.",
                accent = OpwSuccess,
                onClick = { onOpenTab(AdminTab.Treatment) },
            )
        }
        if (canMailbox) {
            DashboardActivityCard(
                title = latestMailbox?.text("subject", fallback = "No new mailbox item") ?: "No mailbox messages",
                subtitle = latestMailbox?.text("senderName", "senderEmail", fallback = "Career and contact messages will appear here.")
                    ?: "Career and contact messages will appear here.",
                accent = OpwDanger,
                onClick = { onOpenTab(AdminTab.Mailbox) },
            )
        }
        if (canPatients) {
            DashboardActivityCard(
                title = newestPatient?.text("name", fallback = "No patients yet") ?: "No patients yet",
                subtitle = newestPatient?.text("mobile", "email", fallback = "Patient data will appear here.")
                    ?: "Patient data will appear here.",
                accent = OpwBlue,
                onClick = { onOpenTab(AdminTab.Patients) },
            )
        }
        if (canMailbox && newestApplication != null) {
            DashboardActivityCard(
                title = "${newestApplication.name} applied",
                subtitle = "${newestApplication.role.ifBlank { "Open role" }} | ${formatTimestamp(newestApplication.createdAt)}",
                accent = OpwWarning,
                onClick = { onOpenTab(AdminTab.Mailbox) },
            )
        }
    }
}

@Composable
private fun DashboardWelcomeCard(
    admin: StaffUser?,
    token: String?,
    todayAppointments: Int,
    todaySessions: Int,
    pendingAppointments: Int,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color.White.copy(alpha = 0.45f), RoundedCornerShape(32.dp)),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF082F49), Color(0xFF0F766E), Color(0xFF38BDF8)),
                    ),
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ProfilePhotoContent(user = admin, token = token, modifier = Modifier.size(58.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Welcome, ${admin?.name?.ifBlank { "OPW Team" } ?: "OPW Team"}",
                        color = Color.White,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Text(
                        text = "Live clinic dashboard",
                        color = Color.White.copy(alpha = 0.76f),
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                DashboardMiniStat("Today", todayAppointments.toString(), Modifier.weight(1f))
                DashboardMiniStat("Sessions", todaySessions.toString(), Modifier.weight(1f))
                DashboardMiniStat("Pending", pendingAppointments.toString(), Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun DashboardMiniStat(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = Color.White.copy(alpha = 0.14f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f)),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(label, color = Color.White.copy(alpha = 0.68f), style = MaterialTheme.typography.bodySmall)
            Text(value, color = Color.White, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleLarge)
        }
    }
}

@Composable
private fun InteractiveMetricCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    detail: String,
    accent: Color,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier
            .border(1.dp, Color.White.copy(alpha = 0.86f), RoundedCornerShape(28.dp)),
        shape = RoundedCornerShape(28.dp),
        color = Color.White,
        shadowElevation = 4.dp,
        onClick = onClick,
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF8FBFF))))
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
                        .size(10.dp)
                        .background(accent, CircleShape),
                )
                Text("Open", color = accent, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
            }
            Text(value, color = OpwInk, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Text(label, color = OpwInk, fontWeight = FontWeight.Bold)
            Text(detail, color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun DashboardActionStrip(
    showPatients: Boolean,
    showTreatment: Boolean,
    showReports: Boolean,
    onPatients: () -> Unit,
    onTreatment: () -> Unit,
    onReports: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (showPatients) {
            DashboardActionPill("Add Patient", OpwBlue, onPatients)
        }
        if (showTreatment) {
            DashboardActionPill("Treatment Tracker", OpwSuccess, onTreatment)
        }
        if (showReports) {
            DashboardActionPill("View Reports", Color(0xFF4F46E5), onReports)
        }
    }
}

@Composable
private fun DashboardActionPill(
    label: String,
    accent: Color,
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = accent.copy(alpha = 0.12f),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.24f)),
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(modifier = Modifier.size(8.dp).background(accent, CircleShape))
            Text(label, color = accent, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun DashboardActivityCard(
    title: String,
    subtitle: String,
    accent: Color,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        color = Color.White,
        shadowElevation = 2.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.padding(15.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AccentOrb(accent = accent, label = title)
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = OpwInk, fontWeight = FontWeight.ExtraBold)
                Text(subtitle, color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun TeamTab(
    users: List<StaffUser>,
    formState: StaffFormState,
    error: String,
    loading: Boolean,
    creationMessage: String,
    onFormChange: (StaffFormState) -> Unit,
    onSave: (String?, StaffFormState) -> Unit,
    onStatusChange: (StaffUser, String) -> Unit,
    onDelete: (StaffUser) -> Unit,
    canEdit: Boolean,
    canManageSalary: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var editingUserId by rememberSaveable { mutableStateOf("") }
    var permissionUserId by rememberSaveable { mutableStateOf("") }
    var showStaffDialog by rememberSaveable { mutableStateOf(false) }
    val editingUser = users.firstOrNull { it.id == editingUserId }
    val permissionUser = users.firstOrNull { it.id == permissionUserId }
    val filteredUsers = remember(users, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            users
        } else {
            users.filter { user ->
                user.name.lowercase().contains(keyword) ||
                    user.email.lowercase().contains(keyword) ||
                    user.mobile.contains(keyword) ||
                    user.workType.lowercase().contains(keyword) ||
                    user.role.lowercase().contains(keyword) ||
                    user.status.lowercase().contains(keyword)
            }
        }
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingUserId = ""
            onFormChange(emptyStaffForm())
            showStaffDialog = true
        }
    }

    if (showStaffDialog) {
        StaffFormDialog(
            user = editingUser,
            initialForm = editingUser?.toStaffFormState() ?: formState,
            error = error,
            loading = loading,
            onDraftChange = onFormChange,
            onDismiss = {
                showStaffDialog = false
                editingUserId = ""
            },
            onSave = { draft ->
                onSave(editingUser?.id, draft)
                if (validateCreateStaffForm(draft, requirePassword = editingUser == null) == null) {
                    showStaffDialog = false
                    editingUserId = ""
                }
            },
            canManageSalary = canManageSalary,
        )
    }

    if (permissionUser != null) {
        StaffPermissionDialog(
            user = permissionUser,
            loading = loading,
            error = error,
            onDismiss = { permissionUserId = "" },
            onSave = { draft ->
                onSave(permissionUser.id, draft)
                permissionUserId = ""
            },
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search staff",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (error.isNotBlank() && !showStaffDialog && permissionUser == null) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        if (creationMessage.isNotBlank()) {
            StatusBanner(message = creationMessage, tone = BannerTone.Success)
        }

        if (filteredUsers.isEmpty()) {
            EmptyStateCard(
                title = "No staff found",
                message = "Add staff from the plus button or try another search term.",
            )
        } else {
            filteredUsers.forEach { user ->
                StaffDirectoryCard(
                    user = user,
                    onEdit = if (canEdit) { {
                        editingUserId = user.id
                        showStaffDialog = true
                    } } else null,
                    onPermissions = if (canEdit) { { permissionUserId = user.id } } else null,
                    onToggleStatus = {
                        onStatusChange(user, if (user.status == "Inactive") "Active" else "Inactive")
                    }.takeIf { canEdit },
                    onDelete = { onDelete(user) },
                    canEdit = canEdit,
                )
            }
        }
    }
}

@Composable
private fun StaffDirectoryCard(
    user: StaffUser,
    onEdit: (() -> Unit)?,
    onPermissions: (() -> Unit)?,
    onToggleStatus: (() -> Unit)?,
    onDelete: () -> Unit,
    canEdit: Boolean,
) {
    val active = user.status != "Inactive"
    SwipeDeleteModuleCard(
        title = user.name.ifBlank { "Staff member" },
        subtitle = listOf(
            user.mobile.ifBlank { "No mobile" },
            user.workType.ifBlank { user.role.ifBlank { "Staff" } },
        ).joinToString(" | "),
        accent = if (active) OpwSuccess else OpwDanger,
        deleteTitle = "Delete Staff",
        deleteMessage = "Delete ${user.name.ifBlank { "this staff member" }}? This removes the staff account from the admin panel.",
        onClick = onEdit,
        onDelete = onDelete,
        swipeEnabled = canEdit,
        actions = {
            if (onPermissions != null) {
                ModuleIconButton(color = OpwBlue, onClick = onPermissions) {
                    PermissionGlyph(OpwBlue)
                }
            }
            if (onToggleStatus != null) {
                ModuleIconButton(color = if (active) OpwWarning else OpwSuccess, onClick = onToggleStatus) {
                    PowerGlyph(if (active) OpwWarning else OpwSuccess)
                }
            }
        },
    )
}

@Composable
private fun StaffFormDialog(
    user: StaffUser?,
    initialForm: StaffFormState,
    error: String,
    loading: Boolean,
    onDraftChange: (StaffFormState) -> Unit,
    onDismiss: () -> Unit,
    onSave: (StaffFormState) -> Unit,
    canManageSalary: Boolean,
) {
    var draft by remember(user?.id) { mutableStateOf(initialForm) }
    var localError by remember(user?.id) { mutableStateOf("") }

    fun update(next: StaffFormState) {
        draft = next
        localError = ""
        onDraftChange(next)
    }

    OpwBottomSheetDialog(
        title = if (user == null) "Add Staff" else "Edit Staff",
        primaryLabel = if (loading) "Saving..." else if (user == null) "Create Staff" else "Save Staff",
        onDismiss = onDismiss,
        onPrimary = {
            val validation = validateCreateStaffForm(draft, requirePassword = user == null)
            if (validation != null) {
                localError = validation
            } else {
                onSave(draft)
            }
        },
        onReset = {
            draft = initialForm
            localError = ""
            onDraftChange(initialForm)
        },
    ) {
        val visibleError = localError.ifBlank { error }
        if (visibleError.isNotBlank()) {
            StatusBanner(message = visibleError, tone = BannerTone.Error)
        }
        SheetPatientField(
            label = "Full Name",
            value = draft.name,
            onValueChange = { update(draft.copy(name = it)) },
        )
        SheetPatientField(
            label = "Email",
            value = draft.email,
            onValueChange = { update(draft.copy(email = it)) },
            keyboardType = KeyboardType.Email,
        )
        SheetPatientField(
            label = "Mobile",
            value = draft.mobile,
            onValueChange = { value -> update(draft.copy(mobile = value.filter(Char::isDigit).take(10))) },
            keyboardType = KeyboardType.Phone,
        )
        SheetPatientField(
            label = "Work Type",
            value = draft.workType,
            onValueChange = { update(draft.copy(workType = it)) },
        )

        if (canManageSalary && draft.role == "Staff") {
            SheetPatientField(
                label = "Monthly Salary",
                value = draft.monthlySalary,
                onValueChange = { value ->
                    update(draft.copy(monthlySalary = value.filter { it.isDigit() || it == '.' }))
                },
                keyboardType = KeyboardType.Decimal,
            )
        }

        Text("Role", fontWeight = FontWeight.Bold, color = OpwInk)
        ChoiceChipRow(
            options = listOf("Staff", "Admin"),
            selected = draft.role,
            onSelected = { role ->
                update(
                    draft.copy(
                        role = role,
                        monthlySalary = if (role == "Admin") "" else draft.monthlySalary,
                        permissions = if (role == "Admin") emptyList() else draft.permissions.ifEmpty { defaultStaffPermissions() },
                    ),
                )
            },
        )

        Text("Status", fontWeight = FontWeight.Bold, color = OpwInk)
        ChoiceChipRow(
            options = listOf("Active", "Inactive"),
            selected = draft.status,
            onSelected = { status -> update(draft.copy(status = status)) },
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
                    Text("Website chat", fontWeight = FontWeight.Bold, color = OpwInk)
                    Text(
                        text = "Show this staff member in the live chat team.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                    )
                }
                Switch(
                    checked = draft.chatEnabled,
                    onCheckedChange = { update(draft.copy(chatEnabled = it)) },
                )
            }
        }

        SheetPatientField(
            label = if (user == null) "Temporary Password" else "New Password",
            value = draft.password,
            onValueChange = { update(draft.copy(password = it)) },
            keyboardType = KeyboardType.Password,
            visualTransformation = PasswordVisualTransformation(),
        )

        StatusBanner(
            message = "Use the key icon on each staff card to manage module permissions.",
            tone = BannerTone.Info,
        )
    }
}

@Composable
private fun StaffPermissionDialog(
    user: StaffUser,
    loading: Boolean,
    error: String,
    onDismiss: () -> Unit,
    onSave: (StaffFormState) -> Unit,
) {
    var draft by remember(user.id) { mutableStateOf(user.toStaffFormState()) }

    OpwBottomSheetDialog(
        title = "Permissions",
        primaryLabel = if (loading) "Saving..." else "Save Permissions",
        onDismiss = onDismiss,
        onPrimary = { onSave(draft) },
        onReset = { draft = user.toStaffFormState() },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AccentOrb(accent = OpwBlue, label = user.name)
            Column(modifier = Modifier.weight(1f)) {
                Text(user.name.ifBlank { "Staff member" }, color = OpwInk, fontWeight = FontWeight.ExtraBold)
                Text(user.email.ifBlank { "No email" }, color = Color(0xFF64748B))
            }
        }
        Surface(color = OpwMist, shape = RoundedCornerShape(20.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Live chat access", color = OpwInk, fontWeight = FontWeight.Bold)
                    Text("Enable public chat availability.", color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = draft.chatEnabled,
                    onCheckedChange = { draft = draft.copy(chatEnabled = it) },
                )
            }
        }

        if (draft.role == "Admin") {
            StatusBanner(
                message = "Admin accounts always receive full access.",
                tone = BannerTone.Info,
            )
        } else {
            draft.permissions.forEachIndexed { index, permission ->
                PermissionCard(
                    permission = permission,
                    onPermissionChange = { updated ->
                        val nextPermissions = draft.permissions.toMutableList()
                        nextPermissions[index] = updated
                        draft = draft.copy(permissions = nextPermissions)
                    },
                )
            }
        }
    }
}

private enum class PatientPanel {
    List,
    Archive,
    Detail,
}

private enum class PatientProfileModule {
    Overview,
    Appointments,
    Treatment,
    Payments,
    Condition,
    Therapy,
}

private val ClinicalNoteTypes = listOf("C/C", "History", "O/E", "D/D", "HEP", "Advice")

@Composable
private fun PatientsTab(
    token: String?,
    patients: List<JSONObject>,
    archivedPatients: List<JSONObject>,
    users: List<StaffUser>,
    services: List<JSONObject>,
    therapyResources: List<JSONObject>,
    appointmentRequests: List<JSONObject>,
    onMenu: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
    onArchive: (JSONObject) -> Unit,
    onRestore: (JSONObject) -> Unit,
    onPermanentDelete: (JSONObject) -> Unit,
    canAddPatient: Boolean,
    canEditPatient: Boolean,
    canViewArchive: Boolean,
    canEditArchive: Boolean,
    canAddTreatmentPlan: Boolean,
    canEditTreatmentPlan: Boolean,
    canAddClinicalNote: Boolean,
    canEditClinicalNote: Boolean,
    canAddTherapyRecommendation: Boolean,
    canEditTherapyRecommendation: Boolean,
    canAddPayment: Boolean,
    canEditPayment: Boolean,
    canAddAppointment: Boolean,
    canEditAppointment: Boolean,
    onTreatmentPlanSave: (String, String?, JSONObject) -> Unit,
    onTreatmentPlanStatusChange: (String, String, String) -> Unit,
    onSessionDayStatusChange: (String, String, String, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    onTreatmentSessionEntryDelete: (String, String, String) -> Unit,
    onTreatmentPaymentAdd: (String, String, Double, String, String) -> Unit,
    onTreatmentPaymentUpdate: (String, String, String, Double, String, String) -> Unit,
    onTreatmentPlanDelete: (String, String) -> Unit,
    onClinicalNoteSave: (String, String?, String, String) -> Unit,
    onClinicalDocumentSave: (String, PickedUploadFile) -> Unit,
    onClinicalNoteDelete: (String, String) -> Unit,
    onClinicalDocumentDelete: (String, String) -> Unit,
    onTherapyRecommendationSave: (String, String, String, List<String>) -> Unit,
    onTherapyRecommendationDelete: (String, String) -> Unit,
    onPatientAppointmentAdd: (String, String, String, String) -> Unit,
    onPatientAppointmentUpdate: (String, JSONObject, String, String, String, String) -> Unit,
    onPatientAppointmentRequestDecision: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var panel by rememberSaveable { mutableStateOf(PatientPanel.List) }
    var selectedPatientId by rememberSaveable { mutableStateOf("") }
    var editingPatientId by rememberSaveable { mutableStateOf("") }
    var showPatientDialog by rememberSaveable { mutableStateOf(false) }
    val selectedPatient = patients.firstOrNull { it.text("id") == selectedPatientId }
    val editingPatient = patients.firstOrNull { it.text("id") == editingPatientId }

    BackHandler(enabled = showPatientDialog || panel != PatientPanel.List) {
        when {
            showPatientDialog -> {
                showPatientDialog = false
                editingPatientId = ""
            }
            panel == PatientPanel.Detail -> panel = PatientPanel.List
            panel == PatientPanel.Archive -> panel = PatientPanel.List
        }
    }

    if (showPatientDialog) {
        PatientFormDialog(
            patient = editingPatient,
            existingPatients = patients + archivedPatients,
            onDismiss = {
                showPatientDialog = false
                editingPatientId = ""
            },
            onSave = { id, payload ->
                onSave(id, payload)
                showPatientDialog = false
                editingPatientId = ""
            },
        )
    }

    when (panel) {
        PatientPanel.List -> PatientListScreen(
            patients = patients,
            archivedCount = archivedPatients.size,
            users = users,
            onMenu = onMenu,
            onArchiveOpen = if (canViewArchive) { { panel = PatientPanel.Archive } } else null,
            onAdd = if (canAddPatient) { {
                editingPatientId = ""
                showPatientDialog = true
            } } else null,
            onView = { patient ->
                selectedPatientId = patient.text("id")
                panel = PatientPanel.Detail
            },
            onArchive = if (canEditPatient) onArchive else null,
        )

        PatientPanel.Archive -> ArchivedPatientsScreen(
            archivedPatients = archivedPatients,
            onBack = { panel = PatientPanel.List },
            onRestore = if (canEditArchive) { { patient ->
                onRestore(patient)
                panel = PatientPanel.List
            } } else null,
            onPermanentDelete = if (canEditArchive) onPermanentDelete else null,
        )

        PatientPanel.Detail -> {
            if (selectedPatient == null) {
                EmptyStateWithBack(
                    title = "Patient not found",
                    message = "This patient may have been archived or removed.",
                    onBack = { panel = PatientPanel.List },
                )
            } else {
                PatientDetailScreen(
                    token = token,
                    patient = selectedPatient,
                    users = users,
                    services = services,
                    therapyResources = therapyResources,
                    appointmentRequests = appointmentRequests.patientRequestsFor(selectedPatient),
                    onBack = { panel = PatientPanel.List },
                    onEdit = if (canEditPatient) { {
                        editingPatientId = selectedPatient.text("id")
                        showPatientDialog = true
                    } } else null,
                    canAddTreatmentPlan = canAddTreatmentPlan,
                    canEditTreatmentPlan = canEditTreatmentPlan,
                    canAddClinicalNote = canAddClinicalNote,
                    canEditClinicalNote = canEditClinicalNote,
                    canAddTherapyRecommendation = canAddTherapyRecommendation,
                    canEditTherapyRecommendation = canEditTherapyRecommendation,
                    canAddPayment = canAddPayment,
                    canEditPayment = canEditPayment,
                    canAddAppointment = canAddAppointment,
                    canEditAppointment = canEditAppointment,
                    onTreatmentPlanSave = onTreatmentPlanSave,
                    onTreatmentPlanStatusChange = onTreatmentPlanStatusChange,
                    onSessionDayStatusChange = onSessionDayStatusChange,
                    onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                    onTreatmentSessionEntryDelete = onTreatmentSessionEntryDelete,
                    onTreatmentPaymentAdd = onTreatmentPaymentAdd,
                    onTreatmentPaymentUpdate = onTreatmentPaymentUpdate,
                    onTreatmentPlanDelete = onTreatmentPlanDelete,
                    onClinicalNoteSave = onClinicalNoteSave,
                    onClinicalDocumentSave = onClinicalDocumentSave,
                    onClinicalNoteDelete = onClinicalNoteDelete,
                    onClinicalDocumentDelete = onClinicalDocumentDelete,
                    onTherapyRecommendationSave = onTherapyRecommendationSave,
                    onTherapyRecommendationDelete = onTherapyRecommendationDelete,
                    onPatientAppointmentAdd = onPatientAppointmentAdd,
                    onPatientAppointmentUpdate = onPatientAppointmentUpdate,
                    onPatientAppointmentRequestDecision = onPatientAppointmentRequestDecision,
                )
            }
        }
    }
}

@Composable
private fun PatientListScreen(
    patients: List<JSONObject>,
    archivedCount: Int,
    users: List<StaffUser>,
    onMenu: () -> Unit,
    onArchiveOpen: (() -> Unit)?,
    onAdd: (() -> Unit)?,
    onView: (JSONObject) -> Unit,
    onArchive: ((JSONObject) -> Unit)?,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var searchOpen by rememberSaveable { mutableStateOf(false) }
    val filteredPatients = remember(patients, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            patients
        } else {
            patients.filter { patient ->
                listOf("name", "email", "mobile", "address", "disease").any { field ->
                    patient.text(field).lowercase().contains(keyword)
                }
            }
        }
    }
    val ongoingTreatmentPatients = remember(filteredPatients) {
        filteredPatients
            .mapNotNull { patient ->
                ongoingTreatmentPlan(patient)?.let { plan -> patient to plan }
            }
            .sortedBy { (_, plan) -> plan.text("toDate") }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PatientMenuButton(onClick = onMenu)
                Text(
                    text = "Patient List",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = OpwInk,
                )
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SearchCircleButton(
                    active = searchOpen || query.isNotBlank(),
                    onClick = { searchOpen = !searchOpen },
                )
                if (onArchiveOpen != null) {
                    ArchiveCircleButton(count = archivedCount, onClick = onArchiveOpen)
                }
                if (onAdd != null) {
                    AddCircleButton(onClick = onAdd)
                }
            }
        }

        if (searchOpen || query.isNotBlank()) {
            PatientSearchField(
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    searchOpen = false
                },
            )
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionCard(
                title = "Treatment Ongoing",
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Patients with running sessions",
                        color = OpwSlate,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.weight(1f),
                    )
                    StatusChip(
                        label = "${ongoingTreatmentPatients.size} active",
                        background = OpwAqua.copy(alpha = 0.12f),
                        foreground = OpwAqua,
                    )
                }
                if (ongoingTreatmentPatients.isEmpty()) {
                    InlineEmpty("No patients currently have an ongoing treatment session.")
                } else {
                    ongoingTreatmentPatients.forEach { (patient, plan) ->
                        OngoingTreatmentPatientCard(
                            patient = patient,
                            plan = plan,
                            users = users,
                            onView = { onView(patient) },
                        )
                    }
                }
            }

            if (filteredPatients.isEmpty()) {
                EmptyStateCard(
                    title = "No patients found",
                    message = "Patient records from the live admin API will appear here.",
                )
            } else {
                filteredPatients.forEach { patient ->
                    CompactPatientCard(
                        patient = patient,
                        users = users,
                        onView = { onView(patient) },
                        onArchive = onArchive?.let { archive -> { archive(patient) } },
                    )
                }
            }
        }
    }
}

@Composable
private fun CompactPatientCard(
    patient: JSONObject,
    users: List<StaffUser>,
    onView: () -> Unit,
    onArchive: (() -> Unit)?,
) {
    var dragOffset by remember { mutableStateOf(0f) }
    var confirmArchive by rememberSaveable(patient.text("id")) { mutableStateOf(false) }
    val thresholdPx = with(LocalDensity.current) { 92.dp.toPx() }
    val patientName = patient.text("name", fallback = "this patient")
    val listPlan = patientListTreatmentPlan(patient)
    val visitLocation = patientVisitLocationText(patient, listPlan)
    val doneDays = doneSessionCount(listPlan)

    if (confirmArchive) {
        ConfirmArchiveDialog(
            patientName = patientName,
            onDismiss = { confirmArchive = false },
            onConfirm = {
                confirmArchive = false
                onArchive?.invoke()
            },
        )
    }

    val shape = RoundedCornerShape(24.dp)

    Box(modifier = Modifier.fillMaxWidth()) {
        if (onArchive != null) {
            DecoratedSwipeReveal(
                modifier = Modifier.matchParentSize(),
                shape = shape,
                color = OpwWarning,
            ) { ArchiveGlyph(OpwWarning) }
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .offset { IntOffset(dragOffset.roundToInt(), 0) }
                .then(if (onArchive != null) Modifier.pointerInput(patient.text("id"), thresholdPx) {
                    detectHorizontalDragGestures(
                        onDragCancel = { dragOffset = 0f },
                        onDragEnd = {
                            if (dragOffset <= -thresholdPx) {
                                confirmArchive = true
                            }
                            dragOffset = 0f
                        },
                        onHorizontalDrag = { change, dragAmount ->
                            val nextOffset = (dragOffset + dragAmount).coerceIn(-thresholdPx * 1.35f, 0f)
                            if (nextOffset != dragOffset) {
                                change.consume()
                            }
                            dragOffset = nextOffset
                        },
                    )
                } else Modifier)
                .clickable(onClick = onView)
                .border(1.dp, OpwBlue.copy(alpha = 0.14f), shape),
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(listOf(Color.White, Color(0xFFF9FCFF), OpwBlue.copy(alpha = 0.055f))))
                    .padding(horizontal = 13.dp, vertical = 12.dp),
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 28.dp, y = (-32).dp)
                        .size(88.dp)
                        .background(OpwBlue.copy(alpha = 0.09f), CircleShape),
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .offset(x = (-34).dp, y = 28.dp)
                        .size(68.dp)
                        .background(OpwAqua.copy(alpha = 0.07f), CircleShape),
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AccentOrb(accent = OpwBlue, label = patient.text("name", fallback = "P"), size = 48.dp)
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(
                            text = patient.text("name", fallback = "Patient"),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                        )
                        Text(
                            text = patient.text("mobile", fallback = "Mobile not provided"),
                            color = OpwSlate,
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            StatusChip(
                                label = visitLocation,
                                background = OpwAqua.copy(alpha = 0.12f),
                                foreground = OpwAqua,
                            )
                            StatusChip(
                                label = "$doneDays days done",
                                background = Color(0xFFDCFCE7),
                                foreground = OpwSuccess,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OngoingTreatmentPatientCard(
    patient: JSONObject,
    plan: JSONObject,
    users: List<StaffUser>,
    onView: () -> Unit,
) {
    val shape = RoundedCornerShape(24.dp)
    val visitLocation = patientVisitLocationText(patient, plan)
    val doneDays = doneSessionCount(plan)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onView)
            .border(1.dp, OpwAqua.copy(alpha = 0.2f), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(Color.White, Color(0xFFF8FFFF), OpwAqua.copy(alpha = 0.075f)),
                    ),
                )
                .padding(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 24.dp, y = (-28).dp)
                    .size(82.dp)
                    .background(OpwAqua.copy(alpha = 0.08f), CircleShape),
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AccentOrb(accent = OpwAqua, label = patient.text("name", fallback = "P"), size = 48.dp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = patient.text("name", fallback = "Patient"),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                            modifier = Modifier.weight(1f),
                        )
                        StatusChip("Active", Color(0xFFDCFCE7), OpwSuccess)
                    }
                    Text(
                        text = patient.text("mobile", fallback = "Mobile not provided"),
                        color = OpwSlate,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        StatusChip(
                            label = visitLocation,
                            background = OpwAqua.copy(alpha = 0.12f),
                            foreground = OpwAqua,
                        )
                        StatusChip(
                            label = "$doneDays days done",
                            background = Color(0xFFDCFCE7),
                            foreground = OpwSuccess,
                        )
                    }
                    Text(
                        text = treatmentTypeText(plan),
                        color = OpwInk,
                        fontWeight = FontWeight.SemiBold,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Text(
                        text = treatmentPeriodText(plan),
                        color = Color(0xFF64748B),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}

@Composable
private fun ConfirmArchiveDialog(
    patientName: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { SectionTitle("Archive Patient") },
        text = {
            Text(
                text = "Move $patientName to archived patients? You can restore this record from the archive screen.",
                color = Color(0xFF475569),
            )
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text("Archive")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        containerColor = OpwCard,
        shape = RoundedCornerShape(28.dp),
    )
}

@Composable
private fun PatientSearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    onClose: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE0ECF8)),
        shadowElevation = 4.dp,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White, Color(0xFFF8FBFF)),
                    ),
                )
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Search Patient",
                    color = OpwInk,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.titleSmall,
                )
                TextButton(onClick = onClose) {
                    Text("Clear")
                }
            }
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Color(0xFFF8FAFC),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = onQueryChange,
                    label = { Text("Name, mobile, or email") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    singleLine = true,
                )
            }
        }
    }
}

@Composable
private fun ArchivedPatientsScreen(
    archivedPatients: List<JSONObject>,
    onBack: () -> Unit,
    onRestore: ((JSONObject) -> Unit)?,
    onPermanentDelete: ((JSONObject) -> Unit)?,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var permanentDeleteId by rememberSaveable { mutableStateOf("") }
    val deleteCandidate = archivedPatients.firstOrNull { it.text("id") == permanentDeleteId }
    val filteredPatients = remember(archivedPatients, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            archivedPatients
        } else {
            archivedPatients.filter { patient ->
                listOf("name", "email", "mobile", "disease").any { field ->
                    patient.text(field).lowercase().contains(keyword)
                }
            }
        }
    }

    if (deleteCandidate != null) {
        ConfirmDeleteDialog(
            title = "Delete Archived Patient",
            message = "This will permanently remove ${deleteCandidate.text("name", fallback = "this patient")} and related records.",
            onDismiss = { permanentDeleteId = "" },
            onConfirm = {
                onPermanentDelete?.invoke(deleteCandidate)
                permanentDeleteId = ""
            },
        )
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SimpleScreenHeader(
            title = "Archived Patients",
            onBack = onBack,
        )

        ModernFieldShell {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search archive") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (filteredPatients.isEmpty()) {
                EmptyStateCard(
                    title = "No archived patients",
                    message = "Archived patient records from the web admin panel will appear here.",
                )
            } else {
                filteredPatients.forEach { patient ->
                    RecordCard(
                        title = patient.text("name", fallback = "Patient"),
                        subtitle = patient.text("mobile", fallback = "Mobile not provided"),
                        status = "Archived",
                        statusColor = Color(0xFF64748B),
                        rows = listOf(
                            "Email" to patient.text("email", fallback = "Not provided"),
                            "Archived" to formatTimestamp(patient.text("archivedAt")),
                        ),
                        actions = if (onRestore != null || onPermanentDelete != null) {
                            {
                                Row(
                                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    if (onRestore != null) {
                                        OutlinedButton(onClick = { onRestore.invoke(patient) }) {
                                            Text("Restore")
                                        }
                                    }
                                    if (onPermanentDelete != null) {
                                        OutlinedButton(onClick = { permanentDeleteId = patient.text("id") }) {
                                            Text("Delete Permanently")
                                        }
                                    }
                                }
                            }
                        } else null,
                    )
                }
            }
        }
    }
}

@Composable
private fun PatientFormDialog(
    patient: JSONObject?,
    existingPatients: List<JSONObject>,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
) {
    var name by rememberSaveable(patient?.text("id").orEmpty()) {
        mutableStateOf(patient?.text("name").orEmpty())
    }
    var email by rememberSaveable(patient?.text("id").orEmpty()) {
        mutableStateOf(patient?.text("email").orEmpty())
    }
    var mobile by rememberSaveable(patient?.text("id").orEmpty()) {
        mutableStateOf(patient?.text("mobile").orEmpty())
    }
    var address by rememberSaveable(patient?.text("id").orEmpty()) {
        mutableStateOf(patient?.text("address").orEmpty())
    }
    var error by rememberSaveable { mutableStateOf("") }
    val focusManager = LocalFocusManager.current

    fun resetFields() {
        name = patient?.text("name").orEmpty()
        email = patient?.text("email").orEmpty()
        mobile = patient?.text("mobile").orEmpty()
        address = patient?.text("address").orEmpty()
        error = ""
    }

    fun submit() {
        val currentPatientId = patient?.text("id").orEmpty()
        val normalizedEmail = email.trim().lowercase()
        val normalizedMobile = mobile.trim()
        val duplicatePatient = existingPatients.firstOrNull { existing ->
            existing.text("id") != currentPatientId &&
                ((normalizedEmail.isNotBlank() && existing.text("email").trim().lowercase() == normalizedEmail) ||
                    existing.text("mobile").trim() == normalizedMobile)
        }

        when {
            name.trim().length < 2 -> error = "Patient name must be at least 2 characters."
            normalizedEmail.isNotBlank() && !Patterns.EMAIL_ADDRESS.matcher(normalizedEmail).matches() -> error = "Enter a valid email."
            !mobile.trim().matches(Regex("\\d{10}")) -> error = "Enter a valid 10-digit mobile."
            duplicatePatient != null && duplicatePatient.text("mobile").trim() == normalizedMobile ->
                error = "A patient with this mobile number already exists."
            duplicatePatient != null -> error = "A patient with this email address already exists."
            else -> {
                val payload = JSONObject()
                    .put("name", name.trim())
                    .put("mobile", normalizedMobile)
                    .put("address", address.trim())
                if (normalizedEmail.isNotBlank()) {
                    payload.put("email", normalizedEmail)
                }
                onSave(
                    patient?.text("id")?.takeIf { it.isNotBlank() },
                    payload,
                )
            }
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x660F172A))
                .pointerInput(focusManager) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Final)
                            if (event.type == PointerEventType.Release && event.changes.none { it.isConsumed }) {
                                focusManager.clearFocus()
                            }
                        }
                    }
                },
            contentAlignment = Alignment.BottomCenter,
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp),
                color = Color.White,
                shadowElevation = 18.dp,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.White, Color(0xFFF8FBFF)),
                            ),
                        )
                        .padding(horizontal = 22.dp, vertical = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(width = 42.dp, height = 4.dp)
                                .background(Color(0xFFD1D5DB), RoundedCornerShape(999.dp)),
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color.Transparent,
                            onClick = onDismiss,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                CloseGlyph(color = Color(0xFF94A3B8))
                            }
                        }
                        Text(
                            text = if (patient == null) "Add Patient" else "Edit Patient",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = OpwInk,
                        )
                        TextButton(onClick = ::resetFields) {
                            Text(
                                text = "Reset",
                                color = Color(0xFF2D8A82),
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }

                    if (error.isNotBlank()) {
                        StatusBanner(message = error, tone = BannerTone.Error)
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        SheetPatientField(
                            label = "Full Name",
                            value = name,
                            onValueChange = {
                                name = it
                                error = ""
                            },
                        )
                        SheetPatientField(
                            label = "Email (optional)",
                            value = email,
                            onValueChange = {
                                email = it
                                error = ""
                            },
                            keyboardType = KeyboardType.Email,
                        )
                        SheetPatientField(
                            label = "Mobile",
                            value = mobile,
                            onValueChange = {
                                mobile = it.filter { char -> char.isDigit() }.take(10)
                                error = ""
                            },
                            keyboardType = KeyboardType.Phone,
                        )
                        SheetPatientField(
                            label = "Address",
                            value = address,
                            onValueChange = {
                                address = it
                                error = ""
                            },
                            minLines = 3,
                        )
                    }

                    Button(
                        onClick = ::submit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(
                            text = if (patient == null) "Create Patient" else "Update Patient",
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SheetPatientField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType = KeyboardType.Text,
    minLines: Int = 1,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            color = OpwInk,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.ExtraBold,
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFFFBFCFE),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            shadowElevation = 1.dp,
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                singleLine = minLines == 1,
                minLines = minLines,
                keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
                visualTransformation = visualTransformation,
                textStyle = MaterialTheme.typography.bodyLarge.copy(
                    color = OpwInk,
                    fontWeight = FontWeight.SemiBold,
                ),
                cursorBrush = SolidColor(OpwBlue),
                decorationBox = { innerTextField ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 15.dp),
                        contentAlignment = if (minLines == 1) Alignment.CenterStart else Alignment.TopStart,
                    ) {
                        if (value.isBlank()) {
                            Text(
                                text = when (label) {
                                    "Full Name" -> "Enter full name"
                                    "Email" -> "Enter email address"
                                    "Mobile" -> "Enter mobile number"
                                    else -> label
                                },
                                color = Color(0xFF94A3B8),
                                style = MaterialTheme.typography.bodyLarge,
                            )
                        }
                        innerTextField()
                    }
                },
            )
        }
    }
}

@Composable
private fun SheetPickerField(
    label: String,
    value: String,
    placeholder: String,
    onClick: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            color = OpwInk,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.ExtraBold,
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFFFBFCFE),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            shadowElevation = 1.dp,
            onClick = onClick,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 15.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = value.ifBlank { placeholder },
                    color = if (value.isBlank()) Color(0xFF94A3B8) else OpwInk,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = if (value.isBlank()) FontWeight.Normal else FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun CompactPickerPill(
    value: String,
    placeholder: String,
    icon: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFFFBFCFE),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
        shadowElevation = 1.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 13.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = icon,
                color = Color(0xFF2D8A82),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                text = value.ifBlank { placeholder },
                color = if (value.isBlank()) Color(0xFF94A3B8) else OpwInk,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (value.isBlank()) FontWeight.Normal else FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun OpwBottomSheetDialog(
    title: String,
    primaryLabel: String,
    onDismiss: () -> Unit,
    onPrimary: () -> Unit,
    onReset: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val focusManager = LocalFocusManager.current

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x660F172A))
                .pointerInput(focusManager) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Final)
                            if (event.type == PointerEventType.Release && event.changes.none { it.isConsumed }) {
                                focusManager.clearFocus()
                            }
                        }
                    }
                },
            contentAlignment = Alignment.BottomCenter,
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp),
                color = Color.White,
                shadowElevation = 18.dp,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.White, Color(0xFFF8FBFF)),
                            ),
                        )
                        .padding(horizontal = 22.dp, vertical = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(width = 42.dp, height = 4.dp)
                                .background(Color(0xFFD1D5DB), RoundedCornerShape(999.dp)),
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color.Transparent,
                            onClick = onDismiss,
                        ) {
                            Box(
                                modifier = Modifier.size(42.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                CloseGlyph(color = Color(0xFF94A3B8))
                            }
                        }
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = OpwInk,
                            textAlign = TextAlign.Center,
                        )
                        if (onReset == null) {
                            Spacer(modifier = Modifier.size(42.dp))
                        } else {
                            TextButton(onClick = onReset) {
                                Text(
                                    text = "Reset",
                                    color = Color(0xFF2D8A82),
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                    }

                    content()

                    Button(
                        onClick = onPrimary,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(primaryLabel, fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ModernPatientTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType = KeyboardType.Text,
    minLines: Int = 1,
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFFF8FAFC),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            singleLine = minLines == 1,
            minLines = minLines,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        )
    }
}

@Composable
private fun PatientDetailScreen(
    token: String?,
    patient: JSONObject,
    users: List<StaffUser>,
    services: List<JSONObject>,
    therapyResources: List<JSONObject>,
    appointmentRequests: List<JSONObject>,
    onBack: () -> Unit,
    onEdit: (() -> Unit)?,
    canAddTreatmentPlan: Boolean,
    canEditTreatmentPlan: Boolean,
    canAddClinicalNote: Boolean,
    canEditClinicalNote: Boolean,
    canAddTherapyRecommendation: Boolean,
    canEditTherapyRecommendation: Boolean,
    canAddPayment: Boolean,
    canEditPayment: Boolean,
    canAddAppointment: Boolean,
    canEditAppointment: Boolean,
    onTreatmentPlanSave: (String, String?, JSONObject) -> Unit,
    onTreatmentPlanStatusChange: (String, String, String) -> Unit,
    onSessionDayStatusChange: (String, String, String, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    onTreatmentSessionEntryDelete: (String, String, String) -> Unit,
    onTreatmentPaymentAdd: (String, String, Double, String, String) -> Unit,
    onTreatmentPaymentUpdate: (String, String, String, Double, String, String) -> Unit,
    onTreatmentPlanDelete: (String, String) -> Unit,
    onClinicalNoteSave: (String, String?, String, String) -> Unit,
    onClinicalDocumentSave: (String, PickedUploadFile) -> Unit,
    onClinicalNoteDelete: (String, String) -> Unit,
    onClinicalDocumentDelete: (String, String) -> Unit,
    onTherapyRecommendationSave: (String, String, String, List<String>) -> Unit,
    onTherapyRecommendationDelete: (String, String) -> Unit,
    onPatientAppointmentAdd: (String, String, String, String) -> Unit,
    onPatientAppointmentUpdate: (String, JSONObject, String, String, String, String) -> Unit,
    onPatientAppointmentRequestDecision: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var selectedModuleName by rememberSaveable(patient.text("id")) {
        mutableStateOf(PatientProfileModule.Overview.name)
    }
    val selectedModule = runCatching {
        PatientProfileModule.valueOf(selectedModuleName)
    }.getOrDefault(PatientProfileModule.Overview)
    var showTreatmentDialog by rememberSaveable { mutableStateOf(false) }
    var editingPlanId by rememberSaveable { mutableStateOf("") }
    var showNoteDialog by rememberSaveable { mutableStateOf(false) }
    var editingNoteId by rememberSaveable { mutableStateOf("") }
    var showTherapyDialog by rememberSaveable { mutableStateOf(false) }
    var showAppointmentDialog by rememberSaveable { mutableStateOf(false) }
    val patientId = patient.text("id")
    val treatmentPlans = patient.array("treatmentPlans").toJsonObjects()
    val activeTreatmentCount = treatmentPlans.count { it.text("status", fallback = "active") == "active" }
    val clinicalNotes = patient.array("clinicalNotes").toJsonObjects()
    val clinicalDocuments = patient.array("clinicalDocuments").toJsonObjects()
    val therapyRecommendations = patient.array("therapyRecommendations").toJsonObjects()
    val appointments = patient.array("appointments").toJsonObjects()
    val directPayments = patient.array("payments").toJsonObjects()
    val activeAppointments = appointments.filter {
        it.text("status", fallback = "scheduled") !in listOf("completed", "cancelled")
    }
    val appointmentHistory = appointments.filter {
        it.text("status", fallback = "scheduled") in listOf("completed", "cancelled")
    }
    val linkedRequestIds = appointments.mapNotNull { it.text("requestId").takeIf { value -> value.isNotBlank() } }.toSet()
    val visibleRequests = appointmentRequests.filter { request ->
        request.text("id") !in linkedRequestIds && request.text("status", fallback = "pending") == "pending"
    }

    BackHandler(enabled = true) {
        if (selectedModule == PatientProfileModule.Overview) {
            onBack()
        } else {
            selectedModuleName = PatientProfileModule.Overview.name
        }
    }

    if (showTreatmentDialog) {
        TreatmentPlanDialog(
            plan = treatmentPlans.firstOrNull { it.text("id") == editingPlanId },
            onDismiss = {
                showTreatmentDialog = false
                editingPlanId = ""
            },
            onSave = { planId, payload ->
                onTreatmentPlanSave(patientId, planId, payload)
                showTreatmentDialog = false
                editingPlanId = ""
            },
        )
    }

    if (showNoteDialog) {
        ClinicalNoteDialog(
            note = clinicalNotes.firstOrNull { it.text("id") == editingNoteId },
            clinicalNotes = clinicalNotes,
            onDismiss = {
                showNoteDialog = false
                editingNoteId = ""
            },
            onSave = { title, note ->
                onClinicalNoteSave(patientId, editingNoteId.takeIf { it.isNotBlank() }, title, note)
                showNoteDialog = false
                editingNoteId = ""
            },
        )
    }

    if (showTherapyDialog) {
        TherapyRecommendationDialog(
            services = services,
            therapyResources = therapyResources,
            onDismiss = { showTherapyDialog = false },
            onSave = { serviceId, note, itemIds ->
                onTherapyRecommendationSave(patientId, serviceId, note, itemIds)
                showTherapyDialog = false
            },
        )
    }

    if (showAppointmentDialog) {
        AddPatientAppointmentDialog(
            services = services,
            onDismiss = { showAppointmentDialog = false },
            onSave = { date, time, service ->
                onPatientAppointmentAdd(patientId, date, time, service)
                showAppointmentDialog = false
            },
        )
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        PatientProfileHeader(
            patient = patient,
            onBack = {
                if (selectedModule == PatientProfileModule.Overview) {
                    onBack()
                } else {
                    selectedModuleName = PatientProfileModule.Overview.name
                }
            },
            onEdit = if (selectedModule == PatientProfileModule.Overview) onEdit else null,
        )

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            when (selectedModule) {
                PatientProfileModule.Overview -> PatientProfileModuleGrid(
                    patient = patient,
                    treatmentPlans = treatmentPlans,
                    activeTreatmentCount = activeTreatmentCount,
                    activeAppointments = activeAppointments,
                    appointmentRequests = visibleRequests,
                    clinicalNotes = clinicalNotes,
                    therapyRecommendations = therapyRecommendations,
                    directPayments = directPayments,
                    onOpenModule = { selectedModuleName = it.name },
                )

                PatientProfileModule.Appointments -> {
                    PatientAppointmentsSection(
                        patientId = patientId,
                        activeAppointments = activeAppointments,
                        appointmentHistory = appointmentHistory,
                        appointmentRequests = visibleRequests,
                        onAdd = if (canAddAppointment) { { showAppointmentDialog = true } } else null,
                        canEdit = canEditAppointment,
                        onAppointmentUpdate = onPatientAppointmentUpdate,
                        onRequestDecision = onPatientAppointmentRequestDecision,
                    )
                }

                PatientProfileModule.Treatment -> {
                    TreatmentPlansSection(
                        patientId = patientId,
                        plans = treatmentPlans,
                        users = users,
                        activeTreatmentCount = activeTreatmentCount,
                        onStart = if (canAddTreatmentPlan) { {
                            onTreatmentPlanSave(patientId, null, JSONObject())
                        } } else null,
                        canEdit = canEditTreatmentPlan,
                        onStatusChange = onTreatmentPlanStatusChange,
                        onTreatmentModeChange = { currentPatientId, planId, mode ->
                            onTreatmentPlanSave(
                                currentPatientId,
                                planId,
                                JSONObject().put("treatmentLocation", mode),
                            )
                        },
                        onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                        onTreatmentSessionEntryDelete = onTreatmentSessionEntryDelete,
                        onDelete = onTreatmentPlanDelete,
                    )
                }

                PatientProfileModule.Payments -> {
                    PatientPaymentsSection(
                        patientId = patientId,
                        treatmentPlans = treatmentPlans,
                        directPayments = directPayments,
                        canAddPayment = canAddPayment,
                        canEditPayment = canEditPayment,
                        onPaymentAdd = onTreatmentPaymentAdd,
                        onPaymentUpdate = onTreatmentPaymentUpdate,
                        onBillingSettingsSave = { currentPatientId, planId, settings ->
                            onTreatmentPlanSave(
                                currentPatientId,
                                planId,
                                JSONObject().put("billingSettings", settings),
                            )
                        },
                    )
                }

                PatientProfileModule.Condition -> {
                    ClinicalNotesSection(
                        patientId = patientId,
                        disease = patient.text("disease"),
                        notes = patient.text("notes"),
                        clinicalNotes = clinicalNotes,
                        clinicalDocuments = clinicalDocuments,
                        token = token,
                        onAdd = if (canAddClinicalNote) { {
                            editingNoteId = ""
                            showNoteDialog = true
                        } } else null,
                        onAddDocument = if (canAddClinicalNote) onClinicalDocumentSave else null,
                        onEdit = if (canEditClinicalNote) { { note ->
                            editingNoteId = note.text("id")
                            showNoteDialog = true
                        } } else null,
                        onDelete = if (canEditClinicalNote) onClinicalNoteDelete else null,
                        onDeleteDocument = if (canEditClinicalNote) onClinicalDocumentDelete else null,
                    )
                }

                PatientProfileModule.Therapy -> {
                    TherapyRecommendationsSection(
                        patientId = patientId,
                        recommendations = therapyRecommendations,
                        onAdd = if (canAddTherapyRecommendation) { { showTherapyDialog = true } } else null,
                        onDelete = if (canEditTherapyRecommendation) onTherapyRecommendationDelete else null,
                    )
                }
            }
        }
    }
}

@Composable
private fun PatientProfileModuleGrid(
    patient: JSONObject,
    treatmentPlans: List<JSONObject>,
    activeTreatmentCount: Int,
    activeAppointments: List<JSONObject>,
    appointmentRequests: List<JSONObject>,
    clinicalNotes: List<JSONObject>,
    therapyRecommendations: List<JSONObject>,
    directPayments: List<JSONObject>,
    onOpenModule: (PatientProfileModule) -> Unit,
) {
    val treatmentPayments = treatmentPlans.flatMap { it.array("payments").toJsonObjects() }
    val paymentCount = directPayments.size + treatmentPayments.size
    val totalPaid = directPayments.sumOf { it.optDouble("amount", 0.0) } +
        treatmentPlans.sumOf { calculateTreatmentBilling(it).paidAmount }
    val dueBalance = treatmentPlans.sumOf { calculateTreatmentBilling(it).balanceAmount }
    val cards = listOf(
        PatientProfileModule.Appointments to ModuleCardSpec(
            title = "Appointment",
            subtitle = "${activeAppointments.size} active, ${appointmentRequests.size} request",
            count = (activeAppointments.size + appointmentRequests.size).toString(),
            accent = OpwBlue,
            tint = Color(0xFFEFF6FF),
        ),
        PatientProfileModule.Treatment to ModuleCardSpec(
            title = "Treatment",
            subtitle = if (activeTreatmentCount > 0) "Ongoing session active" else "${treatmentPlans.size} session record",
            count = activeTreatmentCount.toString(),
            accent = Color(0xFF8B5CF6),
            tint = Color(0xFFF3E8FF),
        ),
        PatientProfileModule.Payments to ModuleCardSpec(
            title = "Payment",
            subtitle = "${formatMoney(totalPaid)} paid, ${formatMoney(dueBalance)} due",
            count = paymentCount.toString(),
            accent = OpwSuccess,
            tint = Color(0xFFDCFCE7),
        ),
        PatientProfileModule.Condition to ModuleCardSpec(
            title = "Clinical Notes",
            subtitle = "Clinical notes",
            count = clinicalNotes.size.toString(),
            accent = OpwWarning,
            tint = Color(0xFFFFF7ED),
        ),
        PatientProfileModule.Therapy to ModuleCardSpec(
            title = "Therapy",
            subtitle = "${therapyRecommendations.size} recommendation",
            count = therapyRecommendations.size.toString(),
            accent = OpwAqua,
            tint = Color(0xFFE0FDF8),
        ),
    )

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        cards.chunked(2).forEach { rowCards ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                rowCards.forEach { (module, spec) ->
                    PatientProfileModuleCard(
                        spec = spec,
                        modifier = Modifier.weight(1f),
                        onClick = { onOpenModule(module) },
                    )
                }
                if (rowCards.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

private data class ModuleCardSpec(
    val title: String,
    val subtitle: String,
    val count: String,
    val accent: Color,
    val tint: Color,
)

@Composable
private fun PatientProfileModuleCard(
    spec: ModuleCardSpec,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, spec.accent.copy(alpha = 0.18f)),
        shadowElevation = 3.dp,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(Color.White, spec.tint.copy(alpha = 0.72f)),
                    ),
                )
                .padding(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 24.dp, y = (-26).dp)
                    .size(72.dp)
                    .background(spec.accent.copy(alpha = 0.1f), CircleShape),
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(spec.tint, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(spec.accent, CircleShape),
                        )
                    }
                    StatusChip(spec.count, Color.White.copy(alpha = 0.88f), spec.accent)
                }
                Text(
                    text = spec.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = OpwInk,
                )
                Text(
                    text = spec.subtitle,
                    color = OpwSlate,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun PatientProfileHeader(
    patient: JSONObject,
    onBack: () -> Unit,
    onEdit: (() -> Unit)?,
) {
    val displayPatientId = patient.text("patientId", fallback = "").ifBlank { "Not assigned" }
    Surface(
        shape = RoundedCornerShape(26.dp),
        color = Color.White.copy(alpha = 0.96f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5EDF7)),
        shadowElevation = 2.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BackCircleButton(onClick = onBack)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = patient.text("name", fallback = "Patient"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = OpwInk,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "ID: $displayPatientId",
                    color = OpwBlue,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                )
                Text(
                    text = listOf(
                        patient.text("mobile", fallback = "Mobile not provided"),
                        patient.text("email", fallback = "Email not provided"),
                    ).joinToString("  |  "),
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (onEdit != null) {
                PatientIconActionButton(icon = PatientActionIcon.Edit, onClick = onEdit)
            }
        }
    }
}

@Composable
private fun TreatmentPlansSection(
    patientId: String,
    plans: List<JSONObject>,
    users: List<StaffUser>,
    activeTreatmentCount: Int,
    onStart: (() -> Unit)?,
    canEdit: Boolean,
    onStatusChange: (String, String, String) -> Unit,
    onTreatmentModeChange: (String, String, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    onTreatmentSessionEntryDelete: (String, String, String) -> Unit,
    onDelete: (String, String) -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF8FBFF))))
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (onStart != null && activeTreatmentCount == 0) {
                Button(
                    onClick = onStart,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D8A82)),
                ) {
                    Text("Session Start", fontWeight = FontWeight.ExtraBold)
                }
            }
            if (plans.isEmpty()) {
                InlineEmpty("No treatment session started yet.")
            } else {
                plans.forEach { plan ->
                    TreatmentPlanCard(
                        patientId = patientId,
                        plan = plan,
                        users = users,
                        canEdit = canEdit,
                        onStatusChange = onStatusChange,
                        onTreatmentModeChange = onTreatmentModeChange,
                        onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                        onTreatmentSessionEntryDelete = onTreatmentSessionEntryDelete,
                        onDelete = onDelete,
                    )
                }
            }
        }
    }
}

@Composable
private fun TreatmentPlanCard(
    patientId: String,
    plan: JSONObject,
    users: List<StaffUser>,
    canEdit: Boolean,
    onStatusChange: (String, String, String) -> Unit,
    onTreatmentModeChange: (String, String, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    onTreatmentSessionEntryDelete: (String, String, String) -> Unit,
    onDelete: (String, String) -> Unit,
) {
    val planId = plan.text("id")
    val status = plan.text("status", fallback = "active")
    val sessionDays = sortedTreatmentSessionDays(plan)
    val treatmentSuggestions = treatmentDetailSuggestions(sessionDays)
    val activeStaff = users.filter { it.role != "Admin" && it.status != "Inactive" }
    val treatmentMode = plan.text("treatmentLocation", "serviceLocation", fallback = "clinic")
        .trim()
        .lowercase()
        .ifBlank { "clinic" }
    var entryDate by rememberSaveable(planId) { mutableStateOf(todayDateKey()) }
    var entryTreatmentType by rememberSaveable(planId) { mutableStateOf("") }
    var entryStaffId by rememberSaveable(planId) { mutableStateOf("") }
    var confirmAction by rememberSaveable(planId) { mutableStateOf("") }
    var deleteDayId by rememberSaveable(planId) { mutableStateOf("") }
    var showEntryDatePicker by rememberSaveable(planId) { mutableStateOf(false) }
    var showEntryStaffMenu by rememberSaveable(planId) { mutableStateOf(false) }
    val selectedStaffName = activeStaff.firstOrNull { it.id == entryStaffId }?.name.orEmpty()

    if (confirmAction == "complete") {
        ConfirmDeleteDialog(
            title = "Mark session completed?",
            message = "Completed sessions cannot be reactivated. Create a new session when treatment restarts.",
            confirmLabel = "Mark Complete",
            onDismiss = { confirmAction = "" },
            onConfirm = {
                onStatusChange(patientId, planId, "completed")
                confirmAction = ""
            },
        )
    }

    if (confirmAction == "delete") {
        ConfirmDeleteDialog(
            title = "Delete treatment session?",
            message = "This will remove the treatment session from this patient profile.",
            onDismiss = { confirmAction = "" },
            onConfirm = {
                onDelete(patientId, planId)
                confirmAction = ""
            },
        )
    }

    if (deleteDayId.isNotBlank()) {
        ConfirmDeleteDialog(
            title = "Delete session entry?",
            message = "Delete this treatment done entry? This is allowed only while the session is active.",
            onDismiss = { deleteDayId = "" },
            onConfirm = {
                onTreatmentSessionEntryDelete(patientId, planId, deleteDayId)
                deleteDayId = ""
            },
        )
    }

    if (showEntryDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = entryDate.ifBlank { todayDateKey() },
            onDismiss = { showEntryDatePicker = false },
            onDateSelected = {
                entryDate = it
                showEntryDatePicker = false
            },
        )
    }

    Surface(
        shape = RoundedCornerShape(26.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        if (status == "completed") "Completed Session" else "Active Session",
                        fontWeight = FontWeight.ExtraBold,
                        color = OpwInk,
                    )
                    Text(
                        "${sessionDays.size} treatment day${if (sessionDays.size == 1) "" else "s"}",
                        color = Color(0xFF2D8A82),
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        plan.array("treatmentTypes").joinLabels().ifBlank { "Treatment type not added" },
                        color = Color(0xFF64748B),
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    listOf("clinic" to "🩺", "home" to "⌂").forEach { (mode, icon) ->
                        val selected = treatmentMode == mode
                        Surface(
                            shape = CircleShape,
                            color = if (selected) Color(0xFFE0FDF8) else Color(0xFFF8FAFC),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (selected) Color(0xFF2D8A82) else Color(0xFFE2E8F0),
                            ),
                            onClick = {
                                if (canEdit && status != "completed") {
                                    onTreatmentModeChange(patientId, planId, mode)
                                }
                            },
                        ) {
                            Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.Center) {
                                Text(icon, fontWeight = FontWeight.ExtraBold, color = Color(0xFF2D8A82))
                            }
                        }
                    }
                    if (canEdit) {
                        if (status == "active") {
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFFDCFCE7),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBBF7D0)),
                                onClick = { confirmAction = "complete" },
                            ) {
                                Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.Center) {
                                    Text("✓", color = OpwSuccess, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFFFF1F2),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFD5DA)),
                            onClick = { confirmAction = "delete" },
                        ) {
                            Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.Center) {
                                Text("🗑", color = OpwDanger, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                }
            }

            if (status == "active" && canEdit) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFEFFBFF), RoundedCornerShape(18.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        CompactPickerPill(
                            value = appointmentDateLabel(entryDate),
                            placeholder = "Pick date",
                            icon = "📅",
                            modifier = Modifier.weight(1f),
                            onClick = { showEntryDatePicker = true },
                        )
                        Box(modifier = Modifier.weight(1f)) {
                            CompactPickerPill(
                                value = selectedStaffName,
                                placeholder = "Done by staff",
                                icon = "⌄",
                                onClick = { showEntryStaffMenu = true },
                            )
                            DropdownMenu(
                                expanded = showEntryStaffMenu,
                                onDismissRequest = { showEntryStaffMenu = false },
                            ) {
                                activeStaff.forEach { staff ->
                                    DropdownMenuItem(
                                        text = { Text(staff.name.ifBlank { staff.email }) },
                                        onClick = {
                                            entryStaffId = staff.id
                                            showEntryStaffMenu = false
                                        },
                                    )
                                }
                            }
                        }
                    }
                    OutlinedTextField(
                        value = entryTreatmentType,
                        onValueChange = { entryTreatmentType = it },
                        placeholder = { Text("Treatment details") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                    TreatmentDetailSuggestions(
                        suggestions = treatmentSuggestions,
                        query = entryTreatmentType,
                        onSelected = { entryTreatmentType = it },
                    )
                    Button(
                        onClick = {
                            onTreatmentSessionEntryAdd(
                                patientId,
                                planId,
                                entryDate,
                                entryTreatmentType,
                                entryStaffId,
                            )
                            entryTreatmentType = ""
                            entryStaffId = ""
                            entryDate = todayDateKey()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = entryTreatmentType.isNotBlank() && entryStaffId.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D8A82)),
                    ) {
                        Text("Add Treatment Done")
                    }
                }
            }

            if (sessionDays.isEmpty()) {
                InlineEmpty("No treatment done entries yet.")
            } else {
                sessionDays.forEach { day ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(day.text("date", fallback = "Date not set"), fontWeight = FontWeight.Bold, color = OpwInk)
                            Text(
                                day.text("treatmentType", fallback = "Treatment detail not added"),
                                color = Color(0xFF64748B),
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            day.text("doneByStaffName").takeIf { it.isNotBlank() }?.let { staffName ->
                                Text(
                                    staffName,
                                    color = OpwSuccess,
                                )
                            }
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            StatusChip("Session Done", Color(0xFFDCFCE7), OpwSuccess)
                            if (status == "active" && canEdit) {
                                Surface(
                                    shape = CircleShape,
                                    color = Color(0xFFFFF1F2),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFD5DA)),
                                    onClick = { deleteDayId = day.text("id") },
                                ) {
                                    Box(modifier = Modifier.size(34.dp), contentAlignment = Alignment.Center) {
                                        Text("🗑", color = OpwDanger, fontWeight = FontWeight.ExtraBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }
    }
}

@Composable
private fun PatientAppointmentsSection(
    patientId: String,
    activeAppointments: List<JSONObject>,
    appointmentHistory: List<JSONObject>,
    appointmentRequests: List<JSONObject>,
    onAdd: (() -> Unit)?,
    canEdit: Boolean,
    onAppointmentUpdate: (String, JSONObject, String, String, String, String) -> Unit,
    onRequestDecision: (String, JSONObject, String, String, String, String) -> Unit,
) {
    SectionCard(
        title = "Appointments",
        actionLabel = "Add",
        onAction = onAdd,
    ) {
        SectionTitle("Appointment Requests")
        if (appointmentRequests.isEmpty()) {
            InlineEmpty("No separate appointment requests.")
        } else {
            appointmentRequests.forEach { request ->
                AppointmentRequestCard(
                    patientId = patientId,
                    request = request,
                    canEdit = canEdit,
                    onDecision = onRequestDecision,
                )
            }
        }

        SectionTitle("Active Appointments")
        if (activeAppointments.isEmpty()) {
            InlineEmpty("No active appointment scheduled.")
        } else {
            activeAppointments.forEach { appointment ->
                PatientAppointmentCard(
                    patientId = patientId,
                    appointment = appointment,
                    canEdit = canEdit,
                    onUpdate = onAppointmentUpdate,
                )
            }
        }

        SectionTitle("Appointment History")
        if (appointmentHistory.isEmpty()) {
            InlineEmpty("No appointment history yet.")
        } else {
            appointmentHistory.forEach { appointment ->
                RecordCard(
                    title = appointment.text("service", fallback = "Appointment"),
                    subtitle = scheduleLabel(appointment.text("date"), appointment.text("time")),
                    status = appointmentStatusLabel(appointment.text("status")),
                    statusColor = statusColor(appointment.text("status")),
                    rows = listOf(
                        "Remark" to appointment.text("remark", fallback = "No remark"),
                    ),
                )
            }
        }
    }
}

@Composable
private fun PatientPaymentsSection(
    patientId: String,
    treatmentPlans: List<JSONObject>,
    directPayments: List<JSONObject>,
    canAddPayment: Boolean,
    canEditPayment: Boolean,
    onPaymentAdd: (String, String, Double, String, String) -> Unit,
    onPaymentUpdate: (String, String, String, Double, String, String) -> Unit,
    onBillingSettingsSave: (String, String, JSONObject) -> Unit,
) {
    var selectedPlanId by rememberSaveable(treatmentPlans.joinToString("|") { it.text("id") }) {
        mutableStateOf(treatmentPlans.firstOrNull { it.text("status", fallback = "active") == "active" }?.text("id")
            ?: treatmentPlans.firstOrNull()?.text("id").orEmpty())
    }
    var paymentAmount by rememberSaveable { mutableStateOf("") }
    var paymentMethod by rememberSaveable { mutableStateOf("") }
    var paymentDate by rememberSaveable { mutableStateOf(todayDateKey()) }
    var showPaymentDatePicker by rememberSaveable { mutableStateOf(false) }
    var showBillingSettings by rememberSaveable { mutableStateOf(false) }
    var showPlanMenu by rememberSaveable { mutableStateOf(false) }
    var showMethodMenu by rememberSaveable { mutableStateOf(false) }
    var paymentError by rememberSaveable { mutableStateOf("") }
    var editingPaymentPlanId by rememberSaveable { mutableStateOf("") }
    var editingPaymentId by rememberSaveable { mutableStateOf("") }
    val treatmentPayments = treatmentPlans.flatMap { plan ->
        plan.array("payments").toJsonObjects().map { payment -> plan to payment }
    }
    val selectedPlan = treatmentPlans.firstOrNull { it.text("id") == selectedPlanId }
    val editingPaymentPlan = treatmentPlans.firstOrNull { it.text("id") == editingPaymentPlanId }
    val editingPayment = editingPaymentPlan
        ?.array("payments")
        ?.toJsonObjects()
        ?.firstOrNull { it.text("id") == editingPaymentId }
    val totalPaid = directPayments.sumOf { it.optDouble("amount", 0.0) } +
        treatmentPlans.sumOf { calculateTreatmentBilling(it).paidAmount }
    val dueBalance = treatmentPlans.sumOf { calculateTreatmentBilling(it).balanceAmount }
    val availableBalance = treatmentPlans.sumOf { calculateTreatmentBilling(it).availableBalance }
    val availableSessionDays = treatmentPlans.sumOf { calculateTreatmentBilling(it).availableSessionDays }

    if (editingPaymentPlan != null && editingPayment != null) {
        TreatmentPaymentEditDialog(
            payment = editingPayment,
            onDismiss = {
                editingPaymentPlanId = ""
                editingPaymentId = ""
            },
            onSave = { amount, method, date ->
                onPaymentUpdate(patientId, editingPaymentPlanId, editingPaymentId, amount, method, date)
                editingPaymentPlanId = ""
                editingPaymentId = ""
            },
        )
    }

    SectionCard(
        title = "Payment Summary",
        actionLabel = if (selectedPlan != null) "⚙" else null,
        onAction = if (selectedPlan != null) { { showBillingSettings = true } } else null,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                PaymentSummaryTile(
                    title = "Paid",
                    value = formatMoney(totalPaid),
                    accent = OpwSuccess,
                    modifier = Modifier.weight(1f),
                )
                PaymentSummaryTile(
                    title = "Due Balance",
                    value = formatMoney(dueBalance),
                    accent = OpwWarning,
                    modifier = Modifier.weight(1f),
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                PaymentSummaryTile(
                    title = "Available Balance",
                    value = formatMoney(availableBalance),
                    accent = OpwAqua,
                    modifier = Modifier.weight(1f),
                )
                PaymentSummaryTile(
                    title = "Days Avail",
                    value = availableSessionDays.toString(),
                    accent = OpwBlue,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        if (canAddPayment) {
            SectionTitle("Add Treatment Payment")
            if (treatmentPlans.isEmpty()) {
                InlineEmpty("Start a treatment session before adding treatment payment.")
            } else {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(26.dp),
                    color = Color(0xFFF8FAFC),
                    border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        if (paymentError.isNotBlank()) {
                            StatusBanner(message = paymentError, tone = BannerTone.Error)
                        }
                        if (treatmentPlans.size > 1) {
                            Box {
                                CompactPickerPill(
                                    value = selectedPlan?.let { treatmentTypeText(it) }.orEmpty(),
                                    placeholder = "Select treatment",
                                    icon = "⌄",
                                    onClick = { showPlanMenu = true },
                                )
                                DropdownMenu(
                                    expanded = showPlanMenu,
                                    onDismissRequest = { showPlanMenu = false },
                                ) {
                                    treatmentPlans.forEachIndexed { index, plan ->
                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    "Plan ${index + 1} - ${treatmentTypeText(plan)}",
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                            },
                                            onClick = {
                                                selectedPlanId = plan.text("id")
                                                val billing = calculateTreatmentBilling(plan)
                                                paymentAmount = if (billing.balanceAmount > 0.0) {
                                                    billing.balanceAmount.toLong().toString()
                                                } else {
                                                    ""
                                                }
                                                paymentMethod = plan.text("paymentMethod")
                                                paymentError = ""
                                                showPlanMenu = false
                                            },
                                        )
                                    }
                                }
                            }
                        }
                        OutlinedTextField(
                            value = paymentAmount,
                            onValueChange = {
                                paymentAmount = it.filter { char -> char.isDigit() }
                                paymentError = ""
                            },
                            placeholder = { Text("Amount") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        )
                        CompactPickerPill(
                            value = appointmentDateLabel(paymentDate),
                            placeholder = "Pick payment date",
                            icon = "📅",
                            onClick = { showPaymentDatePicker = true },
                        )
                        Box {
                            CompactPickerPill(
                                value = paymentMethod.replaceFirstChar {
                                    if (it.isLowerCase()) it.titlecase() else it.toString()
                                },
                                placeholder = "Select payment method",
                                icon = "⌄",
                                onClick = { showMethodMenu = true },
                            )
                            DropdownMenu(
                                expanded = showMethodMenu,
                                onDismissRequest = { showMethodMenu = false },
                            ) {
                                listOf("cash" to "Cash", "online" to "Online").forEach { (value, label) ->
                                    DropdownMenuItem(
                                        text = { Text(label) },
                                        onClick = {
                                            paymentMethod = value
                                            paymentError = ""
                                            showMethodMenu = false
                                        },
                                    )
                                }
                            }
                        }
                        Button(
                            onClick = {
                                val amount = paymentAmount.toDoubleOrNull() ?: 0.0
                                when {
                                    selectedPlanId.isBlank() -> paymentError = "Choose a treatment session."
                                    amount <= 0.0 -> paymentError = "Enter payment amount."
                                    else -> {
                                        onPaymentAdd(
                                            patientId,
                                            selectedPlanId,
                                            amount,
                                            paymentMethod.trim(),
                                            paymentDate.ifBlank { todayDateKey() },
                                        )
                                        paymentAmount = ""
                                        paymentDate = todayDateKey()
                                        paymentError = ""
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Add Payment")
                        }
                    }
                }
            }
        }

        SectionTitle("Treatment Payments")
        if (treatmentPayments.isEmpty()) {
            InlineEmpty("No treatment payment entries yet.")
        } else {
            treatmentPayments.forEach { (plan, payment) ->
                val displayDate = payment.text("paymentDate").ifBlank { payment.text("createdAt").take(10) }
                RecordCard(
                    title = formatMoney(payment.optDouble("amount", 0.0)),
                    subtitle = appointmentDateLabel(displayDate),
                    status = payment.text("method", fallback = "Payment"),
                    statusColor = OpwSuccess,
                    rows = listOf(
                        "Treatment" to treatmentTypeText(plan),
                    ),
                    onClick = if (canEditPayment) {
                        {
                            editingPaymentPlanId = plan.text("id")
                            editingPaymentId = payment.text("id")
                        }
                    } else {
                        null
                    },
                )
            }
        }

        SectionTitle("Other Payments")
        if (directPayments.isEmpty()) {
            InlineEmpty("No direct payment entries yet.")
        } else {
            directPayments.forEach { payment ->
                val displayDate = payment.text("paymentDate").ifBlank { payment.text("createdAt").take(10) }
                RecordCard(
                    title = formatMoney(payment.optDouble("amount", 0.0)),
                    subtitle = appointmentDateLabel(displayDate),
                    status = payment.text("method", fallback = "Payment"),
                    statusColor = OpwBlue,
                    rows = listOf(
                        "Created" to formatTimestamp(payment.text("createdAt")),
                    ),
                )
            }
        }
    }

    if (showBillingSettings && selectedPlan != null) {
        TreatmentBillingSettingsDialog(
            plan = selectedPlan,
            onDismiss = { showBillingSettings = false },
            onSave = { settings ->
                onBillingSettingsSave(patientId, selectedPlanId, settings)
                val previewPlan = JSONObject(selectedPlan.toString()).put("billingSettings", settings)
                val billing = calculateTreatmentBilling(previewPlan)
                paymentAmount = if (billing.balanceAmount > 0.0) billing.balanceAmount.toLong().toString() else ""
                showBillingSettings = false
            },
        )
    }

    if (showPaymentDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = paymentDate.ifBlank { todayDateKey() },
            onDismiss = { showPaymentDatePicker = false },
            onDateSelected = {
                paymentDate = it
                paymentError = ""
                showPaymentDatePicker = false
            },
        )
    }
}

@Composable
private fun TreatmentBillingSettingsDialog(
    plan: JSONObject,
    onDismiss: () -> Unit,
    onSave: (JSONObject) -> Unit,
) {
    val billing = calculateTreatmentBilling(plan)
    var homeVisitCharge by rememberSaveable(plan.text("id")) { mutableStateOf(billing.homeVisitCharge.toLong().toString()) }
    var clinicVisitCharge by rememberSaveable(plan.text("id")) { mutableStateOf(billing.clinicVisitCharge.toLong().toString()) }
    var firstConsultationCharge by rememberSaveable(plan.text("id")) { mutableStateOf(billing.firstConsultationCharge.toLong().toString()) }
    var discountType by rememberSaveable(plan.text("id")) { mutableStateOf(billing.discountType) }
    var discountValue by rememberSaveable(plan.text("id")) {
        mutableStateOf(if (billing.discountValue > 0.0) billing.discountValue.toLong().toString() else "")
    }
    var extraSessionDays by rememberSaveable(plan.text("id")) {
        mutableStateOf(if (billing.extraSessionDays > 0) billing.extraSessionDays.toString() else "")
    }
    val previewPlan = remember(
        plan.text("id"),
        homeVisitCharge,
        clinicVisitCharge,
        firstConsultationCharge,
        discountType,
        discountValue,
        extraSessionDays,
    ) {
        JSONObject(plan.toString()).put(
            "billingSettings",
            billingSettingsPayload(
                homeVisitCharge = homeVisitCharge,
                clinicVisitCharge = clinicVisitCharge,
                firstConsultationCharge = firstConsultationCharge,
                discountType = discountType,
                discountValue = discountValue,
                extraSessionDays = extraSessionDays,
            ),
        )
    }
    val preview = calculateTreatmentBilling(previewPlan)

    OpwBottomSheetDialog(
        title = "Payment Settings",
        primaryLabel = "Save Settings",
        onDismiss = onDismiss,
        onPrimary = {
            onSave(
                billingSettingsPayload(
                    homeVisitCharge = homeVisitCharge,
                    clinicVisitCharge = clinicVisitCharge,
                    firstConsultationCharge = firstConsultationCharge,
                    discountType = discountType,
                    discountValue = discountValue,
                    extraSessionDays = extraSessionDays,
                ),
            )
        },
        onReset = {
            homeVisitCharge = "500"
            clinicVisitCharge = "300"
            firstConsultationCharge = "200"
            discountType = "none"
            discountValue = ""
            extraSessionDays = ""
        },
    ) {
        ModernPatientTextField(
            label = "Home visit charge",
            value = homeVisitCharge,
            onValueChange = { homeVisitCharge = it.filter(Char::isDigit) },
            keyboardType = KeyboardType.Number,
        )
        ModernPatientTextField(
            label = "Clinic visit charge",
            value = clinicVisitCharge,
            onValueChange = { clinicVisitCharge = it.filter(Char::isDigit) },
            keyboardType = KeyboardType.Number,
        )
        ModernPatientTextField(
            label = "1st consultant charge",
            value = firstConsultationCharge,
            onValueChange = { firstConsultationCharge = it.filter(Char::isDigit) },
            keyboardType = KeyboardType.Number,
        )
        Text("Discount", color = OpwInk, fontWeight = FontWeight.ExtraBold)
        ChoiceChipRow(
            options = listOf("none", "percent", "amount"),
            selected = discountType,
            onSelected = {
                discountType = it
                if (it == "none") discountValue = ""
            },
        )
        ModernPatientTextField(
            label = "Discount value",
            value = discountValue,
            onValueChange = { discountValue = it.filter(Char::isDigit) },
            keyboardType = KeyboardType.Number,
        )
        ModernPatientTextField(
            label = "More days",
            value = extraSessionDays,
            onValueChange = { extraSessionDays = it.filter(Char::isDigit) },
            keyboardType = KeyboardType.Number,
        )
        Surface(
            color = Color(0xFFEFFBFF),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBAE6FD)),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                DetailRow("Started days", preview.sessionCount.toString())
                DetailRow("Session amount", formatMoney(preview.sessionSubtotal))
                DetailRow("Consultation", formatMoney(preview.consultationCharge))
                DetailRow("Discount", formatMoney(preview.discountAmount))
                DetailRow("Payable", formatMoney(preview.payableAmount))
                DetailRow("Extra days", preview.extraSessionDays.toString())
                DetailRow("Days avail", preview.availableSessionDays.toString())
                if (discountType == "percent") {
                    Text(
                        "Percentage discount applies only to session charges. Consultant charge is not counted.",
                        color = OpwBlue,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}

@Composable
private fun TreatmentPaymentEditDialog(
    payment: JSONObject,
    onDismiss: () -> Unit,
    onSave: (Double, String, String) -> Unit,
) {
    var amount by rememberSaveable(payment.text("id")) {
        mutableStateOf(payment.optDouble("amount", 0.0).takeIf { it > 0.0 }?.toLong()?.toString().orEmpty())
    }
    var method by rememberSaveable(payment.text("id")) {
        mutableStateOf(payment.text("method").lowercase())
    }
    var paymentDate by rememberSaveable(payment.text("id")) {
        mutableStateOf(payment.text("paymentDate").ifBlank { payment.text("createdAt").take(10) }.ifBlank { todayDateKey() })
    }
    var error by rememberSaveable(payment.text("id")) { mutableStateOf("") }
    var showDatePicker by rememberSaveable(payment.text("id")) { mutableStateOf(false) }
    var showMethodMenu by rememberSaveable(payment.text("id")) { mutableStateOf(false) }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = paymentDate.ifBlank { todayDateKey() },
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                paymentDate = it
                showDatePicker = false
            },
        )
    }

    OpwBottomSheetDialog(
        title = "Edit Payment",
        primaryLabel = "Save Payment",
        onDismiss = onDismiss,
        onPrimary = {
            val parsedAmount = amount.toDoubleOrNull() ?: 0.0
            when {
                parsedAmount <= 0.0 -> error = "Enter payment amount."
                else -> onSave(parsedAmount, method.trim(), paymentDate.ifBlank { todayDateKey() })
            }
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        OutlinedTextField(
            value = amount,
            onValueChange = {
                amount = it.filter { char -> char.isDigit() }
                error = ""
            },
            placeholder = { Text("Amount") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        )
        CompactPickerPill(
            value = appointmentDateLabel(paymentDate),
            placeholder = "Pick payment date",
            icon = "ðŸ“…",
            onClick = { showDatePicker = true },
        )
        Box {
            CompactPickerPill(
                value = method.replaceFirstChar {
                    if (it.isLowerCase()) it.titlecase() else it.toString()
                },
                placeholder = "Select payment method",
                icon = "âŒ„",
                onClick = { showMethodMenu = true },
            )
            DropdownMenu(
                expanded = showMethodMenu,
                onDismissRequest = { showMethodMenu = false },
            ) {
                listOf("cash" to "Cash", "online" to "Online").forEach { (value, label) ->
                    DropdownMenuItem(
                        text = { Text(label) },
                        onClick = {
                            method = value
                            error = ""
                            showMethodMenu = false
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentSummaryTile(
    title: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        color = accent.copy(alpha = 0.09f),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.18f)),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(title, color = OpwSlate, style = MaterialTheme.typography.bodySmall)
            Text(value, color = OpwInk, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
        }
    }
}

@Composable
private fun AppointmentRequestCard(
    patientId: String,
    request: JSONObject,
    canEdit: Boolean,
    onDecision: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var decisionAction by rememberSaveable(request.text("id")) { mutableStateOf("") }

    if (decisionAction.isNotBlank()) {
        AppointmentRequestDecisionDialog(
            patientId = patientId,
            request = request,
            action = decisionAction,
            onDismiss = { decisionAction = "" },
            onDecision = { id, item, action, date, time, note ->
                onDecision(id, item, action, date, time, note)
                decisionAction = ""
            },
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = Color(0xFFFFFBEB),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        request.text("service", fallback = "Appointment Request"),
                        fontWeight = FontWeight.ExtraBold,
                        color = OpwInk,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        "Requested: ${scheduleLabel(request.text("requestedDate"), request.text("requestedTime"))}",
                        color = Color(0xFF64748B),
                    )
                }
                StatusChip("Request", Color.White, OpwWarning)
            }
            if (canEdit) {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(onClick = { decisionAction = "approve" }) {
                        Text("Approve")
                    }
                    OutlinedButton(onClick = { decisionAction = "reschedule" }) {
                        Text("Reschedule")
                    }
                }
            }
        }
    }
}

@Composable
private fun AppointmentRequestDecisionDialog(
    patientId: String,
    request: JSONObject,
    action: String,
    onDismiss: () -> Unit,
    onDecision: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var date by rememberSaveable(request.text("id"), action) {
        mutableStateOf(request.text("confirmedDate", "requestedDate", fallback = todayDateKey()))
    }
    var time by rememberSaveable(request.text("id"), action) {
        mutableStateOf(request.text("confirmedTime", "requestedTime"))
    }
    var note by rememberSaveable(request.text("id"), action) {
        mutableStateOf(request.text("decisionNote"))
    }
    var error by rememberSaveable(request.text("id"), action) { mutableStateOf("") }
    var showDatePicker by rememberSaveable(request.text("id"), action) { mutableStateOf(false) }
    var showTimePicker by rememberSaveable(request.text("id"), action) { mutableStateOf(false) }

    fun submit() {
        if (date.isBlank()) {
            error = "Choose a date."
        } else {
            onDecision(patientId, request, action, date.trim(), time.trim(), note.trim())
        }
    }

    OpwBottomSheetDialog(
        title = if (action == "reschedule") "Reschedule Request" else "Approve Request",
        primaryLabel = if (action == "reschedule") "Reschedule" else "Approve",
        onDismiss = onDismiss,
        onPrimary = ::submit,
        onReset = {
            date = request.text("confirmedDate", "requestedDate", fallback = todayDateKey())
            time = request.text("confirmedTime", "requestedTime")
            note = request.text("decisionNote")
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        DetailRow("Service", request.text("service", fallback = "Appointment"))
        DetailRow("Requested", scheduleLabel(request.text("requestedDate"), request.text("requestedTime")))
        SheetPickerField(
            label = "Decision Date",
            value = appointmentDateLabel(date),
            placeholder = "Select decision date",
            onClick = { showDatePicker = true },
        )
        SheetPickerField(
            label = "Decision Time",
            value = appointmentTimeLabel(time),
            placeholder = "Select decision time",
            onClick = { showTimePicker = true },
        )
        SheetPatientField(
            label = "OPW Note",
            value = note,
            onValueChange = {
                note = it
                error = ""
            },
            minLines = 3,
        )
    }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = date,
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                date = it
                error = ""
                showDatePicker = false
            },
        )
    }

    if (showTimePicker) {
        AppointmentTimePickerDialog(
            selectedTime = time,
            onDismiss = { showTimePicker = false },
            onTimeSelected = {
                time = it
                showTimePicker = false
            },
        )
    }
}

@Composable
private fun PatientAppointmentCard(
    patientId: String,
    appointment: JSONObject,
    canEdit: Boolean,
    onUpdate: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var updateStatus by rememberSaveable(appointment.text("id")) { mutableStateOf("") }

    if (updateStatus.isNotBlank()) {
        ActiveAppointmentUpdateDialog(
            patientId = patientId,
            appointment = appointment,
            status = updateStatus,
            onDismiss = { updateStatus = "" },
            onUpdate = { id, item, status, date, time, remark ->
                onUpdate(id, item, status, date, time, remark)
                updateStatus = ""
            },
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        appointment.text("service", fallback = "Appointment"),
                        fontWeight = FontWeight.ExtraBold,
                        color = OpwInk,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(scheduleLabel(appointment.text("date"), appointment.text("time")), color = Color(0xFF64748B))
                }
                StatusChip("Active", Color(0xFFDCFCE7), OpwSuccess)
            }
            if (canEdit) {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(onClick = { updateStatus = "rescheduled" }) {
                        Text("Reschedule")
                    }
                    OutlinedButton(onClick = { updateStatus = "completed" }) {
                        Text("Done")
                    }
                    OutlinedButton(onClick = { updateStatus = "cancelled" }) {
                        Text("Cancel")
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveAppointmentUpdateDialog(
    patientId: String,
    appointment: JSONObject,
    status: String,
    onDismiss: () -> Unit,
    onUpdate: (String, JSONObject, String, String, String, String) -> Unit,
) {
    var date by rememberSaveable(appointment.text("id"), status) { mutableStateOf(appointment.text("date")) }
    var time by rememberSaveable(appointment.text("id"), status) { mutableStateOf(appointment.text("time")) }
    var remark by rememberSaveable(appointment.text("id"), status) { mutableStateOf(appointment.text("remark")) }
    var error by rememberSaveable(appointment.text("id"), status) { mutableStateOf("") }
    var showDatePicker by rememberSaveable(appointment.text("id"), status) { mutableStateOf(false) }
    var showTimePicker by rememberSaveable(appointment.text("id"), status) { mutableStateOf(false) }
    val title = when (status) {
        "rescheduled" -> "Reschedule Appointment"
        "completed" -> "Complete Appointment"
        else -> "Cancel Appointment"
    }
    val primaryLabel = when (status) {
        "rescheduled" -> "Reschedule"
        "completed" -> "Mark Done"
        else -> "Cancel Appointment"
    }

    fun submit() {
        val safeRemark = remark.trim().ifBlank {
            when (status) {
                "completed" -> "Completed from mobile app."
                "cancelled" -> "Cancelled from mobile app."
                else -> ""
            }
        }
        when {
            status == "rescheduled" && date.isBlank() -> error = "Choose a date."
            status in listOf("completed", "cancelled") && safeRemark.isBlank() -> error = "Add a remark."
            else -> onUpdate(patientId, appointment, status, date.trim(), time.trim(), safeRemark)
        }
    }

    OpwBottomSheetDialog(
        title = title,
        primaryLabel = primaryLabel,
        onDismiss = onDismiss,
        onPrimary = ::submit,
        onReset = {
            date = appointment.text("date")
            time = appointment.text("time")
            remark = appointment.text("remark")
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        DetailRow("Service", appointment.text("service", fallback = "Appointment"))
        SheetPickerField(
            label = "Date",
            value = appointmentDateLabel(date),
            placeholder = "Select appointment date",
            onClick = { showDatePicker = true },
        )
        SheetPickerField(
            label = "Time",
            value = appointmentTimeLabel(time),
            placeholder = "Select appointment time",
            onClick = { showTimePicker = true },
        )
        SheetPatientField(
            label = "Remark",
            value = remark,
            onValueChange = {
                remark = it
                error = ""
            },
            minLines = 3,
        )
    }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = date,
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                date = it
                error = ""
                showDatePicker = false
            },
        )
    }

    if (showTimePicker) {
        AppointmentTimePickerDialog(
            selectedTime = time,
            onDismiss = { showTimePicker = false },
            onTimeSelected = {
                time = it
                showTimePicker = false
            },
        )
    }
}

@Composable
private fun ClinicalNotesSection(
    patientId: String,
    disease: String,
    notes: String,
    clinicalNotes: List<JSONObject>,
    clinicalDocuments: List<JSONObject>,
    token: String?,
    onAdd: (() -> Unit)?,
    onAddDocument: ((String, PickedUploadFile) -> Unit)?,
    onEdit: ((JSONObject) -> Unit)?,
    onDelete: ((String, String) -> Unit)?,
    onDeleteDocument: ((String, String) -> Unit)?,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var documentError by rememberSaveable { mutableStateOf("") }
    var showDocumentSource by rememberSaveable { mutableStateOf(false) }
    var cameraUri by remember { mutableStateOf<Uri?>(null) }
    var previewDocument by remember { mutableStateOf<JSONObject?>(null) }
    var previewBytes by remember { mutableStateOf<ByteArray?>(null) }
    var previewLoading by rememberSaveable { mutableStateOf(false) }
    var previewError by rememberSaveable { mutableStateOf("") }

    fun uploadPickedUris(uris: List<Uri>, emptyMessage: String) {
        if (uris.isEmpty()) {
            documentError = emptyMessage
            return
        }
        var uploadedCount = 0
        uris.forEach { uri ->
            val picked = readPickedUploadFile(context, uri)
            if (picked != null) {
                uploadedCount += 1
                onAddDocument?.invoke(patientId, picked)
            }
        }
        documentError = if (uploadedCount == 0) "Unable to read selected file." else ""
    }

    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        uploadPickedUris(uris, "No photo selected.")
    }
    val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        uploadPickedUris(uris, "No document selected.")
    }
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        val uri = cameraUri
        if (success && uri != null) {
            val picked = readPickedUploadFile(context, uri, fallbackName = "clinical-photo-${System.currentTimeMillis()}.jpg")
            if (picked == null) {
                documentError = "Unable to read captured photo."
            } else {
                documentError = ""
                onAddDocument?.invoke(patientId, picked.copy(mimeType = picked.mimeType.ifBlank { "image/jpeg" }))
            }
        }
        cameraUri = null
    }

    fun openDocument(document: JSONObject) {
        val activeToken = token.orEmpty()
        if (activeToken.isBlank()) {
            previewDocument = document
            previewBytes = null
            previewError = "Please log in again to preview this document."
            return
        }
        previewDocument = document
        previewBytes = null
        previewError = ""
        previewLoading = true
        scope.launch {
            try {
                previewBytes = loadClinicalAssetBytes(document.text("downloadUrl"), activeToken)
                previewError = ""
            } catch (error: Exception) {
                previewError = "Unable to open this document inside the app."
            } finally {
                previewLoading = false
            }
        }
    }

    if (showDocumentSource) {
        AlertDialog(
            onDismissRequest = { showDocumentSource = false },
            title = { Text("Add Document", fontWeight = FontWeight.ExtraBold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Choose camera, multiple photos, or multiple files.")
                    OutlinedButton(
                        onClick = {
                            showDocumentSource = false
                            photoPicker.launch("image/*")
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text("Select Photos")
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDocumentSource = false
                        val uri = createClinicalCaptureUri(context)
                        cameraUri = uri
                        if (uri == null) {
                            documentError = "Camera upload is not available on this device."
                        } else {
                            cameraLauncher.launch(uri)
                        }
                    },
                ) {
                    Text("Camera")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showDocumentSource = false
                        documentPicker.launch("*/*")
                    },
                ) {
                    Text("Select Files")
                }
            },
        )
    }

    previewDocument?.let { document ->
        ClinicalDocumentPreviewDialog(
            document = document,
            bytes = previewBytes,
            loading = previewLoading,
            error = previewError,
            onDismiss = {
                previewDocument = null
                previewBytes = null
                previewError = ""
                previewLoading = false
            },
        )
    }

    SectionCard(
        title = "Clinical Notes",
        actionLabel = "Add Note",
        onAction = onAdd,
    ) {
        if (disease.isNotBlank()) {
            DetailRow("Primary Condition", disease)
        }
        if (clinicalNotes.isEmpty()) {
            InlineEmpty("No clinical notes added yet.")
        } else {
            clinicalNotes.forEach { note ->
                val noteId = note.text("id")
                val noteTitle = note.text("title", fallback = "Clinical Note")
                val notePreview = note.text("note", fallback = "No note text added.")
                SwipeDeleteModuleCard(
                    title = noteTitle,
                    subtitle = notePreview,
                    accent = OpwBlue,
                    deleteTitle = "Delete clinical note?",
                    deleteMessage = "This will remove this clinical note from the patient profile.",
                    onClick = onEdit?.let { edit -> { edit(note) } },
                    onDelete = { onDelete?.invoke(patientId, noteId) },
                    swipeEnabled = onDelete != null && noteId.isNotBlank(),
                    actions = {
                        StatusChip(
                            formatTimestamp(note.text("createdAt")).ifBlank { note.text("addedByLabel", fallback = "OPW") },
                            Color(0xFFEFF6FF),
                            OpwBlue,
                        )
                    },
                )
            }
        }

        DividerLine()
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SectionTitle("Documents")
            if (onAddDocument != null) {
                OutlinedButton(
                    onClick = { showDocumentSource = true },
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Text("Add Document")
                }
            }
        }
        if (documentError.isNotBlank()) {
            StatusBanner(message = documentError, tone = BannerTone.Error)
        }
        if (clinicalDocuments.isEmpty()) {
            InlineEmpty("No clinical documents uploaded yet.")
        } else {
            clinicalDocuments.forEach { document ->
                val documentId = document.text("id")
                val canDelete = document.text("source") != "legacy_note_document"
                SwipeDeleteModuleCard(
                    title = document.text("name", fallback = "Clinical document"),
                    subtitle = formatTimestamp(document.text("uploadedAt")),
                    accent = OpwAqua,
                    deleteTitle = "Delete clinical document?",
                    deleteMessage = "This will remove this uploaded clinical document.",
                    onClick = { openDocument(document) },
                    onDelete = { onDeleteDocument?.invoke(patientId, documentId) },
                    swipeEnabled = canDelete && onDeleteDocument != null && documentId.isNotBlank(),
                    actions = {
                        StatusChip(
                            if (document.text("mimeType").startsWith("image/")) "Image" else "Document",
                            Color(0xFFE0F2FE),
                            OpwBlue,
                        )
                    },
                )
            }
        }
    }
}

@Composable
private fun TherapyRecommendationsSection(
    patientId: String,
    recommendations: List<JSONObject>,
    onAdd: (() -> Unit)?,
    onDelete: ((String, String) -> Unit)?,
) {
    SectionCard(
        title = "Recommended Therapy",
        actionLabel = "Add Therapy",
        onAction = onAdd,
    ) {
        if (recommendations.isEmpty()) {
            InlineEmpty("No therapy recommendations added yet.")
        } else {
            recommendations.forEach { recommendation ->
                val items = recommendation.array("items").toJsonObjects()
                RecordCard(
                    title = recommendation.text("serviceName", fallback = "Therapy Service"),
                    subtitle = "${items.size} item(s)",
                    status = "Therapy",
                    rows = listOf(
                        "Note" to recommendation.text("note", fallback = "No note"),
                        "Items" to items.joinToString(", ") { it.text("title", "fileName", fallback = "Item") },
                    ),
                    actions = if (onDelete != null) {
                        {
                        OutlinedButton(onClick = { onDelete(patientId, recommendation.text("id")) }) {
                            Text("Delete")
                        }
                        }
                    } else null,
                )
            }
        }
    }
}

@Composable
private fun ClinicalDocumentPreviewDialog(
    document: JSONObject,
    bytes: ByteArray?,
    loading: Boolean,
    error: String,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val mimeType = document.text("mimeType").lowercase()
    val bitmap = remember(bytes, mimeType) {
        when {
            bytes == null -> null
            mimeType.startsWith("image/") -> BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            mimeType == "application/pdf" -> renderPdfFirstPage(context, bytes)
            else -> null
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            color = Color.White,
            shape = RoundedCornerShape(28.dp),
            shadowElevation = 18.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            document.text("name", fallback = "Clinical document"),
                            color = OpwInk,
                            fontWeight = FontWeight.ExtraBold,
                            style = MaterialTheme.typography.titleMedium,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            when {
                                mimeType.startsWith("image/") -> "Image preview"
                                mimeType == "application/pdf" -> "PDF preview"
                                else -> "Document preview"
                            },
                            color = Color(0xFF64748B),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    ModuleIconButton(color = Color(0xFFE2E8F0), onClick = onDismiss) {
                        CloseGlyph(Color(0xFF64748B))
                    }
                }

                when {
                    loading -> {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color = OpwBlue,
                            trackColor = Color(0xFFE0F2FE),
                        )
                    }

                    error.isNotBlank() -> StatusBanner(message = error, tone = BannerTone.Error)

                    bitmap != null -> {
                        Image(
                            bitmap = bitmap,
                            contentDescription = document.text("name", fallback = "Clinical document"),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(420.dp)
                                .background(Color(0xFFF8FAFC), RoundedCornerShape(20.dp)),
                            contentScale = ContentScale.Fit,
                        )
                    }

                    bytes != null -> {
                        Surface(
                            color = Color(0xFFEFFBFF),
                            shape = RoundedCornerShape(22.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBAE6FD)),
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text("Document loaded inside OPW Staff", color = OpwInk, fontWeight = FontWeight.ExtraBold)
                                Text(
                                    "${formatBytes(bytes.size.toLong())} • ${document.text("mimeType", fallback = "file")}",
                                    color = Color(0xFF64748B),
                                    textAlign = TextAlign.Center,
                                )
                                Text(
                                    "This file is protected and is not opened in an external browser or app.",
                                    color = OpwBlue,
                                    textAlign = TextAlign.Center,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                    }

                    else -> InlineEmpty("Preparing preview...")
                }
            }
        }
    }
}

@Composable
private fun TreatmentPlanDialog(
    plan: JSONObject?,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
) {
    var treatmentLocation by rememberSaveable(plan?.text("id").orEmpty()) {
        mutableStateOf(plan?.text("treatmentLocation", "serviceLocation", fallback = "clinic").orEmpty().ifBlank { "clinic" })
    }
    var error by rememberSaveable { mutableStateOf("") }

    fun resetFields() {
        treatmentLocation = plan?.text("treatmentLocation", "serviceLocation", fallback = "clinic").orEmpty().ifBlank { "clinic" }
        error = ""
    }

    fun submit() {
        onSave(
            plan?.text("id")?.takeIf { it.isNotBlank() },
            JSONObject().put("treatmentLocation", treatmentLocation.trim().ifBlank { "clinic" }),
        )
    }

    OpwBottomSheetDialog(
        title = if (plan == null) "Session Start" else "Edit Session",
        primaryLabel = if (plan == null) "Start Session" else "Save Session",
        onDismiss = onDismiss,
        onPrimary = ::submit,
        onReset = ::resetFields,
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        Text("Treatment Mode", fontWeight = FontWeight.Bold, color = OpwInk)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf("clinic" to "Clinic", "home" to "Home Visit").forEach { (mode, label) ->
                val selected = treatmentLocation == mode
                if (selected) {
                    Button(
                        onClick = {
                            treatmentLocation = mode
                            error = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D8A82)),
                    ) {
                        Text(label)
                    }
                } else {
                    OutlinedButton(
                        onClick = {
                            treatmentLocation = mode
                            error = ""
                        },
                    ) {
                        Text(label)
                    }
                }
            }
        }
    }
}

@Composable
private fun ClinicalNoteDialog(
    note: JSONObject?,
    clinicalNotes: List<JSONObject>,
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit,
) {
    val noteKey = note?.text("id").orEmpty()
    fun existingNoteForType(type: String): JSONObject? =
        clinicalNotes.firstOrNull { it.text("title").equals(type, ignoreCase = true) }

    var title by rememberSaveable(noteKey) {
        mutableStateOf(note?.text("title").orEmpty().ifBlank {
            clinicalNotes.firstOrNull()?.text("title").orEmpty().ifBlank { ClinicalNoteTypes.first() }
        })
    }
    var noteText by rememberSaveable(noteKey) {
        mutableStateOf(note?.text("note").orEmpty().ifBlank { existingNoteForType(title)?.text("note").orEmpty() })
    }
    var error by rememberSaveable { mutableStateOf("") }

    OpwBottomSheetDialog(
        title = if (note == null) "Clinical Note" else "Edit Clinical Note",
        primaryLabel = if (note == null) "Save Note" else "Update Note",
        onDismiss = onDismiss,
        onPrimary = {
            if (noteText.isBlank()) {
                error = "Add note details."
            } else {
                onSave(title.trim(), noteText.trim())
            }
        },
        onReset = {
            title = note?.text("title").orEmpty().ifBlank { ClinicalNoteTypes.first() }
            noteText = note?.text("note").orEmpty().ifBlank { existingNoteForType(title)?.text("note").orEmpty() }
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        Text("Note Type", fontWeight = FontWeight.Bold, color = OpwInk)
        ChoiceChipRow(
            options = ClinicalNoteTypes,
            selected = title,
            onSelected = {
                title = it
                if (note == null) {
                    noteText = existingNoteForType(it)?.text("note").orEmpty()
                }
                error = ""
            },
        )
        SheetPatientField(
            label = "Note",
            value = noteText,
            onValueChange = {
                noteText = it
                error = ""
            },
            minLines = 5,
        )
    }
}

@Composable
private fun TherapyRecommendationDialog(
    services: List<JSONObject>,
    therapyResources: List<JSONObject>,
    onDismiss: () -> Unit,
    onSave: (String, String, List<String>) -> Unit,
) {
    var serviceId by rememberSaveable { mutableStateOf(services.firstOrNull()?.text("id").orEmpty()) }
    var note by rememberSaveable { mutableStateOf("") }
    var itemIds by rememberSaveable { mutableStateOf(listOf<String>()) }
    var error by rememberSaveable { mutableStateOf("") }
    val availableResources = therapyResources.filter { it.text("serviceId") == serviceId }

    OpwBottomSheetDialog(
        title = "Recommended Therapy",
        primaryLabel = "Save Therapy",
        onDismiss = onDismiss,
        onPrimary = {
            when {
                serviceId.isBlank() -> error = "Please choose a service."
                itemIds.isEmpty() -> error = "Please choose at least one therapy item."
                else -> onSave(serviceId, note.trim(), itemIds)
            }
        },
        onReset = {
            serviceId = services.firstOrNull()?.text("id").orEmpty()
            note = ""
            itemIds = emptyList()
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SectionTitle("Service")
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            services.forEach { service ->
                FilterChip(
                    selected = service.text("id") == serviceId,
                    onClick = {
                        serviceId = service.text("id")
                        itemIds = emptyList()
                        error = ""
                    },
                    label = { Text(service.text("name", fallback = "Service")) },
                )
            }
        }
        SheetPatientField(
            label = "Recommendation Note",
            value = note,
            onValueChange = { note = it },
            minLines = 3,
        )
        SectionTitle("Therapy Items")
        if (availableResources.isEmpty()) {
            InlineEmpty("No therapy items available for this service.")
        } else {
            availableResources.forEach { resource ->
                val id = resource.text("id")
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = if (itemIds.contains(id)) Color(0xFFE0F2FE) else Color(0xFFF8FAFC),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (itemIds.contains(id)) OpwBlue.copy(alpha = 0.32f) else OpwBorder,
                    ),
                    onClick = {
                        itemIds = if (itemIds.contains(id)) {
                            itemIds.filterNot { it == id }
                        } else {
                            itemIds + id
                        }
                        error = ""
                    },
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                resource.text("title", "fileName", fallback = "Therapy item"),
                                fontWeight = FontWeight.ExtraBold,
                                color = OpwInk,
                            )
                            Text(
                                resource.text("resourceType", fallback = "File"),
                                color = Color(0xFF64748B),
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        StatusChip(
                            label = if (itemIds.contains(id)) "Selected" else "Add",
                            background = Color.White,
                            foreground = if (itemIds.contains(id)) OpwBlue else Color(0xFF64748B),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AddPatientAppointmentDialog(
    services: List<JSONObject>,
    onDismiss: () -> Unit,
    onSave: (String, String, String) -> Unit,
) {
    var date by rememberSaveable { mutableStateOf(todayDateKey()) }
    var time by rememberSaveable { mutableStateOf("") }
    var service by rememberSaveable { mutableStateOf(services.firstOrNull()?.text("name").orEmpty()) }
    var error by rememberSaveable { mutableStateOf("") }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    var showTimePicker by rememberSaveable { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    fun resetFields() {
        date = todayDateKey()
        time = ""
        service = services.firstOrNull()?.text("name").orEmpty()
        error = ""
    }

    fun submit() {
        when {
            date.isBlank() -> error = "Date is required."
            date < todayDateKey() -> error = "Appointment date cannot be in the past."
            service.isBlank() -> error = "Service is required."
            else -> onSave(date.trim(), time.trim(), service.trim())
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x660F172A))
                .pointerInput(focusManager) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Final)
                            if (event.type == PointerEventType.Release && event.changes.none { it.isConsumed }) {
                                focusManager.clearFocus()
                            }
                        }
                    }
                },
            contentAlignment = Alignment.BottomCenter,
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp),
                color = Color.White,
                shadowElevation = 18.dp,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.White, Color(0xFFF8FBFF)),
                            ),
                        )
                        .padding(horizontal = 22.dp, vertical = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(width = 42.dp, height = 4.dp)
                                .background(Color(0xFFD1D5DB), RoundedCornerShape(999.dp)),
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color.Transparent,
                            onClick = onDismiss,
                        ) {
                            Box(
                                modifier = Modifier.size(42.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                CloseGlyph(color = Color(0xFF94A3B8))
                            }
                        }
                        Text(
                            text = "Add Appointment",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = OpwInk,
                        )
                        TextButton(onClick = ::resetFields) {
                            Text(
                                text = "Reset",
                                color = Color(0xFF2D8A82),
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }

                    if (error.isNotBlank()) {
                        StatusBanner(message = error, tone = BannerTone.Error)
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        SheetPickerField(
                            label = "Date",
                            value = appointmentDateLabel(date),
                            placeholder = "Select appointment date",
                            onClick = { showDatePicker = true },
                        )
                        SheetPickerField(
                            label = "Time",
                            value = appointmentTimeLabel(time),
                            placeholder = "Select appointment time",
                            onClick = { showTimePicker = true },
                        )
                        SheetPatientField(
                            label = "Service",
                            value = service,
                            onValueChange = {
                                service = it
                                error = ""
                            },
                        )
                    }

                    if (services.isNotEmpty()) {
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            services.forEach { item ->
                                val name = item.text("name", fallback = "Service")
                                FilterChip(
                                    selected = service == name,
                                    onClick = {
                                        service = name
                                        error = ""
                                    },
                                    label = { Text(name) },
                                )
                            }
                        }
                    }

                    Button(
                        onClick = ::submit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(
                            text = "Save Appointment",
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                }
            }
        }
    }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = date,
            onDismiss = { showDatePicker = false },
            onDateSelected = { selectedDate ->
                date = selectedDate
                error = ""
                showDatePicker = false
            },
        )
    }

    if (showTimePicker) {
        AppointmentTimePickerDialog(
            selectedTime = time,
            onDismiss = { showTimePicker = false },
            onTimeSelected = { selectedTime ->
                time = selectedTime
                showTimePicker = false
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppointmentDatePickerDialog(
    selectedDate: String,
    onDismiss: () -> Unit,
    onDateSelected: (String) -> Unit,
) {
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = appointmentDatePickerMillis(selectedDate) ?: appointmentDatePickerMillis(todayDateKey()),
    )

    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        onDateSelected(appointmentDateKeyFromMillis(millis))
                    } ?: onDismiss()
                },
            ) {
                Text("Select")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        shape = RoundedCornerShape(28.dp),
        tonalElevation = 8.dp,
    ) {
        DatePicker(
            state = datePickerState,
            showModeToggle = false,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppointmentTimePickerDialog(
    selectedTime: String,
    onDismiss: () -> Unit,
    onTimeSelected: (String) -> Unit,
) {
    val initialTime = remember(selectedTime) { appointmentTimeParts(selectedTime) }
    val timePickerState = rememberTimePickerState(
        initialHour = initialTime.first,
        initialMinute = initialTime.second,
        is24Hour = false,
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { SectionTitle("Select Time") },
        text = {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center,
            ) {
                TimePicker(state = timePickerState)
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onTimeSelected(appointmentTimeKey(timePickerState.hour, timePickerState.minute))
                },
            ) {
                Text("Select")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        containerColor = OpwCard,
        shape = RoundedCornerShape(28.dp),
    )
}

@Composable
private fun SectionCard(
    title: String,
    actionLabel: String? = null,
    actionEnabled: Boolean = true,
    onAction: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(30.dp),
                ambientColor = OpwBlue.copy(alpha = 0.12f),
                spotColor = OpwSky.copy(alpha = 0.16f),
            )
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF8FBFF))))
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SectionTitle(title)
                if (actionLabel != null && onAction != null) {
                    OutlinedButton(onClick = onAction, enabled = actionEnabled) {
                        Text(actionLabel)
                    }
                }
            }
            content()
        }
    }
}

@Composable
private fun InlineEmpty(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFFF8FAFC),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            color = Color(0xFF64748B),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun SimpleScreenHeader(
    title: String,
    onBack: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BackCircleButton(onClick = onBack)
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold,
            color = OpwInk,
        )
    }
}

@Composable
private fun EmptyStateWithBack(
    title: String,
    message: String,
    onBack: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SimpleScreenHeader(title = title, onBack = onBack)
        EmptyStateCard(title = title, message = message)
    }
}

@Composable
private fun ConfirmDeleteDialog(
    title: String,
    message: String,
    confirmLabel: String = "Delete",
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { SectionTitle(title) },
        text = {
            Text(text = message, color = Color(0xFF475569))
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text(confirmLabel)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        containerColor = OpwCard,
        shape = RoundedCornerShape(28.dp),
    )
}


@Composable
private fun AppointmentsTab(
    appointments: List<JSONObject>,
    onApprove: (JSONObject) -> Unit,
    onStatusChange: (JSONObject, String) -> Unit,
    canEdit: Boolean,
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
            actions = if (canEdit) {
                {
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
                }
            } else null,
        )
    }
}

@Composable
private fun TreatmentTab(
    tracker: JSONObject?,
    users: List<StaffUser>,
    onAppointmentRequestDecision: (String, JSONObject, String, String, String, String) -> Unit,
    onAppointmentStatusChange: (JSONObject, String) -> Unit,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
    canEdit: Boolean,
) {
    if (tracker == null) {
        EmptyStateCard(
            title = "Treatment tracker unavailable",
            message = "Refresh after login to load appointments, sessions, and follow-up records.",
        )
        return
    }

    val todaysSessions = tracker.array("todaysSessions").toJsonObjects()
    val todaysAppointments = tracker.array("todaysAppointments").toJsonObjects()
    val appointmentRequests = tracker.array("appointmentRequests").toJsonObjects()
    val upcomingAppointments = tracker.array("upcomingAppointments").toJsonObjects()
    val followUps = tracker.array("followUpNeeded").toJsonObjects()
    val activeSessions = tracker.array("activeSessions").toJsonObjects()
    val activeStaff = users.filter { it.role != "Admin" && it.status != "Inactive" }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        TreatmentTrackerSection(
            title = "Session List",
            subtitle = "Active treatment patients still pending today's session entry.",
            countLabel = "${activeSessions.size} patients",
        ) {
            if (activeSessions.isEmpty()) {
                InlineEmpty("No active treatment sessions are pending for today.")
            } else {
                activeSessions.forEach { patient ->
                    val plan = patient.objectValue("activeTreatmentPlan")
                    TreatmentTrackerActiveSessionCard(
                        patient = patient,
                        plan = plan,
                        staffOptions = activeStaff,
                        canEdit = canEdit,
                        onTreatmentSessionEntryAdd = onTreatmentSessionEntryAdd,
                    )
                }
            }
        }

        TreatmentTrackerSection(
            title = "Today's Session History",
            subtitle = "Completed treatment entries added by staff today.",
            countLabel = "${todaysSessions.size} done",
        ) {
            if (todaysSessions.isEmpty()) {
                InlineEmpty("No completed treatment sessions added today.")
            } else {
                todaysSessions.forEach { session ->
                    val doneBy = session.text("doneByStaffName").ifBlank { "staff" }
                    val treatmentText = session.text("treatmentType").ifBlank {
                        session.text("treatmentTypes", "service", fallback = "Treatment done")
                    }
                    RecordCard(
                        title = session.text("patientName", fallback = "Patient"),
                        subtitle = "Session done by $doneBy",
                        status = "Done",
                        statusColor = OpwSuccess,
                        rows = listOf(
                            "Treatment" to treatmentText,
                        ),
                    )
                }
            }
        }

        TreatmentTrackerSection(
            title = "Today's Appointments",
            subtitle = "Mark today's confirmed appointments as done or cancelled.",
            countLabel = "${todaysAppointments.size} today",
        ) {
            if (todaysAppointments.isEmpty()) {
                InlineEmpty("No appointments scheduled for today.")
            } else {
                todaysAppointments.forEach { appointment ->
                    val status = appointment.text("status", fallback = "approved")
                    RecordCard(
                        title = appointment.text("name", fallback = "Appointment"),
                        subtitle = appointment.text("service", fallback = "Service"),
                        status = appointmentStatusLabel(status),
                        statusColor = statusColor(status),
                        rows = listOf(
                            "Phone" to appointment.text("phone", fallback = "Not provided"),
                            "Schedule" to scheduleLabel(
                                appointment.text("confirmedDate", "requestedDate"),
                                appointment.text("confirmedTime", "requestedTime"),
                            ),
                        ),
                        actions = if (canEdit) {
                            {
                                Row(
                                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    if (status != "completed") {
                                        OutlinedButton(onClick = { onAppointmentStatusChange(appointment, "completed") }) {
                                            Text("Done")
                                        }
                                    }
                                    if (status != "cancelled") {
                                        OutlinedButton(onClick = { onAppointmentStatusChange(appointment, "cancelled") }) {
                                            Text("Cancel")
                                        }
                                    }
                                }
                            }
                        } else null,
                    )
                }
            }
        }

        TreatmentTrackerSection(
            title = "Appointment Requests",
            subtitle = "Patient appointment requests now live in Treatment Tracker.",
            countLabel = "${appointmentRequests.size} requests",
        ) {
            if (appointmentRequests.isEmpty()) {
                InlineEmpty("No appointment requests found.")
            } else {
                appointmentRequests.forEach { request ->
                    TreatmentTrackerAppointmentRequestCard(
                        request = request,
                        onDecision = onAppointmentRequestDecision,
                        onCancel = if (canEdit) { { onAppointmentStatusChange(request, "cancelled") } } else null,
                        canEdit = canEdit,
                    )
                }
            }
        }

        TreatmentTrackerSection(
            title = "Upcoming Appointment List",
            subtitle = "Patients who already have future appointments scheduled.",
            countLabel = "${upcomingAppointments.size} patients",
        ) {
            if (upcomingAppointments.isEmpty()) {
                InlineEmpty("No upcoming appointments found.")
            } else {
                upcomingAppointments.forEach { patient ->
                    val next = patient.objectValue("nextAppointment")
                    TreatmentTrackerPatientCard(
                        patient = patient,
                        statusLabel = "Upcoming",
                        statusColor = OpwBlue,
                        subtitle = scheduleLabel(next?.text("date").orEmpty(), next?.text("time").orEmpty()),
                        rows = listOf(
                            "Mobile" to patient.text("mobile", fallback = "Not provided"),
                            "Service" to (next?.text("service", fallback = "Not set") ?: "Not set"),
                        ),
                    )
                }
            }
        }

        TreatmentTrackerSection(
            title = "Treatment Completed Follow-up",
            subtitle = "Patients whose last completed session is older than 7 days.",
            countLabel = "${followUps.size} patients",
        ) {
            if (followUps.isEmpty()) {
                InlineEmpty("No follow-up cases are pending right now.")
            } else {
                followUps.forEach { patient ->
                    val latestSession = patient.objectValue("latestSession")
                    TreatmentTrackerPatientCard(
                        patient = patient,
                        statusLabel = "Follow-up",
                        statusColor = OpwWarning,
                        subtitle = latestSession?.text("date", fallback = "No session date") ?: "No session date",
                        rows = listOf(
                            "Mobile" to patient.text("mobile", fallback = "Not provided"),
                            "Days Since" to patient.optInt("daysSinceLastSession", 0).toString(),
                        ),
                    )
                }
            }
        }
    }
}

@Composable
private fun TreatmentTrackerAppointmentRequestCard(
    request: JSONObject,
    onDecision: (String, JSONObject, String, String, String, String) -> Unit,
    onCancel: (() -> Unit)?,
    canEdit: Boolean,
) {
    val status = request.text("status", fallback = "pending").trim().lowercase()
    val patientId = request.text("patientId")
    var decisionAction by rememberSaveable(request.text("id")) { mutableStateOf("") }

    if (decisionAction.isNotBlank()) {
        AppointmentRequestDecisionDialog(
            patientId = patientId,
            request = request,
            action = decisionAction,
            onDismiss = { decisionAction = "" },
            onDecision = { id, item, action, date, time, note ->
                onDecision(id, item, action, date, time, note)
                decisionAction = ""
            },
        )
    }

    RecordCard(
        title = request.text("name", fallback = "Patient"),
        subtitle = request.text("service", fallback = "Appointment"),
        status = appointmentStatusLabel(status),
        statusColor = statusColor(status),
        rows = listOf(
            "Phone" to request.text("phone", fallback = "Not provided"),
            "Requested" to scheduleLabel(request.text("requestedDate"), request.text("requestedTime")),
            "Location" to formatServiceLocation(request.text("serviceLocation")),
            "Message" to request.text("message", fallback = "No message"),
        ),
        actions = if (canEdit) {
            {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (status !in listOf("approved", "completed", "cancelled")) {
                        Button(onClick = { decisionAction = "approve" }) {
                            Text("Approve")
                        }
                        OutlinedButton(onClick = { decisionAction = "reschedule" }) {
                            Text("Reschedule")
                        }
                    }
                    if (status != "cancelled" && onCancel != null) {
                        OutlinedButton(onClick = onCancel) {
                            Text("Cancel")
                        }
                    }
                }
            }
        } else null,
    )
}

@Composable
private fun TreatmentTrackerSection(
    title: String,
    subtitle: String,
    countLabel: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    SectionCard(title = title) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Text(
                text = subtitle,
                modifier = Modifier.weight(1f),
                color = Color(0xFF64748B),
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(modifier = Modifier.size(10.dp))
            StatusChip(countLabel, Color(0xFFF1F5F9), Color(0xFF475569))
        }
        content()
    }
}

@Composable
private fun TreatmentTrackerPatientCard(
    patient: JSONObject,
    statusLabel: String,
    statusColor: Color,
    subtitle: String,
    rows: List<Pair<String, String>>,
) {
    RecordCard(
        title = patient.text("patientName", "name", fallback = "Patient"),
        subtitle = subtitle.ifBlank { patient.text("mobile", "email", fallback = "No contact") },
        status = statusLabel,
        statusColor = statusColor,
        rows = rows,
    )
}

@Composable
private fun TreatmentTrackerActiveSessionCard(
    patient: JSONObject,
    plan: JSONObject?,
    staffOptions: List<StaffUser>,
    canEdit: Boolean,
    onTreatmentSessionEntryAdd: (String, String, String, String, String) -> Unit,
) {
    val patientId = patient.text("id")
    val planId = plan?.text("id").orEmpty()
    val sessionDays = sortedTreatmentSessionDays(plan)
    val treatmentSuggestions = treatmentDetailSuggestions(sessionDays)
    var entryDate by rememberSaveable(patientId, planId) { mutableStateOf(todayDateKey()) }
    var treatmentDone by rememberSaveable(patientId, planId) { mutableStateOf("") }
    var doneByStaffId by rememberSaveable(patientId, planId) { mutableStateOf("") }
    var showEntryDatePicker by rememberSaveable(patientId, planId) { mutableStateOf(false) }
    var showStaffMenu by rememberSaveable(patientId, planId) { mutableStateOf(false) }
    val selectedStaffName = staffOptions.firstOrNull { it.id == doneByStaffId }?.name.orEmpty()

    if (showEntryDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = entryDate.ifBlank { todayDateKey() },
            onDismiss = { showEntryDatePicker = false },
            onDateSelected = {
                entryDate = it
                showEntryDatePicker = false
            },
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = patient.text("patientName", "name", fallback = "Patient"),
                color = OpwInk,
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                text = "${sessionDays.size} treatment day${if (sessionDays.size == 1) "" else "s"}",
                color = Color(0xFF2D8A82),
                fontWeight = FontWeight.Bold,
            )
            if (canEdit && planId.isNotBlank()) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CompactPickerPill(
                        value = appointmentDateLabel(entryDate),
                        placeholder = "Pick date",
                        icon = "📅",
                        modifier = Modifier.weight(1f),
                        onClick = { showEntryDatePicker = true },
                    )
                    Box(modifier = Modifier.weight(1f)) {
                        CompactPickerPill(
                            value = selectedStaffName,
                            placeholder = "Done by staff",
                            icon = "⌄",
                            onClick = { showStaffMenu = true },
                        )
                        DropdownMenu(
                            expanded = showStaffMenu,
                            onDismissRequest = { showStaffMenu = false },
                        ) {
                            staffOptions.forEach { staff ->
                                DropdownMenuItem(
                                    text = { Text(staff.name.ifBlank { staff.email }) },
                                    onClick = {
                                        doneByStaffId = staff.id
                                        showStaffMenu = false
                                    },
                                )
                            }
                        }
                    }
                }
                OutlinedTextField(
                    value = treatmentDone,
                    onValueChange = { treatmentDone = it },
                    placeholder = { Text("Treatment details") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                TreatmentDetailSuggestions(
                    suggestions = treatmentSuggestions,
                    query = treatmentDone,
                    onSelected = { treatmentDone = it },
                )
                Button(
                    onClick = {
                        onTreatmentSessionEntryAdd(
                            patientId,
                            planId,
                            entryDate,
                            treatmentDone,
                            doneByStaffId,
                        )
                        entryDate = todayDateKey()
                        treatmentDone = ""
                        doneByStaffId = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = treatmentDone.isNotBlank() && doneByStaffId.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D8A82)),
                ) {
                    Text("Add Treatment Done")
                }
            }
        }
    }
}

@Composable
private fun MailboxTab(
    items: List<JSONObject>,
    applications: List<StaffApplication>,
    onReadChange: (JSONObject) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedKey by rememberSaveable { mutableStateOf("") }
    var deleteKey by rememberSaveable { mutableStateOf("") }
    val filteredItems = remember(items, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            items
        } else {
            items.filter { item ->
                listOf("title", "senderName", "senderEmail", "senderPhone", "subject", "summary", "message", "type")
                    .any { field -> item.text(field).lowercase().contains(keyword) }
            }
        }
    }
    val filteredApplications = remember(applications, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            applications
        } else {
            applications.filter { application ->
                application.name.lowercase().contains(keyword) ||
                    application.email.lowercase().contains(keyword) ||
                    application.phone.lowercase().contains(keyword) ||
                    application.role.lowercase().contains(keyword) ||
                    application.experience.lowercase().contains(keyword) ||
                    application.message.lowercase().contains(keyword)
            }
        }
    }
    val selectedItem = items.firstOrNull { mailboxKey(it) == selectedKey }
    val deleteCandidate = items.firstOrNull { mailboxKey(it) == deleteKey }

    if (selectedItem != null) {
        MailboxDetailDialog(
            item = selectedItem,
            onDismiss = { selectedKey = "" },
            onReadChange = if (canEdit) { { onReadChange(selectedItem) } } else null,
            onDelete = if (canEdit) { { deleteKey = mailboxKey(selectedItem) } } else null,
        )
    }

    if (deleteCandidate != null) {
        ConfirmDeleteDialog(
            title = "Delete Mail",
            message = "Delete ${deleteCandidate.text("subject", fallback = "this mail")}? This cannot be undone.",
            onDismiss = { deleteKey = "" },
            onConfirm = {
                onDelete(deleteCandidate)
                if (selectedKey == deleteKey) {
                    selectedKey = ""
                }
                deleteKey = ""
            },
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search inbox",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (items.isEmpty()) {
            InboxTab(applications = filteredApplications)
        } else if (filteredItems.isEmpty()) {
            EmptyStateCard(
                title = "No messages",
                message = "Career and contact messages will appear here.",
            )
        } else {
            filteredItems.forEach { item ->
                MailboxInboxCard(
                    item = item,
                    onOpen = { selectedKey = mailboxKey(item) },
                    onReadChange = if (canEdit) { { onReadChange(item) } } else null,
                    onDelete = if (canEdit) { { deleteKey = mailboxKey(item) } } else null,
                )
            }
        }
    }
}

@Composable
private fun MailboxInboxCard(
    item: JSONObject,
    onOpen: () -> Unit,
    onReadChange: (() -> Unit)?,
    onDelete: (() -> Unit)?,
) {
    val isRead = item.optBoolean("isRead")
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, if (isRead) Color(0xFFE5EDF7) else Color(0xFFBFDBFE), RoundedCornerShape(24.dp))
            .clickable(onClick = onOpen),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isRead) 1.dp else 4.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(if (isRead) Color(0xFFF1F5F9) else Color(0xFFDBEAFE), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = item.text("senderName", fallback = "M").take(1).uppercase(),
                    color = if (isRead) Color(0xFF64748B) else OpwBlue,
                    fontWeight = FontWeight.ExtraBold,
                )
                if (!isRead) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(10.dp)
                            .background(OpwDanger, CircleShape),
                    )
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = item.text("senderName", fallback = "Unknown sender"),
                        color = OpwInk,
                        fontWeight = if (isRead) FontWeight.SemiBold else FontWeight.ExtraBold,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = formatTimestamp(item.text("createdAt")).substringBefore(","),
                        color = Color(0xFF94A3B8),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Text(
                    text = item.text("subject", fallback = item.text("title", fallback = "Message")),
                    color = OpwInk,
                    fontWeight = if (isRead) FontWeight.SemiBold else FontWeight.ExtraBold,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Text(
                    text = item.text("summary", "message", fallback = "No preview available"),
                    color = Color(0xFF64748B),
                    maxLines = 2,
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StatusChip(
                        label = if (item.text("type") == "career") "Career" else "Contact",
                        background = if (item.text("type") == "career") Color(0xFFFFEDD5) else Color(0xFFE0F2FE),
                        foreground = if (item.text("type") == "career") OpwWarning else OpwBlue,
                    )
                    if (onReadChange != null) {
                        TextButton(onClick = onReadChange) {
                            Text(if (isRead) "Unread" else "Read")
                        }
                    }
                    if (onDelete != null) {
                        TextButton(onClick = onDelete) {
                            Text("Delete", color = OpwDanger)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MailboxDetailDialog(
    item: JSONObject,
    onDismiss: () -> Unit,
    onReadChange: (() -> Unit)?,
    onDelete: (() -> Unit)?,
) {
    OpwBottomSheetDialog(
        title = item.text("subject", fallback = "Message"),
        primaryLabel = if (onReadChange != null) {
            if (item.optBoolean("isRead")) "Mark Unread" else "Mark Read"
        } else {
            "Close"
        },
        onDismiss = onDismiss,
        onPrimary = onReadChange ?: onDismiss,
    ) {
        DetailRow("From", item.text("senderName", fallback = "Unknown"))
        DetailRow("Email", item.text("senderEmail", fallback = "Not provided"))
        DetailRow("Phone", item.text("senderPhone", fallback = "Not provided"))
        if (item.text("role").isNotBlank()) {
            DetailRow("Role", item.text("role"))
        }
        if (item.text("experience").isNotBlank()) {
            DetailRow("Experience", item.text("experience"))
        }
        DetailRow("Received", formatTimestamp(item.text("createdAt")))
        DividerLine()
        Text(
            text = item.text("summary", "message", fallback = "No message provided."),
            color = OpwInk,
            style = MaterialTheme.typography.bodyLarge,
        )
        if (item.optBoolean("hasAttachment")) {
            StatusBanner(
                message = "Attachment: ${item.text("attachmentName", fallback = "File available from web admin")}",
                tone = BannerTone.Info,
            )
        }
        if (onDelete != null) {
            OutlinedButton(
                onClick = onDelete,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Delete Mail", color = OpwDanger)
            }
        }
    }
}

private fun mailboxKey(item: JSONObject): String =
    "${item.text("type")}:${item.text("id")}"

@Composable
private fun NotificationsTab(
    items: List<JSONObject>,
    patients: List<JSONObject>,
    onSend: (String, String, String, List<String>) -> Unit,
    onDelete: (List<String>) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showDialog by rememberSaveable { mutableStateOf(false) }
    var statusFilter by rememberSaveable { mutableStateOf("all") }
    var sortMode by rememberSaveable { mutableStateOf("Unread first") }
    val readCount = remember(items) { items.count { it.text("readAt").isNotBlank() } }
    val unreadCount = remember(items, readCount) { (items.size - readCount).coerceAtLeast(0) }
    val filteredItems = remember(items, query, statusFilter, sortMode) {
        val keyword = query.trim().lowercase()
        val filtered = items.filter { item ->
            val read = item.text("readAt").isNotBlank()
            val statusMatches = statusFilter == "all" ||
                (statusFilter == "read" && read) ||
                (statusFilter == "unread" && !read)
            val queryMatches = if (keyword.isBlank()) {
                true
            } else {
                listOf("title", "body", "category", "patientName", "createdByLabel")
                    .any { field -> item.text(field).lowercase().contains(keyword) }
            }
            statusMatches && queryMatches
        }
        when (sortMode) {
            "Read first" -> filtered.sortedWith(
                compareByDescending<JSONObject> { it.text("readAt").isNotBlank() }
                    .thenByDescending { it.text("scheduledFor", "createdAt") },
            )
            "Newest first" -> filtered.sortedByDescending { it.text("scheduledFor", "createdAt") }
            else -> filtered.sortedWith(
                compareBy<JSONObject> { it.text("readAt").isNotBlank() }
                    .thenByDescending { it.text("scheduledFor", "createdAt") },
            )
        }
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            showDialog = true
        }
    }

    if (showDialog) {
        CustomNotificationDialog(
            patients = patients,
            onDismiss = { showDialog = false },
            onSend = { title, body, audience, patientIds ->
                onSend(title, body, audience, patientIds)
                showDialog = false
            },
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search notifications",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            SummaryMiniCard(label = "Total", value = items.size.toString(), modifier = Modifier.weight(1f))
            SummaryMiniCard(label = "Read", value = readCount.toString(), modifier = Modifier.weight(1f))
            SummaryMiniCard(label = "Unread", value = unreadCount.toString(), modifier = Modifier.weight(1f))
        }

        ChoiceChipRow(
            options = listOf("all", "unread", "read"),
            selected = statusFilter,
            onSelected = { statusFilter = it },
        )
        ChoiceChipRow(
            options = listOf("Unread first", "Read first", "Newest first"),
            selected = sortMode,
            onSelected = { sortMode = it },
        )

        if (filteredItems.isEmpty()) {
            EmptyStateCard(
                title = "No notifications",
                message = "Use the plus button to send offers, festive wishes, or care updates.",
            )
        } else {
            filteredItems.forEach { item ->
                val read = item.text("readAt").isNotBlank()
                val id = item.text("id")
                val accent = if (read) Color(0xFF64748B) else moduleAccent(AdminTab.Notifications)
                SwipeDeleteModuleCard(
                    title = item.text("title", fallback = "Notification"),
                    subtitle = listOf(
                        if (read) "Read" else "Unread",
                        item.text("patientName", fallback = item.text("audienceLabel", fallback = "Patient update")),
                        formatTimestamp(item.text("scheduledFor", fallback = item.text("createdAt"))),
                    ).filter { it.isNotBlank() }.joinToString(" | "),
                    accent = accent,
                    deleteTitle = "Delete Notification",
                    deleteMessage = "Delete ${item.text("title", fallback = "this notification")}? This cannot be undone.",
                    onClick = {},
                    onDelete = {
                        if (id.isNotBlank()) {
                            onDelete(listOf(id))
                        }
                    },
                    swipeEnabled = canEdit,
                    actions = {
                        StatusChip(
                            label = item.text("category", fallback = "custom"),
                            background = accent.copy(alpha = 0.1f),
                            foreground = accent,
                        )
                    },
                )
            }
        }
    }
}

@Composable
private fun SummaryMiniCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = label,
                color = Color(0xFF64748B),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = value,
                color = OpwInk,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
private fun CustomNotificationDialog(
    patients: List<JSONObject>,
    onDismiss: () -> Unit,
    onSend: (String, String, String, List<String>) -> Unit,
) {
    var title by rememberSaveable { mutableStateOf("") }
    var body by rememberSaveable { mutableStateOf("") }
    var audience by rememberSaveable { mutableStateOf("selected") }
    var selectedIds by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var patientQuery by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf("") }
    val filteredPatients = remember(patients, patientQuery) {
        val keyword = patientQuery.trim().lowercase()
        if (keyword.isBlank()) {
            patients.take(80)
        } else {
            patients.filter { patient ->
                listOf("name", "email", "mobile").any { field ->
                    patient.text(field).lowercase().contains(keyword)
                }
            }.take(80)
        }
    }

    OpwBottomSheetDialog(
        title = "Send Notification",
        primaryLabel = "Send Notification",
        onDismiss = onDismiss,
        onPrimary = {
            when {
                title.trim().isBlank() -> error = "Title is required."
                body.trim().isBlank() -> error = "Message is required."
                audience != "all" && selectedIds.isEmpty() -> error = "Choose at least one patient."
                else -> onSend(title.trim(), body.trim(), audience, selectedIds)
            }
        },
        onReset = {
            title = ""
            body = ""
            audience = "selected"
            selectedIds = emptyList()
            patientQuery = ""
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SheetPatientField("Title", title, { title = it; error = "" })
        SheetPatientField("Message", body, { body = it; error = "" }, minLines = 4)
        Text("Audience", fontWeight = FontWeight.Bold, color = OpwInk)
        ChoiceChipRow(
            options = listOf("selected", "all"),
            selected = audience,
            onSelected = {
                audience = it
                error = ""
            },
        )
        if (audience == "selected") {
            SheetPatientField("Search Patient", patientQuery, { patientQuery = it })
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                filteredPatients.forEach { patient ->
                    val id = patient.text("id")
                    val selected = id in selectedIds
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        color = if (selected) OpwBlue.copy(alpha = 0.1f) else Color(0xFFF8FAFC),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (selected) OpwBlue.copy(alpha = 0.35f) else OpwBorder,
                        ),
                        onClick = {
                            selectedIds = if (selected) {
                                selectedIds.filterNot { it == id }
                            } else {
                                selectedIds + id
                            }
                        },
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(patient.text("name", fallback = "Patient"), color = OpwInk, fontWeight = FontWeight.Bold)
                                Text(patient.text("mobile", fallback = patient.text("email")), color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
                            }
                            StatusChip(
                                label = if (selected) "Selected" else "Tap",
                                background = if (selected) OpwBlue.copy(alpha = 0.12f) else Color(0xFFF1F5F9),
                                foreground = if (selected) OpwBlue else Color(0xFF64748B),
                            )
                        }
                    }
                }
            }
        } else {
            StatusBanner(
                message = "This custom notification will be sent to all active patients.",
                tone = BannerTone.Info,
            )
        }
    }
}

@Composable
private fun ModuleActionHeader(
    title: String,
    searchOpen: Boolean,
    onSearchToggle: () -> Unit,
    onAdd: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold,
            color = OpwInk,
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SearchCircleButton(active = searchOpen, onClick = onSearchToggle)
            if (onAdd != null) {
                AddCircleButton(onClick = onAdd)
            }
        }
    }
}

@Composable
private fun ModuleSearchField(
    label: String,
    query: String,
    onQueryChange: (String) -> Unit,
    onClose: () -> Unit,
) {
    val shape = RoundedCornerShape(24.dp)
    val motion = rememberStaffFloatingCardMotion(delayMillis = 80)
    Surface(
        modifier = Modifier
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = shape,
                ambientColor = OpwBlue.copy(alpha = 0.12f),
                spotColor = OpwSky.copy(alpha = 0.18f),
            ),
        shape = shape,
        color = Color.White.copy(alpha = 0.97f),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
        shadowElevation = motion.elevation,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF8FBFF))))
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(label, color = OpwInk, fontWeight = FontWeight.ExtraBold)
                TextButton(onClick = onClose) {
                    Text("Clear")
                }
            }
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = { Text(label) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
        }
    }
}

@Composable
private fun ModuleIconButton(
    color: Color,
    onClick: () -> Unit,
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.24f)),
        shadowElevation = 1.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier.size(42.dp),
            contentAlignment = Alignment.Center,
        ) {
            content()
        }
    }
}

@Composable
private fun TrashGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        drawLine(color, Offset(7.dp.toPx(), 8.dp.toPx()), Offset(15.dp.toPx(), 8.dp.toPx()), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(9.dp.toPx(), 6.dp.toPx()), Offset(13.dp.toPx(), 6.dp.toPx()), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(8.dp.toPx(), 10.dp.toPx()), Offset(9.dp.toPx(), 18.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(14.dp.toPx(), 10.dp.toPx()), Offset(13.dp.toPx(), 18.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(10.dp.toPx(), 18.dp.toPx()), Offset(12.dp.toPx(), 18.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
private fun PermissionGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        val stroke = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawCircle(
            color = color,
            radius = 4.dp.toPx(),
            center = Offset(7.dp.toPx(), 9.dp.toPx()),
            style = stroke,
        )
        drawLine(color, Offset(11.dp.toPx(), 9.dp.toPx()), Offset(19.dp.toPx(), 9.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(16.dp.toPx(), 9.dp.toPx()), Offset(16.dp.toPx(), 12.5.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(19.dp.toPx(), 9.dp.toPx()), Offset(19.dp.toPx(), 12.5.dp.toPx()), strokeWidth = 2.2.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
private fun PowerGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        val stroke = Stroke(width = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(11.dp.toPx(), 3.5.dp.toPx()), Offset(11.dp.toPx(), 10.dp.toPx()), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawArc(
            color = color,
            startAngle = 135f,
            sweepAngle = 270f,
            useCenter = false,
            topLeft = Offset(5.dp.toPx(), 6.dp.toPx()),
            size = Size(12.dp.toPx(), 12.dp.toPx()),
            style = stroke,
        )
    }
}

@Composable
private fun SendGlyph(color: Color) {
    Canvas(modifier = Modifier.size(22.dp)) {
        drawLine(color, Offset(4.dp.toPx(), 5.dp.toPx()), Offset(19.dp.toPx(), 11.dp.toPx()), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(19.dp.toPx(), 11.dp.toPx()), Offset(4.dp.toPx(), 17.dp.toPx()), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(5.dp.toPx(), 6.dp.toPx()), Offset(9.dp.toPx(), 11.dp.toPx()), strokeWidth = 2.1.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(9.dp.toPx(), 11.dp.toPx()), Offset(5.dp.toPx(), 16.dp.toPx()), strokeWidth = 2.1.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
private fun ServicesTab(
    services: List<JSONObject>,
    onSave: (String?, String) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var editingServiceId by rememberSaveable { mutableStateOf("") }
    var showServiceDialog by rememberSaveable { mutableStateOf(false) }
    val editingService = services.firstOrNull { it.text("id") == editingServiceId }
    val filteredServices = remember(services, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            services
        } else {
            services.filter { it.text("name").lowercase().contains(keyword) }
        }
    }

    if (showServiceDialog) {
        ServiceFormDialog(
            service = editingService,
            onDismiss = {
                showServiceDialog = false
                editingServiceId = ""
            },
            onSave = { id, name ->
                onSave(id, name)
                showServiceDialog = false
                editingServiceId = ""
            },
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingServiceId = ""
            showServiceDialog = true
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search services",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (filteredServices.isEmpty()) {
            EmptyStateCard(
                title = "No services",
                message = "Clinic services managed on the web admin will appear here.",
            )
        } else {
            filteredServices.forEachIndexed { index, service ->
                ServiceListCard(
                    service = service,
                    delayMillis = (index * 80).coerceAtMost(320),
                    canEdit = canEdit,
                    onClick = {
                        editingServiceId = service.text("id")
                        showServiceDialog = true
                    },
                    onDelete = { onDelete(service) },
                )
            }
        }
    }
}

@Composable
private fun ServiceListCard(
    service: JSONObject,
    delayMillis: Int,
    canEdit: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit,
) {
    val title = service.text("name", fallback = "Service")
    val accent = OpwBlue
    val shape = RoundedCornerShape(24.dp)
    val motion = rememberStaffFloatingCardMotion(delayMillis = delayMillis)
    var dragOffset by remember { mutableStateOf(0f) }
    var confirmDelete by rememberSaveable(service.text("id")) { mutableStateOf(false) }
    val thresholdPx = with(LocalDensity.current) { 88.dp.toPx() }

    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = "Delete Service",
            message = "Delete $title? This cannot be undone.",
            onDismiss = { confirmDelete = false },
            onConfirm = {
                confirmDelete = false
                onDelete()
            },
        )
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        if (canEdit) {
            DecoratedSwipeReveal(
                modifier = Modifier.matchParentSize(),
                shape = shape,
                color = OpwDanger,
            ) { TrashGlyph(OpwDanger) }
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .offset(y = motion.lift)
                .offset { IntOffset(dragOffset.roundToInt(), 0) }
                .then(if (canEdit) Modifier.pointerInput(service.text("id"), thresholdPx) {
                    detectHorizontalDragGestures(
                        onDragCancel = { dragOffset = 0f },
                        onDragEnd = {
                            if (dragOffset <= -thresholdPx) {
                                confirmDelete = true
                            }
                            dragOffset = 0f
                        },
                        onHorizontalDrag = { change, dragAmount ->
                            val nextOffset = (dragOffset + dragAmount).coerceIn(-thresholdPx * 1.35f, 0f)
                            if (nextOffset != dragOffset) {
                                change.consume()
                            }
                            dragOffset = nextOffset
                        },
                    )
                } else Modifier)
                .shadow(
                    elevation = motion.elevation + 2.dp,
                    shape = shape,
                    ambientColor = OpwSky.copy(alpha = 0.18f),
                    spotColor = OpwBlue.copy(alpha = 0.2f),
                )
                .border(1.dp, Color(0xFFD8EAFB), shape)
                .then(if (canEdit) Modifier.clickable(onClick = onClick) else Modifier),
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
            elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color.White,
                                Color(0xFFF7FCFF),
                                Color(0xFFEFF8FF),
                            ),
                        ),
                    )
                    .padding(horizontal = 13.dp, vertical = 12.dp),
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 28.dp, y = (-32).dp)
                        .size(88.dp)
                        .background(OpwSky.copy(alpha = 0.13f), CircleShape),
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .offset(x = (-34).dp, y = 28.dp)
                        .size(68.dp)
                        .background(OpwAqua.copy(alpha = 0.1f), CircleShape),
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Color(0xFFEAF3FF),
                        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBlue.copy(alpha = 0.12f)),
                        shadowElevation = 2.dp,
                    ) {
                        Box(
                            modifier = Modifier.size(48.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            StethoscopeMark(OpwBlue)
                        }
                    }
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            text = title,
                            color = OpwInk,
                            fontWeight = FontWeight.Black,
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "Clinic service",
                            color = OpwSlate,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StethoscopeMark(color: Color) {
    Canvas(modifier = Modifier.size(30.dp)) {
        val stroke = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
        drawArc(
            color = color,
            startAngle = 200f,
            sweepAngle = 140f,
            useCenter = false,
            topLeft = Offset(5.dp.toPx(), 4.dp.toPx()),
            size = Size(20.dp.toPx(), 18.dp.toPx()),
            style = stroke,
        )
        drawLine(
            color,
            Offset(15.dp.toPx(), 20.dp.toPx()),
            Offset(15.dp.toPx(), 24.dp.toPx()),
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawCircle(
            color = color,
            radius = 4.dp.toPx(),
            center = Offset(22.dp.toPx(), 23.dp.toPx()),
            style = stroke,
        )
    }
}

@Composable
private fun ServiceFormDialog(
    service: JSONObject?,
    onDismiss: () -> Unit,
    onSave: (String?, String) -> Unit,
) {
    var name by rememberSaveable(service?.text("id").orEmpty()) {
        mutableStateOf(service?.text("name").orEmpty())
    }
    var error by rememberSaveable { mutableStateOf("") }

    OpwBottomSheetDialog(
        title = if (service == null) "Create Service" else "Edit Service",
        primaryLabel = if (service == null) "Create Service" else "Update Service",
        onDismiss = onDismiss,
        onPrimary = {
            if (name.trim().length < 2) {
                error = "Service name must be at least 2 characters."
            } else {
                onSave(service?.text("id")?.takeIf { it.isNotBlank() }, name.trim())
            }
        },
        onReset = {
            name = service?.text("name").orEmpty()
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SheetPatientField(
            label = "Service Name",
            value = name,
            onValueChange = {
                name = it
                error = ""
            },
        )
    }
}

@Composable
private fun SimpleModuleCard(
    title: String,
    subtitle: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit,
) {
    val shape = RoundedCornerShape(24.dp)
    val motion = rememberStaffFloatingCardMotion(delayMillis = (title.length * 19).coerceAtMost(260))
    Card(
        modifier = modifier
            .fillMaxWidth()
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = shape,
                ambientColor = accent.copy(alpha = 0.12f),
                spotColor = accent.copy(alpha = 0.16f),
            )
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .border(1.dp, accent.copy(alpha = 0.14f), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
        elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color.White,
                            Color(0xFFF9FCFF),
                            accent.copy(alpha = 0.055f),
                        ),
                    ),
                )
                .padding(horizontal = 13.dp, vertical = 12.dp),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 28.dp, y = (-32).dp)
                    .size(88.dp)
                    .background(accent.copy(alpha = 0.09f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = (-34).dp, y = 28.dp)
                    .size(68.dp)
                    .background(OpwAqua.copy(alpha = 0.07f), CircleShape),
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AccentOrb(accent = accent, label = title, size = 48.dp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = OpwInk,
                    )
                    Text(
                        text = subtitle,
                        color = OpwSlate,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    actions()
                }
            }
        }
    }
}

@Composable
private fun DecoratedSwipeReveal(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    color: Color,
    icon: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier,
        shape = shape,
        color = color.copy(alpha = 0.1f),
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            icon()
        }
    }
}

@Composable
private fun SwipeDeleteModuleCard(
    title: String,
    subtitle: String,
    accent: Color,
    deleteTitle: String,
    deleteMessage: String,
    onClick: (() -> Unit)?,
    onDelete: () -> Unit,
    swipeEnabled: Boolean = true,
    actions: @Composable RowScope.() -> Unit = {},
) {
    var dragOffset by remember { mutableStateOf(0f) }
    var confirmDelete by rememberSaveable(title, subtitle) { mutableStateOf(false) }
    val thresholdPx = with(LocalDensity.current) { 88.dp.toPx() }

    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = deleteTitle,
            message = deleteMessage,
            onDismiss = { confirmDelete = false },
            onConfirm = {
                confirmDelete = false
                onDelete()
            },
        )
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        if (swipeEnabled) {
            DecoratedSwipeReveal(
                modifier = Modifier.matchParentSize(),
                shape = RoundedCornerShape(26.dp),
                color = OpwDanger,
            ) { TrashGlyph(OpwDanger) }
        }

        SimpleModuleCard(
            title = title,
            subtitle = subtitle,
            accent = accent,
            modifier = Modifier
                .offset { IntOffset(dragOffset.roundToInt(), 0) }
                .then(if (swipeEnabled) Modifier.pointerInput(title, subtitle, thresholdPx) {
                    detectHorizontalDragGestures(
                        onDragCancel = { dragOffset = 0f },
                        onDragEnd = {
                            if (dragOffset <= -thresholdPx) {
                                confirmDelete = true
                            }
                            dragOffset = 0f
                        },
                        onHorizontalDrag = { change, dragAmount ->
                            val nextOffset = (dragOffset + dragAmount).coerceIn(-thresholdPx * 1.35f, 0f)
                            if (nextOffset != dragOffset) {
                                change.consume()
                            }
                            dragOffset = nextOffset
                        },
                    )
                } else Modifier),
            onClick = onClick,
            actions = actions,
        )
    }
}

@Composable
private fun TherapyTab(
    resources: List<JSONObject>,
    services: List<JSONObject>,
    onSave: (String?, String, String, String, PickedUploadFile?) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showTherapyDialog by rememberSaveable { mutableStateOf(false) }
    var editingResourceId by rememberSaveable { mutableStateOf("") }
    val editingResource = resources.firstOrNull { it.text("id") == editingResourceId }
    val filteredResources = remember(resources, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            resources
        } else {
            resources.filter { resource ->
                listOf("title", "serviceName", "fileName", "resourceType").any { field ->
                    resource.text(field).lowercase().contains(keyword)
                }
            }
        }
    }

    if (showTherapyDialog) {
        TherapyResourceFormDialog(
            resource = editingResource,
            services = services,
            onDismiss = {
                showTherapyDialog = false
                editingResourceId = ""
            },
            onSave = { id, serviceId, title, description, file ->
                onSave(id, serviceId, title, description, file)
                showTherapyDialog = false
                editingResourceId = ""
            },
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingResourceId = ""
            showTherapyDialog = true
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search therapy files",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (filteredResources.isEmpty()) {
            EmptyStateCard(
                title = "No therapy resources",
                message = "Uploaded exercise files and therapy resources will appear here.",
            )
        } else {
            filteredResources.forEach { resource ->
                SwipeDeleteModuleCard(
                    title = resource.text("title", fallback = "Therapy resource"),
                    subtitle = resource.text("serviceName", fallback = resource.text("fileName", fallback = "Therapy file")),
                    accent = OpwAqua,
                    deleteTitle = "Delete Therapy File",
                    deleteMessage = "Delete ${resource.text("title", fallback = "this therapy file")}? This cannot be undone.",
                    onClick = {
                        editingResourceId = resource.text("id")
                        showTherapyDialog = true
                    }.takeIf { canEdit },
                    onDelete = { onDelete(resource) },
                    swipeEnabled = canEdit,
                )
            }
        }
    }
}

@Composable
private fun TherapyResourceFormDialog(
    resource: JSONObject?,
    services: List<JSONObject>,
    onDismiss: () -> Unit,
    onSave: (String?, String, String, String, PickedUploadFile?) -> Unit,
) {
    val context = LocalContext.current
    var serviceId by rememberSaveable(resource?.text("id").orEmpty()) {
        mutableStateOf(resource?.text("serviceId").orEmpty().ifBlank { services.firstOrNull()?.text("id").orEmpty() })
    }
    var title by rememberSaveable(resource?.text("id").orEmpty()) {
        mutableStateOf(resource?.text("title").orEmpty())
    }
    var description by rememberSaveable(resource?.text("id").orEmpty()) {
        mutableStateOf(resource?.text("description").orEmpty())
    }
    var pickedFile by remember { mutableStateOf<PickedUploadFile?>(null) }
    var error by rememberSaveable { mutableStateOf("") }
    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val picked = readPickedUploadFile(context, uri)
            if (picked == null) {
                error = "Could not read selected file."
            } else {
                pickedFile = picked
                error = ""
            }
        }
    }

    OpwBottomSheetDialog(
        title = if (resource == null) "Add Therapy File" else "Edit Therapy File",
        primaryLabel = if (resource == null) "Upload File" else "Save Therapy",
        onDismiss = onDismiss,
        onPrimary = {
            when {
                serviceId.isBlank() -> error = "Please choose a service."
                title.trim().isBlank() -> error = "Title is required."
                resource == null && pickedFile == null -> error = "Please choose a file."
                else -> onSave(
                    resource?.text("id")?.takeIf { it.isNotBlank() },
                    serviceId,
                    title.trim(),
                    description.trim(),
                    pickedFile,
                )
            }
        },
        onReset = {
            serviceId = resource?.text("serviceId").orEmpty().ifBlank { services.firstOrNull()?.text("id").orEmpty() }
            title = resource?.text("title").orEmpty()
            description = resource?.text("description").orEmpty()
            pickedFile = null
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SectionTitle("Service")
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            services.forEach { service ->
                FilterChip(
                    selected = service.text("id") == serviceId,
                    onClick = {
                        serviceId = service.text("id")
                        error = ""
                    },
                    label = { Text(service.text("name", fallback = "Service")) },
                )
            }
        }
        SheetPatientField(
            label = "Title",
            value = title,
            onValueChange = {
                title = it
                error = ""
            },
        )
        SheetPatientField(
            label = "Description",
            value = description,
            onValueChange = { description = it },
            minLines = 3,
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFFF8FAFC),
            border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
            onClick = { filePicker.launch("*/*") },
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("Therapy File", fontWeight = FontWeight.ExtraBold, color = OpwInk)
                Text(
                    pickedFile?.name ?: resource?.text("fileName", fallback = "Tap to choose file").orEmpty().ifBlank { "Tap to choose file" },
                    color = Color(0xFF64748B),
                )
            }
        }
    }
}

@Composable
private fun ShopTab(
    products: List<JSONObject>,
    orders: List<JSONObject>,
    onOrderStatusChange: (JSONObject, String) -> Unit,
    onProductSave: (String?, JSONObject) -> Unit,
    onProductDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showProductDialog by rememberSaveable { mutableStateOf(false) }
    var editingProductId by rememberSaveable { mutableStateOf("") }
    val editingProduct = products.firstOrNull { it.text("id") == editingProductId }
    val filteredProducts = remember(products, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            products
        } else {
            products.filter { product ->
                listOf("name", "category", "description").any { field ->
                    product.text(field).lowercase().contains(keyword)
                }
            }
        }
    }

    if (showProductDialog) {
        ShopProductFormDialog(
            product = editingProduct,
            onDismiss = {
                showProductDialog = false
                editingProductId = ""
            },
            onSave = { id, payload ->
                onProductSave(id, payload)
                showProductDialog = false
                editingProductId = ""
            },
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingProductId = ""
            showProductDialog = true
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search products",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

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
                                    if (canEdit) {
                                        OutlinedButton(onClick = { onOrderStatusChange(order, status) }) {
                                            Text(status.replaceFirstChar { it.titlecase() })
                                        }
                                    }
                                }
                            }
                        }
                    },
                )
            }
        }

        SectionTitle("Products")
        if (filteredProducts.isEmpty()) {
            EmptyStateCard("No products", "Products created from mobile or web admin will appear here.")
        } else {
            filteredProducts.forEach { product ->
                SwipeDeleteModuleCard(
                    title = product.text("name", fallback = "Product"),
                    subtitle = "${formatMoney(product.opt("price"))} | Stock ${product.optInt("stockQuantity", 0)}",
                    accent = if (product.optBoolean("isActive", true)) OpwSuccess else Color(0xFF64748B),
                    deleteTitle = "Delete Product",
                    deleteMessage = "Delete ${product.text("name", fallback = "this product")}? This cannot be undone.",
                    onClick = {
                        editingProductId = product.text("id")
                        showProductDialog = true
                    }.takeIf { canEdit },
                    onDelete = { onProductDelete(product) },
                    swipeEnabled = canEdit,
                )
            }
        }
    }
}

@Composable
private fun ShopProductFormDialog(
    product: JSONObject?,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
) {
    var name by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.text("name").orEmpty()) }
    var category by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.text("category").orEmpty()) }
    var description by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.text("description").orEmpty()) }
    var price by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.opt("price")?.toString().orEmpty()) }
    var stock by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.optInt("stockQuantity", 0)?.toString() ?: "0") }
    var active by rememberSaveable(product?.text("id").orEmpty()) { mutableStateOf(product?.optBoolean("isActive", true) ?: true) }
    var error by rememberSaveable { mutableStateOf("") }

    OpwBottomSheetDialog(
        title = if (product == null) "Add Product" else "Edit Product",
        primaryLabel = if (product == null) "Create Product" else "Update Product",
        onDismiss = onDismiss,
        onPrimary = {
            val parsedPrice = price.trim().toDoubleOrNull()
            when {
                name.trim().length < 2 -> error = "Product name must be at least 2 characters."
                parsedPrice == null || parsedPrice <= 0.0 -> error = "Product price must be greater than zero."
                else -> onSave(
                    product?.text("id")?.takeIf { it.isNotBlank() },
                    JSONObject()
                        .put("name", name.trim())
                        .put("category", category.trim())
                        .put("description", description.trim())
                        .put("price", parsedPrice)
                        .put("stockQuantity", stock.toIntOrNull() ?: 0)
                        .put("isActive", active),
                )
            }
        },
        onReset = {
            name = product?.text("name").orEmpty()
            category = product?.text("category").orEmpty()
            description = product?.text("description").orEmpty()
            price = product?.opt("price")?.toString().orEmpty()
            stock = product?.optInt("stockQuantity", 0)?.toString() ?: "0"
            active = product?.optBoolean("isActive", true) ?: true
            error = ""
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SheetPatientField("Product Name", name, { name = it; error = "" })
        SheetPatientField("Category", category, { category = it })
        SheetPatientField("Description", description, { description = it }, minLines = 3)
        SheetPatientField("Price", price, { price = it.filter { char -> char.isDigit() || char == '.' }; error = "" }, KeyboardType.Decimal)
        SheetPatientField("Stock Quantity", stock, { stock = it.filter { char -> char.isDigit() }.ifBlank { "0" } }, KeyboardType.Number)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Visible in shop", color = OpwInk, fontWeight = FontWeight.Bold)
            Switch(checked = active, onCheckedChange = { active = it })
        }
        Text(
            text = "Product image upload remains available on web admin.",
            color = Color(0xFF64748B),
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

private val marketingTypeOptions = listOf(
    "medical_shop" to "Medical Shop",
    "clinic" to "Clinic",
    "institute" to "Institute",
    "hospital" to "Hospital",
    "doctor" to "Doctor",
    "other" to "Other",
)

private val marketingStatusOptions = listOf(
    "new" to "New Lead",
    "visited" to "Visited",
    "interested" to "Interested",
    "follow_up" to "Follow-up",
    "converted" to "Converted",
    "not_interested" to "Not Interested",
)

@Composable
private fun MarketingTab(
    sources: List<JSONObject>,
    token: String?,
    onSave: (String?, JSONObject, PickedUploadFile?) -> Unit,
    onDelete: (JSONObject) -> Unit,
    onReferralAdd: (JSONObject, JSONObject) -> Unit,
    onReferralDelete: (JSONObject, JSONObject) -> Unit,
    canAdd: Boolean,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showSourceDialog by rememberSaveable { mutableStateOf(false) }
    var editingSourceId by rememberSaveable { mutableStateOf("") }
    var viewSourceId by rememberSaveable { mutableStateOf("") }
    var leadSourceId by rememberSaveable { mutableStateOf("") }
    val editingSource = sources.firstOrNull { it.text("id") == editingSourceId }
    val viewSource = sources.firstOrNull { it.text("id") == viewSourceId }
    val leadSource = sources.firstOrNull { it.text("id") == leadSourceId }
    val filteredSources = remember(sources, query) {
        val keyword = query.trim().lowercase()
        sortMarketingSources(
            if (keyword.isBlank()) {
                sources
            } else {
                sources.filter { source ->
                    listOf(
                        "name",
                        "contactPerson",
                        "doctorName",
                        "mobile",
                        "area",
                        "city",
                        "assignedTo",
                        "sourceTypeLabel",
                        "pitchStatusLabel",
                    ).any { field -> source.text(field).lowercase().contains(keyword) }
                }
            },
        )
    }

    if (showSourceDialog) {
        MarketingSourceFormDialog(
            source = editingSource,
            onDismiss = {
                showSourceDialog = false
                editingSourceId = ""
            },
            onSave = { id, payload, photo ->
                onSave(id, payload, photo)
                showSourceDialog = false
                editingSourceId = ""
            },
        )
    }

    if (viewSource != null) {
        MarketingSourceViewDialog(
            source = viewSource,
            token = token,
            onDismiss = { viewSourceId = "" },
            onEdit = if (canEdit) { {
                editingSourceId = viewSource.text("id")
                showSourceDialog = true
            } } else null,
            onDelete = if (canEdit) { { onDelete(viewSource) } } else null,
            onGenerateLead = if (canAdd) { { leadSourceId = viewSource.text("id") } } else null,
            onReferralDelete = if (canEdit) { { referral -> onReferralDelete(viewSource, referral) } } else null,
        )
    }

    if (leadSource != null) {
        MarketingLeadDialog(
            source = leadSource,
            onDismiss = { leadSourceId = "" },
            onSave = { payload ->
                onReferralAdd(leadSource, payload)
                leadSourceId = ""
            },
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingSourceId = ""
            showSourceDialog = true
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search marketing sources",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Sources",
                value = sources.size.toString(),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Converted",
                value = sources.count { it.text("pitchStatus", "status") == "converted" }.toString(),
                accent = OpwSuccess,
            )
        }

        if (filteredSources.isEmpty()) {
            EmptyStateCard(
                title = "No marketing sources",
                message = "Use the plus button to add a medical shop, clinic, institute, or doctor source.",
            )
        } else {
            filteredSources.forEachIndexed { index, source ->
                val status = source.text("pitchStatus", "status", fallback = "new")
                val accent = if (status == "converted") OpwSuccess else moduleAccent(AdminTab.Marketing)
                MarketingSourceCard(
                    source = source,
                    accent = accent,
                    delayMillis = (index * 90).coerceAtMost(360),
                    onView = { viewSourceId = source.text("id") },
                    onEdit = if (canEdit) { {
                        editingSourceId = source.text("id")
                        showSourceDialog = true
                    } } else null,
                    onDelete = { onDelete(source) },
                    canEdit = canEdit,
                )
            }
        }
    }
}

@Composable
private fun MarketingSourceCard(
    source: JSONObject,
    accent: Color,
    delayMillis: Int,
    onView: () -> Unit,
    onEdit: (() -> Unit)?,
    onDelete: () -> Unit,
    canEdit: Boolean,
) {
    val shape = RoundedCornerShape(24.dp)
    val motion = rememberStaffFloatingCardMotion(delayMillis = delayMillis)
    var dragOffset by remember { mutableStateOf(0f) }
    var confirmDelete by rememberSaveable(source.text("id")) { mutableStateOf(false) }
    val thresholdPx = with(LocalDensity.current) { 88.dp.toPx() }
    val status = source.text("pitchStatus", "status", fallback = "new")
    val sourceName = source.text("name", fallback = "Marketing source")
    val contactLine = listOf(
        source.text("doctorName", "contactPerson"),
        source.text("mobile", "alternateMobile"),
    ).filter { it.isNotBlank() }.joinToString(" | ").ifBlank { "Contact not added" }
    val locationLine = listOf(source.text("area"), source.text("city")).filter { it.isNotBlank() }.joinToString(", ")

    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = "Delete Marketing Source",
            message = "Delete $sourceName? This cannot be undone.",
            onDismiss = { confirmDelete = false },
            onConfirm = {
                confirmDelete = false
                onDelete()
            },
        )
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        if (canEdit) {
            DecoratedSwipeReveal(
                modifier = Modifier.matchParentSize(),
                shape = shape,
                color = OpwDanger,
            ) { TrashGlyph(OpwDanger) }
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .offset(y = motion.lift)
                .offset { IntOffset(dragOffset.roundToInt(), 0) }
                .then(if (canEdit) Modifier.pointerInput(source.text("id"), thresholdPx) {
                    detectHorizontalDragGestures(
                        onDragCancel = { dragOffset = 0f },
                        onDragEnd = {
                            if (dragOffset <= -thresholdPx) {
                                confirmDelete = true
                            }
                            dragOffset = 0f
                        },
                        onHorizontalDrag = { change, dragAmount ->
                            val nextOffset = (dragOffset + dragAmount).coerceIn(-thresholdPx * 1.35f, 0f)
                            if (nextOffset != dragOffset) {
                                change.consume()
                            }
                            dragOffset = nextOffset
                        },
                    )
                } else Modifier)
                .shadow(
                    elevation = motion.elevation,
                    shape = shape,
                    ambientColor = accent.copy(alpha = 0.14f),
                    spotColor = accent.copy(alpha = 0.2f),
                )
                .border(1.dp, accent.copy(alpha = 0.14f), shape)
                .clickable(onClick = onView),
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
            elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(listOf(Color.White, Color(0xFFF9FCFF), accent.copy(alpha = 0.055f))))
                    .padding(horizontal = 13.dp, vertical = 12.dp),
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 28.dp, y = (-32).dp)
                        .size(88.dp)
                        .background(accent.copy(alpha = 0.09f), CircleShape),
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .offset(x = (-34).dp, y = 28.dp)
                        .size(68.dp)
                        .background(OpwAqua.copy(alpha = 0.07f), CircleShape),
                )
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            color = accent.copy(alpha = 0.12f),
                            shape = CircleShape,
                        ) {
                            Box(
                                modifier = Modifier.size(48.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = sourceName.firstOrNull()?.uppercaseChar()?.toString() ?: "M",
                                    color = accent,
                                    fontWeight = FontWeight.Black,
                                    style = MaterialTheme.typography.titleMedium,
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                text = sourceName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = OpwInk,
                            )
                            Text(
                                text = contactLine,
                                color = OpwSlate,
                                style = MaterialTheme.typography.bodySmall,
                            )
                            if (locationLine.isNotBlank()) {
                                Text(
                                    text = locationLine,
                                    color = Color(0xFF64748B),
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                        StatusChip(
                            label = marketingStatusLabel(status),
                            background = accent.copy(alpha = 0.12f),
                            foreground = accent,
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        StatusChip(
                            label = marketingTypeLabel(source.text("sourceType")),
                            background = Color(0xFFEFF7FF),
                            foreground = OpwBlue,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ModuleIconButton(color = OpwBlue, onClick = onView) {
                                ViewGlyph(OpwBlue)
                            }
                            if (onEdit != null) {
                                ModuleIconButton(color = OpwSuccess, onClick = onEdit) {
                                    EditGlyph(OpwSuccess)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MarketingSourceFormDialog(
    source: JSONObject?,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject, PickedUploadFile?) -> Unit,
) {
    val context = LocalContext.current
    val sourceId = source?.text("id").orEmpty()
    var step by rememberSaveable(sourceId) { mutableStateOf(0) }
    var sourceType by rememberSaveable(sourceId) { mutableStateOf(source?.text("sourceType").orEmpty().ifBlank { "medical_shop" }) }
    var name by rememberSaveable(sourceId) { mutableStateOf(source?.text("name").orEmpty()) }
    var assignedTo by rememberSaveable(sourceId) { mutableStateOf(source?.text("assignedTo", "marketingPerson").orEmpty()) }
    var contactPerson by rememberSaveable(sourceId) { mutableStateOf(source?.text("contactPerson").orEmpty()) }
    var doctorName by rememberSaveable(sourceId) { mutableStateOf(source?.text("doctorName").orEmpty()) }
    var mobile by rememberSaveable(sourceId) { mutableStateOf(source?.text("mobile").orEmpty()) }
    var alternateMobile by rememberSaveable(sourceId) { mutableStateOf(source?.text("alternateMobile").orEmpty()) }
    var email by rememberSaveable(sourceId) { mutableStateOf(source?.text("email").orEmpty()) }
    var area by rememberSaveable(sourceId) { mutableStateOf(source?.text("area").orEmpty()) }
    var city by rememberSaveable(sourceId) { mutableStateOf(source?.text("city").orEmpty()) }
    var address by rememberSaveable(sourceId) { mutableStateOf(source?.text("address").orEmpty()) }
    var visitDate by rememberSaveable(sourceId) { mutableStateOf(source?.text("visitDate").orEmpty()) }
    var followUpDate by rememberSaveable(sourceId) { mutableStateOf(source?.text("nextFollowUpDate").orEmpty()) }
    var pitchStatus by rememberSaveable(sourceId) { mutableStateOf(source?.text("pitchStatus", "status").orEmpty().ifBlank { "new" }) }
    var expectedDailyPatients by rememberSaveable(sourceId) { mutableStateOf(source?.optInt("expectedDailyPatients", 0)?.takeIf { it > 0 }?.toString().orEmpty()) }
    var notes by rememberSaveable(sourceId) { mutableStateOf(source?.text("notes").orEmpty()) }
    var pickedPhoto by remember { mutableStateOf<PickedUploadFile?>(null) }
    var error by rememberSaveable(sourceId) { mutableStateOf("") }
    var showVisitPicker by rememberSaveable { mutableStateOf(false) }
    var showFollowUpPicker by rememberSaveable { mutableStateOf(false) }
    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val picked = readPickedUploadFile(context, uri)
            if (picked == null) {
                error = "Could not read selected photo."
            } else if (!picked.mimeType.startsWith("image/", ignoreCase = true)) {
                error = "Please select an image file."
            } else {
                pickedPhoto = picked
                error = ""
            }
        }
    }

    if (showVisitPicker) {
        AppointmentDatePickerDialog(
            selectedDate = visitDate.ifBlank { todayDateKey() },
            onDismiss = { showVisitPicker = false },
            onDateSelected = {
                visitDate = it
                showVisitPicker = false
            },
        )
    }

    if (showFollowUpPicker) {
        AppointmentDatePickerDialog(
            selectedDate = followUpDate.ifBlank { todayDateKey() },
            onDismiss = { showFollowUpPicker = false },
            onDateSelected = {
                followUpDate = it
                showFollowUpPicker = false
            },
        )
    }

    fun validateStep(): Boolean {
        error = when {
            step == 0 && name.trim().length < 2 -> "Source name must be at least 2 characters."
            step == 1 && mobile.isNotBlank() && normalizePhone(mobile).length != 10 -> "Primary mobile must be 10 digits."
            step == 1 && alternateMobile.isNotBlank() && normalizePhone(alternateMobile).length != 10 -> "Alternate mobile must be 10 digits."
            step == 1 && email.isNotBlank() && !Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches() -> "Please enter a valid email address."
            else -> ""
        }
        return error.isBlank()
    }

    OpwBottomSheetDialog(
        title = if (source == null) "Add Marketing Source" else "Edit Marketing Source",
        primaryLabel = if (step < 3) "Next" else if (source == null) "Save Source" else "Update Source",
        onDismiss = onDismiss,
        onPrimary = {
            if (!validateStep()) return@OpwBottomSheetDialog
            if (step < 3) {
                step += 1
            } else {
                onSave(
                    source?.text("id")?.takeIf { it.isNotBlank() },
                    JSONObject()
                        .put("sourceType", sourceType)
                        .put("name", name.trim())
                        .put("assignedTo", assignedTo.trim())
                        .put("contactPerson", contactPerson.trim())
                        .put("doctorName", doctorName.trim())
                        .put("mobile", normalizePhone(mobile))
                        .put("alternateMobile", normalizePhone(alternateMobile))
                        .put("email", email.trim().lowercase())
                        .put("area", area.trim())
                        .put("city", city.trim())
                        .put("address", address.trim())
                        .put("visitDate", visitDate.trim())
                        .put("nextFollowUpDate", followUpDate.trim())
                        .put("pitchStatus", pitchStatus)
                        .put("expectedDailyPatients", expectedDailyPatients.toIntOrNull() ?: 0)
                        .put("notes", notes.trim())
                        .put("removePhotoIds", "[]"),
                    pickedPhoto,
                )
            }
        },
    ) {
        Text(
            text = "Part ${step + 1} of 4",
            color = moduleAccent(AdminTab.Marketing),
            fontWeight = FontWeight.ExtraBold,
        )
        ChoiceChipRow(
            options = listOf("Source", "Contact", "Visit", "Photos"),
            selected = listOf("Source", "Contact", "Visit", "Photos")[step],
            onSelected = { selected -> step = listOf("Source", "Contact", "Visit", "Photos").indexOf(selected).coerceAtLeast(0) },
        )
        if (step > 0) {
            OutlinedButton(
                onClick = {
                    step -= 1
                    error = ""
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Previous")
            }
        }
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }

        when (step) {
            0 -> {
                Text("Source Type", fontWeight = FontWeight.Bold, color = OpwInk)
                ChoiceChipRow(
                    options = marketingTypeOptions.map { it.second },
                    selected = marketingTypeLabel(sourceType),
                    onSelected = { label ->
                        sourceType = marketingTypeOptions.firstOrNull { it.second == label }?.first ?: "medical_shop"
                    },
                )
                SheetPatientField("Place / Source Name", name, { name = it; error = "" })
                SheetPatientField("Marketing Person", assignedTo, { assignedTo = it })
            }
            1 -> {
                SheetPatientField("Contact Person", contactPerson, { contactPerson = it })
                SheetPatientField("Doctor Name", doctorName, { doctorName = it })
                SheetPatientField("Mobile", mobile, { mobile = it.filter(Char::isDigit); error = "" }, KeyboardType.Phone)
                SheetPatientField("Alternate Mobile", alternateMobile, { alternateMobile = it.filter(Char::isDigit); error = "" }, KeyboardType.Phone)
                SheetPatientField("Email", email, { email = it; error = "" }, KeyboardType.Email)
            }
            2 -> {
                SheetPatientField("Area", area, { area = it })
                SheetPatientField("City", city, { city = it })
                SheetPickerField("Visit Date", appointmentDateLabel(visitDate), "Pick visit date", onClick = { showVisitPicker = true })
                SheetPickerField("Next Follow-up", appointmentDateLabel(followUpDate), "Pick follow-up date", onClick = { showFollowUpPicker = true })
                Text("Pitch Status", fontWeight = FontWeight.Bold, color = OpwInk)
                ChoiceChipRow(
                    options = marketingStatusOptions.map { it.second },
                    selected = marketingStatusLabel(pitchStatus),
                    onSelected = { label ->
                        pitchStatus = marketingStatusOptions.firstOrNull { it.second == label }?.first ?: "new"
                    },
                )
                SheetPatientField("Expected Daily Patients", expectedDailyPatients, { expectedDailyPatients = it.filter(Char::isDigit) }, KeyboardType.Number)
                SheetPatientField("Full Address", address, { address = it }, minLines = 3)
            }
            else -> {
                SheetPatientField("Marketing Notes", notes, { notes = it }, minLines = 4)
                OutlinedButton(onClick = { photoPicker.launch("image/*") }, modifier = Modifier.fillMaxWidth()) {
                    Text(pickedPhoto?.name ?: "Choose Visit Photo")
                }
                Text(
                    text = "Photo upload is optional. Existing photos stay saved unless changed from web admin.",
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun MarketingSourceViewDialog(
    source: JSONObject,
    token: String?,
    onDismiss: () -> Unit,
    onEdit: (() -> Unit)?,
    onDelete: (() -> Unit)?,
    onGenerateLead: (() -> Unit)?,
    onReferralDelete: ((JSONObject) -> Unit)?,
) {
    val referrals = source.array("referrals").toJsonObjects().asReversed()
    val photos = source.array("photos").toJsonObjects()

    OpwBottomSheetDialog(
        title = source.text("name", fallback = "Marketing Source"),
        primaryLabel = "Close",
        onDismiss = onDismiss,
        onPrimary = onDismiss,
    ) {
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            StatusChip(marketingTypeLabel(source.text("sourceType")), Color(0xFFE0F2FE), OpwBlue)
            StatusChip(marketingStatusLabel(source.text("pitchStatus", "status")), Color(0xFFDCFCE7), statusColor(source.text("pitchStatus", "status")))
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            if (onGenerateLead != null) {
                OutlinedButton(onClick = onGenerateLead, modifier = Modifier.weight(1f)) {
                    Text("Generate Lead")
                }
            }
            if (onEdit != null) {
                OutlinedButton(onClick = onEdit, modifier = Modifier.weight(1f)) {
                    Text("Edit")
                }
            }
            if (onDelete != null) {
                OutlinedButton(onClick = onDelete, modifier = Modifier.weight(1f)) {
                    Text("Delete")
                }
            }
        }

        SectionCard(title = "Details") {
            DetailRow("Contact", source.text("contactPerson", fallback = "Not added"))
            DetailRow("Doctor", source.text("doctorName", fallback = "Not added"))
            DetailRow("Mobile", source.text("mobile", "alternateMobile", fallback = "No mobile"))
            DetailRow("Area", listOf(source.text("area"), source.text("city")).filter { it.isNotBlank() }.joinToString(", ").ifBlank { "Not added" })
            DetailRow("Visit", appointmentDateLabel(source.text("visitDate")))
            DetailRow("Follow-up", appointmentDateLabel(source.text("nextFollowUpDate")))
            DetailRow("Target", "${source.optInt("expectedDailyPatients", 0)} / day")
            DetailRow("Generated", "${source.optInt("totalGeneratedPatients", 0)} patients")
            if (source.text("notes").isNotBlank()) {
                DetailRow("Notes", source.text("notes"))
            }
        }

        SectionCard(title = "Lead Data", actionLabel = if (onGenerateLead != null) "Add" else null, onAction = onGenerateLead) {
            if (referrals.isEmpty()) {
                InlineEmpty("No lead data generated yet.")
            } else {
                referrals.forEach { referral ->
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = OpwMist,
                        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "${referral.optInt("patientCount", 0)} patient(s)",
                                    color = OpwInk,
                                    fontWeight = FontWeight.ExtraBold,
                                )
                                Text(
                                    listOf(appointmentDateLabel(referral.text("date")), referral.text("notes"))
                                        .filter { it.isNotBlank() && it != "Not set" }
                                        .joinToString(" | "),
                                    color = Color(0xFF64748B),
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            if (onReferralDelete != null) {
                                ModuleIconButton(color = OpwDanger, onClick = { onReferralDelete(referral) }) {
                                    TrashGlyph(OpwDanger)
                                }
                            }
                        }
                    }
                }
            }
        }

        SectionCard(title = "Visit Photos") {
            if (photos.isEmpty()) {
                InlineEmpty("No photos added yet.")
            } else {
                photos.forEach { photo ->
                    MarketingPhotoPreview(photo = photo, token = token)
                }
            }
        }
    }
}

@Composable
private fun MarketingLeadDialog(
    source: JSONObject,
    onDismiss: () -> Unit,
    onSave: (JSONObject) -> Unit,
) {
    var date by rememberSaveable(source.text("id")) { mutableStateOf(todayDateKey()) }
    var count by rememberSaveable(source.text("id")) { mutableStateOf("1") }
    var names by rememberSaveable(source.text("id")) { mutableStateOf("") }
    var notes by rememberSaveable(source.text("id")) { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf("") }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = date,
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                date = it
                showDatePicker = false
            },
        )
    }

    OpwBottomSheetDialog(
        title = "Generate Lead Data",
        primaryLabel = "Save Lead",
        onDismiss = onDismiss,
        onPrimary = {
            val parsedCount = count.toIntOrNull()
            if (parsedCount == null || parsedCount < 0) {
                error = "Patient count cannot be negative."
            } else {
                val patientNames = JSONArray()
                names.lines().map { it.trim() }.filter { it.isNotBlank() }.forEach { patientNames.put(it) }
                onSave(
                    JSONObject()
                        .put("date", date)
                        .put("patientCount", parsedCount)
                        .put("patientNames", patientNames)
                        .put("notes", notes.trim()),
                )
            }
        },
    ) {
        Text(source.text("name", fallback = "Marketing source"), color = OpwInk, fontWeight = FontWeight.ExtraBold)
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SheetPickerField("Date", appointmentDateLabel(date), "Pick date", onClick = { showDatePicker = true })
        SheetPatientField("Patient Count", count, { count = it.filter(Char::isDigit).ifBlank { "0" }; error = "" }, KeyboardType.Number)
        SheetPatientField("Patient Names", names, { names = it }, minLines = 3)
        SheetPatientField("Notes", notes, { notes = it }, minLines = 3)
    }
}

@Composable
private fun MarketingPhotoPreview(photo: JSONObject, token: String?) {
    val imageUrl = remember(photo.text("url")) { absoluteApiAssetUrl(photo.text("url")) }
    var imageBitmap by remember(imageUrl, token) { mutableStateOf<ImageBitmap?>(null) }

    LaunchedEffect(imageUrl, token) {
        imageBitmap = if (imageUrl.isBlank()) null else loadProfileImage(imageUrl, token)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .clip(RoundedCornerShape(22.dp))
            .background(OpwMist),
        contentAlignment = Alignment.Center,
    ) {
        if (imageBitmap != null) {
            Image(
                bitmap = imageBitmap!!,
                contentDescription = photo.text("name", fallback = "Visit photo"),
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Text("Photo", color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun FeedbackTab(
    items: List<JSONObject>,
    onToggleApproval: (JSONObject) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    val pending = items.count { !it.optBoolean("isApproved") }
    val approved = items.count { it.optBoolean("isApproved") }
    val filteredItems = remember(items, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            items
        } else {
            items.filter { item ->
                listOf("name", "email", "comment").any { field ->
                    item.text(field).lowercase().contains(keyword)
                }
            }
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search feedback",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

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

        if (filteredItems.isEmpty()) {
            EmptyStateCard(
                title = "No feedback",
                message = "Website feedback submissions will appear here for approval.",
            )
        } else {
            filteredItems.forEach { item ->
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
                actions = if (canEdit) {
                    {
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            ModuleIconButton(
                                color = if (approvedItem) OpwWarning else OpwSuccess,
                                onClick = { onToggleApproval(item) },
                            ) {
                                if (approvedItem) {
                                    CloseGlyph(OpwWarning)
                                } else {
                                    ViewGlyph(OpwSuccess)
                                }
                            }
                            ModuleIconButton(color = OpwDanger, onClick = { onDelete(item) }) {
                                TrashGlyph(OpwDanger)
                            }
                        }
                    }
                } else null,
            )
            }
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
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
    addRequest: Int,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showJobDialog by rememberSaveable { mutableStateOf(false) }
    val filteredRequirements = remember(requirements, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            requirements
        } else {
            requirements.filter { item ->
                listOf("title", "department", "location", "employmentType", "experience", "status")
                    .any { field -> item.text(field).lowercase().contains(keyword) }
            }
        }
    }

    if (showJobDialog) {
        JobRequirementFormDialog(
            form = form,
            editingId = editingId,
            error = error,
            loading = loading,
            onFormChange = onFormChange,
            onDismiss = {
                showJobDialog = false
                onCancelEdit()
            },
            onSave = {
                onSave()
                if (validateJobForm(form) == null) {
                    showJobDialog = false
                }
            },
            onReset = onCancelEdit,
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            onCancelEdit()
            showJobDialog = true
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search career openings",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        if (message.isNotBlank()) {
            StatusBanner(message = message, tone = BannerTone.Success)
        }

        if (filteredRequirements.isEmpty()) {
            EmptyStateCard(
                title = "No career openings",
                message = "Use the plus button to add a career opening.",
            )
        } else {
            filteredRequirements.forEach { item ->
                val status = item.text("status", fallback = "Active")
                val visibleStatus = if (item.optBoolean("isPublished", true)) status else "Hidden"
                SwipeDeleteModuleCard(
                    title = item.text("title", fallback = "Career opening"),
                    subtitle = listOf(
                        item.text("department"),
                        item.text("location"),
                        item.text("employmentType"),
                        visibleStatus,
                    ).filter { it.isNotBlank() }.joinToString(" | "),
                    accent = statusColor(status),
                    deleteTitle = "Delete Career Opening",
                    deleteMessage = "Delete ${item.text("title", fallback = "this career opening")}? This cannot be undone.",
                    onClick = if (canEdit) { {
                        onEdit(item)
                        showJobDialog = true
                    } } else null,
                    onDelete = { onDelete(item) },
                    swipeEnabled = canEdit,
                    actions = if (canEdit) {
                        {
                            ModuleIconButton(
                                color = if (status == "Active") OpwWarning else OpwSuccess,
                                onClick = { onStatusChange(item, if (status == "Active") "Completed" else "Active") },
                            ) {
                                PowerGlyph(if (status == "Active") OpwWarning else OpwSuccess)
                            }
                        }
                    } else {
                        {}
                    },
                )
            }
        }
    }
}

@Composable
private fun JobRequirementFormDialog(
    form: JobFormState,
    editingId: String,
    error: String,
    loading: Boolean,
    onFormChange: (JobFormState) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit,
    onReset: () -> Unit,
) {
    OpwBottomSheetDialog(
        title = if (editingId.isBlank()) "Add Career Opening" else "Edit Career Opening",
        primaryLabel = if (loading) "Saving..." else if (editingId.isBlank()) "Post Opening" else "Update Opening",
        onDismiss = onDismiss,
        onPrimary = onSave,
        onReset = onReset,
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        SheetPatientField("Position Title", form.title, { onFormChange(form.copy(title = it)) })
        SheetPatientField("Department", form.department, { onFormChange(form.copy(department = it)) })
        SheetPatientField("Employment Type", form.employmentType, { onFormChange(form.copy(employmentType = it)) })
        SheetPatientField("Experience", form.experience, { onFormChange(form.copy(experience = it)) })
        SheetPatientField("Location", form.location, { onFormChange(form.copy(location = it)) })
        SheetPatientField(
            label = "Openings",
            value = form.openings,
            onValueChange = { value ->
                onFormChange(form.copy(openings = value.filter { char -> char.isDigit() }.ifBlank { "1" }))
            },
            keyboardType = KeyboardType.Number,
        )
        SheetPatientField("Summary", form.summary, { onFormChange(form.copy(summary = it)) }, minLines = 3)
        SheetPatientField("Responsibilities", form.responsibilities, { onFormChange(form.copy(responsibilities = it)) }, minLines = 3)
        SheetPatientField("Requirements", form.requirements, { onFormChange(form.copy(requirements = it)) }, minLines = 3)
        SheetPatientField("Benefits", form.benefits, { onFormChange(form.copy(benefits = it)) }, minLines = 3)

        Text("Career Status", fontWeight = FontWeight.Bold, color = OpwInk)
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
        Surface(color = OpwMist, shape = RoundedCornerShape(20.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Show on website", color = OpwInk, fontWeight = FontWeight.Bold)
                    Text("Published openings appear on the career page.", color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = form.isPublished,
                    enabled = form.status == "Active",
                    onCheckedChange = { onFormChange(form.copy(isPublished = it)) },
                )
            }
        }
    }
}

@Composable
private fun ReportsTab(
    report: JSONObject?,
    users: List<StaffUser>,
    fromDate: String,
    toDate: String,
    loading: Boolean,
    error: String,
    onRangeChange: (String, String) -> Unit,
    onApply: () -> Unit,
) {
    val summary = report?.objectValue("summary") ?: JSONObject()
    val staffWorkReports = report?.array("staffWorkReports")?.toJsonObjects().orEmpty()
    val reportStaffOptions = remember(users, staffWorkReports) {
        val fromUsers = users
            .filter { it.role != "Admin" }
            .map { it.id to it.name.ifBlank { it.email } }
        val fromReports = staffWorkReports.map { item ->
            item.text("staffId").ifBlank { item.text("staffName") } to item.text("staffName", fallback = "Unassigned")
        }
        (fromUsers + fromReports)
            .filter { (id, label) -> id.isNotBlank() || label.isNotBlank() }
            .distinctBy { (id, label) -> id.ifBlank { label }.lowercase() }
    }
    var selectedStaffKey by rememberSaveable(reportStaffOptions.joinToString("|") { it.first }) {
        mutableStateOf(reportStaffOptions.firstOrNull()?.first.orEmpty())
    }
    var showStaffMenu by rememberSaveable { mutableStateOf(false) }
    var commissionPercent by rememberSaveable { mutableStateOf("") }
    var showFromDatePicker by rememberSaveable { mutableStateOf(false) }
    var showToDatePicker by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(reportStaffOptions) {
        if (selectedStaffKey.isBlank() || reportStaffOptions.none { it.first == selectedStaffKey }) {
            selectedStaffKey = reportStaffOptions.firstOrNull()?.first.orEmpty()
        }
    }

    val selectedStaffReport = staffWorkReports.firstOrNull { item ->
        val itemKey = item.text("staffId").ifBlank { item.text("staffName") }
        itemKey == selectedStaffKey
    }
    val selectedStaffName = reportStaffOptions.firstOrNull { it.first == selectedStaffKey }?.second
        ?: selectedStaffReport?.text("staffName", fallback = "Select staff").orEmpty()
    val patientRows = selectedStaffReport?.array("patients")?.toJsonObjects().orEmpty()
    val totalDoneDays = selectedStaffReport?.optInt("totalDoneDays", 0) ?: 0
    val totalPaidAmount = selectedStaffReport?.optDouble("totalPaidAmount", 0.0) ?: 0.0
    val commissionAmount = totalPaidAmount * ((commissionPercent.toDoubleOrNull() ?: 0.0).coerceAtLeast(0.0) / 100.0)

    if (showFromDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = fromDate,
            onDismiss = { showFromDatePicker = false },
            onDateSelected = { selected ->
                onRangeChange(selected, toDate)
                showFromDatePicker = false
            },
        )
    }

    if (showToDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = toDate,
            onDismiss = { showToDatePicker = false },
            onDateSelected = { selected ->
                onRangeChange(fromDate, selected)
                showToDatePicker = false
            },
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }

        SectionTitle("Staff Work Report")
        ReportFilterCard(
            fromDate = fromDate,
            toDate = toDate,
            loading = loading,
            onFromClick = { showFromDatePicker = true },
            onToClick = { showToDatePicker = true },
            onApply = onApply,
        )

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = Color.White,
            border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
            shadowElevation = 2.dp,
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("Select Staff", color = OpwInk, fontWeight = FontWeight.ExtraBold)
                Box {
                    CompactPickerPill(
                        value = selectedStaffName,
                        placeholder = "Choose staff",
                        icon = "âŒ„",
                        onClick = { showStaffMenu = true },
                    )
                    DropdownMenu(
                        expanded = showStaffMenu,
                        onDismissRequest = { showStaffMenu = false },
                    ) {
                        reportStaffOptions.forEach { (id, label) ->
                            DropdownMenuItem(
                                text = { Text(label) },
                                onClick = {
                                    selectedStaffKey = id
                                    showStaffMenu = false
                                },
                            )
                        }
                    }
                }
                if (reportStaffOptions.isEmpty()) {
                    InlineEmpty("No staff work data found for this date range.")
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Treatment Days",
                value = totalDoneDays.toString(),
                accent = OpwSuccess,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Paid Amount",
                value = formatMoney(totalPaidAmount),
                accent = OpwWarning,
            )
        }

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = Color(0xFFEFFBFF),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBAE6FD)),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("Commission Calculator", color = OpwInk, fontWeight = FontWeight.ExtraBold)
                OutlinedTextField(
                    value = commissionPercent,
                    onValueChange = { value ->
                        commissionPercent = value.filter { char -> char.isDigit() || char == '.' }.take(6)
                    },
                    placeholder = { Text("Commission percentage") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                )
                DetailRow(
                    label = "Formula",
                    value = "${formatMoney(totalPaidAmount)} x ${commissionPercent.ifBlank { "0" }}%",
                )
                DetailRow(
                    label = "Commission Amount",
                    value = formatMoney(commissionAmount),
                )
            }
        }

        ReportRecordsSection(
            title = "Patient-wise Work",
            emptyMessage = "No treatment work found for selected staff and date range.",
            items = patientRows,
            accent = OpwAqua,
        ) { patient ->
            val entries = patient.array("entries").toJsonObjects()
            ReportRecordCard(
                title = patient.text("patientName", fallback = "Patient"),
                subtitle = patient.text("patientMobile", fallback = "Mobile not provided"),
                status = "${patient.optInt("doneDays", 0)} days",
                statusColor = OpwSuccess,
                rows = listOf(
                    "Paid by patient" to formatMoney(patient.opt("paidAmount")),
                    "Dates" to entries.take(6).joinToString(", ") { it.text("date", fallback = "-") },
                    "Treatment" to entries.firstOrNull()?.text("treatmentType", fallback = "Treatment").orEmpty(),
                ) + if (entries.size > 6) {
                    listOf("More" to "${entries.size - 6} more treatment days")
                } else {
                    emptyList()
                },
            )
        }
    }
}

@Composable
private fun FinanceTab(
    finance: JSONObject?,
    users: List<StaffUser>,
    fromDate: String,
    toDate: String,
    onRangeChange: (String, String) -> Unit,
    onApply: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canEdit: Boolean,
    addRequest: Int,
) {
    val summary = finance?.objectValue("summary") ?: JSONObject()
    val patientIncome = finance?.array("patientIncome")?.toJsonObjects().orEmpty()
    val manualIncome = finance?.array("manualIncome")?.toJsonObjects().orEmpty()
    val expenses = finance?.array("expenses")?.toJsonObjects().orEmpty()
    var showFromDatePicker by rememberSaveable { mutableStateOf(false) }
    var showToDatePicker by rememberSaveable { mutableStateOf(false) }
    var financePreset by rememberSaveable { mutableStateOf("monthly") }
    var editingEntry by remember { mutableStateOf<JSONObject?>(null) }
    var showEntryDialog by rememberSaveable { mutableStateOf(false) }

    if (showFromDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = fromDate,
            onDismiss = { showFromDatePicker = false },
            onDateSelected = { selected ->
                onRangeChange(selected, toDate)
                financePreset = "custom"
                showFromDatePicker = false
            },
        )
    }

    if (showToDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = toDate,
            onDismiss = { showToDatePicker = false },
            onDateSelected = { selected ->
                onRangeChange(fromDate, selected)
                financePreset = "custom"
                showToDatePicker = false
            },
        )
    }

    if (showEntryDialog) {
        FinanceEntryDialog(
            entry = editingEntry,
            users = users,
            onDismiss = {
                showEntryDialog = false
                editingEntry = null
            },
            onSave = { id, payload ->
                onSave(id, payload)
                showEntryDialog = false
                editingEntry = null
            },
        )
    }

    LaunchedEffect(addRequest) {
        if (addRequest > 0) {
            editingEntry = null
            showEntryDialog = true
        }
    }

    LaunchedEffect(financePreset, fromDate, toDate) {
        if (financePreset != "custom") {
            onApply()
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        ReportFilterCard(
            fromDate = fromDate,
            toDate = toDate,
            loading = false,
            activePreset = financePreset,
            onPresetSelected = { preset ->
                val range = financePresetRange(preset)
                financePreset = preset
                onRangeChange(range.first, range.second)
            },
            onFromClick = { showFromDatePicker = true },
            onToClick = { showToDatePicker = true },
            onApply = onApply,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Income",
                value = formatMoney(summary.opt("totalIncome")),
                accent = OpwSuccess,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Expense",
                value = formatMoney(summary.opt("totalExpense")),
                accent = OpwDanger,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Patient Income",
                value = formatMoney(summary.opt("patientIncome")),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Manual Income",
                value = formatMoney(summary.opt("manualIncome")),
                accent = OpwAqua,
            )
        }
        MetricCard(
            modifier = Modifier.fillMaxWidth(),
            label = "Net Balance",
            value = formatMoney(summary.opt("netBalance")),
            accent = OpwWarning,
        )

        FinanceRecordsSection(
            title = "Patient Income",
            emptyMessage = "No patient payment income in this range.",
            items = patientIncome,
            accent = OpwSuccess,
            patientIncome = true,
        )
        FinanceRecordsSection(
            title = "Manual Income",
            emptyMessage = "No manual income added yet.",
            items = manualIncome,
            accent = OpwAqua,
            canEdit = canEdit,
            onEdit = { item ->
                editingEntry = item
                showEntryDialog = true
            },
            onDelete = onDelete,
        )
        FinanceRecordsSection(
            title = "Expenses",
            emptyMessage = "No expense added yet.",
            items = expenses,
            accent = OpwDanger,
            canEdit = canEdit,
            onEdit = { item ->
                editingEntry = item
                showEntryDialog = true
            },
            onDelete = onDelete,
        )

    }
}

@Composable
private fun FinanceRecordsSection(
    title: String,
    emptyMessage: String,
    items: List<JSONObject>,
    accent: Color,
    patientIncome: Boolean = false,
    canEdit: Boolean = false,
    onEdit: ((JSONObject) -> Unit)? = null,
    onDelete: ((JSONObject) -> Unit)? = null,
) {
    SectionCard(title = title) {
        if (items.isEmpty()) {
            InlineEmpty(emptyMessage)
        } else {
            items.forEach { item ->
                val itemTitle = item.text("title", fallback = item.text("patientName", fallback = "Finance entry"))
                val contact = item.text("staffName", "patientName", fallback = "").ifBlank {
                    item.text("method", fallback = "Manual")
                }
                val subtitle = if (patientIncome) {
                    appointmentDateLabel(item.text("date", fallback = ""))
                } else listOf(
                    item.text("category", fallback = item.text("method", fallback = "Finance")),
                    appointmentDateLabel(item.text("date", fallback = "")),
                    contact,
                ).filter { it.isNotBlank() && it != "-" }.joinToString(" • ")

                val content: @Composable RowScope.() -> Unit = {
                    StatusChip(
                        label = formatMoney(item.opt("amount")),
                        background = accent.copy(alpha = 0.12f),
                        foreground = accent,
                    )
                }

                if (canEdit && onEdit != null && onDelete != null) {
                    SwipeDeleteModuleCard(
                        title = itemTitle,
                        subtitle = subtitle,
                        accent = accent,
                        deleteTitle = "Delete finance entry?",
                        deleteMessage = "This will remove ${itemTitle} from the finance list.",
                        onClick = { onEdit(item) },
                        onDelete = { onDelete(item) },
                        swipeEnabled = true,
                        actions = content,
                    )
                } else {
                    SimpleModuleCard(
                        title = itemTitle,
                        subtitle = subtitle,
                        accent = accent,
                        actions = content,
                    )
                }
            }
        }
    }
}

@Composable
private fun FinanceEntryDialog(
    entry: JSONObject?,
    users: List<StaffUser>,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
) {
    var type by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("type") ?: "income") }
    var title by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("title").orEmpty()) }
    var category by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("category").orEmpty()) }
    var amount by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.optDouble("amount", 0.0)?.takeIf { it > 0.0 }?.toString().orEmpty()) }
    var date by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("date").orEmpty().ifBlank { todayDateKey() }) }
    var method by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(financeMethodValue(entry?.text("method").orEmpty())) }
    var notes by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("notes").orEmpty()) }
    var staffId by rememberSaveable(entry?.text("id").orEmpty()) { mutableStateOf(entry?.text("staffId").orEmpty()) }
    var error by rememberSaveable { mutableStateOf("") }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    var showMethodMenu by rememberSaveable { mutableStateOf(false) }

    OpwBottomSheetDialog(
        title = if (entry == null) "Add Finance Entry" else "Edit Finance Entry",
        primaryLabel = if (entry == null) "Save Entry" else "Update Entry",
        onDismiss = onDismiss,
        onPrimary = {
            val value = amount.toDoubleOrNull() ?: 0.0
            when {
                title.trim().length < 2 -> error = "Enter a title."
                value <= 0.0 -> error = "Enter a valid amount."
                date.isBlank() -> error = "Choose a date."
                else -> onSave(
                    entry?.text("id"),
                    JSONObject()
                        .put("type", type)
                        .put("title", title.trim())
                        .put("category", category.trim())
                        .put("amount", value)
                        .put("date", date)
                        .put("method", method.trim())
                        .put("notes", notes.trim())
                        .put("staffId", staffId),
                )
            }
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }
        ChoiceChipRow(listOf("income", "expense"), type) { selected -> type = selected }
        SheetPatientField("Title", title, { title = it; error = "" })
        SheetPatientField("Category", category, { category = it })
        SheetPatientField("Amount", amount, { amount = it.filter { char -> char.isDigit() || char == '.' }; error = "" }, KeyboardType.Number)
        SheetPickerField("Date", appointmentDateLabel(date), "Pick date", onClick = { showDatePicker = true })
        Box {
            SheetPickerField(
                label = "Payment Method",
                value = financeMethodLabel(method),
                placeholder = "Select payment method",
                onClick = { showMethodMenu = true },
            )
            DropdownMenu(
                expanded = showMethodMenu,
                onDismissRequest = { showMethodMenu = false },
            ) {
                listOf("cash" to "Cash", "online" to "Online").forEach { (value, label) ->
                    DropdownMenuItem(
                        text = { Text(label) },
                        onClick = {
                            method = value
                            showMethodMenu = false
                        },
                    )
                }
            }
        }
        SheetPatientField("Notes", notes, { notes = it }, minLines = 2)
        if (users.isNotEmpty()) {
            Text("Staff Link", fontWeight = FontWeight.Bold, color = OpwInk)
            ChoiceChipRow(listOf("None") + users.map { it.name.ifBlank { it.email } }, users.firstOrNull { it.id == staffId }?.name ?: "None") { selected ->
                staffId = users.firstOrNull { (it.name.ifBlank { it.email }) == selected }?.id.orEmpty()
            }
        }
    }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = date,
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                date = it
                error = ""
                showDatePicker = false
            },
        )
    }
}

@Composable
private fun PayrollTab(
    payroll: JSONObject?,
    month: String,
    onMonthChange: (String) -> Unit,
    onApply: (String) -> Unit,
    onSave: (String?, JSONObject) -> Unit,
    onDelete: (JSONObject) -> Unit,
    canAdd: Boolean,
    canEdit: Boolean,
    addRequest: Int,
) {
    val summary = payroll?.objectValue("summary") ?: JSONObject()
    val staff = payroll?.array("staff")?.toJsonObjects().orEmpty()
    val payments = payroll?.array("payments")?.toJsonObjects().orEmpty()
    val monthLabel = payroll?.text("monthLabel").orEmpty().ifBlank { month }
    var editingPayment by remember { mutableStateOf<JSONObject?>(null) }
    var showPaymentDialog by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(addRequest) {
        if (addRequest > 0 && canAdd) {
            editingPayment = null
            showPaymentDialog = true
        }
    }

    if (showPaymentDialog) {
        PayrollPaymentDialog(
            payment = editingPayment,
            staff = staff,
            month = payroll?.text("month").orEmpty().ifBlank { month },
            onDismiss = {
                showPaymentDialog = false
                editingPayment = null
            },
            onSave = { id, payload ->
                onSave(id, payload)
                showPaymentDialog = false
                editingPayment = null
            },
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        PayrollMonthCard(
            month = month,
            monthLabel = monthLabel,
            onMonthChange = onMonthChange,
            onApply = { onApply(month) },
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Paid Staff",
                value = summary.optInt("paymentCount", 0).toString(),
                accent = moduleAccent(AdminTab.Payroll),
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Total Paid",
                value = formatMoney(summary.opt("totalAmount")),
                accent = OpwSuccess,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Base Salary",
                value = formatMoney(summary.opt("baseSalary")),
                accent = OpwBlue,
            )
            MetricCard(
                modifier = Modifier.weight(1f),
                label = "Bonus + Commission",
                value = formatMoney(summary.optDouble("bonus", 0.0) + summary.optDouble("commission", 0.0)),
                accent = OpwWarning,
            )
        }

        if (canAdd) {
            Button(
                onClick = {
                    editingPayment = null
                    showPaymentDialog = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(18.dp),
            ) {
                Text("Add Payroll Payment", fontWeight = FontWeight.ExtraBold)
            }
        }

        SectionCard(title = "Staff Salary Setup") {
            if (staff.isEmpty()) {
                InlineEmpty("No staff salary profiles available.")
            } else {
                staff.forEach { member ->
                    val alreadyPaid = member.optBoolean("alreadyPaid")
                    SimpleModuleCard(
                        title = member.text("name", fallback = member.text("email", fallback = "Staff")),
                        subtitle = listOf(
                            member.text("workType", fallback = "Staff"),
                            member.text("status", fallback = "Active"),
                        ).filter { it.isNotBlank() }.joinToString(" | "),
                        accent = if (alreadyPaid) OpwSuccess else moduleAccent(AdminTab.Payroll),
                        actions = {
                            StatusChip(
                                label = if (alreadyPaid) "Paid" else formatMoney(member.opt("monthlySalary")),
                                background = if (alreadyPaid) Color(0xFFDCFCE7) else Color(0xFFE0F2FE),
                                foreground = if (alreadyPaid) OpwSuccess else OpwBlue,
                            )
                        },
                    )
                }
            }
        }

        SectionCard(title = "Paid History") {
            if (payments.isEmpty()) {
                InlineEmpty("No payroll paid for this month yet.")
            } else {
                payments.forEach { payment ->
                    val title = payment.text(
                        "staffName",
                        "staffNameSnapshot",
                        fallback = "Staff payroll",
                    )
                    val subtitle = listOf(
                        payment.text("staffStatus", "staffStatusSnapshot", fallback = "Staff"),
                        appointmentDateLabel(payment.text("paidDate", fallback = "")),
                        payment.text("method", fallback = "Method not set"),
                    ).filter { it.isNotBlank() && it != "-" }.joinToString(" | ")
                    val content: @Composable RowScope.() -> Unit = {
                        StatusChip(
                            label = formatMoney(payment.opt("totalAmount")),
                            background = Color(0xFFDCFCE7),
                            foreground = OpwSuccess,
                        )
                    }

                    if (canEdit) {
                        SwipeDeleteModuleCard(
                            title = title,
                            subtitle = subtitle,
                            accent = moduleAccent(AdminTab.Payroll),
                            deleteTitle = "Delete payroll payment?",
                            deleteMessage = "This will remove the payroll record and linked finance expense.",
                            onClick = {
                                editingPayment = payment
                                showPaymentDialog = true
                            },
                            onDelete = { onDelete(payment) },
                            swipeEnabled = true,
                            actions = content,
                        )
                    } else {
                        SimpleModuleCard(
                            title = title,
                            subtitle = subtitle,
                            accent = moduleAccent(AdminTab.Payroll),
                            actions = content,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PayrollMonthCard(
    month: String,
    monthLabel: String,
    onMonthChange: (String) -> Unit,
    onApply: () -> Unit,
) {
    SectionCard(title = "Payroll Month") {
        Text(
            text = monthLabel,
            color = OpwInk,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
        )
        Text(
            text = "Use YYYY-MM format. Example: ${todayDateKey().take(7)}",
            color = OpwSlate,
            style = MaterialTheme.typography.bodyMedium,
        )
        SheetPatientField(
            label = "Month",
            value = month,
            onValueChange = { value ->
                onMonthChange(value.filter { char -> char.isDigit() || char == '-' }.take(7))
            },
            keyboardType = KeyboardType.Text,
        )
        Button(
            onClick = onApply,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(16.dp),
        ) {
            Text("Load Payroll", fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun PayrollPaymentDialog(
    payment: JSONObject?,
    staff: List<JSONObject>,
    month: String,
    onDismiss: () -> Unit,
    onSave: (String?, JSONObject) -> Unit,
) {
    val paymentId = payment?.text("id").orEmpty()
    val initialStaffId = payment?.text("staffId").orEmpty()
    var staffId by rememberSaveable(paymentId) {
        mutableStateOf(initialStaffId.ifBlank { staff.firstOrNull { !it.optBoolean("alreadyPaid") }?.text("id").orEmpty() })
    }
    var bonus by rememberSaveable(paymentId) {
        mutableStateOf(payment?.optDouble("bonus", 0.0)?.takeIf { it > 0.0 }?.toString().orEmpty())
    }
    var commission by rememberSaveable(paymentId) {
        mutableStateOf(payment?.optDouble("commission", 0.0)?.takeIf { it > 0.0 }?.toString().orEmpty())
    }
    var paidDate by rememberSaveable(paymentId) {
        mutableStateOf(payment?.text("paidDate").orEmpty().ifBlank { todayDateKey() })
    }
    var method by rememberSaveable(paymentId) { mutableStateOf(payment?.text("method").orEmpty()) }
    var notes by rememberSaveable(paymentId) { mutableStateOf(payment?.text("notes").orEmpty()) }
    var error by rememberSaveable { mutableStateOf("") }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    val selectedStaff = staff.firstOrNull { it.text("id") == staffId }
    val selectedStaffLabel = selectedStaff?.text("name", fallback = selectedStaff.text("email", fallback = "Staff"))
        ?: payment?.text("staffName", "staffNameSnapshot", fallback = "Select staff").orEmpty()
    val baseSalary = payment?.optDouble("baseSalary", 0.0)
        ?: selectedStaff?.optDouble("monthlySalary", 0.0)
        ?: 0.0
    val totalAmount = baseSalary + (bonus.toDoubleOrNull() ?: 0.0) + (commission.toDoubleOrNull() ?: 0.0)

    OpwBottomSheetDialog(
        title = if (payment == null) "Add Payroll" else "Edit Payroll",
        primaryLabel = if (payment == null) "Save Payroll" else "Update Payroll",
        onDismiss = onDismiss,
        onPrimary = {
            when {
                payment == null && staffId.isBlank() -> error = "Select staff member."
                paidDate.isBlank() -> error = "Choose paid date."
                totalAmount <= 0.0 -> error = "Set salary, bonus, or commission before saving."
                else -> onSave(
                    payment?.text("id"),
                    JSONObject()
                        .put("staffId", staffId)
                        .put("month", month)
                        .put("bonus", bonus.toDoubleOrNull() ?: 0.0)
                        .put("commission", commission.toDoubleOrNull() ?: 0.0)
                        .put("paidDate", paidDate)
                        .put("method", method.trim())
                        .put("notes", notes.trim()),
                )
            }
        },
    ) {
        if (error.isNotBlank()) {
            StatusBanner(message = error, tone = BannerTone.Error)
        }

        if (payment == null) {
            Text("Staff", fontWeight = FontWeight.Black, color = OpwInk)
            val availableStaff = staff.filter { !it.optBoolean("alreadyPaid") || it.text("id") == staffId }
            if (availableStaff.isEmpty()) {
                InlineEmpty("All staff are already paid for this month.")
            } else {
                ChoiceChipRow(
                    options = availableStaff.map { it.text("name", fallback = it.text("email", fallback = "Staff")) },
                    selected = selectedStaffLabel,
                ) { selected ->
                    staffId = availableStaff.firstOrNull {
                        it.text("name", fallback = it.text("email", fallback = "Staff")) == selected
                    }?.text("id").orEmpty()
                    error = ""
                }
            }
        } else {
            DetailRow("Staff", selectedStaffLabel)
        }

        DetailRow("Salary snapshot", formatMoney(baseSalary))
        DetailRow("Month", month)
        SheetPatientField(
            label = "Bonus",
            value = bonus,
            onValueChange = { bonus = it.filter { char -> char.isDigit() || char == '.' }; error = "" },
            keyboardType = KeyboardType.Decimal,
        )
        SheetPatientField(
            label = "Commission",
            value = commission,
            onValueChange = { commission = it.filter { char -> char.isDigit() || char == '.' }; error = "" },
            keyboardType = KeyboardType.Decimal,
        )
        DetailRow("Total payable", formatMoney(totalAmount))
        SheetPickerField("Paid Date", appointmentDateLabel(paidDate), "Pick date", onClick = { showDatePicker = true })
        SheetPatientField("Payment Method", method, { method = it })
        SheetPatientField("Notes", notes, { notes = it }, minLines = 2)
    }

    if (showDatePicker) {
        AppointmentDatePickerDialog(
            selectedDate = paidDate,
            onDismiss = { showDatePicker = false },
            onDateSelected = {
                paidDate = it
                error = ""
                showDatePicker = false
            },
        )
    }
}

@Composable
private fun ReportFilterCard(
    fromDate: String,
    toDate: String,
    loading: Boolean,
    activePreset: String = "",
    onPresetSelected: ((String) -> Unit)? = null,
    onFromClick: () -> Unit,
    onToClick: () -> Unit,
    onApply: () -> Unit,
) {
    Card(
        modifier = Modifier.border(1.dp, Color.White.copy(alpha = 0.9f), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp),
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF2F7FF))))
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Report Range", color = OpwInk, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleLarge)
                    Text("Pick dates and refresh clinic numbers.", color = Color(0xFF64748B))
                }
                StatusChip(
                    label = "LIVE",
                    background = OpwBlue.copy(alpha = 0.1f),
                    foreground = OpwBlue,
                )
            }
            if (onPresetSelected != null) {
                ChoiceChipRow(
                    options = listOf("All", "Yearly", "Monthly", "Today"),
                    selected = financePresetLabel(activePreset),
                    onSelected = { selected -> onPresetSelected(selected.lowercase()) },
                )
            }
            SheetPickerField(
                label = "From Date",
                value = appointmentDateLabel(fromDate),
                placeholder = "Select start date",
                onClick = onFromClick,
            )
            SheetPickerField(
                label = "To Date",
                value = appointmentDateLabel(toDate),
                placeholder = "Select end date",
                onClick = onToClick,
            )
            Button(
                onClick = onApply,
                enabled = !loading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(if (loading) "Loading report..." else "Apply Report", fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
private fun ReportInsightCard(
    fromDate: String,
    toDate: String,
    summary: JSONObject,
    appointmentCount: Int,
    sessionCount: Int,
    paymentCount: Int,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF172554), Color(0xFF1D4ED8), Color(0xFF0F766E)),
                    ),
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "${appointmentDateLabel(fromDate)} to ${appointmentDateLabel(toDate)}",
                color = Color.White.copy(alpha = 0.78f),
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(
                text = formatMoney(summary.opt("paymentAmount")),
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                text = "Payments from $paymentCount records with $appointmentCount appointments and $sessionCount sessions.",
                color = Color.White.copy(alpha = 0.76f),
            )
        }
    }
}

@Composable
private fun ReportRecordsSection(
    title: String,
    emptyMessage: String,
    items: List<JSONObject>,
    accent: Color,
    itemContent: @Composable (JSONObject) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SectionTitle(title)
        StatusChip(
            label = items.size.toString(),
            background = accent.copy(alpha = 0.12f),
            foreground = accent,
        )
    }
    if (items.isEmpty()) {
        EmptyStateCard(title = "No $title", message = emptyMessage)
    } else {
        items.take(20).forEach { item ->
            itemContent(item)
        }
    }
}

@Composable
private fun ReportRecordCard(
    title: String,
    subtitle: String,
    status: String,
    statusColor: Color,
    rows: List<Pair<String, String>>,
    actions: (@Composable ColumnScope.() -> Unit)? = null,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(15.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AccentOrb(accent = statusColor, label = title)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(title, color = OpwInk, fontWeight = FontWeight.ExtraBold)
                        Text(subtitle, color = Color(0xFF64748B), style = MaterialTheme.typography.bodySmall)
                    }
                }
                StatusChip(
                    label = status.ifBlank { "Open" },
                    background = statusColor.copy(alpha = 0.12f),
                    foreground = statusColor,
                )
            }
            rows.filter { it.second.isNotBlank() }.forEach { row ->
                DetailRow(row.first, row.second)
            }
            actions?.invoke(this)
        }
    }
}

private enum class ChatPanel {
    New,
    Old,
    Thread,
}

@Composable
private fun ChatTab(
    conversations: List<JSONObject>,
    currentUser: StaffUser?,
    onRead: (JSONObject) -> Unit,
    onReply: (JSONObject, String) -> Unit,
    canEdit: Boolean,
    searchOpen: Boolean,
    onSearchOpenChange: (Boolean) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedId by rememberSaveable { mutableStateOf("") }
    var panel by rememberSaveable { mutableStateOf(ChatPanel.New) }
    var returnPanel by rememberSaveable { mutableStateOf(ChatPanel.New) }
    val selectedConversation = conversations.firstOrNull { it.text("id") == selectedId }
    val newChats = remember(conversations) { conversations.filter { it.optBoolean("unreadForAgent") } }
    val oldChats = remember(conversations) { conversations.filterNot { it.optBoolean("unreadForAgent") } }
    val listPanel = if (panel == ChatPanel.Thread && selectedConversation == null) returnPanel else panel
    val sourceConversations = when (listPanel) {
        ChatPanel.Old -> oldChats
        else -> newChats
    }
    val filteredConversations = remember(sourceConversations, query) {
        val keyword = query.trim().lowercase()
        if (keyword.isBlank()) {
            sourceConversations
        } else {
            sourceConversations.filter { conversation ->
                conversation.text("visitorName").lowercase().contains(keyword) ||
                    conversation.text("visitorContact").lowercase().contains(keyword) ||
                    conversation.array("messages").toJsonObjects().any { message ->
                        message.text("text", "senderName").lowercase().contains(keyword)
                    }
            }
        }
    }

    if (panel == ChatPanel.Thread && selectedConversation != null) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            SimpleScreenHeader(
                title = selectedConversation.text("visitorName", fallback = "Chat"),
                onBack = {
                    selectedId = ""
                    panel = returnPanel
                },
            )
            ChatThreadCard(
                conversation = selectedConversation,
                currentUser = currentUser,
                onRead = if (canEdit) { { onRead(selectedConversation) } } else null,
                onReply = if (canEdit) { { message -> onReply(selectedConversation, message) } } else null,
            )
        }
        return
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        ChatPanelSwitch(
            selected = listPanel,
            newCount = newChats.size,
            oldCount = oldChats.size,
            onSelected = {
                selectedId = ""
                panel = it
            },
        )
        if (searchOpen || query.isNotBlank()) {
            ModuleSearchField(
                label = "Search chats",
                query = query,
                onQueryChange = { query = it },
                onClose = {
                    query = ""
                    onSearchOpenChange(false)
                },
            )
        }

        if (filteredConversations.isEmpty()) {
            EmptyStateCard(
                title = if (listPanel == ChatPanel.Old) "No old chats" else "No new chats",
                message = if (listPanel == ChatPanel.Old) {
                    "Read conversations will move here after visitors start chatting with the website team."
                } else {
                    "New website chats will appear here only when a visitor sends a message."
                },
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                filteredConversations.forEach { conversation ->
                    ChatConversationRow(
                        conversation = conversation,
                        selected = false,
                        onClick = {
                            returnPanel = panel
                            selectedId = conversation.text("id")
                            panel = ChatPanel.Thread
                            if (canEdit && conversation.optBoolean("unreadForAgent")) {
                                onRead(conversation)
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ChatPanelSwitch(
    selected: ChatPanel,
    newCount: Int,
    oldCount: Int,
    onSelected: (ChatPanel) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        FilterChip(
            selected = selected == ChatPanel.New,
            onClick = { onSelected(ChatPanel.New) },
            label = { Text("New Chats ($newCount)") },
        )
        FilterChip(
            selected = selected == ChatPanel.Old,
            onClick = { onSelected(ChatPanel.Old) },
            label = { Text("Old Chats ($oldCount)") },
        )
    }
}

@Composable
private fun ChatConversationRow(
    conversation: JSONObject,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val messages = conversation.array("messages").toJsonObjects()
    val lastMessage = messages.lastOrNull()
    val unread = conversation.optBoolean("unreadForAgent")
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = if (selected) Color.White else Color(0xFFF8FBFF),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (selected) OpwBlue.copy(alpha = 0.4f) else Color(0xFFE5EDF7),
        ),
        shadowElevation = if (selected) 4.dp else 1.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(if (unread) Color(0xFFDCFCE7) else Color(0xFFE2E8F0), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = conversation.text("visitorName", fallback = "V").take(1).uppercase(),
                    color = if (unread) OpwSuccess else Color(0xFF64748B),
                    fontWeight = FontWeight.ExtraBold,
                )
                if (unread) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(10.dp)
                            .background(OpwDanger, CircleShape),
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = conversation.text("visitorName", fallback = "Visitor"),
                        color = OpwInk,
                        fontWeight = if (unread) FontWeight.ExtraBold else FontWeight.SemiBold,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = formatTimestamp(conversation.text("updatedAt")).substringBefore(","),
                        color = Color(0xFF94A3B8),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Text(
                    text = conversation.text("visitorContact", fallback = "No contact shared"),
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    text = lastMessage?.text("text")?.ifBlank {
                        val count = lastMessage.array("attachments").length()
                        if (count > 0) "$count attachment${if (count == 1) "" else "s"}" else "No messages yet"
                    } ?: "No messages yet",
                    color = Color(0xFF475569),
                    maxLines = 1,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

@Composable
private fun ChatThreadCard(
    conversation: JSONObject,
    currentUser: StaffUser?,
    onRead: (() -> Unit)?,
    onReply: ((String) -> Unit)?,
) {
    var reply by remember(conversation.text("id")) { mutableStateOf("") }
    val messages = conversation.array("messages").toJsonObjects()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE5EDF7), RoundedCornerShape(28.dp)),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F766E))
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AccentOrb(accent = Color(0xFF99F6E4), label = conversation.text("visitorName", fallback = "V"))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = conversation.text("visitorName", fallback = "Visitor"),
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        text = conversation.text("visitorContact", fallback = "No contact shared"),
                        color = Color.White.copy(alpha = 0.74f),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                if (conversation.optBoolean("unreadForAgent") && onRead != null) {
                    TextButton(onClick = onRead) {
                        Text("Read", color = Color.White)
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF1F5F9))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (messages.isEmpty()) {
                    Text(
                        text = "No messages yet.",
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(12.dp),
                    )
                } else {
                    messages.forEach { message ->
                        ChatBubble(message = message)
                    }
                }
            }

            if (onReply != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(22.dp),
                        color = Color(0xFFF8FAFC),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    ) {
                        BasicTextField(
                            value = reply,
                            onValueChange = { reply = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 13.dp),
                            textStyle = MaterialTheme.typography.bodyLarge.copy(color = OpwInk),
                            cursorBrush = SolidColor(OpwBlue),
                            decorationBox = { innerTextField ->
                                Box(contentAlignment = Alignment.CenterStart) {
                                    if (reply.isBlank()) {
                                        Text(
                                            text = "Reply as ${currentUser?.name?.ifBlank { "staff" } ?: "staff"}",
                                            color = Color(0xFF94A3B8),
                                        )
                                    }
                                    innerTextField()
                                }
                            },
                        )
                    }
                    Surface(
                        shape = CircleShape,
                        color = if (reply.trim().isBlank()) Color(0xFFCBD5E1) else Color(0xFF0F766E),
                        shadowElevation = 3.dp,
                        onClick = {
                            val message = reply.trim()
                            if (message.isNotBlank()) {
                                onReply(message)
                                reply = ""
                            }
                        },
                    ) {
                        Box(modifier = Modifier.size(48.dp), contentAlignment = Alignment.Center) {
                            SendGlyph(Color.White)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatBubble(message: JSONObject) {
    val fromAgent = message.text("senderType") == "agent"
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (fromAgent) Arrangement.End else Arrangement.Start,
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = if (fromAgent) 20.dp else 6.dp,
                bottomEnd = if (fromAgent) 6.dp else 20.dp,
            ),
            color = if (fromAgent) Color(0xFF0F766E) else Color.White,
            border = if (fromAgent) null else androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            shadowElevation = 1.dp,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                if (message.text("text").isNotBlank()) {
                    Text(
                        text = message.text("text"),
                        color = if (fromAgent) Color.White else OpwInk,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
                val attachmentCount = message.array("attachments").length()
                if (attachmentCount > 0) {
                    Text(
                        text = "$attachmentCount attachment${if (attachmentCount == 1) "" else "s"}",
                        color = if (fromAgent) Color.White.copy(alpha = 0.78f) else OpwBlue,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Text(
                    text = formatTimestamp(message.text("createdAt")).substringAfter(", ", formatTimestamp(message.text("createdAt"))),
                    color = if (fromAgent) Color.White.copy(alpha = 0.62f) else Color(0xFF94A3B8),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
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
    canManageSalary: Boolean,
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

                if (canManageSalary && formState.role == "Staff") {
                    OutlinedTextField(
                        value = formState.monthlySalary,
                        onValueChange = { value ->
                            onFormChange(formState.copy(monthlySalary = value.filter { it.isDigit() || it == '.' }))
                        },
                        label = { Text("Monthly salary") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Decimal,
                            imeAction = ImeAction.Next,
                        ),
                    )
                }

                Text("Role", fontWeight = FontWeight.Bold, color = OpwInk)
                ChoiceChipRow(
                    options = listOf("Staff", "Admin"),
                    selected = formState.role,
                    onSelected = { role ->
                        onFormChange(
                            formState.copy(
                                role = role,
                                monthlySalary = if (role == "Admin") "" else formState.monthlySalary,
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
private fun ProfileTab(
    user: StaffUser?,
    token: String?,
    error: String,
    loading: Boolean,
    onSave: (StaffUser, StaffFormState) -> Unit,
    onUploadImage: (StaffUser, PickedUploadFile) -> Unit,
) {
    if (user == null) {
        EmptyStateCard(
            title = "Profile unavailable",
            message = "Refresh the dashboard to load the current admin details.",
        )
        return
    }

    var showEditDialog by rememberSaveable { mutableStateOf(false) }
    var photoError by rememberSaveable { mutableStateOf("") }
    val context = LocalContext.current
    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val picked = readPickedUploadFile(context, uri)
            if (picked == null || !picked.mimeType.startsWith("image/")) {
                photoError = "Choose a valid profile image."
            } else {
                photoError = ""
                onUploadImage(user, picked)
            }
        }
    }

    if (showEditDialog) {
        ProfileEditDialog(
            user = user,
            error = error,
            loading = loading,
            onDismiss = { showEditDialog = false },
            onSave = { draft ->
                onSave(user, draft)
                if (validateCreateStaffForm(draft, requirePassword = false) == null) {
                    showEditDialog = false
                }
            },
        )
    }

    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(contentAlignment = Alignment.BottomEnd) {
                Box(
                    modifier = Modifier
                        .size(66.dp)
                        .background(OpwBlue.copy(alpha = 0.12f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    ProfilePhotoContent(user = user, token = token, modifier = Modifier.size(66.dp))
                }
                ModuleIconButton(color = OpwBlue, onClick = { photoPicker.launch("image/*") }) {
                    TinyEditGlyph(Color.White)
                }
            }
            if (photoError.isNotBlank()) {
                StatusBanner(message = photoError, tone = BannerTone.Error)
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = OpwInk,
                    )
                    Text("Manage your OPW profile details", color = Color(0xFF64748B))
                }
                ModuleIconButton(color = OpwBlue, onClick = { showEditDialog = true }) {
                    EditGlyph(OpwBlue)
                }
            }
            DetailRow("Role", user.role)
            DetailRow("Email", user.email)
            DetailRow("Mobile", user.mobile)
        }
    }
}

@Composable
private fun ProfileEditDialog(
    user: StaffUser,
    error: String,
    loading: Boolean,
    onDismiss: () -> Unit,
    onSave: (StaffFormState) -> Unit,
) {
    var draft by remember(user.id) { mutableStateOf(user.toStaffFormState()) }
    var localError by remember(user.id) { mutableStateOf("") }

    OpwBottomSheetDialog(
        title = "Edit Profile",
        primaryLabel = if (loading) "Saving..." else "Save Profile",
        onDismiss = onDismiss,
        onPrimary = {
            val validation = validateCreateStaffForm(draft, requirePassword = false)
            if (validation != null) {
                localError = validation
            } else {
                onSave(draft.copy(password = ""))
            }
        },
        onReset = {
            draft = user.toStaffFormState()
            localError = ""
        },
    ) {
        val visibleError = localError.ifBlank { error }
        if (visibleError.isNotBlank()) {
            StatusBanner(message = visibleError, tone = BannerTone.Error)
        }
        SheetPatientField("Full Name", draft.name, { draft = draft.copy(name = it); localError = "" })
        SheetPatientField("Email", draft.email, { draft = draft.copy(email = it); localError = "" }, keyboardType = KeyboardType.Email)
        SheetPatientField(
            label = "Mobile",
            value = draft.mobile,
            onValueChange = { value ->
                draft = draft.copy(mobile = value.filter(Char::isDigit).take(10))
                localError = ""
            },
            keyboardType = KeyboardType.Phone,
        )
    }
}

@Composable
private fun JsonListTab(
    title: String,
    emptyTitle: String,
    emptyMessage: String,
    items: List<JSONObject>,
    searchableFields: List<String>,
    headerAction: @Composable (() -> Unit)? = null,
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
            action = headerAction,
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
    onClick: (() -> Unit)? = null,
) {
    val shape = RoundedCornerShape(28.dp)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
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
private fun TreatmentDetailSuggestions(
    suggestions: List<String>,
    query: String,
    onSelected: (String) -> Unit,
) {
    val matches = remember(suggestions, query) {
        val keyword = query.trim()
        if (keyword.isBlank()) {
            suggestions.take(5)
        } else {
            suggestions
                .filter { it.contains(keyword, ignoreCase = true) && !it.equals(keyword, ignoreCase = true) }
                .take(5)
        }
    }

    if (matches.isEmpty()) return

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        matches.forEach { suggestion ->
            Surface(
                shape = RoundedCornerShape(999.dp),
                color = Color(0xFFE0FDF8),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFB8EFE7)),
                onClick = { onSelected(suggestion) },
            ) {
                Text(
                    text = suggestion,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    color = Color(0xFF0F766E),
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
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
    val motion = rememberStaffFloatingCardMotion(delayMillis = (label.length * 45).coerceAtMost(300))
    Card(
        modifier = modifier
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = shape,
                ambientColor = accent.copy(alpha = 0.13f),
                spotColor = accent.copy(alpha = 0.18f),
            )
            .border(1.dp, Color.White.copy(alpha = 0.86f), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
        elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
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
    val shape = RoundedCornerShape(30.dp)
    val motion = rememberStaffFloatingCardMotion(delayMillis = 120)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = shape,
                ambientColor = OpwBlue.copy(alpha = 0.1f),
                spotColor = OpwSky.copy(alpha = 0.14f),
            )
            .border(1.dp, Color(0xFFE5EDF7), shape),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
        elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
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
        AdminTab.Treatment -> state.treatmentTracker?.let { tracker ->
            tracker.array("appointmentRequests").length() +
                tracker.array("todaysAppointments").length() +
                tracker.array("todaysSessions").length() +
                tracker.array("followUpNeeded").length()
        } ?: 0
        AdminTab.Mailbox -> if (state.mailboxItems.isNotEmpty()) {
            state.mailboxItems.count { !it.optBoolean("isRead") }
        } else {
            state.applications.count { !it.isRead }
        }
        AdminTab.Notifications -> state.notificationItems.count { it.text("readAt").isBlank() }
        AdminTab.Services -> state.services.size
        AdminTab.Therapy -> state.therapyResources.size
        AdminTab.Shop -> state.shopOrders.size
        AdminTab.Marketing -> state.marketingSources.size
        AdminTab.Feedback -> state.feedbackItems.count { !it.optBoolean("isApproved") }
        AdminTab.Jobs -> state.jobRequirements.count {
            it.text("status", fallback = "Active") == "Active" && it.optBoolean("isPublished", true)
        }
        AdminTab.Reports -> state.reports?.objectValue("summary")?.optInt("paymentCount", 0) ?: 0
        AdminTab.Finance -> state.finance?.objectValue("summary")?.optInt("paidPatientCount", 0) ?: 0
        AdminTab.Payroll -> state.payroll?.objectValue("summary")?.optInt("paymentCount", 0) ?: 0
        AdminTab.Chat -> state.chatConversations.count { it.optBoolean("unreadForAgent") }
        AdminTab.Team -> state.users.size
        AdminTab.Create -> 0
        AdminTab.Profile -> 0
    }

private fun adminTabPermissionKey(tab: AdminTab): String? =
    when (tab) {
        AdminTab.Overview -> "dashboard"
        AdminTab.Patients -> "patients"
        AdminTab.Appointments -> "appointments"
        AdminTab.Treatment -> "treatment_tracker"
        AdminTab.Services -> "services"
        AdminTab.Therapy -> "therapy"
        AdminTab.Shop -> "shop"
        AdminTab.Marketing -> "marketing"
        AdminTab.Mailbox -> "mailbox"
        AdminTab.Notifications -> "notifications"
        AdminTab.Chat -> "chat"
        AdminTab.Team -> "staff"
        AdminTab.Feedback -> "feedback"
        AdminTab.Jobs -> "career"
        AdminTab.Reports -> "reports"
        AdminTab.Finance -> "finance"
        AdminTab.Payroll -> "payroll"
        AdminTab.Create,
        AdminTab.Profile -> null
    }

private fun hasModulePermission(user: StaffUser?, module: String?, action: String = "view"): Boolean {
    if (module.isNullOrBlank()) {
        return true
    }
    if (user?.role == "Admin") {
        return true
    }
    return user?.permissions.orEmpty().any { permission ->
        permission.module == module && when (action) {
            "add" -> permission.add
            "edit" -> permission.edit
            else -> permission.view
        }
    }
}

private fun canAddAdminTab(user: StaffUser?, tab: AdminTab): Boolean =
    hasModulePermission(user, adminTabPermissionKey(tab), "add")

private fun canEditAdminTab(user: StaffUser?, tab: AdminTab): Boolean =
    hasModulePermission(user, adminTabPermissionKey(tab), "edit")

private fun canOpenAdminTab(user: StaffUser?, tab: AdminTab): Boolean {
    if (tab == AdminTab.Profile) {
        return user != null
    }
    if (tab == AdminTab.Create || tab == AdminTab.Appointments) {
        return false
    }

    val isAdmin = user?.role == "Admin"
    if (tab.adminOnly) {
        return isAdmin
    }
    if (isAdmin) {
        return true
    }

    return hasModulePermission(user, adminTabPermissionKey(tab), "view")
}

private fun moduleErrorsForTab(tab: AdminTab, state: DashboardUiState): List<String> {
    val keys = when (tab) {
        AdminTab.Overview -> state.moduleErrors.keys.toList()
        AdminTab.Patients -> listOf("patients", "archived patients")
        AdminTab.Appointments -> listOf("appointments")
        AdminTab.Treatment -> listOf("treatment tracker")
        AdminTab.Mailbox -> listOf("mailbox", "applications")
        AdminTab.Notifications -> listOf("notifications")
        AdminTab.Services -> listOf("services")
        AdminTab.Therapy -> listOf("therapy")
        AdminTab.Shop -> listOf("shop products", "shop orders")
        AdminTab.Marketing -> listOf("marketing")
        AdminTab.Feedback -> listOf("feedback")
        AdminTab.Jobs -> listOf("job requirements")
        AdminTab.Reports -> listOf("reports")
        AdminTab.Finance -> listOf("finance")
        AdminTab.Payroll -> listOf("payroll")
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

private fun ongoingTreatmentPlan(patient: JSONObject): JSONObject? =
    patient.array("treatmentPlans")
        .toJsonObjects()
        .firstOrNull { it.text("status", fallback = "active").lowercase() == "active" }
        ?: patient.objectValue("activeTreatmentPlan")?.takeIf {
            it.text("status", fallback = "active").lowercase() == "active"
        }

private fun treatmentPeriodText(plan: JSONObject): String {
    val fromDate = plan.text("fromDate")
    val toDate = plan.text("toDate")
    return if (fromDate.isBlank() && toDate.isBlank()) {
        "Dates not added"
    } else {
        "${fromDate.ifBlank { "Start not added" }} to ${toDate.ifBlank { "End not added" }}"
    }
}

private fun treatmentTypeText(plan: JSONObject): String =
    plan.array("treatmentTypes").joinLabels().ifBlank {
        plan.text("treatmentTypes", "service", fallback = "Treatment session")
    }

private fun sortedTreatmentSessionDays(plan: JSONObject?): List<JSONObject> =
    plan?.array("sessionDays")
        ?.toJsonObjects()
        ?.sortedWith(
            compareByDescending<JSONObject> { it.text("date") }
                .thenByDescending { it.text("updatedAt") }
                .thenByDescending { it.text("createdAt") },
        )
        ?: emptyList()

private fun treatmentDetailSuggestions(sessionDays: List<JSONObject>): List<String> =
    sessionDays
        .map { it.text("treatmentType").trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.lowercase() }

private fun doneSessionCount(plan: JSONObject?): Int =
    sortedTreatmentSessionDays(plan)
        .count { day ->
            day.text("date").isNotBlank() && day.text("status", fallback = "done") == "done"
        }

private fun patientListTreatmentPlan(patient: JSONObject): JSONObject? =
    ongoingTreatmentPlan(patient)
        ?: patient.array("treatmentPlans").toJsonObjects().firstOrNull()

private fun patientVisitLocationText(patient: JSONObject, plan: JSONObject?): String {
    val planLocation = if (plan != null) {
        plan.text("treatmentLocationLabel", fallback = "")
            .ifBlank { plan.text("treatmentLocation", "serviceLocation", fallback = "") }
    } else {
        ""
    }

    if (planLocation.isNotBlank()) {
        return if (planLocation.startsWith("At ", ignoreCase = true)) {
            planLocation
        } else {
            formatServiceLocation(planLocation)
        }
    }

    val appointmentLocation = patient.array("appointments")
        .toJsonObjects()
        .firstOrNull()
        ?.text("serviceLocationLabel", fallback = "")
        ?.ifBlank {
            patient.array("appointments")
                .toJsonObjects()
                .firstOrNull()
                ?.text("serviceLocation", "locationPreference", fallback = "")
                .orEmpty()
        }
        .orEmpty()

    return if (appointmentLocation.startsWith("At ", ignoreCase = true)) {
        appointmentLocation
    } else {
        formatServiceLocation(appointmentLocation)
    }
}

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

private fun formatServiceLocation(value: String): String =
    if (value.trim().lowercase() == "home") "At home" else "At clinic"

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

private fun billingSettingsPayload(
    homeVisitCharge: String,
    clinicVisitCharge: String,
    firstConsultationCharge: String,
    discountType: String,
    discountValue: String,
    extraSessionDays: String,
): JSONObject =
    JSONObject()
        .put("homeVisitCharge", homeVisitCharge.toDoubleOrNull() ?: 500.0)
        .put("clinicVisitCharge", clinicVisitCharge.toDoubleOrNull() ?: 300.0)
        .put("firstConsultationCharge", firstConsultationCharge.toDoubleOrNull()?.coerceAtLeast(0.0) ?: 0.0)
        .put("discountType", discountType.ifBlank { "none" })
        .put("discountValue", discountValue.toDoubleOrNull() ?: 0.0)
        .put("extraSessionDays", extraSessionDays.toIntOrNull()?.coerceAtLeast(0) ?: 0)

private fun calculateTreatmentBilling(plan: JSONObject): TreatmentBilling {
    val settings = plan.optJSONObject("billingSettings") ?: JSONObject()
    val homeVisitCharge = settings.optDouble("homeVisitCharge", 500.0).takeIf { it > 0.0 } ?: 500.0
    val clinicVisitCharge = settings.optDouble("clinicVisitCharge", 300.0).takeIf { it > 0.0 } ?: 300.0
    val firstConsultationCharge = if (settings.has("firstConsultationCharge")) {
        settings.optDouble("firstConsultationCharge", 0.0).coerceAtLeast(0.0)
    } else {
        200.0
    }
    val discountType = settings.optString("discountType", "none").lowercase().let {
        if (it in listOf("percent", "amount")) it else "none"
    }
    val discountValue = settings.optDouble("discountValue", 0.0).takeIf { it > 0.0 } ?: 0.0
    val extraSessionDays = settings.optInt("extraSessionDays", 0).coerceAtLeast(0)
    val sessionCount = plan.array("sessionDays").toJsonObjects().count { it.text("date").isNotBlank() }
    val isHome = plan.text("treatmentLocation", "serviceLocation", fallback = "clinic").lowercase() == "home"
    val sessionRate = if (isHome) homeVisitCharge else clinicVisitCharge
    val sessionSubtotal = sessionCount * sessionRate
    val consultationCharge = firstConsultationCharge
    val discountAmount = when (discountType) {
        "percent" -> (sessionSubtotal * discountValue.coerceAtMost(100.0) / 100.0).coerceAtMost(sessionSubtotal)
        "amount" -> discountValue.coerceAtMost(sessionSubtotal + consultationCharge)
        else -> 0.0
    }
    val payableAmount = (sessionSubtotal + consultationCharge - discountAmount).coerceAtLeast(0.0)
    val paidAmount = plan.array("payments").toJsonObjects().sumOf { it.optDouble("amount", 0.0) }
    val balanceAmount = (payableAmount - paidAmount).coerceAtLeast(0.0)
    val availableBalance = (paidAmount - payableAmount).coerceAtLeast(0.0)

    return TreatmentBilling(
        homeVisitCharge = homeVisitCharge,
        clinicVisitCharge = clinicVisitCharge,
        firstConsultationCharge = firstConsultationCharge,
        discountType = discountType,
        discountValue = discountValue,
        extraSessionDays = extraSessionDays,
        sessionCount = sessionCount,
        sessionRate = sessionRate,
        sessionSubtotal = sessionSubtotal,
        consultationCharge = consultationCharge,
        discountAmount = discountAmount,
        payableAmount = payableAmount,
        paidAmount = paidAmount,
        balanceAmount = balanceAmount,
        availableBalance = availableBalance,
        availableSessionDays = (if (sessionRate > 0.0) ceil(availableBalance / sessionRate).toInt() else 0) + extraSessionDays,
    )
}

private fun appointmentStatusLabel(status: String): String =
    when (status.trim().lowercase()) {
        "completed" -> "Done"
        "cancelled", "canceled" -> "Cancelled"
        "rescheduled" -> "Rescheduled"
        "pending" -> "Pending"
        else -> "Scheduled"
    }

private fun List<JSONObject>.patientRequestsFor(patient: JSONObject): List<JSONObject> {
    val patientId = patient.text("id")
    val email = patient.text("email").lowercase()
    val mobile = patient.text("mobile")

    return filter { request ->
        val requestPatientId = request.text("patientId")
        val requestEmail = request.text("email").lowercase()
        val requestPhone = request.text("phone")

        (patientId.isNotBlank() && requestPatientId == patientId) ||
            (email.isNotBlank() && requestEmail == email) ||
            (mobile.isNotBlank() && requestPhone == mobile)
    }
}

private fun formatBytes(value: Long): String =
    when {
        value <= 0 -> "0 B"
        value < 1024 -> "$value B"
        value < 1024L * 1024L -> "${value / 1024L} KB"
        else -> "${value / (1024L * 1024L)} MB"
    }

private fun readPickedUploadFile(context: Context, uri: Uri, fallbackName: String = "therapy-file"): PickedUploadFile? =
    runCatching {
        val resolver = context.contentResolver
        val name = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0 && cursor.moveToFirst()) cursor.getString(index) else null
        }.orEmpty().ifBlank { fallbackName }
        val mimeType = resolver.getType(uri).orEmpty().ifBlank {
            if (name.endsWith(".jpg", ignoreCase = true) || name.endsWith(".jpeg", ignoreCase = true)) {
                "image/jpeg"
            } else {
                "application/octet-stream"
            }
        }
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() } ?: return@runCatching null
        val optimized = optimizeUploadFile(name = name, mimeType = mimeType, bytes = bytes)
        PickedUploadFile(name = optimized.name, mimeType = optimized.mimeType, bytes = optimized.bytes)
    }.getOrNull()

private fun optimizeUploadFile(name: String, mimeType: String, bytes: ByteArray): PickedUploadFile {
    if (!mimeType.startsWith("image/") || bytes.size <= 850 * 1024) {
        return PickedUploadFile(name = name, mimeType = mimeType, bytes = bytes)
    }

    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        ?: return PickedUploadFile(name = name, mimeType = mimeType, bytes = bytes)
    val largestSide = max(bitmap.width, bitmap.height).coerceAtLeast(1)
    val scale = (1600f / largestSide).coerceAtMost(1f)
    val targetWidth = (bitmap.width * scale).roundToInt().coerceAtLeast(1)
    val targetHeight = (bitmap.height * scale).roundToInt().coerceAtLeast(1)
    val scaled = if (targetWidth == bitmap.width && targetHeight == bitmap.height) {
        bitmap
    } else {
        android.graphics.Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }

    var quality = 82
    var outputBytes: ByteArray
    do {
        val output = ByteArrayOutputStream()
        scaled.compress(android.graphics.Bitmap.CompressFormat.JPEG, quality, output)
        outputBytes = output.toByteArray()
        quality -= 8
    } while (outputBytes.size > 850 * 1024 && quality >= 50)

    if (scaled !== bitmap) {
        scaled.recycle()
    }
    bitmap.recycle()

    val uploadName = name.substringBeforeLast('.', missingDelimiterValue = name).ifBlank { "clinical-photo" } + ".jpg"
    return PickedUploadFile(name = uploadName, mimeType = "image/jpeg", bytes = outputBytes)
}

private fun createClinicalCaptureUri(context: Context): Uri? =
    runCatching {
        val folder = File(context.cacheDir, "clinical_captures").apply { mkdirs() }
        val file = File(folder, "clinical-photo-${System.currentTimeMillis()}.jpg")
        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }.getOrNull()

private fun renderPdfFirstPage(context: Context, bytes: ByteArray): ImageBitmap? =
    runCatching {
        val file = File(context.cacheDir, "clinical-preview-${System.currentTimeMillis()}.pdf")
        file.writeBytes(bytes)
        ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
            PdfRenderer(descriptor).use { renderer ->
                if (renderer.pageCount == 0) return@runCatching null
                renderer.openPage(0).use { page ->
                    val width = page.width.coerceAtLeast(1)
                    val height = page.height.coerceAtLeast(1)
                    val bitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmap.asImageBitmap()
                }
            }
        }.also {
            file.delete()
        }
    }.getOrNull()

private fun absoluteProfileImageUrl(value: String): String {
    val trimmed = value.trim()
    if (trimmed.isBlank()) return ""
    if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
        return trimmed
    }
    return "${StaffApiService.DEFAULT_BASE_URL.trimEnd('/')}/${trimmed.trimStart('/')}"
}

private fun absoluteApiAssetUrl(value: String): String =
    absoluteProfileImageUrl(value)

private fun openApiAsset(context: Context, value: String) {
    val url = absoluteApiAssetUrl(value)
    if (url.isBlank()) return
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}

private fun openExternalUrl(context: Context, url: String) {
    val trimmed = url.trim()
    if (trimmed.isBlank()) return
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(trimmed)))
    }
}

private fun normalizePhone(value: String): String =
    value.filter(Char::isDigit)

private fun marketingTypeLabel(value: String): String =
    marketingTypeOptions.firstOrNull { it.first == value.trim() }?.second ?: "Medical Shop"

private fun marketingStatusLabel(value: String): String =
    marketingStatusOptions.firstOrNull { it.first == value.trim() }?.second ?: "New Lead"

private fun sortMarketingSources(sources: List<JSONObject>): List<JSONObject> {
    val rank = mapOf(
        "converted" to 0,
        "interested" to 1,
        "follow_up" to 2,
        "visited" to 3,
        "new" to 4,
        "not_interested" to 5,
    )

    return sources.sortedWith(
        compareBy<JSONObject> { rank[it.text("pitchStatus", "status", fallback = "new")] ?: 9 }
            .thenByDescending { it.text("updatedAt", "createdAt") },
    )
}

private suspend fun loadProfileImage(url: String, token: String?): ImageBitmap? =
    withContext(Dispatchers.IO) {
        runCatching {
            val connection = URL(url).openConnection()
            if (!token.isNullOrBlank()) {
                connection.setRequestProperty("Authorization", "Bearer $token")
            }
            connection.getInputStream().use { input ->
                BitmapFactory.decodeStream(input)?.asImageBitmap()
            }
        }.getOrNull()
    }

private suspend fun loadClinicalAssetBytes(downloadUrl: String, token: String): ByteArray =
    withContext(Dispatchers.IO) {
        val url = absoluteApiAssetUrl(downloadUrl)
        if (url.isBlank()) return@withContext ByteArray(0)
        val connection = URL(url).openConnection()
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.getInputStream().use { input -> input.readBytes() }
    }

private fun statusColor(status: String): Color =
    when (status.trim().lowercase()) {
        "approved", "confirmed", "completed", "done", "active", "delivered", "paid" -> OpwSuccess
        "rejected", "cancelled", "canceled", "failed", "missed", "inactive" -> OpwDanger
        "pending", "processing", "not_done" -> OpwWarning
        else -> OpwBlue
    }

private fun todayDateKey(): String =
    LocalDate.now(ZoneId.of("Asia/Kolkata")).toString()

private fun allFinanceStartDateKey(): String = "2000-01-01"

private fun yearStartDateKey(): String =
    LocalDate.now().withDayOfYear(1).toString()

private fun financePresetRange(preset: String): Pair<String, String> {
    val today = todayDateKey()
    return when (preset.lowercase()) {
        "all" -> allFinanceStartDateKey() to today
        "yearly" -> yearStartDateKey() to today
        "today" -> today to today
        else -> monthStartDateKey() to today
    }
}

private fun financePresetLabel(preset: String): String =
    when (preset.lowercase()) {
        "all" -> "All"
        "yearly" -> "Yearly"
        "monthly" -> "Monthly"
        "today" -> "Today"
        else -> ""
    }

private fun financeMethodValue(method: String): String =
    when (method.trim().lowercase()) {
        "online" -> "online"
        else -> "cash"
    }

private fun financeMethodLabel(method: String): String =
    when (financeMethodValue(method)) {
        "online" -> "Online"
        else -> "Cash"
    }

private fun appointmentDateLabel(date: String): String =
    runCatching {
        LocalDate.parse(date.trim()).format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
    }.getOrElse {
        date.trim()
    }

private fun appointmentDatePickerMillis(date: String): Long? =
    runCatching {
        LocalDate.parse(date.trim())
            .atStartOfDay(ZoneOffset.UTC)
            .toInstant()
            .toEpochMilli()
    }.getOrNull()

private fun appointmentDateKeyFromMillis(millis: Long): String =
    Instant.ofEpochMilli(millis)
        .atZone(ZoneOffset.UTC)
        .toLocalDate()
        .toString()

private fun appointmentTimeParts(time: String): Pair<Int, Int> {
    val match = Regex("""^(\d{1,2}):(\d{2})""").find(time.trim())
    val parsedHour = match?.groupValues?.getOrNull(1)?.toIntOrNull()
    val parsedMinute = match?.groupValues?.getOrNull(2)?.toIntOrNull()
    if (parsedHour != null && parsedMinute != null && parsedHour in 0..23 && parsedMinute in 0..59) {
        return parsedHour to parsedMinute
    }

    val now = LocalTime.now()
    return now.hour to now.minute
}

private fun appointmentTimeKey(hour: Int, minute: Int): String =
    "${hour.coerceIn(0, 23).toString().padStart(2, '0')}:${minute.coerceIn(0, 59).toString().padStart(2, '0')}"

private fun appointmentTimeLabel(time: String): String =
    if (time.isBlank()) {
        ""
    } else {
        runCatching {
            val parts = appointmentTimeParts(time)
            LocalTime.of(parts.first, parts.second).format(DateTimeFormatter.ofPattern("hh:mm a"))
        }.getOrElse {
            time.trim()
        }
    }

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

private fun validateCreateStaffForm(form: StaffFormState, requirePassword: Boolean = true): String? {
    if (form.name.trim().length < 2) {
        return "Staff name must be at least 2 characters."
    }

    if (!Patterns.EMAIL_ADDRESS.matcher(form.email.trim()).matches()) {
        return "Please enter a valid email address."
    }

    if (!form.mobile.trim().matches(Regex("\\d{10}"))) {
        return "Please enter a valid 10-digit mobile number."
    }

    if ((requirePassword || form.password.isNotBlank()) && form.password.length < 6) {
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

private class StaffOfflineStore(context: Context) {
    private val prefs = context.getSharedPreferences("opw_staff_offline_store", Context.MODE_PRIVATE)

    fun saveDashboard(userId: String, state: DashboardUiState) {
        if (userId.isBlank()) return
        prefs.edit()
            .putString("dashboard:$userId", state.toCacheJson().toString())
            .apply()
    }

    fun loadDashboard(userId: String): DashboardUiState? {
        if (userId.isBlank()) return null
        val raw = prefs.getString("dashboard:$userId", null) ?: return null
        return runCatching { JSONObject(raw).toDashboardUiState() }.getOrNull()
    }

    fun enqueueMutation(userId: String, type: String, payload: JSONObject) {
        if (userId.isBlank()) return
        val pending = JSONArray(prefs.getString("mutations:$userId", "[]") ?: "[]")
        pending.put(
            JSONObject()
                .put("id", "offline-${System.currentTimeMillis()}")
                .put("type", type)
                .put("payload", payload)
                .put("createdAt", Instant.now().toString()),
        )
        prefs.edit().putString("mutations:$userId", pending.toString()).apply()
    }

    fun pendingMutations(userId: String): List<JSONObject> {
        if (userId.isBlank()) return emptyList()
        val raw = prefs.getString("mutations:$userId", "[]") ?: "[]"
        return runCatching { JSONArray(raw).toJsonObjects() }.getOrDefault(emptyList())
    }

    fun replaceMutations(userId: String, mutations: List<JSONObject>) {
        if (userId.isBlank()) return
        val next = JSONArray()
        mutations.forEach { next.put(it) }
        prefs.edit().putString("mutations:$userId", next.toString()).apply()
    }

    fun pendingCount(userId: String): Int = pendingMutations(userId).size
}

private fun DashboardUiState.toCacheJson(): JSONObject =
    JSONObject()
        .put("admin", admin?.toJson() ?: JSONObject.NULL)
        .put("users", users.toJsonArray { it.toJson() })
        .put("applications", applications.toJsonArray { it.toJson() })
        .put("patients", patients.toJsonArray())
        .put("archivedPatients", archivedPatients.toJsonArray())
        .put("appointments", appointments.toJsonArray())
        .put("mailboxItems", mailboxItems.toJsonArray())
        .put("notificationItems", notificationItems.toJsonArray())
        .put("services", services.toJsonArray())
        .put("therapyResources", therapyResources.toJsonArray())
        .put("shopProducts", shopProducts.toJsonArray())
        .put("shopOrders", shopOrders.toJsonArray())
        .put("marketingSources", marketingSources.toJsonArray())
        .put("feedbackItems", feedbackItems.toJsonArray())
        .put("jobRequirements", jobRequirements.toJsonArray())
        .put("reports", reports ?: JSONObject.NULL)
        .put("finance", finance ?: JSONObject.NULL)
        .put("payroll", payroll ?: JSONObject.NULL)
        .put("chatConversations", chatConversations.toJsonArray())
        .put("treatmentTracker", treatmentTracker ?: JSONObject.NULL)

private fun JSONObject.toDashboardUiState(): DashboardUiState =
    DashboardUiState(
        loading = false,
        admin = objectValue("admin")?.toStaffUser(),
        users = array("users").toJsonObjects().map { it.toStaffUser() },
        applications = array("applications").toJsonObjects().map { it.toStaffApplication() },
        patients = array("patients").toJsonObjects(),
        archivedPatients = array("archivedPatients").toJsonObjects(),
        appointments = array("appointments").toJsonObjects(),
        mailboxItems = array("mailboxItems").toJsonObjects(),
        notificationItems = array("notificationItems").toJsonObjects(),
        services = array("services").toJsonObjects(),
        therapyResources = array("therapyResources").toJsonObjects(),
        shopProducts = array("shopProducts").toJsonObjects(),
        shopOrders = array("shopOrders").toJsonObjects(),
        marketingSources = array("marketingSources").toJsonObjects(),
        feedbackItems = array("feedbackItems").toJsonObjects(),
        jobRequirements = array("jobRequirements").toJsonObjects(),
        reports = objectValue("reports"),
        finance = objectValue("finance"),
        payroll = objectValue("payroll"),
        chatConversations = array("chatConversations").toJsonObjects(),
        treatmentTracker = objectValue("treatmentTracker"),
    )

private fun StaffApplication.toJson(): JSONObject =
    JSONObject()
        .put("id", id)
        .put("name", name)
        .put("email", email)
        .put("phone", phone)
        .put("role", role)
        .put("experience", experience)
        .put("message", message)
        .put("isRead", isRead)
        .put("createdAt", createdAt)

private fun List<JSONObject>.toJsonArray(): JSONArray {
    val array = JSONArray()
    forEach { item -> array.put(JSONObject(item.toString())) }
    return array
}

private fun <T> List<T>.toJsonArray(mapper: (T) -> JSONObject): JSONArray {
    val array = JSONArray()
    forEach { item -> array.put(mapper(item)) }
    return array
}

private fun networkErrorMessage(baseUrl: String, error: Exception): String {
    val detail = error.localizedMessage?.takeIf { it.isNotBlank() }
        ?: error::class.java.simpleName
    return "Unable to reach $baseUrl. $detail"
}
