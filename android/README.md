# Cinema Alert — Native Android Application

**Tagline:** Never miss the show. Never miss the seat.

## Overview
Cinema Alert is a zero-budget, 100% offline-first Android application designed to monitor movie show releases and newly opened seats on **BookMyShow** and **District**.

### Architecture
- **UI Engine:** React Native / High-performance Android WebView bridge.
- **Background Engine:** Android Jetpack `WorkManager` for battery-efficient periodic checks (15m, 30m, 60m).
- **Foreground Service:** `MonitoringForegroundService` (`FOREGROUND_SERVICE_DATA_SYNC`) with ongoing notification for continuous high-frequency checks.
- **Local Database:** Android Room (SQLite) storing all trackers, show snapshots, and seat diffs on-device. Zero cloud costs, ₹0 budget.
- **Notifications:** Android `NotificationManager` with distinct channels for `New Show Releases` and `Seat Availability Alerts`.
- **Boot Receiver:** Reschedules monitoring tasks automatically on phone reboot.

---

## How to Build the Android APK

### Prerequisites
1. Android Studio Ladybug (or higher) / Android SDK 34+.
2. JDK 17+.

### Building Release APK via Command Line
```bash
# 1. Navigate to android folder
cd android

# 2. Grant execution permission to Gradle wrapper
chmod +x gradlew

# 3. Assemble Release APK
./gradlew assembleRelease

# The generated APK will be available at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Building via Android Studio
1. Open Android Studio.
2. Select **Open an Existing Project** and choose the `/android` folder.
3. Allow Gradle sync to complete.
4. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Transfer the APK to your phone or install via ADB:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Disabling Android Battery Optimization (Recommended for Guaranteed Alerts)
To ensure Android does not defer background workers during Doze mode:
1. Go to **Phone Settings** > **Apps** > **Cinema Alert**.
2. Tap **Battery** or **App battery usage**.
3. Select **Unrestricted** (or "Don't optimize").

Via ADB:
```bash
adb shell dumpsys deviceidle whitelist +com.cinemaalert.app
```

---

## Platform Integration & Compliance Notes
- **BookMyShow**: Queries public cinema listing feeds and show indexes.
- **District (by Zomato)**: Queries cinema schedule endpoints.
- **Robots & Terms Compliance**: Respects rate-limits and access policies. If captcha or anti-bot defenses trigger, the app surfaces a manual-link notification for the user to open directly in one tap.
