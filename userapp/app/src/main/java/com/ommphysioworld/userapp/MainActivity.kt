@file:OptIn(
    androidx.compose.foundation.layout.ExperimentalLayoutApi::class,
    androidx.compose.material3.ExperimentalMaterial3Api::class,
)

package com.ommphysioworld.userapp

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import android.widget.VideoView
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import com.ommphysioworld.userapp.data.ApiException
import com.ommphysioworld.userapp.data.AppApiService
import com.ommphysioworld.userapp.data.AppStorage
import com.ommphysioworld.userapp.data.JsonMap
import com.ommphysioworld.userapp.data.UploadFile
import com.ommphysioworld.userapp.data.asJsonMap
import com.ommphysioworld.userapp.data.asJsonMapList
import com.ommphysioworld.userapp.data.listOfMaps
import com.ommphysioworld.userapp.data.map
import com.ommphysioworld.userapp.data.number
import com.ommphysioworld.userapp.data.string
import com.ommphysioworld.userapp.data.stringOrNull
import com.ommphysioworld.userapp.ui.theme.OmmPhysioWorldTheme
import com.ommphysioworld.userapp.ui.theme.OpwBlue
import com.ommphysioworld.userapp.ui.theme.OpwBorder
import com.ommphysioworld.userapp.ui.theme.OpwDanger
import com.ommphysioworld.userapp.ui.theme.OpwInk
import com.ommphysioworld.userapp.ui.theme.OpwMist
import com.ommphysioworld.userapp.ui.theme.OpwSky
import com.ommphysioworld.userapp.ui.theme.OpwSlate
import com.ommphysioworld.userapp.ui.theme.OpwSuccess
import com.ommphysioworld.userapp.ui.theme.OpwWarning
import com.ommphysioworld.userapp.util.FormValidators
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            OmmPhysioWorldTheme {
                OmmPhysioWorldApp()
            }
        }
    }
}

private enum class AppRoute {
    Loading,
    Onboarding,
    Login,
    Register,
    ForgotPassword,
    Dashboard,
    Profile,
}

private enum class DashboardTab(val label: String) {
    Overview("Overview"),
    Appointments("Appointments"),
    Therapy("Therapy"),
    Sessions("Sessions"),
    Payments("Payments"),
    Orders("Orders"),
    Public("Public"),
}

private enum class PublicSection(val label: String) {
    About("About"),
    Shop("Shop"),
    Faq("FAQ"),
    Chat("Live Chat"),
}

private val FlatShape = RoundedCornerShape(0.dp)

private data class DashboardSnapshot(
    val patient: JsonMap? = null,
    val appointmentRequests: List<JsonMap> = emptyList(),
    val services: List<JsonMap> = emptyList(),
    val shopOrders: List<JsonMap> = emptyList(),
    val loading: Boolean = true,
)

private data class NotificationItem(
    val id: String,
    val title: String,
    val body: String,
    val timestamp: Instant? = null,
)

private data class OnboardingPage(
    val eyebrow: String,
    val title: String,
    val description: String,
    val accent: Color,
    val chips: List<String>,
    val highlights: List<String>,
)

private fun ApiException.isSessionExpired(): Boolean {
    val messageText = message.orEmpty()
    return statusCode == 401 ||
        messageText.contains("session invalid", ignoreCase = true) ||
        messageText.contains("invalid session", ignoreCase = true) ||
        messageText.contains("jwt", ignoreCase = true) ||
        messageText.contains("token", ignoreCase = true) ||
        messageText.contains("unauthorized", ignoreCase = true)
}

