/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  UserProfile,
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  AuditLog,
  ReportType,
} from './types';
import { DEFAULT_SETTINGS, DEFAULT_ADMIN } from './lib/constants';
import {
  getAppSettings,
  getUstadzList,
  getSantriList,
  getPiketSchedules,
  getActivitySessions,
  getStudentAttendances,
  getAuditLogs,
} from './lib/db';
import { getSupabaseClient } from './lib/supabase';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { DashboardView } from './views/DashboardView';
import { JadwalPiketView } from './views/JadwalPiketView';
import { KegiatanMalamView } from './views/KegiatanMalamView';
import { KegiatanPagiView } from './views/KegiatanPagiView';
import { RekapBulananView } from './views/RekapBulananView';
import { DataUstadzView } from './views/DataUstadzView';
import { DataSantriView } from './views/DataSantriView';
import { CetakEksporView } from './views/CetakEksporView';
import { ImporExcelView } from './views/ImporExcelView';
import { RiwayatAktivitasView } from './views/RiwayatAktivitasView';
import { PengaturanView } from './views/PengaturanView';

export default function App() {
  // Authentication State (Peran hanya satu: Admin)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ponpes_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Core Data State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [schedules, setSchedules] = useState<PiketSchedule[]>([]);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [attendances, setAttendances] = useState<StudentAttendance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report Modal State
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: ReportType;
    title: string;
    periodText: string;
  }>({
    isOpen: false,
    type: 'rekap_santri_bulanan',
    title: 'Rekap Kehadiran Santri Bulanan',
    periodText: 'Bulan Berjalan',
  });

  const isSupabaseLive = Boolean(getSupabaseClient());

  const refreshAllData = useCallback(async () => {
    try {
      const [
        loadedSettings,
        loadedUstadz,
        loadedSantri,
        loadedSchedules,
        loadedSessions,
        loadedAttendances,
        loadedLogs,
      ] = await Promise.all([
        getAppSettings(),
        getUstadzList(),
        getSantriList(),
        getPiketSchedules(),
        getActivitySessions(),
        getStudentAttendances(),
        getAuditLogs(),
      ]);

      setSettings(loadedSettings);
      setUstadzList(loadedUstadz);
      setSantriList(loadedSantri);
      setSchedules(loadedSchedules);
      setSessions(loadedSessions);
      setAttendances(loadedAttendances);
      setAuditLogs(loadedLogs);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      localStorage.removeItem('ponpes_auth_user');
      setCurrentUser(null);
    }
  };

  const handleOpenPreview = (type: ReportType, title: string, periodText: string) => {
    setPreviewModal({
      isOpen: true,
      type,
      title,
      periodText,
    });
  };

  const handleClosePreview = () => {
    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
  };

  // If user is not logged in, render the clean login screen
  if (!currentUser) {
    return (
      <LoginForm
        settings={settings}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col selection:bg-amber-200 selection:text-amber-950">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
        settings={settings}
        isSupabaseLive={isSupabaseLive}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar (Bilah Samping bisa disembunyikan) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarOpen(false)}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#FAF7F2] min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto pb-12 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-semibold text-slate-500">
                    Memuat data Ponpes Baitul Arqom SMK Muhiba...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    ustadzList={ustadzList}
                    santriList={santriList}
                    schedules={schedules}
                    sessions={sessions}
                    attendances={attendances}
                    auditLogs={auditLogs}
                    userRole="admin"
                    onNavigate={setCurrentTab}
                  />
                )}

                {currentTab === 'jadwal_piket' && (
                  <JadwalPiketView
                    schedules={schedules}
                    ustadzList={ustadzList}
                    settings={settings}
                    onRefresh={refreshAllData}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        type === 'jadwal_mingguan'
                          ? 'Jadwal Piket Ustadz & Ustadzah Mingguan'
                          : 'Jadwal Piket Ustadz & Ustadzah Bulanan',
                        'Pekan Berjalan'
                      )
                    }
                  />
                )}

                {currentTab === 'kegiatan_malam' && (
                  <KegiatanMalamView
                    sessions={sessions}
                    ustadzList={ustadzList}
                    santriList={santriList}
                    attendances={attendances}
                    settings={settings}
                    onRefresh={refreshAllData}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        'Absensi Kegiatan Malam (Maghrib - Isya)',
                        `Tanggal ${new Date().toISOString().split('T')[0]}`
                      )
                    }
                  />
                )}

                {currentTab === 'kegiatan_pagi' && (
                  <KegiatanPagiView
                    sessions={sessions}
                    ustadzList={ustadzList}
                    santriList={santriList}
                    attendances={attendances}
                    settings={settings}
                    onRefresh={refreshAllData}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        'Absensi Kegiatan Pagi (Subuh - 06:00 WIB)',
                        `Tanggal ${new Date().toISOString().split('T')[0]}`
                      )
                    }
                  />
                )}

                {currentTab === 'rekap_bulanan' && (
                  <RekapBulananView
                    ustadzList={ustadzList}
                    santriList={santriList}
                    schedules={schedules}
                    sessions={sessions}
                    attendances={attendances}
                    userRole="admin"
                    settings={settings}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        type === 'rekap_ustadz_bulanan'
                          ? 'Rekap Kehadiran & Kepatuhan Ustadz Bulanan'
                          : 'Rekap Kehadiran Santri Bulanan',
                        'Bulan Oktober 2026'
                      )
                    }
                  />
                )}

                {currentTab === 'data_ustadz' && (
                  <DataUstadzView
                    ustadzList={ustadzList}
                    userRole="admin"
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'data_santri' && (
                  <DataSantriView
                    santriList={santriList}
                    userRole="admin"
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'cetak_ekspor' && (
                  <CetakEksporView
                    ustadzList={ustadzList}
                    santriList={santriList}
                    schedules={schedules}
                    sessions={sessions}
                    attendances={attendances}
                    settings={settings}
                    onOpenPreview={handleOpenPreview}
                  />
                )}

                {currentTab === 'impor_excel' && (
                  <ImporExcelView
                    userRole="admin"
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'riwayat_aktivitas' && (
                  <RiwayatAktivitasView
                    auditLogs={auditLogs}
                    userRole="admin"
                  />
                )}

                {currentTab === 'pengaturan' && (
                  <PengaturanView
                    settings={settings}
                    userRole="admin"
                    onRefresh={refreshAllData}
                    ustadzList={ustadzList}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Document Preview Modal */}
      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        reportType={previewModal.type}
        title={previewModal.title}
        periodText={previewModal.periodText}
        settings={settings}
        data={{
          ustadzList,
          santriList,
          schedules,
          sessions,
          attendances,
        }}
      />
    </div>
  );
}
