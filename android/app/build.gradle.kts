plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.cinemaalert.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cinemaalert.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug") // Unsigned debug-signed APK for instant installation
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

val webAppDir = rootProject.projectDir.parentFile
val buildWebApp by tasks.registering(Exec::class) {
    workingDir(webAppDir)
    commandLine("npm", "run", "build")
    inputs.files(fileTree(webAppDir) {
        include("index.html", "package.json", "vite.config.ts", "src/**", "public/**")
    })
    outputs.dir(webAppDir.resolve("dist"))
}

val copyWebApp by tasks.registering(Sync::class) {
    dependsOn(buildWebApp)
    from(webAppDir.resolve("dist"))
    into(layout.buildDirectory.dir("generated/webAssets"))
}

android.sourceSets.getByName("main").assets.srcDir(
    layout.buildDirectory.dir("generated/webAssets")
)
tasks.named("preBuild").configure {
    dependsOn(copyWebApp)
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.10.0")

    // Android Jetpack WorkManager (Periodic background tasks)
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Android Room (SQLite Database)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