@Composable
private fun OmmPhysioWorldApp() {
    val context = LocalContext.current
    val storage = remember { AppStorage(context.applicationContext) }
    val apiService = remember { AppApiService(storage) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var route by remember { mutableStateOf(AppRoute.Loading) }
    var sessionUser by remember { mutableStateOf<JsonMap?>(null) }

    fun showMessage(message: String) {
        scope.launch {
            snackbarHostState.showSnackbar(message)
        }
    }

    fun handleAuthenticatedError(error: ApiException) {
        if (error.isSessionExpired()) {
            storage.clearPatientUser()
            storage.clearConversationId()
            sessionUser = null
            route = AppRoute.Login
            showMessage("Your session ended. Please log in again.")
        } else {
            showMessage(error.message.orEmpty())
        }
    }

    LaunchedEffect(Unit) {
        delay(350)
        sessionUser = storage.getPatientUser()
        route = when {
            storage.shouldShowOnboarding() -> AppRoute.Onboarding
            sessionUser != null -> AppRoute.Dashboard
            else -> AppRoute.Login
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
                AppRoute.Onboarding -> OnboardingScreen(
                    onFinish = {
                        storage.setOnboardingSeen()
                        route = if (sessionUser != null) AppRoute.Dashboard else AppRoute.Login
                    },
                )

                AppRoute.Login -> LoginScreen(
                    apiService = apiService,
                    onOpenRegister = { route = AppRoute.Register },
                    onOpenForgotPassword = { route = AppRoute.ForgotPassword },
                    onLoggedIn = { user ->
                        sessionUser = user
                        storage.savePatientUser(user)
                        route = AppRoute.Dashboard
                    },
                    showMessage = ::showMessage,
                )

                AppRoute.Register -> RegisterScreen(
                    apiService = apiService,
                    onBack = { route = AppRoute.Login },
                    onRegistered = { user ->
                        sessionUser = user
                        storage.savePatientUser(user)
                        route = AppRoute.Dashboard
                    },
                    showMessage = ::showMessage,
                )

                AppRoute.ForgotPassword -> ForgotPasswordScreen(
                    apiService = apiService,
                    onBack = { route = AppRoute.Login },
                    showMessage = ::showMessage,
                )

                AppRoute.Dashboard -> {
                    val user = sessionUser
                    if (user == null) {
                        route = AppRoute.Login
                    } else {
                        DashboardScreen(
                            user = user,
                            apiService = apiService,
                            storage = storage,
                            onLogout = {
                                storage.clearPatientUser()
                                storage.clearConversationId()
                                sessionUser = null
                                route = AppRoute.Login
                            },
                            onOpenProfile = { route = AppRoute.Profile },
                            showMessage = ::showMessage,
                            onAuthError = ::handleAuthenticatedError,
                        )
                    }
                }

                AppRoute.Profile -> {
                    val user = sessionUser
                    if (user == null) {
                        route = AppRoute.Login
                    } else {
                        ProfileScreen(
                            user = user,
                            apiService = apiService,
                            storage = storage,
                            onBack = { route = AppRoute.Dashboard },
                            onSessionUserUpdated = { updated ->
                                sessionUser = updated
                                storage.savePatientUser(updated)
                            },
                            showMessage = ::showMessage,
                            onAuthError = ::handleAuthenticatedError,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    SoftAuthBackground {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedSplashBrand()
        }
    }
}

@Composable
private fun OnboardingScreen(onFinish: () -> Unit) {
    val pages = remember {
        listOf(
            OnboardingPage(
                eyebrow = "WELCOME TO OPW",
                title = "Physiotherapy care, made simple.",
                description = "Explore OPW, clinic details, and support in a cleaner native Android app.",
                accent = OpwBlue,
                chips = listOf("Baripada", "Guided Care"),
                highlights = listOf(
                    "Discover clinic details and public support quickly.",
                    "Start with a cleaner first-run experience made for Android.",
                ),
            ),
            OnboardingPage(
                eyebrow = "STAY CONNECTED",
                title = "Keep your care updates in one place.",
                description = "Your notes, appointments, sessions, and payments stay together after login.",
                accent = OpwSky,
                chips = listOf("Notes", "Appointments"),
                highlights = listOf(
                    "View treatment updates without jumping across screens.",
                    "Track appointments, therapy, and payments in one patient space.",
                ),
            ),
            OnboardingPage(
                eyebrow = "MOVE FORWARD",
                title = "Request care and follow recovery easily.",
                description = "Book appointments and stay informed without a messy flow.",
                accent = Color(0xFF0284C7),
                chips = listOf("Easy Requests", "Secure Access"),
                highlights = listOf(
                    "Send appointment requests with the same OPW flow.",
                    "Stay connected with live support and progress updates.",
                ),
            ),
        )
    }
    var index by rememberSaveable { mutableIntStateOf(0) }
    val page = pages[index]

    SoftAuthBackground {
        Scaffold(containerColor = Color.Transparent) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    TextButton(onClick = onFinish) {
                        Text("Skip", color = Color(0xFF475569))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                AnimatedOnboardingBrand()
                Spacer(modifier = Modifier.height(26.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = Color.White.copy(alpha = 0.96f),
                    shape = RoundedCornerShape(30.dp),
                    shadowElevation = 12.dp,
                    tonalElevation = 0.dp,
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Surface(
                                color = page.accent.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(18.dp),
                            ) {
                                Text(
                                    text = page.eyebrow,
                                    color = page.accent,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                )
                            }
                            Text(
                                text = "Step ${index + 1} of ${pages.size}",
                                color = OpwSlate,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(modifier = Modifier.height(18.dp))
                        Text(
                            text = page.title,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = page.description,
                            style = MaterialTheme.typography.bodyLarge,
                            color = OpwSlate,
                        )
                        Spacer(modifier = Modifier.height(18.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            page.chips.forEach { chip ->
                                Surface(
                                    color = page.accent.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(18.dp),
                                ) {
                                    Text(
                                        text = chip,
                                        color = page.accent,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(18.dp))
                        page.highlights.forEachIndexed { itemIndex, highlight ->
                            OnboardingFeatureTile(
                                text = highlight,
                                accent = if (itemIndex % 2 == 0) page.accent else OpwBlue,
                            )
                            if (itemIndex != page.highlights.lastIndex) {
                                Spacer(modifier = Modifier.height(10.dp))
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    pages.forEachIndexed { pageIndex, _ ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(8.dp)
                                .background(
                                    color = if (pageIndex == index) page.accent else Color(0xFFDDE7F2),
                                    shape = CircleShape,
                                ),
                        )
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { index = (index - 1).coerceAtLeast(0) },
                        enabled = index > 0,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(22.dp),
                    ) {
                        Text("Back")
                    }
                    Button(
                        onClick = {
                            if (index == pages.lastIndex) {
                                onFinish()
                            } else {
                                index += 1
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFB8F58F),
                            contentColor = Color(0xFF1F2937),
                        ),
                        shape = RoundedCornerShape(22.dp),
                    ) {
                        Text(if (index == pages.lastIndex) "Enter OPW" else "Continue", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun LoginScreen(
    apiService: AppApiService,
    onOpenRegister: () -> Unit,
    onOpenForgotPassword: () -> Unit,
    onLoggedIn: (JsonMap) -> Unit,
    showMessage: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordHidden by rememberSaveable { mutableStateOf(true) }
    var submitting by remember { mutableStateOf(false) }

    SoftAuthBackground {
        Scaffold(
            containerColor = Color.Transparent,
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(modifier = Modifier.height(28.dp))
                AuthBrandHeader()
                Spacer(modifier = Modifier.height(34.dp))
                ModernRoundedField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = "Enter your Email",
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                )
                Spacer(modifier = Modifier.height(20.dp))
                ModernRoundedField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = "Enter your Password",
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    hidden = passwordHidden,
                    onToggleHidden = { passwordHidden = !passwordHidden },
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    TextButton(onClick = onOpenForgotPassword) {
                        Text("Forgot password?", color = Color(0xFF475569))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                ModernPrimaryButton(
                    onClick = {
                        val emailError = FormValidators.email(email)
                        if (emailError != null) {
                            showMessage(emailError)
                            return@ModernPrimaryButton
                        }
                        if (password.trim().isEmpty()) {
                            showMessage("Please enter both email and password.")
                            return@ModernPrimaryButton
                        }
                        scope.launch {
                            submitting = true
                            try {
                                val response = apiService.login(email.trim(), password.trim())
                                val user = response["user"].asJsonMap()
                                if (user != null) {
                                    showMessage(response["message"]?.toString() ?: "Login successful.")
                                    onLoggedIn(user + mapOf("token" to response["token"]))
                                } else {
                                    showMessage("Login completed, but patient details were missing.")
                                }
                            } catch (error: ApiException) {
                                showMessage(error.message.orEmpty())
                            } finally {
                                submitting = false
                            }
                        }
                    },
                    enabled = !submitting,
                    label = "Continue",
                    loading = submitting,
                )
                Spacer(modifier = Modifier.height(24.dp))
                ModernOrDivider()
                Spacer(modifier = Modifier.height(24.dp))
                SocialSignButton(
                    symbol = "G",
                    label = "Sign in with Google",
                    onClick = { showMessage("Google sign-in can be added next.") },
                )
                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("New patient?", color = OpwSlate)
                    TextButton(onClick = onOpenRegister) {
                        Text("Register", color = Color(0xFF1E293B))
                    }
                }
            }
        }
    }
}

@Composable
private fun RegisterScreen(
    apiService: AppApiService,
    onBack: () -> Unit,
    onRegistered: (JsonMap) -> Unit,
    showMessage: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var passwordHidden by rememberSaveable { mutableStateOf(true) }
    var confirmPasswordHidden by rememberSaveable { mutableStateOf(true) }
    var submitting by remember { mutableStateOf(false) }

    SoftAuthBackground {
        Scaffold(
            containerColor = Color.Transparent,
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                AuthTopRow(onBack = onBack, chipText = "Create account")
                Spacer(modifier = Modifier.height(20.dp))
                AuthBrandHeader(
                    title = "Create your account",
                    subtitle = "Join OPW with a modern native experience.",
                )
                Spacer(modifier = Modifier.height(30.dp))
                ModernRoundedField(value = name, onValueChange = { name = it }, placeholder = "Enter your Name", keyboardType = KeyboardType.Text, imeAction = ImeAction.Next)
                Spacer(modifier = Modifier.height(16.dp))
                ModernRoundedField(value = email, onValueChange = { email = it }, placeholder = "Enter your Email", keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
                Spacer(modifier = Modifier.height(16.dp))
                ModernRoundedField(value = phone, onValueChange = { phone = it }, placeholder = "Enter your Phone Number", keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next)
                Spacer(modifier = Modifier.height(16.dp))
                ModernRoundedField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = "Enter your Password",
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Next,
                    hidden = passwordHidden,
                    onToggleHidden = { passwordHidden = !passwordHidden },
                )
                Spacer(modifier = Modifier.height(16.dp))
                ModernRoundedField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    placeholder = "Confirm your Password",
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    hidden = confirmPasswordHidden,
                    onToggleHidden = { confirmPasswordHidden = !confirmPasswordHidden },
                )
                Spacer(modifier = Modifier.height(22.dp))
                ModernPrimaryButton(
                    onClick = {
                        if (name.trim().length < 2) {
                            showMessage("Full name must be at least 2 characters.")
                            return@ModernPrimaryButton
                        }
                        val emailError = FormValidators.email(email)
                        if (emailError != null) {
                            showMessage(emailError)
                            return@ModernPrimaryButton
                        }
                        val phoneError = FormValidators.phone(phone)
                        if (phoneError != null) {
                            showMessage(phoneError)
                            return@ModernPrimaryButton
                        }
                        if (password.length < 6) {
                            showMessage("Password must be at least 6 characters.")
                            return@ModernPrimaryButton
                        }
                        if (password != confirmPassword) {
                            showMessage("Password and confirm password must match.")
                            return@ModernPrimaryButton
                        }
                        scope.launch {
                            submitting = true
                            try {
                                val response = apiService.register(
                                    name = name.trim(),
                                    email = email.trim().lowercase(),
                                    mobile = FormValidators.cleanPhone(phone),
                                    password = password,
                                )
                                val user = response["user"].asJsonMap()
                                if (user != null) {
                                    showMessage(response["message"]?.toString() ?: "Account created successfully.")
                                    onRegistered(user + mapOf("token" to response["token"]))
                                } else {
                                    showMessage("Registration completed, but patient details were missing.")
                                }
                            } catch (error: ApiException) {
                                showMessage(error.message.orEmpty())
                            } finally {
                                submitting = false
                            }
                        }
                    },
                    enabled = !submitting,
                    label = "Create Account",
                    loading = submitting,
                )
                Spacer(modifier = Modifier.height(20.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Already have an account?", color = OpwSlate)
                    TextButton(onClick = onBack) {
                        Text("Login", color = Color(0xFF1E293B))
                    }
                }
            }
        }
    }
}

@Composable
private fun ForgotPasswordScreen(
    apiService: AppApiService,
    onBack: () -> Unit,
    showMessage: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }

    SoftAuthBackground {
        Scaffold(
            containerColor = Color.Transparent,
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                AuthTopRow(onBack = onBack, chipText = "Recovery")
                Spacer(modifier = Modifier.height(20.dp))
                AuthBrandHeader(
                    title = "Forgot Password",
                    subtitle = "Enter your email to receive a temporary password.",
                )
                Spacer(modifier = Modifier.height(34.dp))
                ModernRoundedField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = "Enter your Email",
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Done,
                )
                Spacer(modifier = Modifier.height(24.dp))
                ModernPrimaryButton(
                    onClick = {
                        val emailError = FormValidators.email(email)
                        if (emailError != null) {
                            showMessage(emailError)
                            return@ModernPrimaryButton
                        }
                        scope.launch {
                            submitting = true
                            try {
                                val response = apiService.requestPasswordReset(email.trim())
                                showMessage(response["message"]?.toString() ?: "A temporary password has been sent to your email.")
                                onBack()
                            } catch (error: ApiException) {
                                showMessage(error.message.orEmpty())
                            } finally {
                                submitting = false
                            }
                        }
                    },
                    enabled = !submitting,
                    label = "Send Password",
                    loading = submitting,
                )
                Spacer(modifier = Modifier.height(18.dp))
                Text(
                    text = "We’ll help you get back into your account quickly.",
                    color = OpwSlate,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun DashboardScreen(
    user: JsonMap,
    apiService: AppApiService,
    storage: AppStorage,
    onLogout: () -> Unit,
    onOpenProfile: () -> Unit,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val patientId = user.string("patientId")
    var activeTab by rememberSaveable { mutableStateOf(DashboardTab.Overview) }
    var publicSection by rememberSaveable { mutableStateOf(PublicSection.About) }
    var snapshot by remember(patientId) { mutableStateOf(DashboardSnapshot()) }
    var dismissedNotificationIds by remember(patientId) { mutableStateOf(storage.getDismissedNotificationIds(patientId)) }
    var showNotifications by remember { mutableStateOf(false) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    fun refreshDashboard() {
        scope.launch {
            snapshot = snapshot.copy(loading = true)
            try {
                snapshot = loadDashboardSnapshot(apiService, patientId)
            } catch (error: ApiException) {
                snapshot = snapshot.copy(loading = false)
                onAuthError(error)
            }
        }
    }

    LaunchedEffect(patientId) {
        refreshDashboard()
    }

    val notifications = remember(snapshot) {
        buildNotifications(snapshot.patient, snapshot.appointmentRequests)
    }
    val activeNotifications = notifications.filterNot { it.id in dismissedNotificationIds }
    val unreadCount = activeNotifications.size
    val drawerProfileUrl = snapshot.patient
        .stringOrNull("profileImageUrl")
        ?.takeIf { it.isNotBlank() }
        ?.let(apiService::resolveResourceUrl)
        .orEmpty()

    if (showNotifications) {
        AlertDialog(
            onDismissRequest = { showNotifications = false },
            shape = RoundedCornerShape(12.dp),
            confirmButton = {
                TextButton(onClick = { showNotifications = false }) {
                    Text("Close")
                }
            },
            title = {
                Text("Notifications")
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    if (activeNotifications.isEmpty()) {
                        Text(
                            text = "OPW updates for therapy, appointments, sessions, payments, and orders will appear here.",
                            color = OpwSlate,
                        )
                    } else {
                        activeNotifications.forEach { item ->
                            NoticeCard(
                                title = item.title,
                                body = item.body,
                                stamp = formatNotificationTime(item.timestamp),
                                unread = true,
                                onClick = {
                                    val nextDismissed = dismissedNotificationIds + item.id
                                    dismissedNotificationIds = nextDismissed
                                    storage.saveDismissedNotificationIds(patientId, nextDismissed)
                                },
                            )
                        }
                    }
                }
            },
        )
    }

    val topBarTitle = if (activeTab == DashboardTab.Public) {
        "Public | ${publicSection.label}"
    } else {
        activeTab.label
    }
    val primaryDrawerTabs = listOf(
        DashboardTab.Overview,
        DashboardTab.Appointments,
        DashboardTab.Therapy,
        DashboardTab.Sessions,
        DashboardTab.Payments,
    )
    val publicTopSections = listOf(PublicSection.About)
    val publicBottomSections = listOf(PublicSection.Faq, PublicSection.Chat)

    SoftAuthBackground {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                Surface(
                    color = Color(0xFFFFFEFB),
                    shape = FlatShape,
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(320.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFFFFFEFB)),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(190.dp)
                                .offset(x = (-52).dp, y = (-28).dp)
                                .background(Color(0x3322C55E), CircleShape),
                        )
                        Box(
                            modifier = Modifier
                                .size(138.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = 42.dp, y = 60.dp)
                                .background(Color(0x1AA3E635), CircleShape),
                        )
                        Box(
                            modifier = Modifier
                                .size(150.dp)
                                .align(Alignment.BottomStart)
                                .offset(x = (-64).dp, y = 36.dp)
                                .background(Color(0x1422C55E), CircleShape),
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(bottom = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White.copy(alpha = 0.76f))
                                    .padding(horizontal = 18.dp, vertical = 24.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp),
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box {
                                        PatientAvatar(
                                            name = user.stringOrNull("name") ?: "Patient",
                                            imageUrl = drawerProfileUrl,
                                            modifier = Modifier.size(56.dp),
                                        )
                                        Surface(
                                            modifier = Modifier
                                                .align(Alignment.BottomEnd)
                                                .offset(x = 4.dp, y = 4.dp)
                                                .clickable {
                                                    scope.launch { drawerState.close() }
                                                    onOpenProfile()
                                                },
                                            color = OpwBlue,
                                            shape = CircleShape,
                                            shadowElevation = 6.dp,
                                        ) {
                                            Box(
                                                modifier = Modifier.padding(6.dp),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                PencilGlyph(Color.White)
                                            }
                                        }
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = user.stringOrNull("name") ?: "Patient",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Black,
                                            color = OpwInk,
                                        )
                                        Text(
                                            text = "Patient account",
                                            color = OpwSlate,
                                            style = MaterialTheme.typography.bodyMedium,
                                        )
                                    }
                                }
                            }
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                primaryDrawerTabs.forEach { tab ->
                                    val selected = activeTab == tab
                                    NavigationDrawerItem(
                                        label = { Text(tab.label, fontWeight = FontWeight.Bold) },
                                        icon = {
                                            DashboardTabGlyph(tab = tab, tint = if (selected) OpwBlue else OpwSlate)
                                        },
                                        selected = selected,
                                        onClick = {
                                            activeTab = tab
                                            scope.launch { drawerState.close() }
                                        },
                                        shape = RoundedCornerShape(18.dp),
                                        colors = NavigationDrawerItemDefaults.colors(
                                            selectedContainerColor = Color(0xFFE2F8E8),
                                            selectedIconColor = OpwBlue,
                                            selectedTextColor = OpwBlue,
                                            unselectedContainerColor = Color.Transparent,
                                            unselectedIconColor = OpwSlate,
                                            unselectedTextColor = OpwInk,
                                        ),
                                    )
                                }
                                HorizontalDivider(color = Color(0xFFD9E4D8))
                                publicTopSections.forEach { section ->
                                    val selected = activeTab == DashboardTab.Public && publicSection == section
                                    NavigationDrawerItem(
                                        label = { Text(section.label, fontWeight = FontWeight.Bold) },
                                        icon = {
                                            PublicSectionGlyph(section = section, tint = if (selected) OpwBlue else OpwSlate)
                                        },
                                        selected = selected,
                                        onClick = {
                                            activeTab = DashboardTab.Public
                                            publicSection = section
                                            scope.launch { drawerState.close() }
                                        },
                                        shape = RoundedCornerShape(18.dp),
                                        colors = NavigationDrawerItemDefaults.colors(
                                            selectedContainerColor = Color(0xFFE2F8E8),
                                            selectedIconColor = OpwBlue,
                                            selectedTextColor = OpwBlue,
                                            unselectedContainerColor = Color.Transparent,
                                            unselectedIconColor = OpwSlate,
                                            unselectedTextColor = OpwInk,
                                        ),
                                    )
                                }
                                publicBottomSections.forEach { section ->
                                    val selected = activeTab == DashboardTab.Public && publicSection == section
                                    NavigationDrawerItem(
                                        label = { Text(section.label, fontWeight = FontWeight.Bold) },
                                        icon = {
                                            PublicSectionGlyph(section = section, tint = if (selected) OpwBlue else OpwSlate)
                                        },
                                        selected = selected,
                                        onClick = {
                                            activeTab = DashboardTab.Public
                                            publicSection = section
                                            scope.launch { drawerState.close() }
                                        },
                                        shape = RoundedCornerShape(18.dp),
                                        colors = NavigationDrawerItemDefaults.colors(
                                            selectedContainerColor = Color(0xFFE2F8E8),
                                            selectedIconColor = OpwBlue,
                                            selectedTextColor = OpwBlue,
                                            unselectedContainerColor = Color.Transparent,
                                            unselectedIconColor = OpwSlate,
                                            unselectedTextColor = OpwInk,
                                        ),
                                    )
                                }
                                HorizontalDivider(color = Color(0xFFD9E4D8))
                                NavigationDrawerItem(
                                    label = { Text("Logout", fontWeight = FontWeight.Bold, color = OpwDanger) },
                                    icon = {
                                        PowerGlyph(tint = OpwDanger)
                                    },
                                    selected = false,
                                    onClick = {
                                        scope.launch { drawerState.close() }
                                        onLogout()
                                    },
                                    shape = RoundedCornerShape(18.dp),
                                    colors = NavigationDrawerItemDefaults.colors(
                                        selectedContainerColor = Color(0xFFFFE6E6),
                                        selectedIconColor = OpwDanger,
                                        selectedTextColor = OpwDanger,
                                        unselectedContainerColor = Color.Transparent,
                                        unselectedIconColor = OpwDanger,
                                        unselectedTextColor = OpwDanger,
                                    ),
                                )
                                TextButton(
                                    onClick = {
                                        context.openUrl("https://ommphysioworld.com")
                                        scope.launch { drawerState.close() }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Text("Check our website", color = OpwBlue, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            },
        ) {
            Scaffold(
                containerColor = Color.Transparent,
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            AnimatedTopBarBrand()
                            Text(
                                text = topBarTitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = OpwSlate,
                            )
                        }
                    },
                    navigationIcon = {
                        IconCircleButton(onClick = { scope.launch { drawerState.open() } }) {
                            HamburgerGlyph()
                        }
                    },
                    actions = {
                        IconCircleButton(onClick = ::refreshDashboard) {
                            RefreshAssetIcon()
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        BadgedBox(
                            badge = {
                                if (unreadCount > 0) {
                                    Badge { Text(unreadCount.toString()) }
                                }
                            },
                        ) {
                            IconCircleButton(onClick = { showNotifications = true }) {
                                NotificationAssetIcon()
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                    ),
                )
            },
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
            ) {
                when (activeTab) {
                    DashboardTab.Overview -> OverviewTab(snapshot = snapshot, user = user)
                    DashboardTab.Appointments -> AppointmentsTab(
                        snapshot = snapshot,
                        user = user,
                        apiService = apiService,
                        onRefresh = ::refreshDashboard,
                        showMessage = showMessage,
                        onAuthError = onAuthError,
                    )

                    DashboardTab.Therapy -> TherapyTab(
                        snapshot = snapshot,
                        apiService = apiService,
                        showMessage = showMessage,
                    )
                    DashboardTab.Sessions -> SessionsTab(snapshot = snapshot)
                    DashboardTab.Payments -> PaymentsTab(snapshot = snapshot)
                    DashboardTab.Orders -> OrdersTab(snapshot = snapshot)
                    DashboardTab.Public -> PublicTab(
                        section = publicSection,
                        apiService = apiService,
                        storage = storage,
                        user = user,
                        onOrderPlaced = ::refreshDashboard,
                        showMessage = showMessage,
                        onAuthError = onAuthError,
                    )
                }
            }
        }
    }
    }
}

@Composable
private fun ProfileScreen(
    user: JsonMap,
    apiService: AppApiService,
    storage: AppStorage,
    onBack: () -> Unit,
    onSessionUserUpdated: (JsonMap) -> Unit,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val patientId = user.string("patientId")

    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var uploading by remember { mutableStateOf(false) }
    var changingPassword by remember { mutableStateOf(false) }
    var patient by remember { mutableStateOf<JsonMap?>(null) }
    var name by rememberSaveable { mutableStateOf(user.string("name")) }
    var email by rememberSaveable { mutableStateOf(user.string("email")) }
    var mobile by rememberSaveable { mutableStateOf(user.string("mobile")) }
    var disease by rememberSaveable { mutableStateOf("") }
    var oldPassword by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            scope.launch {
                val file = context.readUploadFile(uri)
                if (file == null) {
                    showMessage("Unable to read selected image. Please try again.")
                    return@launch
                }
                uploading = true
                try {
                    val updated = apiService.uploadPatientProfileImage(patientId, file)
                    patient = updated
                    val nextUser = user + mapOf(
                        "profileImageUrl" to updated["profileImageUrl"],
                    )
                    storage.savePatientUser(nextUser)
                    onSessionUserUpdated(nextUser)
                    showMessage("Profile image updated.")
                } catch (error: ApiException) {
                    onAuthError(error)
                } finally {
                    uploading = false
                }
            }
        }
    }

    fun loadPatient() {
        scope.launch {
            loading = true
            try {
                val response = apiService.getPatient(patientId)
                patient = response
                name = response.string("name")
                email = response.string("email")
                mobile = response.string("mobile")
                disease = response.string("disease")
            } catch (error: ApiException) {
                onAuthError(error)
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(patientId) {
        loadPatient()
    }

    val profileImageUrl = patient
        .stringOrNull("profileImageUrl")
        ?.takeIf { it.isNotBlank() }
        ?.let(apiService::resolveResourceUrl)
        .orEmpty()

    SoftAuthBackground {
        Scaffold(containerColor = Color.Transparent) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconCircleButton(onClick = onBack) {
                        BackArrowGlyph()
                    }
                    Text(
                        text = "Profile",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = OpwInk,
                    )
                    FilledIconButton(onClick = { loadPatient() }) {
                        if (loading) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("R")
                        }
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Surface(
                        color = Color.White.copy(alpha = 0.98f),
                        shape = CircleShape,
                        shadowElevation = 12.dp,
                        tonalElevation = 0.dp,
                    ) {
                        PatientAvatar(
                            name = name.ifBlank { "Patient" },
                            imageUrl = profileImageUrl,
                            modifier = Modifier.padding(8.dp).size(108.dp),
                        )
                    }
                    Button(
                        onClick = { imagePicker.launch(arrayOf("image/*")) },
                        enabled = !uploading,
                        shape = RoundedCornerShape(20.dp),
                    ) {
                        if (uploading) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text(if (profileImageUrl.isBlank()) "Add Profile Pic" else "Change Profile Pic")
                        }
                    }
                }

                SectionCard(title = "My Details", subtitle = "Update your patient profile details here.", showSubtitle = false) {
                AppTextField(value = name, onValueChange = { name = it }, label = "Full Name")
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(value = email, onValueChange = {}, label = "Email Address", enabled = false)
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(value = mobile, onValueChange = { mobile = it }, label = "Mobile Number", keyboardType = KeyboardType.Phone)
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(value = disease, onValueChange = { disease = it }, label = "Disease / Concern")
                Spacer(modifier = Modifier.height(12.dp))
                LabelValue(label = "Created From", value = createdFromLabel(patient.stringOrNull("createdFrom") ?: user.string("createdFrom")))
                Spacer(modifier = Modifier.height(10.dp))
                LabelValue(label = "Joined", value = formatDisplayDate(parseLocalDate(patient.string("createdAt"))))
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = {
                        if (name.trim().length < 2) {
                            showMessage("Full name must be at least 2 characters.")
                            return@Button
                        }
                        val phoneError = FormValidators.phone(mobile)
                        if (phoneError != null) {
                            showMessage(phoneError)
                            return@Button
                        }
                        scope.launch {
                            saving = true
                            try {
                                val updated = apiService.updatePatientProfile(
                                    patientId = patientId,
                                    name = name.trim(),
                                    mobile = FormValidators.cleanPhone(mobile),
                                    disease = disease.trim(),
                                )
                                patient = updated
                                val nextUser = user + mapOf(
                                    "name" to updated["name"],
                                    "email" to updated["email"],
                                    "mobile" to updated["mobile"],
                                    "patientId" to updated["id"],
                                    "createdFrom" to updated["createdFrom"],
                                )
                                storage.savePatientUser(nextUser)
                                onSessionUserUpdated(nextUser)
                                showMessage("Profile updated successfully.")
                            } catch (error: ApiException) {
                                onAuthError(error)
                            } finally {
                                saving = false
                            }
                        }
                    },
                    enabled = !saving,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (saving) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Save Profile")
                    }
                }
                }

                SectionCard(title = "Change Password", subtitle = "Update your password and keep your account secure.", showSubtitle = false) {
                AppTextField(value = oldPassword, onValueChange = { oldPassword = it }, label = "Old Password", hidden = true, keyboardType = KeyboardType.Password)
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(value = newPassword, onValueChange = { newPassword = it }, label = "New Password", hidden = true, keyboardType = KeyboardType.Password)
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(value = confirmPassword, onValueChange = { confirmPassword = it }, label = "Confirm New Password", hidden = true, keyboardType = KeyboardType.Password)
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = {
                        if (oldPassword.isBlank() || newPassword.isBlank() || confirmPassword.isBlank()) {
                            showMessage("Please fill in all password fields.")
                            return@Button
                        }
                        if (newPassword.length < 6) {
                            showMessage("New password must be at least 6 characters.")
                            return@Button
                        }
                        if (newPassword != confirmPassword) {
                            showMessage("New password and confirm password must match.")
                            return@Button
                        }
                        scope.launch {
                            changingPassword = true
                            try {
                                val response = apiService.changePassword(oldPassword, newPassword, confirmPassword)
                                oldPassword = ""
                                newPassword = ""
                                confirmPassword = ""
                                showMessage(response["message"]?.toString() ?: "Password changed successfully.")
                            } catch (error: ApiException) {
                                onAuthError(error)
                            } finally {
                                changingPassword = false
                            }
                        }
                    },
                    enabled = !changingPassword,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (changingPassword) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Change Password")
                    }
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = "Omm Physio World | Baripada, Odisha",
                color = Color.White.copy(alpha = 0.72f),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
            )
        }
    }
}
}

@Composable
private fun PublicTab(
    section: PublicSection,
    apiService: AppApiService,
    storage: AppStorage,
    user: JsonMap,
    onOrderPlaced: () -> Unit,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    when (section) {
        PublicSection.About -> AboutSection()
        PublicSection.Shop -> ShopSection(
            apiService = apiService,
            storage = storage,
            onOrderPlaced = onOrderPlaced,
            showMessage = showMessage,
            onAuthError = onAuthError,
        )
        PublicSection.Faq -> FaqSection()
        PublicSection.Chat -> ChatSection(
            apiService = apiService,
            storage = storage,
            user = user,
            showMessage = showMessage,
            onAuthError = onAuthError,
        )
    }
}

@Composable
private fun OverviewTab(snapshot: DashboardSnapshot, user: JsonMap) {
    val patient = snapshot.patient
    val appointments = patient.listOfMaps("appointments")
    val visibleRequests = visibleAppointmentRequests(patient, snapshot.appointmentRequests)
    val treatmentPlans = patient.listOfMaps("treatmentPlans")
    val payments = patient.listOfMaps("payments")
    val therapyRecommendations = patient.listOfMaps("therapyRecommendations")
    val notes = patient.listOfMaps("clinicalNotes")
    val pendingRequests = visibleRequests.count { it.string("status").lowercase().ifBlank { "pending" } == "pending" }
    val nextVisit = remember(appointments) {
        appointments
            .mapNotNull { appointment ->
                val date = parseLocalDate(appointment.stringOrNull("date")) ?: return@mapNotNull null
                Triple(
                    date,
                    appointment.stringOrNull("service") ?: "Appointment",
                    appointment.stringOrNull("time").orEmpty(),
                )
            }
            .filter { (date, _, _) -> !date.isBefore(LocalDate.now()) }
            .minByOrNull { it.first }
    }
    val activePlan = remember(treatmentPlans) {
        treatmentPlans.maxByOrNull {
            firstValidInstant(it["updatedAt"], it["createdAt"], it["fromDate"]) ?: Instant.EPOCH
        }
    }
    val totalSessions = remember(treatmentPlans) { treatmentPlans.sumOf { it.listOfMaps("sessionDays").size } }
    val completedSessions = remember(treatmentPlans) {
        treatmentPlans.sumOf { plan ->
            plan.listOfMaps("sessionDays").count { day -> day.string("status") == "done" }
        }
    }
    val latestNote = remember(notes) {
        notes
            .filter { it.string("addedByType") != "patient" }
            .maxByOrNull { firstValidInstant(it["updatedAt"], it["createdAt"]) ?: Instant.EPOCH }
    }
    val latestTherapy = remember(therapyRecommendations) {
        therapyRecommendations.maxByOrNull {
            firstValidInstant(it["updatedAt"], it["createdAt"]) ?: Instant.EPOCH
        }
    }
    val latestPayment = remember(payments, treatmentPlans) {
        val directPayments = payments.map { payment ->
            Triple(
                firstValidInstant(payment["updatedAt"], payment["createdAt"]) ?: Instant.EPOCH,
                formatMoney(payment["amount"]),
                payment.stringOrNull("method") ?: "Payment",
            )
        }
        val planPayments = treatmentPlans.flatMap { plan ->
            val label = (plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Treatment" }
            plan.listOfMaps("payments").map { payment ->
                Triple(
                    firstValidInstant(payment["updatedAt"], payment["createdAt"]) ?: Instant.EPOCH,
                    formatMoney(payment["amount"]),
                    label,
                )
            }
        }
        (directPayments + planPayments).maxByOrNull { it.first }
    }
    val recentActivity = remember(notes, therapyRecommendations, visibleRequests, treatmentPlans, payments) {
        buildList {
            latestNote?.let { note ->
                add(
                    Triple(
                        "Clinical note added",
                        note.stringOrNull("title") ?: "Doctor update",
                        firstValidInstant(note["updatedAt"], note["createdAt"]),
                    ),
                )
            }
            latestTherapy?.let { recommendation ->
                add(
                    Triple(
                        "Therapy updated",
                        recommendation.stringOrNull("serviceName")
                            ?: recommendation.stringOrNull("service")
                            ?: "Therapy recommendation",
                        firstValidInstant(recommendation["updatedAt"], recommendation["createdAt"]),
                    ),
                )
            }
            visibleRequests.maxByOrNull { firstValidInstant(it["updatedAt"], it["createdAt"]) ?: Instant.EPOCH }?.let { request ->
                add(
                    Triple(
                        "Appointment request",
                        "${request.stringOrNull("service") ?: "Appointment"} - ${request.stringOrNull("status") ?: "pending"}",
                        firstValidInstant(request["updatedAt"], request["createdAt"]),
                    ),
                )
            }
            treatmentPlans.flatMap { plan ->
                val label = (plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Session plan" }
                plan.listOfMaps("sessionDays")
                    .filter { it.stringOrNull("updatedAt")?.isNotBlank() == true }
                    .map { day ->
                        Triple(
                            "Session updated",
                            "$label | ${day.stringOrNull("date") ?: "Date not set"}",
                            firstValidInstant(day["updatedAt"], day["date"]),
                        )
                    }
            }.maxByOrNull { it.third ?: Instant.EPOCH }?.let { add(it) }
            latestPayment?.let { payment ->
                add(Triple("Payment update", "${payment.second} | ${payment.third}", payment.first))
            }
        }.sortedByDescending { it.third ?: Instant.EPOCH }.take(4)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "WELCOME BACK",
                title = user.stringOrNull("name") ?: "Patient",
                subtitle = user.stringOrNull("email") ?: "Track your OPW care updates in one place.",
                showSubtitle = false,
                shape = RoundedCornerShape(28.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(
                                patient.stringOrNull("disease")
                                    ?.takeIf { it.isNotBlank() }
                                    ?: "Recovery in progress",
                            )
                        },
                    )
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(
                                "Joined ${formatDisplayDate(parseLocalDate(patient.stringOrNull("createdAt")))}",
                            )
                        },
                    )
                }
            }
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                AppointmentSummaryCard(
                    label = "Next Visit",
                    value = nextVisit?.let { formatDisplayDate(it.first) } ?: "No visit",
                    detail = nextVisit?.let {
                        buildString {
                            append(it.second)
                            if (it.third.isNotBlank()) append(" | ${it.third}")
                        }
                    } ?: "Book your next appointment",
                    icon = { CalendarGlyph(OpwBlue) },
                    accent = OpwBlue,
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Sessions",
                    value = "$completedSessions/$totalSessions",
                    detail = if (totalSessions == 0) "No sessions yet" else "Completed vs total",
                    icon = { SessionsGlyph(Color(0xFF14B8A6)) },
                    accent = Color(0xFF14B8A6),
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Pending",
                    value = pendingRequests.toString(),
                    detail = if (pendingRequests == 0) "No pending requests" else "Awaiting OPW review",
                    icon = { NotificationGlyph(OpwWarning) },
                    accent = OpwWarning,
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            MetricGrid(
                metrics = listOf(
                    "Appointments" to appointments.size.toString(),
                    "Treatment Plans" to treatmentPlans.size.toString(),
                    "Services" to therapyRecommendations.size.toString(),
                    "Notes" to notes.size.toString(),
                ),
            )
        }
        item {
            SectionCard(
                title = "Current Care Snapshot",
                subtitle = "",
                showSubtitle = false,
            ) {
                if (activePlan == null && latestNote == null && latestTherapy == null) {
                    Text("Your recovery summary will appear here once OPW starts adding updates.", color = OpwSlate)
                } else {
                    latestNote?.let { note ->
                        RecordTile(
                            title = "Latest Clinical Note",
                            subtitle = buildString {
                                append(note.stringOrNull("title") ?: "Doctor note")
                                note.stringOrNull("note")?.takeIf { it.isNotBlank() }?.let { append("\n$it") }
                            },
                        )
                    }
                    activePlan?.let { plan ->
                        RecordTile(
                            title = "Active Treatment Plan",
                            subtitle = buildString {
                                append((plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Treatment plan" })
                                append("\n${plan.stringOrNull("fromDate") ?: "not set"} to ${plan.stringOrNull("toDate") ?: "not set"}")
                                val balance = formatMoney(plan["balanceAmount"])
                                append("\nBalance: $balance")
                            },
                        )
                    }
                    latestTherapy?.let { recommendation ->
                        RecordTile(
                            title = "Latest Therapy Update",
                            subtitle = buildString {
                                append(
                                    recommendation.stringOrNull("serviceName")
                                        ?: recommendation.stringOrNull("service")
                                        ?: "Therapy recommendation",
                                )
                                recommendation.stringOrNull("note")?.takeIf { it.isNotBlank() }?.let { append("\n$it") }
                                append("\nItems shared: ${recommendation.listOfMaps("items").size}")
                            },
                        )
                    }
                }
            }
        }
        item {
            SectionCard(
                title = "Recent Activity",
                subtitle = "",
                showSubtitle = false,
            ) {
                if (recentActivity.isEmpty()) {
                    Text("No recent activity yet.", color = OpwSlate)
                } else {
                    recentActivity.forEach { activity ->
                        RecordTile(
                            title = activity.first,
                            subtitle = buildString {
                                append(activity.second)
                                append("\n${formatNotificationTime(activity.third)}")
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AppointmentsTab(
    snapshot: DashboardSnapshot,
    user: JsonMap,
    apiService: AppApiService,
    onRefresh: () -> Unit,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val patient = snapshot.patient
    val services = snapshot.services
    val serviceOptions = remember(services) {
        services.mapNotNull { service ->
            (service.stringOrNull("name") ?: service.stringOrNull("title") ?: service.string("service"))
                .trim()
                .takeIf { it.isNotBlank() }
        }.distinct()
    }
    val appointments = patient.listOfMaps("appointments")
    val requests = visibleAppointmentRequests(patient, snapshot.appointmentRequests)
    val hasPending = requests.any { it.string("status").lowercase().ifBlank { "pending" } == "pending" }
    val pendingCount = requests.count { it.string("status").lowercase().ifBlank { "pending" } == "pending" }
    val nextVisit = remember(appointments) {
        appointments
            .mapNotNull { appointment ->
                val date = parseLocalDate(appointment.stringOrNull("date")) ?: return@mapNotNull null
                Triple(
                    date,
                    appointment.stringOrNull("service") ?: "Appointment",
                    appointment.stringOrNull("time").orEmpty(),
                )
            }
            .filter { (date, _, _) -> !date.isBefore(LocalDate.now()) }
            .minByOrNull { it.first }
    }

    var selectedService by rememberSaveable { mutableStateOf("") }
    var showServiceMenu by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedTime by remember { mutableStateOf<LocalTime?>(null) }
    var message by rememberSaveable { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    val attachments = remember { mutableStateListOf<UploadFile>() }

    val docsPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        scope.launch {
            val files = uris.mapNotNull { context.readUploadFile(it) }
            attachments.clear()
            attachments.addAll(files.take(10))
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                AppointmentSummaryCard(
                    label = "Booked",
                    value = appointments.size.toString(),
                    detail = "Confirmed visits",
                    icon = { CalendarGlyph(OpwBlue) },
                    accent = OpwBlue,
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Pending",
                    value = pendingCount.toString(),
                    detail = "Awaiting review",
                    icon = { NotificationGlyph(OpwWarning) },
                    accent = OpwWarning,
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Next Visit",
                    value = nextVisit?.let { formatDisplayDate(it.first) } ?: "No visit",
                    detail = nextVisit?.let { visit ->
                        buildString {
                            append(visit.second)
                            if (visit.third.isNotBlank()) {
                                append(" | ${visit.third}")
                            }
                        }
                    } ?: "Book your next slot",
                    icon = { ClockGlyph(Color(0xFF14B8A6)) },
                    accent = Color(0xFF14B8A6),
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            SectionCard(
                title = "Request Appointment",
                subtitle = "",
            ) {
                ExposedDropdownMenuBox(
                    expanded = showServiceMenu,
                    onExpandedChange = {
                        if (serviceOptions.isNotEmpty()) {
                            showServiceMenu = !showServiceMenu
                        }
                    },
                ) {
                    OutlinedTextField(
                        value = selectedService,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Service needed") },
                        placeholder = { Text(if (serviceOptions.isEmpty()) "No services available" else "Choose service") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showServiceMenu) },
                        modifier = Modifier
                            .menuAnchor(
                                type = ExposedDropdownMenuAnchorType.PrimaryNotEditable,
                                enabled = serviceOptions.isNotEmpty(),
                            )
                            .fillMaxWidth(),
                        enabled = serviceOptions.isNotEmpty(),
                        shape = RoundedCornerShape(20.dp),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFFF8FBFF),
                            unfocusedContainerColor = Color(0xFFF8FBFF),
                            disabledContainerColor = Color(0xFFF1F5F9),
                            focusedIndicatorColor = OpwBlue,
                            unfocusedIndicatorColor = Color(0xFFD7E6F5),
                            disabledIndicatorColor = Color(0xFFD7E6F5),
                        ),
                    )
                    ExposedDropdownMenu(
                        expanded = showServiceMenu,
                        onDismissRequest = { showServiceMenu = false },
                    ) {
                        serviceOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    selectedService = option
                                    showServiceMenu = false
                                },
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    PickerIconAction(
                        onClick = {
                            showDatePicker(context, selectedDate ?: LocalDate.now()) { selectedDate = it }
                        },
                        modifier = Modifier.weight(1f),
                        icon = { CalendarGlyph(OpwBlue) },
                        label = "Date",
                        value = selectedDate?.let(::formatDisplayDate).orEmpty(),
                    )
                    PickerIconAction(
                        onClick = {
                            showTimePicker(context, selectedTime ?: LocalTime.now()) { selectedTime = it }
                        },
                        modifier = Modifier.weight(1f),
                        icon = { ClockGlyph(OpwBlue) },
                        label = "Time",
                        value = selectedTime?.let(::formatDisplayTime).orEmpty(),
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                AppTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = "Message",
                    minLines = 3,
                    keyboardType = KeyboardType.Text,
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedButton(onClick = { docsPicker.launch(arrayOf("application/pdf", "image/*")) }) {
                    Text("Add PDF / Images")
                }
                if (attachments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    AttachmentList(attachments = attachments, onRemove = { attachments.removeAt(it) })
                }
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = {
                        if (hasPending) {
                            showMessage("Your previous appointment request is still pending. Please wait for OPW to review it first.")
                            return@Button
                        }
                        if (selectedService.isBlank() || selectedDate == null) {
                            showMessage("Please add service needed and preferred appointment date.")
                            return@Button
                        }
                        if (selectedDate != null && FormValidators.isPastDate(selectedDate!!)) {
                            showMessage("Preferred appointment date cannot be in the past.")
                            return@Button
                        }
                        scope.launch {
                            submitting = true
                            try {
                                val response = apiService.submitAppointment(
                                    name = user.string("name"),
                                    email = user.string("email"),
                                    phone = user.string("mobile"),
                                    patientId = user.string("patientId"),
                                    service = selectedService.trim(),
                                    date = selectedDate!!.format(DateTimeFormatter.ISO_LOCAL_DATE),
                                    time = selectedTime?.format(DateTimeFormatter.ofPattern("HH:mm")).orEmpty(),
                                    message = message.trim(),
                                    documents = attachments.toList(),
                                )
                                showMessage(response["message"]?.toString() ?: "Appointment request submitted.")
                                selectedService = ""
                                selectedDate = null
                                selectedTime = null
                                message = ""
                                attachments.clear()
                                onRefresh()
                            } catch (error: ApiException) {
                                onAuthError(error)
                            } finally {
                                submitting = false
                            }
                        }
                    },
                    enabled = !submitting,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (submitting) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Submit Request")
                    }
                }
            }
        }
        item {
            SectionCard(
                title = "Booked Appointments",
                subtitle = "Appointments confirmed by OPW will appear here.",
                showSubtitle = false,
            ) {
                if (appointments.isEmpty()) {
                    Text("No booked appointments yet.", color = OpwSlate)
                } else {
                    appointments.forEach { appointment ->
                        RecordTile(
                            title = appointment.stringOrNull("service") ?: "Appointment",
                            subtitle = listOfNotNull(
                                "Date: ${appointment.stringOrNull("date") ?: "Not added"}",
                                appointment.stringOrNull("time")?.takeIf { it.isNotBlank() }?.let { "Time: $it" },
                                appointment.stringOrNull("status")?.let { "Status: $it" },
                            ).joinToString("\n"),
                        )
                    }
                }
            }
        }
        item {
            SectionCard(
                title = "Appointment Request Updates",
                subtitle = "Pending requests stay here. Approved ones move to booked appointments.",
                showSubtitle = false,
            ) {
                if (requests.isEmpty()) {
                    Text("No request updates yet.", color = OpwSlate)
                } else {
                    requests.forEach { request ->
                        RecordTile(
                            title = "${request.stringOrNull("service") ?: "Appointment"} - ${request.stringOrNull("status") ?: "pending"}",
                            subtitle = buildString {
                                append("Requested: ${request.stringOrNull("requestedDate") ?: "Date not added"}")
                                request.stringOrNull("requestedTime")?.takeIf { it.isNotBlank() }?.let { append(" at $it") }
                                request.stringOrNull("confirmedDate")?.takeIf { it.isNotBlank() }?.let {
                                    append("\nConfirmed: $it")
                                    request.stringOrNull("confirmedTime")?.takeIf { value -> value.isNotBlank() }?.let { time ->
                                        append(" at $time")
                                    }
                                }
                                request.stringOrNull("decisionNote")?.takeIf { it.isNotBlank() }?.let { append("\nOPW note: $it") }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TherapyTab(
    snapshot: DashboardSnapshot,
    apiService: AppApiService,
    showMessage: (String) -> Unit,
) {
    val patient = snapshot.patient
    val therapyRecommendations = patient.listOfMaps("therapyRecommendations")
    val notes = patient.listOfMaps("clinicalNotes")
    var fullscreenImage by remember { mutableStateOf<Pair<String, String>?>(null) }
    var fullscreenVideo by remember { mutableStateOf<Pair<String, String>?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionCard(
                title = "Recommended Therapy",
                subtitle = "Service-wise therapy items shared by OPW appear here.",
                showSubtitle = false,
            ) {
                if (therapyRecommendations.isEmpty()) {
                    Text("No therapy recommendations added yet.", color = OpwSlate)
                } else {
                    therapyRecommendations.forEach { recommendation ->
                        val items = recommendation.listOfMaps("items")
                        SectionCard(
                            title = recommendation.stringOrNull("serviceName")
                                ?: recommendation.stringOrNull("service")
                                ?: recommendation.stringOrNull("title")
                                ?: "Therapy Recommendation",
                            subtitle = recommendation.stringOrNull("note").orEmpty(),
                            showSubtitle = false,
                        ) {
                            if (items.isEmpty()) {
                                Text("OPW will add therapy guidance here.", color = OpwSlate)
                            } else {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    items.forEach { item ->
                                        TherapyResourceCard(
                                            item = item,
                                            apiService = apiService,
                                            onOpenImage = { title, url ->
                                                fullscreenImage = title to url
                                            },
                                            onOpenVideo = { title, url ->
                                                fullscreenVideo = title to url
                                            },
                                            showMessage = showMessage,
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
        item {
            SectionCard(
                title = "Doctors Note & Documents",
                subtitle = "You can only view notes and files shared here.",
                showSubtitle = false,
            ) {
                if (notes.isEmpty()) {
                    Text("No clinical notes yet.", color = OpwSlate)
                } else {
                    notes.forEach { note ->
                        RecordTile(
                            title = note.stringOrNull("title") ?: "Doctor's Note",
                            subtitle = buildString {
                                append(note.stringOrNull("note") ?: "No note text added.")
                                note.stringOrNull("addedByLabel")?.takeIf { it.isNotBlank() }?.let { append("\nAdded by $it") }
                                val documents = note.listOfMaps("documents")
                                if (documents.isNotEmpty()) {
                                    append("\nDocuments: ${documents.joinToString { it.stringOrNull("name") ?: "Document" }}")
                                }
                            },
                        )
                    }
                }
            }
        }
    }

    fullscreenImage?.let { (title, url) ->
        FullscreenImageViewer(
            title = title,
            imageUrl = url,
            onDismiss = { fullscreenImage = null },
        )
    }
    fullscreenVideo?.let { (title, url) ->
        TherapyVideoDialog(
            title = title,
            videoUrl = url,
            onDismiss = { fullscreenVideo = null },
        )
    }
}

@Composable
private fun SessionsTab(snapshot: DashboardSnapshot) {
    val plans = snapshot.patient.listOfMaps("treatmentPlans")

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionCard(
                title = "Session / Treatment Details",
                subtitle = "Treatment and session plan details from OPW are visible here.",
                showSubtitle = false,
            ) {
                if (plans.isEmpty()) {
                    Text("No treatment plans added yet.", color = OpwSlate)
                } else {
                    plans.forEach { plan ->
                        val sessions = plan.listOfMaps("sessionDays")
                        SessionPlanCard(
                            title = (plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Treatment Plan" },
                            dateRange = "From ${plan.stringOrNull("fromDate") ?: "not set"} to ${plan.stringOrNull("toDate") ?: "not set"}",
                            sessions = sessions,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentsTab(snapshot: DashboardSnapshot) {
    val patient = snapshot.patient
    val payments = patient.listOfMaps("payments")
    val plans = patient.listOfMaps("treatmentPlans")
    fun amountOf(value: Any?): Double = when (value) {
        is Number -> value.toDouble()
        else -> value?.toString()?.toDoubleOrNull() ?: 0.0
    }

    val directPaidAmount = payments.sumOf { payment -> amountOf(payment["amount"]) }
    val planTotalAmount = plans.sumOf { plan -> amountOf(plan["totalAmount"]) }
    val planBalanceAmount = plans.sumOf { plan -> amountOf(plan["balanceAmount"]) }
    val planPaidAmount = (planTotalAmount - planBalanceAmount).coerceAtLeast(0.0)
    val totalPaidAmount = directPaidAmount + planPaidAmount
    val totalAmountToPay = planTotalAmount + directPaidAmount
    val balanceToPay = (totalAmountToPay - totalPaidAmount).coerceAtLeast(0.0)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                AppointmentSummaryCard(
                    label = "Total Amount",
                    value = formatMoney(totalAmountToPay),
                    detail = if (plans.isEmpty()) "Overall payable record" else "${plans.size} treatment plans",
                    icon = { PaymentGlyph(OpwBlue) },
                    accent = OpwBlue,
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Total Paid",
                    value = formatMoney(totalPaidAmount),
                    detail = "Recorded paid amount",
                    icon = { ShieldGlyph(OpwSuccess) },
                    accent = OpwSuccess,
                    modifier = Modifier.weight(1f),
                )
                AppointmentSummaryCard(
                    label = "Balance",
                    value = formatMoney(balanceToPay),
                    detail = "Still left to pay",
                    icon = { ClockGlyph(OpwWarning) },
                    accent = OpwWarning,
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            SectionCard(
                title = "Payment Details",
                subtitle = "All general payments and treatment plan payments appear here.",
                showSubtitle = false,
            ) {
                if (payments.isEmpty() && plans.none { it.listOfMaps("payments").isNotEmpty() }) {
                    Text("No payment updates added yet.", color = OpwSlate)
                } else {
                    payments.forEach { payment ->
                        RecordTile(
                            title = formatMoney(payment["amount"]),
                            subtitle = "${payment.stringOrNull("method") ?: "Payment"} | Date: ${formatPaymentDate(payment)}",
                        )
                    }
                    plans.forEach { plan ->
                        val label = (plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Treatment" }
                        plan.listOfMaps("payments").forEach { payment ->
                            RecordTile(
                                title = formatMoney(payment["amount"]),
                                subtitle = "${payment.stringOrNull("method") ?: "Payment"} | $label\nDate: ${formatPaymentDate(payment)}",
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OrdersTab(snapshot: DashboardSnapshot) {
    val orders = snapshot.shopOrders

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionCard(
                title = "My Orders",
                subtitle = "All shop orders placed from your patient account will appear here.",
                showSubtitle = false,
            ) {
                if (orders.isEmpty()) {
                    Text("No shop orders placed yet.", color = OpwSlate)
                } else {
                    orders.forEach { order ->
                        val items = order.listOfMaps("items")
                        RecordTile(
                            title = order.stringOrNull("status")?.replaceFirstChar { it.uppercase() } ?: "Order",
                            subtitle = buildString {
                                append("Total: ${formatMoney(order["totalAmount"])}")
                                order.stringOrNull("createdAt")?.let { append("\nDate: ${formatDisplayDate(parseLocalDate(it))}") }
                                if (items.isNotEmpty()) {
                                    append("\nItems: ${items.joinToString { "${it.stringOrNull("name") ?: "Item"} x${it.stringOrNull("quantity") ?: "1"}" }}")
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AboutSection() {
    val context = LocalContext.current
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "ABOUT US",
                title = "Omm Physio World",
                subtitle = "Modern physiotherapy care focused on pain relief, posture, recovery, and practical daily movement.",
                showSubtitle = false,
                shape = RoundedCornerShape(30.dp),
            )
        }
        item {
            SectionCard(
                title = "Our Services",
                subtitle = "Pain management, posture correction, sports rehabilitation, neurological support, manual therapy, and recovery planning.",
            )
        }
        item {
            SectionCard(
                title = "Doctor",
                subtitle = "Dr. Tapaswini Sahu leads patient-first physiotherapy care with a calm and practical treatment approach.",
            )
        }
        item {
            SectionCard(
                title = "Clinic Details",
                subtitle = "Baripada, Odisha\nMonday to Saturday\n9:00 AM to 7:00 PM",
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(onClick = { context.dialPhone("+918895555519") }, modifier = Modifier.weight(1f)) {
                        Text("Call")
                    }
                    OutlinedButton(onClick = { context.openUrl("https://maps.app.goo.gl/Ph78XSeNRtXFNKpE9") }, modifier = Modifier.weight(1f)) {
                        Text("Map")
                    }
                }
            }
        }
    }
}

@Composable
private fun FaqSection() {
    val faqs = remember {
        listOf(
            "How do I request an appointment?" to "Open the Appointments tab, choose a service, pick your preferred date, and submit the request.",
            "Where do therapy updates appear?" to "Clinical notes, therapy recommendations, and session plans appear inside the Therapy and Sessions tabs.",
            "Can I place shop orders from the app?" to "Yes. Open Public > Shop, add products to cart, and place the order from your logged-in account.",
            "How do I contact OPW support?" to "Open Public > Live Chat to message the clinic team directly from the app.",
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "FAQ",
                title = "Common Questions",
                subtitle = "Quick answers for the same patient journey now rebuilt in native Android.",
                showSubtitle = false,
                shape = RoundedCornerShape(30.dp),
            )
        }
        items(faqs) { faq ->
            SectionCard(title = faq.first, subtitle = faq.second)
        }
    }
}

@Composable
private fun ShopSection(
    apiService: AppApiService,
    storage: AppStorage,
    onOrderPlaced: () -> Unit,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var placingOrder by remember { mutableStateOf(false) }
    var products by remember { mutableStateOf<List<JsonMap>>(emptyList()) }
    var orderNote by rememberSaveable { mutableStateOf("") }
    val cartItems = remember { mutableStateListOf<JsonMap>() }

    fun quantityForProduct(productId: String): Int {
        val item = cartItems.firstOrNull { it.string("productId") == productId } ?: return 0
        return item["quantity"]?.toString()?.toIntOrNull() ?: 0
    }

    fun persistCart() {
        storage.saveCartItems(cartItems.toList())
    }

    fun updateQuantity(product: JsonMap, nextQuantity: Int) {
        val productId = product.string("id")
        val index = cartItems.indexOfFirst { it.string("productId") == productId }
        if (nextQuantity <= 0) {
            if (index >= 0) {
                cartItems.removeAt(index)
                persistCart()
            }
            return
        }

        val nextItem = mapOf(
            "productId" to productId,
            "name" to product.stringOrNull("name"),
            "price" to product["price"],
            "stockQuantity" to product["stockQuantity"],
            "quantity" to nextQuantity,
        )
        if (index >= 0) {
            cartItems[index] = nextItem
        } else {
            cartItems.add(nextItem)
        }
        persistCart()
    }

    LaunchedEffect(Unit) {
        cartItems.clear()
        cartItems.addAll(storage.getCartItems())
        try {
            products = apiService.getShopProducts()
        } catch (error: ApiException) {
            onAuthError(error)
        } finally {
            loading = false
        }
    }

    val cartCount = cartItems.sumOf { it.stringOrNull("quantity")?.toIntOrNull() ?: 0 }
    val cartTotal = cartItems.sumOf {
        val quantity = it.stringOrNull("quantity")?.toDoubleOrNull() ?: 0.0
        val price = it["price"]?.toString()?.toDoubleOrNull() ?: 0.0
        quantity * price
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "SHOP",
                title = "OPW Products",
                subtitle = "Browse products, keep them in a local cart, and place an order from your native app account.",
                showSubtitle = false,
            ) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = {}, label = { Text("Items: $cartCount") })
                    AssistChip(onClick = {}, label = { Text("Total: ${formatMoney(cartTotal)}") })
                }
            }
        }
        if (loading) {
            item {
                SectionCard(title = "Loading Products", subtitle = "Fetching shop products from OPW.") {
                    CircularProgressIndicator(color = OpwBlue)
                }
            }
        } else if (products.isEmpty()) {
            item {
                SectionCard(title = "No Products", subtitle = "No products are available right now.")
            }
        } else {
            items(products) { product ->
                val productId = product.string("id")
                val quantity = quantityForProduct(productId)
                val stockQuantity = product.stringOrNull("stockQuantity")?.toIntOrNull() ?: 0
                SectionCard(
                    title = product.stringOrNull("name") ?: "OPW Product",
                    subtitle = "${formatMoney(product["price"])} | ${if (stockQuantity > 0) "$stockQuantity in stock" else "Out of stock"}",
                ) {
                    product.stringOrNull("description")?.takeIf { it.isNotBlank() }?.let {
                        Text(it, color = OpwSlate)
                        Spacer(modifier = Modifier.height(10.dp))
                    }
                    if (quantity == 0) {
                        Button(
                            onClick = { updateQuantity(product, 1) },
                            enabled = stockQuantity > 0,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Add to Cart")
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            OutlinedButton(onClick = { updateQuantity(product, quantity - 1) }) {
                                Text("-")
                            }
                            Text("$quantity", fontWeight = FontWeight.Bold, color = OpwInk)
                            OutlinedButton(onClick = { updateQuantity(product, quantity + 1) }, enabled = quantity < stockQuantity) {
                                Text("+")
                            }
                        }
                    }
                }
            }
            item {
                SectionCard(
                    title = "Checkout",
                    subtitle = "Cart items are stored locally until you place the order.",
                    showSubtitle = false,
                ) {
                    AppTextField(
                        value = orderNote,
                        onValueChange = { orderNote = it },
                        label = "Order note",
                        minLines = 3,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            if (cartItems.isEmpty()) {
                                showMessage("Your cart is empty.")
                                return@Button
                            }
                            scope.launch {
                                placingOrder = true
                                try {
                                    val response = apiService.placeShopOrder(
                                        items = cartItems.map {
                                            mapOf(
                                                "productId" to it.string("productId"),
                                                "quantity" to (it.stringOrNull("quantity")?.toIntOrNull() ?: 0),
                                            )
                                        },
                                        note = orderNote.trim(),
                                    )
                                    cartItems.clear()
                                    storage.clearCartItems()
                                    orderNote = ""
                                    showMessage(response["message"]?.toString() ?: "Order placed successfully.")
                                    onOrderPlaced()
                                } catch (error: ApiException) {
                                    onAuthError(error)
                                } finally {
                                    placingOrder = false
                                }
                            }
                        },
                        enabled = !placingOrder,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (placingOrder) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Place Order")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatSection(
    apiService: AppApiService,
    storage: AppStorage,
    user: JsonMap,
    showMessage: (String) -> Unit,
    onAuthError: (ApiException) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    var agents by remember { mutableStateOf<List<JsonMap>>(emptyList()) }
    var conversation by remember { mutableStateOf<JsonMap?>(null) }
    var selectedAgentId by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    val attachments = remember { mutableStateListOf<UploadFile>() }

    val attachmentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        scope.launch {
            val files = uris.mapNotNull { context.readUploadFile(it) }
            attachments.clear()
            attachments.addAll(files.take(5))
        }
    }

    fun resolveSelectedAgentId(nextAgents: List<JsonMap>, nextConversation: JsonMap?): String {
        val assignedId = nextConversation?.map("assignedTo")?.stringOrNull("id")
        if (!assignedId.isNullOrBlank()) {
            return assignedId
        }
        if (nextAgents.any { it.string("id") == selectedAgentId }) {
            return selectedAgentId
        }
        return nextAgents.firstOrNull()?.string("id").orEmpty()
    }

    fun loadChat(silent: Boolean) {
        scope.launch {
            if (!silent) {
                loading = true
                error = ""
            }
            try {
                val nextAgents = apiService.getPublicChatAgents()
                var conversationId = conversation?.string("id").orEmpty()
                if (conversationId.isBlank()) {
                    conversationId = storage.getConversationId().orEmpty()
                }
                val nextConversation = if (conversationId.isBlank()) {
                    null
                } else {
                    try {
                        apiService.getPublicChatConversation(conversationId)
                    } catch (errorValue: ApiException) {
                        if (errorValue.isSessionExpired()) {
                            throw errorValue
                        }
                        null
                    }
                }
                if (nextConversation == null && conversationId.isNotBlank()) {
                    storage.clearConversationId()
                }
                agents = nextAgents
                conversation = nextConversation
                selectedAgentId = resolveSelectedAgentId(nextAgents, nextConversation)
            } catch (errorValue: ApiException) {
                if (errorValue.isSessionExpired()) {
                    onAuthError(errorValue)
                } else {
                    error = errorValue.message.orEmpty()
                }
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadChat(false)
    }

    LaunchedEffect(conversation.stringOrNull("id")) {
        while (true) {
            delay(5_000)
            loadChat(true)
        }
    }

    val conversationMessages = conversation.listOfMaps("messages")
    val visitorName = user.stringOrNull("name") ?: "Mobile Patient"
    val visitorContact = user.stringOrNull("mobile")?.takeIf { it.isNotBlank() } ?: user.string("email")
    val assignedAgent = conversation.map("assignedTo")
    val activeAgentName = assignedAgent?.stringOrNull("name")
        ?: agents.firstOrNull { it.string("id") == selectedAgentId }?.stringOrNull("name")
        ?: "Clinic Team"
    val activeAgentRole = assignedAgent?.stringOrNull("workType")
        ?: agents.firstOrNull { it.string("id") == selectedAgentId }?.stringOrNull("workType")
        ?: "OPW support"
    val messageListState = rememberLazyListState()

    LaunchedEffect(conversationMessages.size, conversation.stringOrNull("id")) {
        if (conversationMessages.isNotEmpty()) {
            messageListState.animateScrollToItem(conversationMessages.lastIndex)
        }
    }

    fun resetConversation() {
        storage.clearConversationId()
        conversation = null
        message = ""
        attachments.clear()
    }

    fun submitMessage() {
        if (message.isBlank() && attachments.isEmpty()) {
            error = "Please type your message or add a document."
            return
        }
        if (conversation == null && selectedAgentId.isBlank()) {
            error = "No doctor or staff is available right now."
            return
        }
        scope.launch {
            sending = true
            error = ""
            try {
                val nextConversation = if (conversation == null) {
                    apiService.startPublicChatConversation(
                        agentId = selectedAgentId,
                        visitorName = visitorName,
                        visitorContact = visitorContact,
                        text = message.trim(),
                        attachments = attachments.toList(),
                    )
                } else {
                    apiService.sendPublicChatMessage(
                        conversationId = conversation!!.string("id"),
                        visitorName = visitorName,
                        text = message.trim(),
                        attachments = attachments.toList(),
                    )
                }
                conversation = nextConversation
                storage.saveConversationId(nextConversation.string("id"))
                message = ""
                attachments.clear()
                showMessage("Message sent.")
            } catch (errorValue: ApiException) {
                if (errorValue.isSessionExpired()) {
                    onAuthError(errorValue)
                } else {
                    error = errorValue.message.orEmpty()
                }
            } finally {
                sending = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White.copy(alpha = 0.97f),
            shape = RoundedCornerShape(28.dp),
            shadowElevation = 10.dp,
            tonalElevation = 0.dp,
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    PatientAvatar(
                        name = activeAgentName,
                        imageUrl = "",
                        modifier = Modifier.size(54.dp),
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (conversation == null) "Live Chat Support" else activeAgentName,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (conversation == null) {
                                if (loading) "Checking who is online for you..."
                                else "${agents.size} OPW team members available to help"
                            } else {
                                activeAgentRole
                            },
                            color = OpwSlate,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    ChatStatusChip(
                        label = if (conversation == null) "Online" else "Active",
                        tint = if (conversation == null) Color(0xFF16A34A) else OpwBlue,
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = { loadChat(false) },
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Refresh")
                    }
                    if (conversation != null) {
                        Button(
                            onClick = ::resetConversation,
                            shape = RoundedCornerShape(18.dp),
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFE8F2FF),
                                contentColor = OpwBlue,
                            ),
                        ) {
                            Text("New Chat")
                        }
                    }
                }
            }
        }

        when {
            loading && agents.isEmpty() && conversation == null -> {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    color = Color.White.copy(alpha = 0.94f),
                    shape = RoundedCornerShape(28.dp),
                    shadowElevation = 8.dp,
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = OpwBlue)
                            Spacer(modifier = Modifier.height(14.dp))
                            Text("Checking online clinic team...", color = OpwInk, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            conversation == null && agents.isEmpty() -> {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    color = Color.White.copy(alpha = 0.94f),
                    shape = RoundedCornerShape(28.dp),
                    shadowElevation = 8.dp,
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(22.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = "No staff online right now",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Call the clinic and the OPW team will connect back with you soon.",
                            color = OpwSlate,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(modifier = Modifier.height(18.dp))
                        Button(
                            onClick = { context.dialPhone("+918895555519") },
                            shape = RoundedCornerShape(20.dp),
                        ) {
                            Text("Contact Us")
                        }
                    }
                }
            }

            conversation == null -> {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    color = Color.White.copy(alpha = 0.95f),
                    shape = RoundedCornerShape(28.dp),
                    shadowElevation = 8.dp,
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "Choose who to message",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = OpwInk,
                        )
                        Text(
                            text = "Start with the available doctor or staff member you want to talk to.",
                            color = OpwSlate,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            items(agents) { agent ->
                                SelectableTile(
                                    selected = selectedAgentId == agent.string("id"),
                                    title = agent.stringOrNull("name") ?: "Clinic Team",
                                    subtitle = agent.stringOrNull("workType") ?: "Available staff",
                                    onClick = { selectedAgentId = agent.string("id") },
                                )
                            }
                        }
                    }
                }
            }

            else -> {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    color = Color(0xFFF8FBFF),
                    shape = RoundedCornerShape(28.dp),
                    shadowElevation = 8.dp,
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 18.dp, vertical = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            PatientAvatar(
                                name = activeAgentName,
                                imageUrl = "",
                                modifier = Modifier.size(42.dp),
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = activeAgentName,
                                    fontWeight = FontWeight.Black,
                                    color = OpwInk,
                                )
                                Text(
                                    text = "Usually replies in this conversation thread",
                                    color = OpwSlate,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            ChatStatusChip(label = "Online", tint = Color(0xFF16A34A))
                        }
                        HorizontalDivider(color = Color(0xFFE2E8F0))
                        if (conversationMessages.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "Say hello to start your conversation.",
                                    color = OpwSlate,
                                )
                            }
                        } else {
                            LazyColumn(
                                state = messageListState,
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                items(conversationMessages) { chatMessage ->
                                    val isVisitor = chatMessage.string("senderType") == "visitor"
                                    ChatBubble(
                                        fromVisitor = isVisitor,
                                        senderName = if (isVisitor) visitorName else activeAgentName,
                                        text = chatMessage.string("text"),
                                        time = formatChatTime(chatMessage.stringOrNull("createdAt")),
                                        attachments = chatMessage.listOfMaps("attachments"),
                                        onOpenAttachment = { url ->
                                            context.openUrl(apiService.resolveResourceUrl(url))
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White.copy(alpha = 0.97f),
            shape = RoundedCornerShape(28.dp),
            shadowElevation = 10.dp,
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (error.isNotBlank()) {
                    Surface(
                        color = Color(0xFFFFF1F2),
                        shape = RoundedCornerShape(18.dp),
                    ) {
                        Text(
                            text = error,
                            color = OpwDanger,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        )
                    }
                }
                if (conversation == null && selectedAgentId.isNotBlank()) {
                    Surface(
                        color = Color(0xFFF2F8FF),
                        shape = RoundedCornerShape(18.dp),
                    ) {
                        Text(
                            text = "You are about to start a chat with $activeAgentName.",
                            color = OpwBlue,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        )
                    }
                }
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    shape = RoundedCornerShape(22.dp),
                    placeholder = {
                        Text(
                            text = if (conversation == null) "Type your first message..." else "Write a reply...",
                            color = OpwSlate,
                        )
                    },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFFF8FBFF),
                        unfocusedContainerColor = Color(0xFFF8FBFF),
                        focusedIndicatorColor = Color(0xFFD4E3F5),
                        unfocusedIndicatorColor = Color(0xFFD4E3F5),
                    ),
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedButton(
                        onClick = {
                            attachmentPicker.launch(
                                arrayOf(
                                    "application/pdf",
                                    "image/*",
                                    "application/msword",
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                ),
                            )
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(20.dp),
                    ) {
                        Text("Attach File")
                    }
                    Button(
                        onClick = ::submitMessage,
                        enabled = !sending,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(20.dp),
                    ) {
                        if (sending) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text(if (conversation == null) "Start Chat" else "Send")
                        }
                    }
                }
                if (attachments.isNotEmpty()) {
                    AttachmentList(attachments = attachments, onRemove = { attachments.removeAt(it) })
                }
            }
        }
    }
}

@Composable
private fun ModernRoundedField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType,
    imeAction: ImeAction,
    hidden: Boolean = false,
    onToggleHidden: (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        placeholder = {
            Text(
                text = placeholder,
                color = Color(0xFF64748B),
            )
        },
        singleLine = true,
        shape = CircleShape,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction,
        ),
        visualTransformation = if (hidden) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = if (onToggleHidden != null) {
            {
                TextButton(onClick = onToggleHidden) {
                    Text(
                        text = if (hidden) "Show" else "Hide",
                        color = Color(0xFF0F172A),
                    )
                }
            }
        } else {
            null
        },
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
            focusedIndicatorColor = Color(0xFFD4D4D8),
            unfocusedIndicatorColor = Color(0xFFD4D4D8),
            cursorColor = Color(0xFF1E293B),
        ),
    )
}

@Composable
private fun ModernOrDivider() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = Color(0xFFE4E4E7),
        )
        Text(
            text = "or",
            color = Color(0xFF94A3B8),
            style = MaterialTheme.typography.bodyMedium,
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = Color(0xFFE4E4E7),
        )
    }
}

@Composable
private fun SocialSignButton(
    symbol: String,
    label: String,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        shape = CircleShape,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = symbol,
                    color = Color.Black,
                    fontWeight = FontWeight.Black,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = label,
                color = Color(0xFF111827),
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun SoftAuthBackground(content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .dismissKeyboardOnTap()
            .background(Color(0xFFFFFEFB)),
    ) {
        Box(
            modifier = Modifier
                .size(240.dp)
                .offset(x = (-70).dp, y = (-40).dp)
                .background(Color(0x3322C55E), CircleShape),
        )
        Box(
            modifier = Modifier
                .size(180.dp)
                .align(Alignment.TopEnd)
                .offset(x = 48.dp, y = 36.dp)
                .background(Color(0x1AA3E635), CircleShape),
        )
        content()
    }
}

@Composable
private fun Modifier.dismissKeyboardOnTap(): Modifier {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    return pointerInput(focusManager, keyboardController) {
        detectTapGestures {
            focusManager.clearFocus(force = true)
            keyboardController?.hide()
        }
    }
}

@Composable
private fun BrandLogoImage(
    size: androidx.compose.ui.unit.Dp = 72.dp,
    modifier: Modifier = Modifier,
) {
    Image(
        painter = painterResource(id = R.drawable.opwlogo_edited),
        contentDescription = "OPW logo",
        modifier = modifier.size(size),
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun AuthBrandHeader(
    title: String = "Omm Physio World",
    subtitle: String = "Care, Recovery, Movement",
) {
    BrandLogoImage()
    Spacer(modifier = Modifier.height(18.dp))
    Text(
        text = title,
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Black,
        color = Color(0xFF1E293B),
        textAlign = TextAlign.Center,
    )
    Spacer(modifier = Modifier.height(8.dp))
    Text(
        text = subtitle,
        style = MaterialTheme.typography.bodyLarge,
        color = Color(0xFF475569),
        textAlign = TextAlign.Center,
    )
}

@Composable
private fun AnimatedOnboardingBrand() {
    val transition = rememberInfiniteTransition(label = "onboarding-brand")
    val bob = transition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "onboarding-bob",
    )
    val scale = transition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.03f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "onboarding-scale",
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Surface(
            color = Color.White.copy(alpha = 0.82f),
            shape = CircleShape,
            shadowElevation = 10.dp,
            tonalElevation = 0.dp,
        ) {
            BrandLogoImage(
                size = 92.dp,
                modifier = Modifier
                    .padding(12.dp)
                    .graphicsLayer {
                        translationY = bob.value
                        scaleX = scale.value
                        scaleY = scale.value
                    },
            )
        }
        Spacer(modifier = Modifier.height(18.dp))
        Text(
            text = "Omm Physio World",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = OpwInk,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Care, Recovery, Movement",
            style = MaterialTheme.typography.bodyLarge,
            color = OpwSlate,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AnimatedSplashBrand() {
    val transition = rememberInfiniteTransition(label = "splash-brand")
    val bob = transition.animateFloat(
        initialValue = -5f,
        targetValue = 5f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "splash-bob",
    )
    val scale = transition.animateFloat(
        initialValue = 0.97f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "splash-scale",
    )

    Column(
        modifier = Modifier.padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(
            color = Color.White.copy(alpha = 0.84f),
            shape = CircleShape,
            shadowElevation = 12.dp,
            tonalElevation = 0.dp,
        ) {
            BrandLogoImage(
                size = 96.dp,
                modifier = Modifier
                    .padding(14.dp)
                    .graphicsLayer {
                        translationY = bob.value
                        scaleX = scale.value
                        scaleY = scale.value
                    },
            )
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "Omm Physio World",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = Color(0xFF1E293B),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Care, Recovery, Movement",
            style = MaterialTheme.typography.bodyLarge,
            color = Color(0xFF475569),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun OnboardingFeatureTile(text: String, accent: Color) {
    Surface(
        color = Color.White.copy(alpha = 0.98f),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.12f)),
        shadowElevation = 4.dp,
        tonalElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = accent.copy(alpha = 0.12f),
                shape = RoundedCornerShape(14.dp),
            ) {
                Box(
                    modifier = Modifier.padding(9.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    GridGlyph(accent)
                }
            }
            Text(
                text = text,
                color = OpwInk,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun OnboardingInfoCard(
    label: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = 0.98f),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.12f)),
        shadowElevation = 4.dp,
        tonalElevation = 0.dp,
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 14.dp)) {
            Text(
                text = label,
                color = OpwSlate,
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = accent,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
private fun AuthTopRow(
    onBack: () -> Unit,
    chipText: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconCircleButton(onClick = onBack) {
            BackArrowGlyph()
        }
        AssistChip(
            onClick = {},
            label = { Text(chipText) },
        )
    }
}

@Composable
private fun IconCircleButton(
    onClick: () -> Unit,
    content: @Composable BoxScope.() -> Unit,
) {
    Surface(
        onClick = onClick,
        color = Color.White.copy(alpha = 0.88f),
        shape = CircleShape,
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        modifier = Modifier.size(42.dp),
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
            content = content,
        )
    }
}

@Composable
private fun BackArrowGlyph() {
    Box(modifier = Modifier.size(18.dp)) {
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = 2.dp, y = (-3).dp)
                .size(width = 10.dp, height = 2.dp)
                .rotate(-45f)
                .background(Color(0xFF1E293B), CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = 2.dp, y = 3.dp)
                .size(width = 10.dp, height = 2.dp)
                .rotate(45f)
                .background(Color(0xFF1E293B), CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .offset(x = 2.dp)
                .size(width = 11.dp, height = 2.dp)
                .background(Color(0xFF1E293B), CircleShape),
        )
    }
}

@Composable
private fun HamburgerGlyph() {
    Column(
        verticalArrangement = Arrangement.spacedBy(3.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        repeat(3) {
            Box(
                modifier = Modifier
                    .size(width = 16.dp, height = 2.dp)
                    .background(Color(0xFF1E293B), CircleShape),
            )
        }
    }
}

@Composable
private fun DashboardTabGlyph(tab: DashboardTab, tint: Color) {
    when (tab) {
        DashboardTab.Overview -> GridGlyph(tint)
        DashboardTab.Appointments -> CalendarGlyph(tint)
        DashboardTab.Therapy -> TherapyGlyph(tint)
        DashboardTab.Sessions -> SessionsGlyph(tint)
        DashboardTab.Payments -> PaymentGlyph(tint)
        DashboardTab.Orders -> OrdersGlyph(tint)
        DashboardTab.Public -> InfoGlyph(tint)
    }
}

@Composable
private fun PublicSectionGlyph(section: PublicSection, tint: Color) {
    when (section) {
        PublicSection.About -> InfoGlyph(tint)
        PublicSection.Shop -> ShopGlyph(tint)
        PublicSection.Faq -> QuestionGlyph(tint)
        PublicSection.Chat -> ChatGlyph(tint)
    }
}

@Composable
private fun GlyphFrame(content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier = Modifier.size(18.dp),
        contentAlignment = Alignment.Center,
        content = content,
    )
}

@Composable
private fun GridGlyph(tint: Color) {
    GlyphFrame {
        Column(
            verticalArrangement = Arrangement.spacedBy(2.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            repeat(2) {
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    repeat(2) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(tint, FlatShape),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CalendarGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 16.dp, height = 14.dp)
                .border(2.dp, tint, FlatShape),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .size(width = 16.dp, height = 4.dp)
                    .background(tint, FlatShape),
            )
            Row(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(y = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                repeat(2) {
                    Box(
                        modifier = Modifier
                            .size(3.dp)
                            .background(tint, FlatShape),
                    )
                }
            }
        }
    }
}

@Composable
private fun TherapyGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 14.dp, height = 3.dp)
                .background(tint, CircleShape),
        )
        Box(
            modifier = Modifier
                .size(width = 3.dp, height = 14.dp)
                .background(tint, CircleShape),
        )
    }
}

@Composable
private fun SessionsGlyph(tint: Color) {
    GlyphFrame {
        Column(
            verticalArrangement = Arrangement.spacedBy(2.dp),
            horizontalAlignment = Alignment.Start,
        ) {
            repeat(3) { index ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(3.dp)
                            .background(tint, CircleShape),
                    )
                    Box(
                        modifier = Modifier
                            .size(width = if (index == 1) 9.dp else 11.dp, height = 2.dp)
                            .background(tint, CircleShape),
                    )
                }
            }
        }
    }
}

@Composable
private fun ClockGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(14.dp)
                .border(2.dp, tint, CircleShape),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(y = (-2).dp)
                    .size(width = 2.dp, height = 5.dp)
                    .background(tint, CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(x = 2.dp, y = 1.dp)
                    .size(width = 4.dp, height = 2.dp)
                    .rotate(35f)
                    .background(tint, CircleShape),
            )
        }
    }
}

@Composable
private fun ShieldGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 14.dp, height = 16.dp)
                .border(2.dp, tint, RoundedCornerShape(topStart = 7.dp, topEnd = 7.dp, bottomStart = 8.dp, bottomEnd = 8.dp)),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(width = 5.dp, height = 2.dp)
                    .rotate(45f)
                    .background(tint, CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(x = (-2).dp, y = 2.dp)
                    .size(width = 2.dp, height = 6.dp)
                    .rotate(45f)
                    .background(tint, CircleShape),
            )
        }
    }
}

@Composable
private fun PaymentGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 16.dp, height = 11.dp)
                .border(2.dp, tint, FlatShape),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .offset(x = 2.dp)
                    .size(width = 10.dp, height = 2.dp)
                    .background(tint, CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .offset(x = (-2).dp)
                    .size(3.dp)
                    .background(tint, CircleShape),
            )
        }
    }
}

@Composable
private fun OrdersGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 14.dp, height = 16.dp)
                .border(2.dp, tint, FlatShape),
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(y = 1.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                repeat(3) {
                    Box(
                        modifier = Modifier
                            .size(width = 8.dp, height = 2.dp)
                            .background(tint, CircleShape),
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoGlyph(tint: Color) {
    GlyphFrame {
        Text(
            text = "i",
            color = tint,
            fontWeight = FontWeight.Black,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun ShopGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 14.dp, height = 12.dp)
                .border(2.dp, tint, FlatShape),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-4).dp)
                    .size(width = 8.dp, height = 6.dp)
                    .border(2.dp, tint, CircleShape),
            )
        }
    }
}

@Composable
private fun QuestionGlyph(tint: Color) {
    GlyphFrame {
        Text(
            text = "?",
            color = tint,
            fontWeight = FontWeight.Black,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun ChatGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 15.dp, height = 11.dp)
                .border(2.dp, tint, FlatShape),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = 2.dp, y = 4.dp)
                    .size(5.dp)
                    .rotate(45f)
                    .background(tint, FlatShape),
            )
        }
    }
}

@Composable
private fun PencilGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 10.dp, height = 3.dp)
                .rotate(-35f)
                .background(tint, CircleShape),
        )
        Box(
            modifier = Modifier
                .offset(x = 4.dp, y = (-4).dp)
                .size(3.dp)
                .rotate(-35f)
                .background(tint, RoundedCornerShape(1.dp)),
        )
        Box(
            modifier = Modifier
                .offset(x = (-4).dp, y = 4.dp)
                .size(3.dp)
                .rotate(-35f)
                .background(tint, RoundedCornerShape(1.dp)),
        )
    }
}

@Composable
private fun RefreshGlyph() {
    GlyphFrame {
        Text(
            text = "↻",
            color = Color(0xFF1E293B),
            fontWeight = FontWeight.Black,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun NotificationGlyph(tint: Color = Color(0xFF1E293B)) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 12.dp, height = 10.dp)
                .background(tint, RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp, bottomStart = 2.dp, bottomEnd = 2.dp)),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-1).dp)
                .size(4.dp)
                .background(tint, CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .offset(y = (-1).dp)
                .size(width = 14.dp, height = 2.dp)
                .background(tint, CircleShape),
        )
    }
}

@Composable
private fun PowerGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(14.dp)
                .border(2.dp, tint, CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-1).dp)
                .size(width = 3.dp, height = 8.dp)
                .background(Color.White, CircleShape),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = 1.dp)
                .size(width = 3.dp, height = 7.dp)
                .background(tint, CircleShape),
        )
    }
}

@Composable
private fun AnimatedTopBarBrand() {
    val transition = rememberInfiniteTransition(label = "topbar-brand")
    val bob = transition.animateFloat(
        initialValue = -2.5f,
        targetValue = 2.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2100, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "brand-bob",
    )
    val tilt = transition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "brand-tilt",
    )

    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandLogoImage(
            size = 32.dp,
            modifier = Modifier.graphicsLayer {
                translationY = bob.value
                rotationZ = tilt.value
            },
        )
        Text(
            text = "Omm Physio World",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.ExtraBold,
            color = OpwInk,
        )
    }
}

