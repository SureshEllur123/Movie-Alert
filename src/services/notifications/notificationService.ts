import { NotificationEvent } from '../../types/index.ts';
import { db } from '../database/storage.ts';

type NotificationListener = (event: NotificationEvent) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private audioCtx: AudioContext | null = null;

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Generates a modern, subtle two-tone cinema chime using Web Audio API.
   * Completely offline, 0 bytes external asset.
   */
  playAlertSound(): void {
    try {
      const settings = db.getSettings();
      if (!settings.soundEnabled) return;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 880 Hz (A5) - crisp harmonic
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch {
      // Audio autoplay policy or unavailable context
    }
  }

  /**
   * Triggers haptic vibration if available on mobile devices.
   */
  triggerHaptic(): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      // Ignore vibration error
    }
  }

  /**
   * Requests native notification permissions from the browser/OS.
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Dispatches a notification event to all subsystems:
   * 1. Persistent DB
   * 2. Audio Chime & Haptics
   * 3. Browser Notification (if granted)
   * 4. In-App Android Notification HUD
   */
  notify(event: NotificationEvent): void {
    const settings = db.getSettings();

    // 1. Save to local DB
    db.addNotification(event);

    // 2. Audio & Haptic feedback
    this.playAlertSound();
    this.triggerHaptic();

    // 3. Native Web Notification
    if (settings.systemNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const n = new Notification(event.title, {
            body: event.message,
            icon: '/icon-192.png',
            tag: event.id,
          });
          n.onclick = () => {
            window.focus();
            if (event.bookingUrl) {
              window.open(event.bookingUrl, '_blank');
            }
          };
        } catch {
          // Native notification failed
        }
      }
    }

    // 4. In-App Subscribers (Android HUD simulator & screen updates)
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    });
  }
}

export const notificationService = new NotificationService();
