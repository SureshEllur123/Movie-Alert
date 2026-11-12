import React, { useState } from 'react';
import {
  Sliders,
  BatteryCharging,
  Bell,
  Volume2,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Smartphone,
  ExternalLink,
  Code,
  Copy,
  Check,
  CheckCircle,
} from 'lucide-react';
import { db, UserSettings } from '../../services/database/storage.ts';
import { notificationService } from '../../services/notifications/notificationService.ts';

interface SettingsScreenProps {
  onRefreshData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onRefreshData }) => {
  const [settings, setSettings] = useState<UserSettings>(() => db.getSettings());
  const [copiedExport, setCopiedExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAndroidCodeModal, setShowAndroidCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'worker' | 'foreground' | 'manifest' | 'db'>('worker');

  const updateSettings = (updated: Partial<UserSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    db.saveSettings(next);
    onRefreshData();
  };

  const handleTestSound = () => {
    notificationService.playAlertSound();
    notificationService.triggerHaptic();
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      updateSettings({ systemNotificationsEnabled: true });
    }
  };

  const handleExportData = () => {
    const json = db.exportAllData();
    navigator.clipboard.writeText(json);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleImportData = () => {
    if (!importText) return;
    const success = db.importAllData(importText);
    if (success) {
      setShowImportModal(false);
      setImportText('');
      onRefreshData();
    } else {
      alert('Invalid JSON format. Please verify configuration.');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to restore default sample trackers and reset history?')) {
      db.resetAllData();
      setSettings(db.getSettings());
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-[#F4F6FA] tracking-tight">
          Settings & Radar Configuration
        </h2>
        <p className="text-xs text-[#929BAA]">
          Manage Android background workers, notifications, and local data
        </p>
      </div>

      {/* 1. Global Monitoring */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B7F36B] font-mono">
          Radar Execution
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-[#F4F6FA] block">
              Global Background Monitoring
            </span>
            <span className="text-xs text-[#929BAA]">
              Execute periodic WorkManager checks for all active trackers.
            </span>
          </div>
          <button
            onClick={() =>
              updateSettings({
                globalMonitoringEnabled: !settings.globalMonitoringEnabled,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.globalMonitoringEnabled ? 'bg-[#B7F36B]' : 'bg-[#252D38]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#090B0F] transition-transform ${
                settings.globalMonitoringEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-[#252D38]/60 space-y-2">
          <label className="text-xs font-semibold text-[#929BAA] block">
            Default Check Frequency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[15, 30, 60, 0].map((mins) => (
              <button
                key={mins}
                onClick={() =>
                  updateSettings({ defaultIntervalMinutes: mins as 15 | 30 | 60 | 0 })
                }
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  settings.defaultIntervalMinutes === mins
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                    : 'bg-[#1C232E] text-[#929BAA] border-[#252D38]'
                }`}
              >
                {mins === 0 ? 'Foreground' : `${mins} Minutes`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#626D7D] leading-relaxed">
            WorkManager adheres to Android battery guidelines. 15 minutes is the minimum allowed periodic background interval by Google.
          </p>
        </div>
      </section>

      {/* 2. Notifications & Sounds */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B7F36B] font-mono">
          Alert Feedback
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#F4F6FA] block">
                Two-Tone Cinema Radar Chime
              </span>
              <span className="text-[11px] text-[#929BAA]">
                Synthesized 587Hz & 880Hz audio chime via Web Audio API.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestSound}
                className="px-2.5 py-1 rounded-lg bg-[#1C232E] hover:bg-[#252D38] text-[11px] text-[#B7F36B] border border-[#252D38]"
              >
                Test Chime
              </button>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  settings.soundEnabled ? 'bg-[#B7F36B]' : 'bg-[#252D38]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#090B0F] transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#252D38]/60">
            <div>
              <span className="text-xs font-bold text-[#F4F6FA] block">
                Android Notification HUD Simulator
              </span>
              <span className="text-[11px] text-[#929BAA]">
                Displays realistic heads-up notifications directly in the app.
              </span>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  showAndroidNotificationHud: !settings.showAndroidNotificationHud,
                })
              }
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                settings.showAndroidNotificationHud ? 'bg-[#B7F36B]' : 'bg-[#252D38]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#090B0F] transition-transform ${
                  settings.showAndroidNotificationHud ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#252D38]/60">
            <div>
              <span className="text-xs font-bold text-[#F4F6FA] block">
                System Web Notifications
              </span>
              <span className="text-[11px] text-[#929BAA]">
                Deliver desktop or Android OS lock-screen notifications.
              </span>
            </div>
            <button
              onClick={handleRequestNotificationPermission}
              className="px-3 py-1 rounded-lg bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] text-xs font-medium text-[#F4F6FA]"
            >
              Request Permission
            </button>
          </div>
        </div>
      </section>

      {/* 3. Android Battery Optimization Guidance */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B7F36B] font-mono">
          <BatteryCharging className="w-4 h-4" />
          <span>Android Background Optimization Guide</span>
        </div>
        <p className="text-xs text-[#929BAA] leading-relaxed">
          Aggressive OEM battery managers (Samsung OneUI, Xiaomi MIUI/HyperOS, OnePlus OxygenOS) may suspend background workers during Doze mode. To guarantee instantaneous show alerts:
        </p>

        <div className="space-y-2 text-xs font-mono bg-[#10141B] p-3 rounded-xl border border-[#252D38] text-[#929BAA]">
          <div className="flex items-start gap-2">
            <span className="text-[#B7F36B] font-bold">1.</span>
            <span>Open Android Settings &gt; Apps &gt; Cinema Alert.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#B7F36B] font-bold">2.</span>
            <span>Select <strong>Battery</strong> &gt; Set to <strong>Unrestricted</strong>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#B7F36B] font-bold">3.</span>
            <span>Ensure <strong>Allow background usage</strong> is enabled.</span>
          </div>
        </div>
      </section>

      {/* 4. Native Android Project & APK Deliverable */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#B7F36B]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#B7F36B]/10 flex items-center justify-center text-[#B7F36B]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#F4F6FA]">
                Native Android Source & APK Instructions
              </h3>
              <p className="text-[11px] text-[#929BAA]">
                WorkManager, Foreground Service, Room SQLite & Gradle files
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAndroidCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs active:scale-95 transition-all shadow-sm shadow-[#B7F36B]/20"
          >
            <Code className="w-3.5 h-3.5" />
            <span>View Native Code</span>
          </button>
        </div>
      </section>

      {/* 5. Data Management (Export / Import / Reset) */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B7F36B] font-mono">
          Local Storage & Backup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleExportData}
            className="p-3 rounded-xl bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] text-xs font-medium text-[#F4F6FA] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {copiedExport ? <Check className="w-4 h-4 text-[#64D99B]" /> : <Download className="w-4 h-4 text-[#B7F36B]" />}
            <span>{copiedExport ? 'Copied to Clipboard!' : 'Export Config (JSON)'}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-3 rounded-xl bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] text-xs font-medium text-[#F4F6FA] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-[#B7F36B]" />
            <span>Import Config</span>
          </button>

          <button
            onClick={handleResetData}
            className="p-3 rounded-xl bg-[#1C232E] hover:bg-[#F07878]/20 border border-[#252D38] text-xs font-medium text-[#F07878] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </section>

      {/* 6. Zero-Budget & Privacy Statement */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-2 text-xs text-[#929BAA] leading-relaxed">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F4F6FA]">
          <Shield className="w-4 h-4 text-[#64D99B]" />
          <span>Zero Budget • 100% Privacy • ₹0 Operating Cost</span>
        </div>
        <p>
          Cinema Alert operates with ₹0 budget, zero paid APIs, zero cloud database costs, and zero subscriptions.
          All configurations, movie filters, and seat history are stored strictly on-device in local storage.
          No accounts or logins are required.
        </p>
      </section>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10141B] border border-[#252D38] rounded-2xl w-full max-w-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#F4F6FA]">Import Cinema Radar Configuration</h3>
            <p className="text-xs text-[#929BAA]">
              Paste exported JSON below to restore your trackers and settings.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder="Paste JSON here..."
              className="w-full bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl p-3 text-xs font-mono text-[#F4F6FA] focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-[#151A22] border border-[#252D38] text-xs text-[#929BAA]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportData}
                className="px-4 py-2 rounded-xl bg-[#B7F36B] text-[#090B0F] font-bold text-xs"
              >
                Restore Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Native Source Code Modal */}
      {showAndroidCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#10141B] border border-[#252D38] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#252D38] flex items-center justify-between bg-[#151A22]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#B7F36B]" />
                <h3 className="text-sm font-bold text-[#F4F6FA]">
                  Native Android Source & Build Specification
                </h3>
              </div>
              <button
                onClick={() => setShowAndroidCodeModal(false)}
                className="text-[#929BAA] hover:text-[#F4F6FA] text-xs"
              >
                ✕
              </button>
            </div>

            {/* Code Tabs */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#151A22] border-b border-[#252D38] overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setActiveCodeTab('worker')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  activeCodeTab === 'worker'
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                    : 'bg-[#10141B] text-[#929BAA] border-[#252D38]'
                }`}
              >
                CinemaAlertWorker.kt
              </button>
              <button
                onClick={() => setActiveCodeTab('foreground')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  activeCodeTab === 'foreground'
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                    : 'bg-[#10141B] text-[#929BAA] border-[#252D38]'
                }`}
              >
                ForegroundService.kt
              </button>
              <button
                onClick={() => setActiveCodeTab('manifest')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  activeCodeTab === 'manifest'
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                    : 'bg-[#10141B] text-[#929BAA] border-[#252D38]'
                }`}
              >
                AndroidManifest.xml
              </button>
              <button
                onClick={() => setActiveCodeTab('db')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  activeCodeTab === 'db'
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                    : 'bg-[#10141B] text-[#929BAA] border-[#252D38]'
                }`}
              >
                AppDatabase.kt
              </button>
            </div>

            {/* Code View */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-[#090B0F] text-[#929BAA] space-y-4 leading-relaxed">
              {activeCodeTab === 'worker' && (
                <div>
                  <p className="text-[#64D99B] mb-2">// Path: /android/app/src/main/java/com/cinemaalert/app/background/CinemaAlertWorker.kt</p>
                  <pre className="text-[#F4F6FA] text-[11px] whitespace-pre-wrap">{`class CinemaAlertWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val db = AppDatabase.getInstance(context)
        val activeTrackers = db.trackerDao().getActiveTrackers()
        
        for (tracker in activeTrackers) {
            // Check BookMyShow & District providers
            // Detect new show releases & seat reopenings
        }
        Result.success()
    }
}`}</pre>
                </div>
              )}

              {activeCodeTab === 'foreground' && (
                <div>
                  <p className="text-[#64D99B] mb-2">// Path: /android/app/src/main/java/com/cinemaalert/app/background/MonitoringForegroundService.kt</p>
                  <pre className="text-[#F4F6FA] text-[11px] whitespace-pre-wrap">{`class MonitoringForegroundService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(9001, createOngoingNotification("Cinema Radar Active", "Monitoring BookMyShow & District..."))
        startContinuousCheckLoop() // 45s loop
        return START_STICKY
    }
}`}</pre>
                </div>
              )}

              {activeCodeTab === 'manifest' && (
                <div>
                  <p className="text-[#64D99B] mb-2">// Path: /android/app/src/main/AndroidManifest.xml</p>
                  <pre className="text-[#F4F6FA] text-[11px] whitespace-pre-wrap">{`<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />`}</pre>
                </div>
              )}

              {activeCodeTab === 'db' && (
                <div>
                  <p className="text-[#64D99B] mb-2">// Path: /android/app/src/main/java/com/cinemaalert/app/data/AppDatabase.kt</p>
                  <pre className="text-[#F4F6FA] text-[11px] whitespace-pre-wrap">{`@Database(entities = [TrackerEntity::class, ShowEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun trackerDao(): TrackerDao
}`}</pre>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#151A22] border border-[#252D38] text-[11px] space-y-1">
                <span className="text-[#B7F36B] font-bold block">Build Commands for Android Studio / CLI:</span>
                <code>cd android &amp;&amp; ./gradlew assembleRelease</code>
                <p className="text-[#626D7D]">Output APK: app/build/outputs/apk/release/app-release-unsigned.apk</p>
              </div>
            </div>

            <div className="p-4 border-t border-[#252D38] bg-[#151A22] flex justify-end">
              <button
                onClick={() => setShowAndroidCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-[#B7F36B] text-[#090B0F] font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