@Composable
private fun RefreshAssetIcon() {
    val transition = rememberInfiniteTransition(label = "refresh-icon")
    val rotation = transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "refresh-rotate",
    )
    Image(
        painter = painterResource(id = R.drawable.topbar_reload),
        contentDescription = "Refresh",
        modifier = Modifier
            .size(18.dp)
            .graphicsLayer { rotationZ = rotation.value },
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun NotificationAssetIcon() {
    val transition = rememberInfiniteTransition(label = "bell-icon")
    val sway = transition.animateFloat(
        initialValue = -7f,
        targetValue = 7f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "bell-sway",
    )
    val bob = transition.animateFloat(
        initialValue = -1f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "bell-bob",
    )
    Image(
        painter = painterResource(id = R.drawable.topbar_bell),
        contentDescription = "Notifications",
        modifier = Modifier
            .size(18.dp)
            .offset(x = (-2).dp)
            .graphicsLayer {
                rotationZ = sway.value
                translationY = bob.value
            },
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun ModernPrimaryButton(
    onClick: () -> Unit,
    enabled: Boolean,
    label: String,
    loading: Boolean,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFFB8F58F),
            contentColor = Color(0xFF1F2937),
        ),
        shape = CircleShape,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Spacer(modifier = Modifier.width(12.dp))
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(18.dp),
                    color = Color(0xFF1F2937),
                    strokeWidth = 2.dp,
                )
            } else {
                Text(
                    label,
                    fontWeight = FontWeight.Bold,
                )
            }
            Text(
                ">",
                fontWeight = FontWeight.Black,
                color = Color(0xFF1F2937),
            )
        }
    }
}

