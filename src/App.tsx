/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
  UserRole,
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
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Lazy-load all views to keep initial bundle ultra lightweight
const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const JadwalPiketView = lazy(() => import('./views/JadwalPiketView').then((m) => ({ default: m.JadwalPiketView })));
const KegiatanMalamView = lazy(() => import('./views/KegiatanMalamView').then((m) => ({ default: m.KegiatanMalamView })));
const KegiatanPagiView = lazy(() => import('./views/KegiatanPagiView').then((m) => ({ default: m.KegiatanPagiView })));
const RekapBulananView = lazy(() => import('./views/RekapBulananView').then((m) => ({ default: m.RekapBulananView })));
const DataUstadzView = lazy(() => import('./views/DataUstadzView').then((m) => ({ default: m.DataUstadzView })));
const DataSantriView = lazy(() => import('./views/DataSantriView').then((m) => ({ default: m.DataSantriView })));
const CetakEksporView = lazy(() => import('./views/CetakEksporView').then((m) => ({ default: m.CetakEksporView })));
const ImporExcelView = lazy(() => import('./views/ImporExcelView').then((m) => ({ default: m.ImporExcelView })));
const RiwayatAktivitasView = lazy(() => import('./views/RiwayatAktivitasView').then((m) => ({ default: m.RiwayatAktivitasView })));
const PengaturanView = lazy(() => import('./views/PengaturanView').then((m) => ({ default: m.PengaturanView })));

