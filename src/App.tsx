/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  UserRole,
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  AuditLog,
  ReportType,
} from './types';
import { DEFAULT_SETTINGS } from './lib/constants';
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
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { DashboardView } from './views/DashboardView';
import { JadwalPiketView } from './views/JadwalPiketView';
import { DataUstadzView } from './views/DataUstadzView';
import { DataSantriView } from './views/DataSantriView';
import { AbsensiHarianView } from './views/AbsensiHarianView';
import { KegiatanMalamView } from './views/KegiatanMalamView';
import { KegiatanPagiView } from './views/KegiatanPagiView';
import { RekapBulananView } from './views/RekapBulananView';
import { CetakEksporView } from './views/CetakEksporView';
import { ImporExcelView } from './views/ImporExcelView';
import { RiwayatAktivitasView } from './views/RiwayatAktivitasView';
import { PengaturanView } from './views/PengaturanView';
import { ManajemenPenggunaView } from './views/ManajemenPenggunaView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    periodText: 'Bulan Oktober 2026',
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Contract Header */}
      <Header
        currentRole={userRole}
        onRoleChange={setUserRole}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        settings={settings}
        isSupabaseLive={isSupabaseLive}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pastel Rounded Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
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
                    userRole={userRole}
                    onNavigate={setCurrentTab}
                  />
                )}

                {currentTab === 'jadwal_piket' && (
                  <JadwalPiketView
                    schedules={schedules}
                    ustadzList={ustadzList}
                    userRole={userRole}
                    settings={settings}
                    onRefresh={refreshAllData}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        type === 'jadwal_mingguan'
                          ? 'Jadwal Piket Ustadz Mingguan'
                          : 'Jadwal Piket Ustadz Bulanan',
                        'Pekan Berjalan'
                      )
                    }
                  />
                )}

                {currentTab === 'data_ustadz' && (
                  <DataUstadzView
                    ustadzList={ustadzList}
                    userRole={userRole}
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'data_santri' && (
                  <DataSantriView
                    santriList={santriList}
                    userRole={userRole}
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'absensi_harian' && (
                  <AbsensiHarianView
                    santriList={santriList}
                    sessions={sessions}
                    attendances={attendances}
                    userRole={userRole}
                    settings={settings}
                    onRefresh={refreshAllData}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        'Absensi Santri Harian',
                        `Tanggal ${new Date().toISOString().split('T')[0]}`
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
                    userRole={userRole}
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
                    userRole={userRole}
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
                    userRole={userRole}
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
                    userRole={userRole}
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'riwayat_aktivitas' && (
                  <RiwayatAktivitasView
                    auditLogs={auditLogs}
                    userRole={userRole}
                  />
                )}

                {currentTab === 'pengaturan' && (
                  <PengaturanView
                    settings={settings}
                    userRole={userRole}
                    onRefresh={refreshAllData}
                  />
                )}

                {currentTab === 'manajemen_pengguna' && (
                  <ManajemenPenggunaView userRole={userRole} />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Formal Document Preview Modal (A4 Print / PDF / Excel) */}
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