@Composable
private fun PatientAvatar(
    name: String,
    imageUrl: String,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val storage = remember(context) { AppStorage(context.applicationContext) }
    val authToken = remember(imageUrl) { storage.getPatientUser()?.string("token").orEmpty() }
    val bitmap by produceState<Bitmap?>(initialValue = null, imageUrl, authToken) {
        value = if (imageUrl.isBlank()) {
            null
        } else {
            loadProtectedBitmap(imageUrl, authToken)
        }
    }
    val initial = name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "P"

    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = OpwBlue.copy(alpha = 0.12f),
    ) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap!!.asImageBitmap(),
                contentDescription = "$name profile image",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape),
            )
        } else {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = initial,
                    color = OpwBlue,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                )
            }
        }
    }
}

@Composable
private fun BrandPill(
    title: String,
    subtitle: String,
) {
    Surface(
        color = Color.White.copy(alpha = 0.14f),
        shape = MaterialTheme.shapes.large,
    ) {
        Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
            Text(
                text = title,
                color = Color.White,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                text = subtitle,
                color = Color.White.copy(alpha = 0.74f),
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun GlassFeatureRow(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.12f), MaterialTheme.shapes.large)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(OpwSky, CircleShape),
        )
        Text(
            text = text,
            color = Color.White,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun OnboardingMiniStat(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.large,
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
            Text(
                text = label,
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
private fun AuthShell(
    title: String,
    subtitle: String,
    onBack: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    GradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 18.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BrandPill(
                    title = "OPW Access",
                    subtitle = "Patient login flow",
                )
                if (onBack != null) {
                    TextButton(onClick = onBack) {
                        Text("Back", color = Color.White)
                    }
                } else {
                    AssistChip(
                        onClick = {},
                        label = { Text("Secure Access") },
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.12f)),
                shape = MaterialTheme.shapes.extraLarge,
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = "OMM PHYSIO WORLD",
                        color = Color.White.copy(alpha = 0.76f),
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.White.copy(alpha = 0.9f),
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        OnboardingMiniStat(label = "Clinic", value = "OPW", modifier = Modifier.weight(1f))
                        OnboardingMiniStat(label = "Mode", value = "Native", modifier = Modifier.weight(1f))
                        OnboardingMiniStat(label = "Support", value = "Live", modifier = Modifier.weight(1f))
                    }
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
                shape = MaterialTheme.shapes.extraLarge,
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = OpwInk,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = OpwSlate,
                    )
                    Spacer(modifier = Modifier.height(18.dp))
                    content()
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = "Baripada, Odisha | Patient-first physiotherapy care",
                color = Color.White.copy(alpha = 0.72f),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun GradientBackground(content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .dismissKeyboardOnTap()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF071224), OpwBlue, OpwSky),
                ),
            ),
        content = content,
    )
}