export default function App() {
  const isSupabaseLive = isSupabaseConfigured() && Boolean(getSupabaseClient());

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Only in Demo Mode (when Supabase is NOT configured) can we check localStorage
    if (!isSupabaseConfigured()) {
      try {
        const saved = localStorage.getItem('ponpes_auth_user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(isSupabaseLive);
  const [authError, setAuthError] = useState<string | null>(null);

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
  const [dataError, setDataError] = useState<string | null>(null);

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

  // Adjust default tab when role is ustadz_piket
  useEffect(() => {
    if (currentUser?.role === 'ustadz_piket') {
      setCurrentTab('kegiatan_malam');
    }
  }, [currentUser?.role]);

  // Handle Supabase Auth Session & onAuthStateChange
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    const loadUserProfile = async (userId: string, email: string): Promise<UserProfile> => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        throw new Error(
          'Profil pengguna tidak ditemukan di database. Pastikan akun terdaftar di tabel profiles.'
        );
      }

      if (profile.is_active === false) {
        throw new Error('Akses ditolak: Akun Anda dinonaktifkan oleh administrator.');
      }

      const validRoles: UserRole[] = ['admin', 'ustadz_piket', 'kepala_pengawas'];
      if (!validRoles.includes(profile.role as UserRole)) {
        throw new Error(`Role akun "${profile.role}" tidak dikenal.`);
      }

      return {
        id: profile.id,
        email: profile.email || email,
        fullName: profile.full_name || email,
        role: profile.role as UserRole,
        isActive: true,
      };
    };

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const user = await loadUserProfile(session.user.id, session.user.email || '');
        setCurrentUser(user);
        setAuthError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setAuthError(msg);
        await supabase.auth.signOut();
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    // 2. Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        try {
          const user = await loadUserProfile(session.user.id, session.user.email || '');
          setCurrentUser(user);
          setAuthError(null);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setAuthError(msg);
          await supabase.auth.signOut();
          setCurrentUser(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setDataError(null);

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
        getActivitySessions({ daysBack: 90 }),
        getStudentAttendances({ daysBack: 90 }),
        getAuditLogs(100),
      ]);

      setSettings(loadedSettings);
      setUstadzList(loadedUstadz);
      setSantriList(loadedSantri);
      setSchedules(loadedSchedules);
      setSessions(loadedSessions);
      setAttendances(loadedAttendances);
      setAuditLogs(loadedLogs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error refreshing data:', msg);
      setDataError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, refreshAllData]);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore signout error
        }
      }
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

  // Loading Session Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Memeriksa sesi login Supabase...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the login form
  if (!currentUser) {
    return (
      <div>
        {authError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
            <div className="p-3.5 bg-rose-100 border-2 border-slate-900 text-rose-950 rounded-xl text-xs flex items-center gap-2 shadow-[3px_3px_0px_#1e293b] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{authError}</span>
            </div>
          </div>
        )}
        <LoginForm
          settings={settings}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setAuthError(null);
          }}
        />
      </div>
    );
  }

  const role = currentUser.role;

  return (
    <div
      className={`min-h-screen bg-[#FAF7F2] flex flex-col selection:bg-amber-200 selection:text-amber-950 ${
        previewModal.isOpen ? 'print:bg-white print:min-h-0 print:p-0 print:m-0 print:block' : ''
      }`}
    >
      {/* Notice Banner: MODE DEMO */}
      {!isSupabaseLive && (
        <div className="no-print bg-[#FEF08A] border-b-2 border-slate-900 px-4 py-1.5 text-center text-xs font-black text-amber-950 flex items-center justify-center gap-2 shadow-2xs">
          <span className="px-1.5 py-0.2 bg-amber-900 text-white rounded text-[10px] uppercase tracking-wider">
            MODE DEMO
          </span>
          <span>
            Database Supabase Cloud belum diatur di environment. Perubahan disimpan di penyimpanan lokal demo.
          </span>
        </div>
      )}

      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
        settings={settings}
        isSupabaseLive={isSupabaseLive}
      />

      {/* Sub Header Bar */}
      <SubHeader
        currentTab={currentTab}
        settings={settings}
        userRole={role}
        isSupabaseLive={isSupabaseLive}
      />

      {/* Main Layout Area */}
      <div className={`flex-1 flex overflow-hidden relative ${previewModal.isOpen ? 'print:hidden' : ''}`}>
        {/* Navigation Sidebar with Role Filtering */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarOpen(false)}
          userRole={role}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#FAF7F2] min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto pb-12 min-w-0">
            {dataError && (
              <div className="mb-6 p-4 bg-[#FFE4E6] border-2 border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#1e293b]">
                <div className="flex items-center gap-2 text-rose-950 text-xs font-bold">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  <span>Terjadi kesalahan saat memuat data: {dataError}</span>
                </div>
                <button
                  type="button"
                  onClick={refreshAllData}
                  className="neo-btn px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-600">
                    Memuat data Ponpes Baitul Arqom SMK Muhiba...
                  </p>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                {/* 1. Dashboard (admin & kepala_pengawas) */}
                {currentTab === 'dashboard' && (role === 'admin' || role === 'kepala_pengawas') && (
                  <DashboardView
                    ustadzList={ustadzList}
                    santriList={santriList}
                    schedules={schedules}
                    sessions={sessions}
                    attendances={attendances}
                    auditLogs={auditLogs}
                    userRole={role}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* 2. Jadwal Piket (all roles) */}
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

                {/* 3. Kegiatan Malam (all roles) */}
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

                {/* 4. Kegiatan Pagi (all roles) */}
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

                {/* 5. Rekap Bulanan (admin & kepala_pengawas) */}
                {currentTab === 'rekap_bulanan' && (role === 'admin' || role === 'kepala_pengawas') && (
                  <RekapBulananView
                    ustadzList={ustadzList}
                    santriList={santriList}
                    schedules={schedules}
                    sessions={sessions}
                    attendances={attendances}
                    userRole={role}
                    settings={settings}
                    onOpenReportModal={(type) =>
                      handleOpenPreview(
                        type,
                        type === 'rekap_ustadz_bulanan'
                          ? 'Rekap Kehadiran & Kepatuhan Ustadz Bulanan'
                          : 'Rekap Kehadiran Santri Bulanan',
                        'Bulan Berjalan'
                      )
                    }
                  />
                )}

                {/* 6. Data Ustadz (admin & kepala_pengawas) */}
                {currentTab === 'data_ustadz' && (role === 'admin' || role === 'kepala_pengawas') && (
                  <DataUstadzView
                    ustadzList={ustadzList}
                    userRole={role}
                    onRefresh={refreshAllData}
                  />
                )}

                {/* 7. Data Santri (admin & kepala_pengawas) */}
                {currentTab === 'data_santri' && (role === 'admin' || role === 'kepala_pengawas') && (
                  <DataSantriView
                    santriList={santriList}
                    userRole={role}
                    onRefresh={refreshAllData}
                  />
                )}

                {/* 8. Cetak & Ekspor (admin & kepala_pengawas) */}
                {currentTab === 'cetak_ekspor' && (role === 'admin' || role === 'kepala_pengawas') && (
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

                {/* 9. Impor Excel (admin only) */}
                {currentTab === 'impor_excel' && role === 'admin' && (
                  <ImporExcelView
                    userRole={role}
                    onRefresh={refreshAllData}
                  />
                )}

                {/* 10. Riwayat Aktivitas / Audit Log (admin only) */}
                {currentTab === 'riwayat_aktivitas' && role === 'admin' && (
                  <RiwayatAktivitasView
                    auditLogs={auditLogs}
                    userRole={role}
                  />
                )}

                {/* 11. Pengaturan Sistem (admin only) */}
                {currentTab === 'pengaturan' && role === 'admin' && (
                  <PengaturanView
                    settings={settings}
                    userRole={role}
                    onRefresh={refreshAllData}
                    ustadzList={ustadzList}
                  />
                )}
              </Suspense>
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
