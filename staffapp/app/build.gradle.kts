import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use(::load)
    }
}

val staffUploadStoreFile = localProperties.getProperty("OPW_STAFF_UPLOAD_STORE_FILE")?.trim()
val staffUploadStorePassword = localProperties.getProperty("OPW_STAFF_UPLOAD_STORE_PASSWORD")?.trim()
val staffUploadKeyAlias = localProperties.getProperty("OPW_STAFF_UPLOAD_KEY_ALIAS")?.trim()
val staffUploadKeyPassword = localProperties.getProperty("OPW_STAFF_UPLOAD_KEY_PASSWORD")?.trim()
val hasStaffUploadSigning = listOf(
    staffUploadStoreFile,
    staffUploadStorePassword,
    staffUploadKeyAlias,
    staffUploadKeyPassword,
).all { !it.isNullOrBlank() }

android {
    namespace = "com.example.opw_staff"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.ommphysioworld.staffapp"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        val apiBaseUrl = providers.gradleProperty("OPW_STAFF_API_BASE_URL")
            .orElse("https://ommphysioworld.com/api")
            .get()
            .trim()
        buildConfigField("String", "OPW_STAFF_API_BASE_URL", "\"${apiBaseUrl.escapeForBuildConfig()}\"")
    }

    signingConfigs {
        if (hasStaffUploadSigning) {
            create("release") {
                storeFile = rootProject.file(staffUploadStoreFile!!)
                storePassword = staffUploadStorePassword
                keyAlias = staffUploadKeyAlias
                keyPassword = staffUploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasStaffUploadSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}

fun String.escapeForBuildConfig(): String =
    replace("\\", "\\\\").replace("\"", "\\\"")