@Composable
private fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier.fillMaxWidth(),
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    enabled: Boolean = true,
    minLines: Int = 1,
    hidden: Boolean = false,
    onToggleHidden: (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier,
        enabled = enabled,
        minLines = minLines,
        shape = FlatShape,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction,
        ),
        visualTransformation = if (hidden) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = if (onToggleHidden != null) {
            {
                TextButton(onClick = onToggleHidden) {
                    Text(if (hidden) "Show" else "Hide")
                }
            }
        } else {
            null
        },
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Color(0xFFF8FBFF),
            unfocusedContainerColor = Color(0xFFF8FBFF),
            disabledContainerColor = Color(0xFFF1F5F9),
            focusedIndicatorColor = OpwBlue,
            unfocusedIndicatorColor = OpwBorder,
            disabledIndicatorColor = OpwBorder,
        ),
    )
}

@Composable
private fun HeroCard(
    eyebrow: String,
    title: String,
    subtitle: String,
    showSubtitle: Boolean = true,
    shape: androidx.compose.ui.graphics.Shape = FlatShape,
    content: @Composable (() -> Unit)? = null,
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent,
        ),
        shape = shape,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(Color(0xFF071224), OpwBlue, OpwSky),
                    ),
                )
                .padding(22.dp),
        ) {
            Text(
                text = eyebrow,
                color = Color.White.copy(alpha = 0.85f),
                fontWeight = FontWeight.ExtraBold,
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
                color = Color.White,
            )
            if (showSubtitle && subtitle.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.92f),
                )
            }
            if (content != null) {
                Spacer(modifier = Modifier.height(14.dp))
                content()
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    subtitle: String,
    showSubtitle: Boolean = true,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    val motion = rememberFloatingCardMotion(delayMillis = 0)
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
        shape = RoundedCornerShape(24.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD8E7F6)),
        modifier = Modifier
            .fillMaxWidth()
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation + 2.dp,
                shape = RoundedCornerShape(24.dp),
                ambientColor = OpwBlue.copy(alpha = 0.18f),
                spotColor = OpwBlue.copy(alpha = 0.22f),
            ),
        elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
                color = OpwInk,
            )
            if (showSubtitle && subtitle.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = subtitle, color = OpwSlate)
                Spacer(modifier = Modifier.height(14.dp))
            } else {
                Spacer(modifier = Modifier.height(12.dp))
            }
            content()
        }
    }
}

