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
import com.example.opw_staff.ui.theme.OpwBorder
import com.example.opw_staff.ui.theme.OpwDanger
import com.example.opw_staff.ui.theme.OpwInk
import com.example.opw_staff.ui.theme.OpwMist
import com.example.opw_staff.ui.theme.OpwSky
import com.example.opw_staff.ui.theme.OpwStaffTheme
import com.example.opw_staff.ui.theme.OpwSuccess
import com.example.opw_staff.ui.theme.OpwWarning
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
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

private enum class AdminTab(val label: String) {
    Overview("Dashboard"),
    Patients("Patients"),
    Appointments("Appointments"),
    Treatment("Treatment"),
    Mailbox("Mailbox"),
    Services("Services"),
    Therapy("Therapy"),
    Shop("Shop"),
    Chat("Chat"),
    Team("Staff"),
    Create("Create Staff"),
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
    val chatConversations: List<JSONObject> = emptyList(),
    val treatmentTracker: JSONObject? = null,
    val moduleErrors: Map<String, String> = emptyMap(),
    val error: String = "",
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
            .background(OpwMist),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = OpwBlue)
            Spacer(modifier = Modifier.height(16.dp))
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
                    colors = listOf(Color(0xFFEFF6FF), Color(0xFFF8FAFC), Color.White),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 10.dp),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 26.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "OPW Staff Admin",
                    style = MaterialTheme.typography.headlineSmall,
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
    onTabSelected: (AdminTab) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onFormChange: (StaffFormState) -> Unit,
    onCreateStaff: () -> Unit,
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
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
            ModalDrawerSheet {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "OPW Staff",
                        style = MaterialTheme.typography.titleLarge,
                        color = OpwInk,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Text(
                        text = state.admin?.role ?: session?.user?.role ?: "Staff",
                        color = Color(0xFF64748B),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    DividerLine()
                    AdminTab.entries.forEach { tab ->
                        NavigationDrawerItem(
                            label = {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(tab.label)
                                    val count = moduleCount(tab, state)
                                    if (count > 0) {
                                        Text(
                                            text = count.toString(),
                                            color = Color(0xFF64748B),
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                    }
                                }
                            },
                            selected = selectedTab == tab,
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
        Scaffold(containerColor = OpwMist) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                HeroHeader(
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
                        color = OpwBlue,
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

                    AdminTab.Patients -> PatientsTab(patients = state.patients)
                    AdminTab.Appointments -> AppointmentsTab(appointments = state.appointments)
                    AdminTab.Treatment -> TreatmentTab(tracker = state.treatmentTracker)
                    AdminTab.Mailbox -> MailboxTab(items = state.mailboxItems, applications = state.applications)
                    AdminTab.Services -> ServicesTab(services = state.services)
                    AdminTab.Therapy -> TherapyTab(resources = state.therapyResources)
                    AdminTab.Shop -> ShopTab(products = state.shopProducts, orders = state.shopOrders)
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

@Composable
private fun HeroHeader(
    adminName: String,
    adminRole: String,
    teamCount: Int,
    mailboxCount: Int,
    onMenu: () -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF0F172A), Color(0xFF1D4ED8), Color(0xFF38BDF8)),
                ),
                shape = RoundedCornerShape(30.dp),
            )
            .padding(20.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(
                text = "OPW ADMIN FLOW",
                style = MaterialTheme.typography.labelLarge,
                color = Color.White.copy(alpha = 0.7f),
            )
            Text(
                text = if (adminName.isBlank()) "Staff workspace" else "Welcome, $adminName",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
            )
            Text(
                text = "Role: ${adminRole.ifBlank { "Staff" }}  |  Team: $teamCount  |  Mailbox: $mailboxCount",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.84f),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onMenu) {
                    Text("Menu")
                }
                OutlinedButton(onClick = onRefresh) {
                    Text("Refresh")
                }
                TextButton(onClick = onLogout) {
                    Text("Logout", color = Color.White)
                }
            }
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
private fun PatientsTab(patients: List<JSONObject>) {
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
        )
    }
}

@Composable
private fun AppointmentsTab(appointments: List<JSONObject>) {
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
private fun MailboxTab(items: List<JSONObject>, applications: List<StaffApplication>) {
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
        )
    }
}

@Composable
private fun ServicesTab(services: List<JSONObject>) {
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
        )
    }
}

@Composable
private fun TherapyTab(resources: List<JSONObject>) {
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
        )
    }
}

@Composable
private fun ShopTab(products: List<JSONObject>, orders: List<JSONObject>) {
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
            )
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

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = OpwInk,
            )
            StatusChip(
                label = "${filteredItems.size}/${items.size}",
                background = Color(0xFFE2E8F0),
                foreground = Color(0xFF334155),
            )
        }
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )
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
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = OpwInk,
    )
}

@Composable
private fun RecordCard(
    title: String,
    subtitle: String,
    status: String,
    rows: List<Pair<String, String>>,
    statusColor: Color = OpwBlue,
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = OpwInk,
                    )
                    Text(
                        text = subtitle,
                        color = Color(0xFF64748B),
                        style = MaterialTheme.typography.bodyMedium,
                    )
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
        }
    }
}

@Composable
private fun PermissionCard(
    permission: StaffPermission,
    onPermissionChange: (StaffPermission) -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = OpwMist,
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
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
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
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
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(accent, CircleShape),
            )
            Text(label, color = Color(0xFF64748B))
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
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
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
        shape = RoundedCornerShape(20.dp),
        color = background,
    ) {
        Text(
            text = message,
            color = foreground,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
        )
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
        modifier = Modifier.fillMaxWidth(),
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
