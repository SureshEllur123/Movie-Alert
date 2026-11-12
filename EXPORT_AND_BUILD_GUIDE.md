# Cinema Alert — Export to Git & APK Build Guide

This comprehensive guide shows how to push Cinema Alert to a Git repository and generate an installable Android APK file for free.

---

## 1. Exporting the Project to a Git Repository

The repository has been initialized on your local environment. To push it to your GitHub or GitLab account:

```bash
# 1. Create a new repository on GitHub (e.g. named "cinema-alert") without initializing README

# 2. Add your GitHub remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/cinema-alert.git

# 3. Rename branch to main if needed
git branch -M main

# 4. Push all code to GitHub
git push -u origin main
```

---

## 2. Option A: Automated APK Build via GitHub Actions (Easiest — 100% Free)

A ready-to-run GitHub Actions workflow has been pre-configured in `.github/workflows/build-apk.yml`.

1. Push your repository to GitHub (as shown above).
2. Go to your repository on GitHub and click on the **Actions** tab.
3. You will see the **Build Android APK** workflow running automatically.
4. When finished (~3 to 5 minutes), click on the completed run.
5. Under **Artifacts**, download `cinema-alert-release-apk.zip`.
6. Extract the zip to get your installable `app-release.apk`!

---

## 3. Option B: Cloud APK Build via Expo EAS (1-Command Cloud Build)

Using the generated `app.json` and `eas.json`:

```bash
# 1. Install EAS CLI globally (or run with npx)
npm install -g eas-cli

# 2. Log in to your free Expo account (free signup at expo.dev)
eas login

# 3. Trigger cloud Android APK build
eas build -p android --profile preview
```

- EAS will build the `.apk` file on high-speed cloud runners.
- When finished, EAS prints a direct download link and QR code to install the APK directly onto your Android phone!

---

## 4. Option C: Local Build via Android Studio or Command Line

### Prerequisites
- JDK 17+ installed.
- Android Studio Ladybug+ or Android SDK command line tools.

### Building via Terminal
```bash
# 1. Navigate to the android folder
cd android

# 2. Ensure gradlew is executable
chmod +x gradlew

# 3. Assemble Release APK
./gradlew assembleRelease
```

The compiled APK will be created at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Building via Android Studio GUI
1. Launch **Android Studio**.
2. Select **Open** and select the `/android` directory.
3. Allow Gradle to sync dependencies (`androidx.work`, `androidx.room`, etc.).
4. Select **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Android Studio will notify you with a "locate" link when the APK is compiled.

---

## 5. Installing the APK on Your Android Device

### Method 1: Via ADB (USB Debugging)
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Direct Phone Download / USB Transfer
1. Copy `app-release.apk` to your phone via USB cable, Google Drive, or WhatsApp/Telegram.
2. Open the file on your Android phone.
3. Tap **Install**. (If prompted, allow "Install unknown apps" for your file manager or browser).
4. Launch **Cinema Alert**!

---

## 6. Configuring Background Battery Settings on Your Device

To ensure uninterrupted radar checks when your phone screen is locked or idle:
1. Open **Settings** on your phone.
2. Go to **Apps** > **Cinema Alert**.
3. Tap **Battery** or **App battery usage**.
4. Select **Unrestricted** (or "Don't optimize").