@Composable
private fun PlainSection(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            color = OpwInk,
        )
        if (subtitle.isNotBlank()) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = subtitle,
                color = OpwSlate,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        Spacer(modifier = Modifier.height(14.dp))
        content()
    }
}

@Composable
private fun PickerIconAction(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: @Composable () -> Unit,
    label: String,
    value: String,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            modifier = Modifier
                .clickable(onClick = onClick)
                .padding(vertical = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = Color.White.copy(alpha = 0.95f),
                shape = RoundedCornerShape(18.dp),
                tonalElevation = 0.dp,
                shadowElevation = 8.dp,
                modifier = Modifier.shadow(
                    elevation = 10.dp,
                    shape = RoundedCornerShape(18.dp),
                    ambientColor = OpwBlue.copy(alpha = 0.14f),
                    spotColor = OpwBlue.copy(alpha = 0.18f),
                ),
            ) {
                Box(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    icon()
                }
            }
            Text(
                text = label,
                color = OpwInk,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (value.isNotBlank()) {
            Text(
                text = value,
                color = OpwSlate,
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(start = 2.dp),
            )
        }
    }
}

@Composable
private fun AppointmentHeroMiniCard(
    title: String,
    subtitle: String,
    icon: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = 0.12f),
        shape = RoundedCornerShape(24.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Surface(
                color = Color.White.copy(alpha = 0.12f),
                shape = RoundedCornerShape(16.dp),
            ) {
                Box(
                    modifier = Modifier.padding(10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    icon()
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = subtitle,
                color = Color.White.copy(alpha = 0.78f),
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun AppointmentSummaryCard(
    label: String,
    value: String,
    detail: String,
    icon: @Composable () -> Unit,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    val motion = rememberFloatingCardMotion(delayMillis = 90)
    Surface(
        modifier = Modifier
            .then(modifier)
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = RoundedCornerShape(24.dp),
                ambientColor = accent.copy(alpha = 0.14f),
                spotColor = accent.copy(alpha = 0.18f),
            ),
        color = Color.White.copy(alpha = 0.97f),
        shape = RoundedCornerShape(24.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.14f)),
        tonalElevation = 0.dp,
        shadowElevation = motion.elevation,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                color = accent.copy(alpha = 0.12f),
                shape = RoundedCornerShape(16.dp),
            ) {
                Box(
                    modifier = Modifier.padding(10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    icon()
                }
            }
            Text(
                text = label,
                color = OpwSlate,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = value,
                color = OpwInk,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = detail,
                color = OpwSlate,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun MetricGrid(metrics: List<Pair<String, String>>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        metrics.chunked(2).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEachIndexed { columnIndex, entry ->
                    val (label, value) = entry
                    val accent = metricAccent(label)
                    val motion = rememberFloatingCardMotion(delayMillis = (rowIndex * 220) + (columnIndex * 140))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.96f)),
                        modifier = Modifier
                            .weight(1f)
                            .offset(y = motion.lift)
                            .shadow(
                                elevation = motion.elevation + 1.dp,
                                shape = RoundedCornerShape(24.dp),
                                ambientColor = accent.copy(alpha = 0.16f),
                                spotColor = accent.copy(alpha = 0.22f),
                            ),
                        shape = RoundedCornerShape(24.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.16f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = motion.elevation),
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top,
                            ) {
                                Surface(
                                    color = accent.copy(alpha = 0.14f),
                                    shape = RoundedCornerShape(16.dp),
                                ) {
                                    Box(
                                        modifier = Modifier.padding(10.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        MetricGlyph(label = label, tint = accent)
                                    }
                                }
                                Text(
                                    value,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Black,
                                    color = OpwInk,
                                )
                            }
                            Spacer(modifier = Modifier.height(14.dp))
                            Text(
                                label,
                                color = OpwSlate,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

private fun metricAccent(label: String): Color = when (label) {
    "Appointments" -> OpwBlue
    "Pending Requests" -> OpwWarning
    "Treatment Plans" -> Color(0xFF14B8A6)
    "Payments" -> OpwSuccess
    "Services" -> Color(0xFF0EA5E9)
    "Notes" -> Color(0xFF6366F1)
    else -> OpwBlue
}

@Composable
private fun MetricGlyph(label: String, tint: Color) {
    when (label) {
        "Appointments" -> CalendarGlyph(tint)
        "Pending Requests" -> NotificationGlyph(tint = tint)
        "Treatment Plans" -> TherapyGlyph(tint)
        "Payments" -> PaymentGlyph(tint)
        "Services" -> GridGlyph(tint)
        "Notes" -> OrdersGlyph(tint)
        else -> GridGlyph(tint)
    }
}

@Composable
private fun TherapyResourceCard(
    item: JsonMap,
    apiService: AppApiService,
    onOpenImage: (String, String) -> Unit,
    onOpenVideo: (String, String) -> Unit,
    showMessage: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val storage = remember(context) { AppStorage(context.applicationContext) }
    val authToken = remember(item.string("id")) { storage.getPatientUser()?.string("token").orEmpty() }
    val fileName = item.stringOrNull("fileName")?.takeIf { it.isNotBlank() }
        ?: item.stringOrNull("title")?.takeIf { it.isNotBlank() }
        ?: "therapy-file"
    val mimeType = item.stringOrNull("mimeType").orEmpty()
    val resourceUrl = item.stringOrNull("fileUrl")
        ?.takeIf { it.isNotBlank() }
        ?: item.stringOrNull("downloadUrl").orEmpty()
    val resolvedUrl = apiService.resolveResourceUrl(resourceUrl)
    val isGif = mimeType.equals("image/gif", ignoreCase = true) || fileName.endsWith(".gif", ignoreCase = true)
    val isImage = mimeType.startsWith("image/") && !isGif
    val isVideo = mimeType.startsWith("video/")
    val title = item.stringOrNull("title")?.takeIf { it.isNotBlank() } ?: "Therapy item"
    val description = item.stringOrNull("description").orEmpty()
    val typeLabel = when {
        isImage -> "Image"
        isVideo -> "Video"
        isGif -> "GIF"
        mimeType.contains("pdf", ignoreCase = true) || fileName.endsWith(".pdf", ignoreCase = true) -> "PDF"
        mimeType.isNotBlank() -> mimeType.substringBefore('/').replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        else -> "File"
    }

    Surface(
        modifier = Modifier.clickable(enabled = resolvedUrl.isNotBlank()) {
            when {
                resolvedUrl.isBlank() -> Unit
                isImage -> onOpenImage(title, resolvedUrl)
                isVideo -> onOpenVideo(title, resolvedUrl)
                else -> {
                    scope.launch {
                        val opened = context.openProtectedFile(
                            url = resolvedUrl,
                            fileName = fileName,
                            mimeType = mimeType,
                            authToken = authToken,
                        )
                        if (!opened) {
                            showMessage("Unable to open this file right now.")
                        }
                    }
                }
            }
        },
        color = Color(0xFFF8FBFF),
        shape = RoundedCornerShape(22.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder.copy(alpha = 0.8f)),
        shadowElevation = 2.dp,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = when {
                    isImage -> OpwBlue.copy(alpha = 0.12f)
                    isVideo -> OpwSuccess.copy(alpha = 0.12f)
                    else -> OpwWarning.copy(alpha = 0.12f)
                },
                shape = RoundedCornerShape(18.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .padding(12.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    when {
                        isImage -> GridGlyph(OpwBlue)
                        isVideo -> PlayGlyph(OpwSuccess)
                        else -> OrdersGlyph(OpwWarning)
                    }
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = title,
                    color = OpwInk,
                    fontWeight = FontWeight.Black,
                )
                if (description.isNotBlank()) {
                    Text(
                        text = description,
                        color = OpwSlate,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                    )
                }
                Text(
                    text = "$typeLabel | $fileName",
                    color = OpwSlate,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                )
            }
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, OpwBorder.copy(alpha = 0.7f)),
            ) {
                Text(
                    text = if (resolvedUrl.isBlank()) "No file" else "Open",
                    color = if (resolvedUrl.isBlank()) OpwSlate else OpwBlue,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                )
            }
        }
    }
}

@Composable
private fun PlayGlyph(tint: Color) {
    GlyphFrame {
        Box(
            modifier = Modifier
                .size(width = 0.dp, height = 0.dp)
                .border(
                    width = 0.dp,
                    color = tint,
                    shape = RoundedCornerShape(0.dp),
                ),
        )
        Text(
            text = "▶",
            color = tint,
            fontWeight = FontWeight.Black,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun TherapyVideoDialog(
    title: String,
    videoUrl: String,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val storage = remember(context) { AppStorage(context.applicationContext) }
    val authToken = remember(videoUrl) { storage.getPatientUser()?.string("token").orEmpty() }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                )
                TherapyVideoPlayer(
                    videoUrl = videoUrl,
                    authToken = authToken,
                    autoPlay = true,
                )
            }
            TextButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp),
            ) {
                Text("Close", color = Color.White)
            }
        }
    }
}

