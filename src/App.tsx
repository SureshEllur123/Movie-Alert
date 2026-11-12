/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header.tsx';
import { BottomNav, NavTab } from './components/common/BottomNav.tsx';
import { AndroidNotificationHud } from './components/common/AndroidNotificationHud.tsx';
import { HomeScreen } from './screens/HomeScreen/HomeScreen.tsx';
import { TrackersScreen } from './screens/TrackersScreen/TrackersScreen.tsx';
import { ActivityScreen } from './screens/ActivityScreen/ActivityScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen/SettingsScreen.tsx';
import { CreateTrackerModal } from './screens/CreateTrackerScreen/CreateTrackerModal.tsx';
import { TrackerDetailsModal } from './screens/TrackerDetailsScreen/TrackerDetailsModal.tsx';

import { Tracker, NotificationEvent, AppStats } from './types/index.ts';
import { db } from './services/database/storage.ts';
import { monitoringEngine } from './services/monitoring/monitoringEngine.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [stats, setStats] = useState<AppStats>(() => db.getStats());

  const [isChecking, setIsChecking] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTrackerForDetails, setSelectedTrackerForDetails] = useState<Tracker | null>(null);

  const reloadData = useCallback(() => {
    setTrackers(db.getTrackers());
    setNotifications(db.getNotifications());
    setStats(db.getStats());
  }, []);

  useEffect(() => {
    // Initial load
    reloadData();

    // Start background radar loop
    monitoringEngine.start();

    // Subscribe to monitoring engine updates
    const unsubscribeMonitoring = monitoringEngine.subscribe(() => {
      reloadData();
      setIsChecking(monitoringEngine.isCurrentlyRunning());
    });

    return () => {
      unsubscribeMonitoring();
      monitoringEngine.stop();
    };
  }, [reloadData]);

  const handleCheckNow = async () => {
    setIsChecking(true);
    await monitoringEngine.runCycle();
    reloadData();
    setIsChecking(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#090B0F] text-[#F4F6FA] flex flex-col font-sans selection:bg-[#B7F36B] selection:text-[#090B0F]">
      {/* Android Notification Floating HUD Simulator */}
      <AndroidNotificationHud />

      {/* Main Top Header */}
      <Header
        stats={stats}
        isChecking={isChecking}
        onCheckNow={handleCheckNow}
        onOpenSettings={() => setCurrentTab('settings')}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {currentTab === 'home' && (
          <HomeScreen
            stats={stats}
            trackers={trackers}
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenTrackerDetails={(tracker) => setSelectedTrackerForDetails(tracker)}
            onRefreshData={reloadData}
            onSwitchToActivity={() => setCurrentTab('activity')}
          />
        )}

        {currentTab === 'track' && (
          <TrackersScreen
            trackers={trackers}
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenTrackerDetails={(tracker) => setSelectedTrackerForDetails(tracker)}
            onRefreshData={reloadData}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityScreen
            notifications={notifications}
            onRefreshData={reloadData}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen onRefreshData={reloadData} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        unreadCount={unreadCount}
      />

      {/* Create Tracker Modal */}
      {isCreateOpen && (
        <CreateTrackerModal
          onClose={() => setIsCreateOpen(false)}
          onTrackerCreated={(newTracker) => {
            reloadData();
            // Automatically run a check for the newly created tracker
            monitoringEngine.runCycle(newTracker.id).then(() => {
              reloadData();
            });
          }}
        />
      )}

      {/* Tracker Details Modal */}
      {selectedTrackerForDetails && (
        <TrackerDetailsModal
          tracker={selectedTrackerForDetails}
          onClose={() => setSelectedTrackerForDetails(null)}
          onTrackerUpdated={reloadData}
        />
      )}
    </div>
  );
}
