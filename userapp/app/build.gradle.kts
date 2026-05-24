import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.google.services)
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use(::load)
    }
}

val userUploadStoreFile = localProperties.getProperty("OPW_USER_UPLOAD_STORE_FILE")?.trim()
val userUploadStorePassword = localProperties.getProperty("OPW_USER_UPLOAD_STORE_PASSWORD")?.trim()
val userUploadKeyAlias = localProperties.getProperty("OPW_USER_UPLOAD_KEY_ALIAS")?.trim()
val userUploadKeyPassword = localProperties.getProperty("OPW_USER_UPLOAD_KEY_PASSWORD")?.trim()
val hasUserUploadSigning = listOf(
    userUploadStoreFile,
    userUploadStorePassword,
    userUploadKeyAlias,
    userUploadKeyPassword,
).all { !it.isNullOrBlank() }

android {
    namespace = "com.ommphysioworld.userapp"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.ommphysioworld.userapp"
        minSdk = 24
        targetSdk = 36
        versionCode = 3
        versionName = "1.0.2"
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"https://ommphysioworld.com/api\""
        )

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasUserUploadSigning) {
            create("release") {
                storeFile = rootProject.file(userUploadStoreFile!!)
                storePassword = userUploadStorePassword
                keyAlias = userUploadKeyAlias
                keyPassword = userUploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasUserUploadSigning) {
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
    implementation(platform(libs.firebase.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.firebase.messaging)
    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