@Composable
private fun SecureAttachmentImage(
    imageUrl: String,
    authToken: String,
    onClick: () -> Unit,
) {
    val bitmap by produceState<Bitmap?>(initialValue = null, imageUrl, authToken) {
        value = loadProtectedBitmap(imageUrl, authToken)
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        color = Color.White,
        shape = RoundedCornerShape(20.dp),
        shadowElevation = 4.dp,
    ) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap!!.asImageBitmap(),
                contentDescription = "Therapy image",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                contentScale = ContentScale.Crop,
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = OpwBlue)
            }
        }
    }
}

@Composable
private fun TherapyVideoPlayer(
    videoUrl: String,
    authToken: String,
    autoPlay: Boolean = false,
) {
    var videoView by remember { mutableStateOf<VideoView?>(null) }
    val headers = remember(authToken) {
        if (authToken.isBlank()) emptyMap() else mapOf("Authorization" to "Bearer $authToken")
    }

    Surface(
        color = Color.White,
        shape = RoundedCornerShape(20.dp),
        shadowElevation = 4.dp,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AndroidView(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                factory = { viewContext ->
                    VideoView(viewContext).apply {
                        setVideoURI(Uri.parse(videoUrl), headers)
                        setOnPreparedListener { mediaPlayer ->
                            mediaPlayer.isLooping = false
                            if (autoPlay) {
                                start()
                            } else {
                                seekTo(1)
                                pause()
                            }
                        }
                        videoView = this
                    }
                },
                update = { view ->
                    if (videoView !== view) {
                        videoView = view
                    }
                },
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedButton(
                    onClick = { videoView?.start() },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Play")
                }
                OutlinedButton(
                    onClick = { videoView?.pause() },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Pause")
                }
                OutlinedButton(
                    onClick = {
                        videoView?.pause()
                        videoView?.seekTo(0)
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Stop")
                }
            }
        }
    }
}

@Composable
private fun FullscreenImageViewer(
    title: String,
    imageUrl: String,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val storage = remember(context) { AppStorage(context.applicationContext) }
    val authToken = remember(imageUrl) { storage.getPatientUser()?.string("token").orEmpty() }
    val bitmap by produceState<Bitmap?>(initialValue = null, imageUrl, authToken) {
        value = loadProtectedBitmap(imageUrl, authToken)
    }
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
        ) {
            if (bitmap != null) {
                Image(
                    bitmap = bitmap!!.asImageBitmap(),
                    contentDescription = title,
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(imageUrl) {
                            detectTransformGestures { _, pan, zoom, _ ->
                                scale = (scale * zoom).coerceIn(1f, 5f)
                                offset = offset + pan
                            }
                        }
                        .graphicsLayer {
                            scaleX = scale
                            scaleY = scale
                            translationX = offset.x
                            translationY = offset.y
                        },
                    contentScale = ContentScale.Fit,
                )
            } else {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = Color.White)
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                )
                TextButton(
                    onClick = {
                        scale = 1f
                        offset = Offset.Zero
                    },
                ) {
                    Text("Reset", color = Color.White)
                }
                TextButton(onClick = onDismiss) {
                    Text("Close", color = Color.White)
                }
            }
        }
    }
}

@Composable
private fun SessionPlanCard(
    title: String,
    dateRange: String,
    sessions: List<JsonMap>,
) {
    Surface(
        color = Color(0xFFF8FBFF),
        shape = RoundedCornerShape(22.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD7E6F5)),
        shadowElevation = 3.dp,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = title,
                color = OpwInk,
                fontWeight = FontWeight.Black,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                text = dateRange,
                color = OpwSlate,
                style = MaterialTheme.typography.bodySmall,
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFEAF3FB), RoundedCornerShape(16.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                SessionHeaderCell("Date", Modifier.weight(1f))
                SessionHeaderCell("Session Done / Note Done", Modifier.weight(1f))
                SessionHeaderCell("Remark", Modifier.weight(1f))
            }

            if (sessions.isEmpty()) {
                Text("No session dates added yet.", color = OpwSlate)
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    sessions.forEach { session ->
                        SessionDataRow(session = session)
                    }
                }
            }
        }
    }
}

@Composable
private fun SessionHeaderCell(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        modifier = modifier,
        color = OpwInk,
        fontWeight = FontWeight.Bold,
        style = MaterialTheme.typography.bodySmall,
    )
}

@Composable
private fun SessionDataRow(session: JsonMap) {
    val status = session.string("status").lowercase().ifBlank { "not_done" }
    val statusLabel = if (status == "done") "Done" else "Not done"
    val statusTint = if (status == "done") OpwSuccess else OpwWarning
    val remark = session.stringOrNull("updatedAt")
        ?.takeIf { it.isNotBlank() }
        ?.let { "Updated ${formatDisplayDate(parseLocalDate(it.substringBefore('T')))}" }
        ?: "-"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(1.dp, OpwBorder.copy(alpha = 0.75f), RoundedCornerShape(18.dp))
            .padding(horizontal = 12.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = session.stringOrNull("date") ?: "Date not added",
            modifier = Modifier.weight(1f),
            color = OpwInk,
            style = MaterialTheme.typography.bodyMedium,
        )
        Surface(
            color = statusTint.copy(alpha = 0.12f),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.weight(1f),
        ) {
            Text(
                text = statusLabel,
                color = statusTint,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            )
        }
        Text(
            text = remark,
            modifier = Modifier.weight(1f),
            color = OpwSlate,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun RecordTile(title: String, subtitle: String) {
    val motion = rememberFloatingCardMotion(delayMillis = 120)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .offset(y = motion.lift)
            .shadow(
                elevation = motion.elevation,
                shape = RoundedCornerShape(20.dp),
                ambientColor = OpwBlue.copy(alpha = 0.14f),
                spotColor = OpwBlue.copy(alpha = 0.18f),
            ),
        color = Color(0xFFF8FBFF),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD7E6F5)),
        tonalElevation = 0.dp,
        shadowElevation = motion.elevation,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Surface(
                color = OpwBlue.copy(alpha = 0.12f),
                shape = RoundedCornerShape(14.dp),
            ) {
                Box(
                    modifier = Modifier.padding(10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    OrdersGlyph(tint = OpwBlue)
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, color = OpwInk)
                Spacer(modifier = Modifier.height(6.dp))
                Text(subtitle, color = OpwSlate)
            }
        }
    }
}

private data class FloatingCardMotion(
    val lift: androidx.compose.ui.unit.Dp,
    val elevation: androidx.compose.ui.unit.Dp,
)

@Composable
private fun rememberFloatingCardMotion(delayMillis: Int): FloatingCardMotion {
    val transition = rememberInfiniteTransition(label = "floating-card")
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
        label = "card-lift",
    )
    val elevation = transition.animateFloat(
        initialValue = 8f,
        targetValue = 16f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 2200,
                delayMillis = delayMillis,
                easing = FastOutSlowInEasing,
            ),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "card-elevation",
    )
    return FloatingCardMotion(
        lift = lift.value.dp,
        elevation = elevation.value.dp,
    )
}

@Composable
private fun NoticeCard(title: String, body: String, stamp: String, unread: Boolean, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .border(1.dp, if (unread) OpwBlue.copy(alpha = 0.3f) else OpwBorder, FlatShape)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, fontWeight = FontWeight.Bold, color = OpwInk, modifier = Modifier.weight(1f))
            if (unread) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(OpwBlue, CircleShape),
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(body, color = OpwSlate)
        Spacer(modifier = Modifier.height(8.dp))
        Text(stamp, color = OpwSlate, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun AttachmentList(attachments: List<UploadFile>, onRemove: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        attachments.forEachIndexed { index, file ->
            Surface(
                color = Color(0xFFF8FBFF),
                shape = RoundedCornerShape(18.dp),
                shadowElevation = 2.dp,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, OpwBorder.copy(alpha = 0.7f), RoundedCornerShape(18.dp))
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(file.name, color = OpwInk, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    TextButton(onClick = { onRemove(index) }) {
                        Text("Remove")
                    }
                }
            }
        }
    }
}

@Composable
private fun LabelValue(label: String, value: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, OpwBorder, FlatShape)
            .padding(12.dp),
    ) {
        Text(label, color = OpwSlate)
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, color = OpwInk, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SelectableTile(selected: Boolean, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(if (selected) 10.dp else 2.dp, RoundedCornerShape(22.dp), clip = false)
            .background(
                color = if (selected) Color(0xFFEFF7FF) else Color.White,
                shape = RoundedCornerShape(22.dp),
            )
            .border(1.dp, if (selected) OpwBlue.copy(alpha = 0.32f) else OpwBorder, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PatientAvatar(
            name = title,
            imageUrl = "",
            modifier = Modifier.size(46.dp),
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Black, color = OpwInk)
            Spacer(modifier = Modifier.height(4.dp))
            Text(subtitle, color = OpwSlate)
        }
        ChatStatusChip(
            label = if (selected) "Selected" else "Online",
            tint = if (selected) OpwBlue else Color(0xFF16A34A),
        )
    }
}

@Composable
private fun ChatBubble(
    fromVisitor: Boolean,
    senderName: String,
    text: String,
    time: String,
    attachments: List<JsonMap>,
    onOpenAttachment: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp),
        horizontalArrangement = if (fromVisitor) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Bottom,
    ) {
        if (!fromVisitor) {
            PatientAvatar(
                name = senderName,
                imageUrl = "",
                modifier = Modifier.size(34.dp),
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
        Surface(
            color = if (fromVisitor) OpwBlue else Color.White,
            shape = RoundedCornerShape(
                topStart = 22.dp,
                topEnd = 22.dp,
                bottomStart = if (fromVisitor) 22.dp else 8.dp,
                bottomEnd = if (fromVisitor) 8.dp else 22.dp,
            ),
            tonalElevation = 0.dp,
            shadowElevation = if (fromVisitor) 2.dp else 6.dp,
            modifier = Modifier.fillMaxWidth(0.82f),
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                if (!fromVisitor) {
                    Text(
                        text = senderName,
                        color = OpwBlue,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                Text(text.ifBlank { "(Attachment)" }, color = if (fromVisitor) Color.White else OpwInk)
                if (attachments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    attachments.forEach { attachment ->
                        Surface(
                            color = if (fromVisitor) Color.White.copy(alpha = 0.15f) else Color(0xFFF2F8FF),
                            shape = RoundedCornerShape(16.dp),
                        ) {
                            Text(
                                text = attachment.stringOrNull("name") ?: "Attachment",
                                color = if (fromVisitor) Color.White.copy(alpha = 0.96f) else OpwBlue,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier
                                    .clickable {
                                        attachment.stringOrNull("downloadUrl")?.let(onOpenAttachment)
                                    }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
                if (time.isNotBlank()) {
                    if (attachments.isEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Text(
                        time,
                        color = if (fromVisitor) Color.White.copy(alpha = 0.7f) else OpwSlate,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
        if (fromVisitor) {
            Spacer(modifier = Modifier.width(8.dp))
            PatientAvatar(
                name = senderName,
                imageUrl = "",
                modifier = Modifier.size(34.dp),
            )
        }
    }
}

@Composable
private fun ChatStatusChip(label: String, tint: Color) {
    Surface(
        color = tint.copy(alpha = 0.12f),
        shape = RoundedCornerShape(20.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(tint, CircleShape),
            )
            Text(
                text = label,
                color = tint,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun SmallActionButton(label: String, onClick: () -> Unit, enabled: Boolean = true) {
    OutlinedButton(onClick = onClick, enabled = enabled) {
        Text(label)
    }
}

private suspend fun loadDashboardSnapshot(apiService: AppApiService, patientId: String): DashboardSnapshot {
    if (patientId.isBlank()) {
        return DashboardSnapshot(loading = false)
    }

    return try {
        coroutineScope {
            val patient = apiService.getPatient(patientId)
            val appointmentRequests = apiService.getPatientAppointmentRequests(patientId)
            val services = apiService.getServices()
            val shopOrders = apiService.getMyShopOrders()
            DashboardSnapshot(
                patient = patient,
                appointmentRequests = appointmentRequests,
                services = services,
                shopOrders = shopOrders,
                loading = false,
            )
        }
    } catch (error: ApiException) {
        throw error
    }
}

private fun buildNotifications(patient: JsonMap?, appointmentRequests: List<JsonMap>): List<NotificationItem> {
    if (patient == null) {
        return emptyList()
    }

    val notifications = mutableListOf<NotificationItem>()

    patient.listOfMaps("clinicalNotes").forEach { note ->
        if (note.string("addedByType") == "patient") {
            return@forEach
        }
        notifications += NotificationItem(
            id = "note:${note.string("id")}:${note.stringOrNull("updatedAt") ?: note.stringOrNull("createdAt").orEmpty()}",
            title = note.stringOrNull("title") ?: "New clinical note from OPW",
            body = note.stringOrNull("note") ?: "OPW added a clinical note to your recovery record.",
            timestamp = firstValidInstant(note["updatedAt"], note["createdAt"]),
        )
    }

    appointmentRequests.forEach { request ->
        val status = request.string("status").lowercase().ifBlank { "pending" }
        if (status == "pending") {
            return@forEach
        }
        val service = request.stringOrNull("service") ?: "Appointment"
        notifications += NotificationItem(
            id = "appointment:${request.string("id")}:${request.stringOrNull("updatedAt") ?: request.stringOrNull("createdAt").orEmpty()}",
            title = when (status) {
                "approved" -> "$service confirmed"
                "rescheduled" -> "$service rescheduled"
                "completed" -> "$service marked done"
                "cancelled" -> "$service cancelled"
                else -> "$service updated"
            },
            body = listOfNotNull(
                request.stringOrNull("confirmedDate")?.let { date ->
                    val time = request.stringOrNull("confirmedTime")
                    if (time.isNullOrBlank()) "Schedule: $date" else "Schedule: $date at $time"
                },
                request.stringOrNull("decisionNote")?.takeIf { it.isNotBlank() }?.let { "OPW note: $it" },
            ).ifEmpty { listOf("OPW updated your appointment request.") }.joinToString("\n"),
            timestamp = firstValidInstant(request["updatedAt"], request["createdAt"], request["confirmedDate"]),
        )
    }

    patient.listOfMaps("treatmentPlans").forEach { plan ->
        val treatmentLabel = (plan["treatmentTypes"] as? List<*>)?.joinToString().orEmpty().ifBlank { "Session plan" }
        notifications += NotificationItem(
            id = "plan:${plan.string("id")}:${plan.stringOrNull("updatedAt") ?: plan.stringOrNull("createdAt") ?: plan.stringOrNull("fromDate").orEmpty()}",
            title = "Session plan updated",
            body = "$treatmentLabel\nPlan period: ${plan.stringOrNull("fromDate") ?: "not set"} to ${plan.stringOrNull("toDate") ?: "not set"}",
            timestamp = firstValidInstant(plan["updatedAt"], plan["createdAt"], plan["fromDate"]),
        )
        plan.listOfMaps("sessionDays")
            .filter { day ->
                day.stringOrNull("updatedAt")?.isNotBlank() == true
            }
            .forEach { day ->
                notifications += NotificationItem(
                    id = "session-day:${plan.string("id")}:${day.string("id")}:${day.stringOrNull("updatedAt").orEmpty()}",
                    title = "$treatmentLabel session updated",
                    body = buildString {
                        append("Date: ${day.stringOrNull("date") ?: "not set"}")
                        append("\nStatus: ${if (day.string("status") == "done") "Done" else "Not done"}")
                    },
                    timestamp = firstValidInstant(day["updatedAt"], day["date"]),
                )
            }
        plan.listOfMaps("payments").forEach { payment ->
            notifications += NotificationItem(
                id = "plan-payment:${plan.string("id")}:${payment.string("id")}:${payment.stringOrNull("updatedAt") ?: payment.stringOrNull("createdAt").orEmpty()}",
                title = "Treatment payment updated",
                body = "${formatMoney(payment["amount"])} | $treatmentLabel",
                timestamp = firstValidInstant(payment["updatedAt"], payment["createdAt"]),
            )
        }
    }

    patient.listOfMaps("therapyRecommendations").forEach { recommendation ->
        val serviceLabel = recommendation.stringOrNull("serviceName")
            ?: recommendation.stringOrNull("service")
            ?: "Therapy"
        notifications += NotificationItem(
            id = "therapy:${recommendation.string("id")}:${recommendation.stringOrNull("updatedAt") ?: recommendation.stringOrNull("createdAt").orEmpty()}",
            title = "$serviceLabel therapy updated",
            body = recommendation.stringOrNull("note")
                ?.takeIf { it.isNotBlank() }
                ?: "${recommendation.listOfMaps("items").size} therapy item(s) shared by OPW.",
            timestamp = firstValidInstant(recommendation["updatedAt"], recommendation["createdAt"]),
        )
        recommendation.listOfMaps("items").forEach { item ->
            notifications += NotificationItem(
                id = "therapy-item:${recommendation.string("id")}:${item.string("id")}:${recommendation.stringOrNull("updatedAt") ?: recommendation.stringOrNull("createdAt").orEmpty()}",
                title = "${item.stringOrNull("title") ?: "Therapy item"} added",
                body = listOfNotNull(
                    serviceLabel.takeIf { it.isNotBlank() },
                    item.stringOrNull("description")?.takeIf { it.isNotBlank() },
                    item.stringOrNull("fileName")?.takeIf { it.isNotBlank() }?.let { "File: $it" },
                ).joinToString("\n"),
                timestamp = firstValidInstant(recommendation["updatedAt"], recommendation["createdAt"]),
            )
        }
    }

    patient.listOfMaps("payments").forEach { payment ->
        notifications += NotificationItem(
            id = "payment:${payment.string("id")}:${payment.stringOrNull("updatedAt") ?: payment.stringOrNull("createdAt").orEmpty()}",
            title = "Payment update added",
            body = "${formatMoney(payment["amount"])} | ${payment.stringOrNull("method") ?: "Payment"}",
            timestamp = firstValidInstant(payment["updatedAt"], payment["createdAt"]),
        )
    }

    return notifications.sortedByDescending { it.timestamp ?: Instant.EPOCH }
}

private fun visibleAppointmentRequests(patient: JsonMap?, appointmentRequests: List<JsonMap>): List<JsonMap> {
    val bookedRequestIds = patient.listOfMaps("appointments")
        .mapNotNull { it.stringOrNull("requestId") }
        .toSet()

    return appointmentRequests.filter { request ->
        val requestId = request.string("id")
        val status = request.string("status")
        requestId !in bookedRequestIds && status != "cancelled" && status != "completed"
    }
}

private fun createdFromLabel(value: String): String {
    return when (value.trim()) {
        "mobile_app" -> "Mobile App"
        "website" -> "Website"
        else -> "Admin"
    }
}

private fun firstValidInstant(vararg values: Any?): Instant? {
    values.forEach { value ->
        parseInstant(value?.toString())?.let { return it }
    }
    return null
}

private fun parseInstant(value: String?): Instant? {
    val raw = value?.trim().orEmpty()
    if (raw.isBlank()) {
        return null
    }

    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { LocalDate.parse(raw).atStartOfDay(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun parseLocalDate(value: String?): LocalDate? {
    val raw = value?.trim().orEmpty()
    if (raw.isBlank()) {
        return null
    }

    return runCatching { LocalDate.parse(raw.take(10)) }.getOrNull()
        ?: runCatching { Instant.parse(raw).atZone(ZoneId.systemDefault()).toLocalDate() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).toLocalDate() }.getOrNull()
}

private fun formatDisplayDate(date: LocalDate?): String {
    return date?.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) ?: "Not available"
}

private fun formatDisplayTime(time: LocalTime): String {
    return time.format(DateTimeFormatter.ofPattern("hh:mm a"))
}

private fun formatNotificationTime(value: Instant?): String {
    if (value == null) {
        return "Recent update"
    }

    val zoned = value.atZone(ZoneId.systemDefault())
    val now = Instant.now().atZone(ZoneId.systemDefault())
    val difference = java.time.temporal.ChronoUnit.DAYS.between(zoned.toLocalDate(), now.toLocalDate())
    val timeLabel = zoned.format(DateTimeFormatter.ofPattern("hh:mm a"))
    return when (difference) {
        0L -> "Today, $timeLabel"
        1L -> "Yesterday, $timeLabel"
        else -> "${formatDisplayDate(zoned.toLocalDate())} | $timeLabel"
    }
}

private fun formatPaymentDate(record: JsonMap): String {
    return formatDisplayDate(parseLocalDate(record.stringOrNull("createdAt")))
}

private fun formatChatTime(value: String?): String {
    val instant = parseInstant(value) ?: return ""
    return instant.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"))
}

private fun formatMoney(value: Any?): String {
    val amount = when (value) {
        is Number -> value.toDouble()
        else -> value?.toString()?.toDoubleOrNull() ?: 0.0
    }
    return "Rs. ${amount.toInt()}"
}

private suspend fun loadProtectedBitmap(url: String, authToken: String): Bitmap? {
    if (url.isBlank()) {
        return null
    }
    return withContext(Dispatchers.IO) {
        runCatching {
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 15_000
                readTimeout = 15_000
                if (authToken.isNotBlank()) {
                    setRequestProperty("Authorization", "Bearer $authToken")
                }
            }
            connection.inputStream.use { stream ->
                BitmapFactory.decodeStream(stream)
            }
        }.getOrNull()
    }
}

private suspend fun Context.openProtectedFile(
    url: String,
    fileName: String,
    mimeType: String,
    authToken: String,
): Boolean {
    if (url.isBlank()) {
        return false
    }

    return runCatching {
        val targetFile = withContext(Dispatchers.IO) {
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000
                readTimeout = 20_000
                if (authToken.isNotBlank()) {
                    setRequestProperty("Authorization", "Bearer $authToken")
                }
            }
            val safeName = fileName
                .ifBlank { "therapy-file" }
                .replace(Regex("[^A-Za-z0-9._-]"), "_")
            val extension = safeName.substringAfterLast('.', "")
                .ifBlank {
                    MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType).orEmpty()
                }
            val finalName = if (safeName.contains('.')) safeName else {
                if (extension.isBlank()) safeName else "$safeName.$extension"
            }
            val directory = File(cacheDir, "shared_files").apply { mkdirs() }
            val file = File(directory, finalName)
            connection.inputStream.use { input ->
                FileOutputStream(file).use { output ->
                    input.copyTo(output)
                }
            }
            file
        }

        val fileUri = FileProvider.getUriForFile(
            this,
            "$packageName.fileprovider",
            targetFile,
        )
        val finalMimeType = mimeType.ifBlank {
            MimeTypeMap.getSingleton()
                .getMimeTypeFromExtension(targetFile.extension.lowercase())
                .orEmpty()
        }.ifBlank { "*/*" }

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(fileUri, finalMimeType)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(intent, "Open file"))
        true
    }.getOrDefault(false)
}

private fun showDatePicker(context: Context, initial: LocalDate, onSelected: (LocalDate) -> Unit) {
    DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            onSelected(LocalDate.of(year, month + 1, dayOfMonth))
        },
        initial.year,
        initial.monthValue - 1,
        initial.dayOfMonth,
    ).show()
}

private fun showTimePicker(context: Context, initial: LocalTime, onSelected: (LocalTime) -> Unit) {
    TimePickerDialog(
        context,
        { _, hourOfDay, minute ->
            onSelected(LocalTime.of(hourOfDay, minute))
        },
        initial.hour,
        initial.minute,
        false,
    ).show()
}

private fun Context.openUrl(url: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    startActivity(intent)
}

private fun Context.dialPhone(phone: String) {
    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    startActivity(intent)
}

private fun Context.readUploadFile(uri: Uri): UploadFile? {
    return try {
        val name = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (cursor.moveToFirst() && index >= 0) cursor.getString(index) else null
        } ?: "upload-file"
        val mimeType = contentResolver.getType(uri)
        val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return null
        UploadFile(name = name, bytes = bytes, mimeType = mimeType)
    } catch (_: IOException) {
        null
    }
}
