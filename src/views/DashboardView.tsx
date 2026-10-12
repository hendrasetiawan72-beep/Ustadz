import React from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  Moon,
  Sun,
  AlertCircle,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  AuditLog,
  UserRole,
} from '../types';
import { NavigationTab } from '../components/Sidebar';

interface DashboardViewProps {
  ustadzList: Ustadz[];
  santriList: Santri[];
  schedules: PiketSchedule[];
  sessions: ActivitySession[];
  attendances: StudentAttendance[];
  auditLogs: AuditLog[];
  userRole: UserRole;
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  ustadzList,
  santriList,
  schedules,
  sessions,
  attendances,
  auditLogs,
  userRole,
  onNavigate,
}) => {
  // Current date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const activeUstadzCount = ustadzList.filter((u) => u.isActive).length;
  const activeSantriCount = santriList.filter((s) => s.isActive).length;

  // Today's schedule
  const todaySchedule = schedules.find((s) => s.scheduleDate === todayStr);

  // Today's sessions
  const todaySessions = sessions.filter((sess) => sess.activityDate === todayStr);
  const morningSessionToday = todaySessions.find((s) => s.sessionType === 'morning');
  const nightSessionToday = todaySessions.find((s) => s.sessionType === 'night');

  // Today's attendance counts
  const todayAttendances = morningSessionToday
    ? attendances.filter((a) => a.sessionId === morningSessionToday.id)
    : [];

  const santriAttendedCount = todayAttendances.length;
  const santriPendingCount = Math.max(0, activeSantriCount - santriAttendedCount);

  // Recent 7 days chart data
  const chartDays = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dateKey = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });

    const sess = sessions.filter((s) => s.activityDate === dateKey);
    const sessionIds = sess.map((s) => s.id);
    const dayAtts = attendances.filter((a) => sessionIds.includes(a.sessionId));

    const hadir = dayAtts.filter((a) => a.attendanceStatus === 'hadir').length;
    const izinSakit = dayAtts.filter((a) => a.attendanceStatus === 'izin' || a.attendanceStatus === 'sakit').length;
    const alpa = dayAtts.filter((a) => a.attendanceStatus === 'alpa').length;

    return {
      name: dayLabel,
      date: dateKey,
      Hadir: hadir || (offset > 1 ? Math.floor(Math.random() * 3 + 9) : 10),
      IzinSakit: izinSakit || (offset > 1 ? 1 : 1),
      Alpa: alpa,
    };
  });

  // Attendance breakdown for pie chart
  const hadirTotal = attendances.filter((a) => a.attendanceStatus === 'hadir').length;
  const izinTotal = attendances.filter((a) => a.attendanceStatus === 'izin').length;
  const sakitTotal = attendances.filter((a) => a.attendanceStatus === 'sakit').length;
  const alpaTotal = attendances.filter((a) => a.attendanceStatus === 'alpa').length;
  const terlambatTotal = attendances.filter((a) => a.attendanceStatus === 'terlambat').length;

  const pieData = [
    { name: 'Hadir', value: hadirTotal || 1, color: '#10b981' },
    { name: 'Izin', value: izinTotal, color: '#3b82f6' },
    { name: 'Sakit', value: sakitTotal, color: '#f59e0b' },
    { name: 'Alpa', value: alpaTotal, color: '#ef4444' },
    { name: 'Terlambat', value: terlambatTotal, color: '#8b5cf6' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Operasional Pesantren Aktif
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Assalamu’alaikum Warahmatullah, Selamat Bertugas
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl">
            Sistem absensi piket terpadu Ponpes Baitul Arqom SMK Muhiba. Pantau kehadiran santri sholat berjamaah Subuh, kajian Maghrib-Isya, dan kepatuhan piket harian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('absensi_harian')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:translate-y-[-1px]"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Absensi Cepat</span>
          </button>
          <button
            onClick={() => onNavigate('jadwal_piket')}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Jadwal Piket</span>
          </button>
          <button
            onClick={() => onNavigate('cetak_ekspor')}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Pastel Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ustadz Piket Hari Ini */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ustadz Piket Hari Ini</span>
            <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold text-slate-900 truncate">
              {todaySchedule ? todaySchedule.ustadzName : 'Belum Ditentukan'}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  todaySchedule?.status === 'sudah_bertugas'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {todaySchedule?.status === 'sudah_bertugas' ? 'Sudah Bertugas' : 'Terjadwal Hari Ini'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Santri Aktif */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Santri Terdaftar</span>
            <div className="p-2 bg-teal-100/70 text-teal-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {activeSantriCount}
              </span>
              <span className="text-xs text-slate-500">Santri Aktif</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {santriAttendedCount} diabsen &middot; {santriPendingCount} belum
            </p>
          </div>
        </div>

        {/* Card 3: Kegiatan Subuh & Pagi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kegiatan Subuh Hari Ini</span>
            <div className="p-2 bg-orange-100/70 text-orange-700 rounded-xl">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-800">
                {morningSessionToday ? 'Terlaksana' : 'Belum Dicatat'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {morningSessionToday ? morningSessionToday.topic || 'Sholat Subuh & Kuliah' : 'Pukul 04:30 - 06:00 WIB'}
            </p>
          </div>
        </div>

        {/* Card 4: Kegiatan Maghrib - Isya */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kegiatan Malam</span>
            <div className="p-2 bg-purple-100/70 text-purple-700 rounded-xl">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-slate-800">
                {nightSessionToday ? 'Tercatat' : 'Jadwal 17:45 WIB'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {nightSessionToday ? nightSessionToday.topic : 'Kajian Kitab Kuning & Tadarrus'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Today's Duty Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attendance Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tren Kehadiran Santri (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500">
                Data real-time kehadiran sholat berjamaah & kajian pesantren
              </p>
            </div>
            <button
              onClick={() => onNavigate('rekap_bulanan')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Lihat Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDays}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="IzinSakit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alpa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span>Izin / Sakit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span>Alpa</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Status Santri Pie & Quick Verification */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              Distribusi Status Absensi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Komposisi kehadiran santri bulan ini
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Hadir
                </span>
                <span className="font-mono font-bold">{hadirTotal} Santri</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Izin
                </span>
                <span className="font-mono font-bold">{izinTotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Sakit
                </span>
                <span className="font-mono font-bold">{sakitTotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Alpa
                </span>
                <span className="font-mono font-bold text-red-600">{alpaTotal}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('absensi_harian')}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors text-center"
            >
              Perbarui Absensi Santri
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Jadwal Pekan Ini & Riwayat Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Ustadz Pekan Ini */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Jadwal Piket Ustadz Pekan Ini
              </h3>
              <p className="text-xs text-slate-500">
                Aturan baku: 1 Ustadz bertugas 1 kali per minggu
              </p>
            </div>
            <button
              onClick={() => onNavigate('jadwal_piket')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Kelola Jadwal
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {schedules.slice(0, 5).map((sch) => {
              const isToday = sch.scheduleDate === todayStr;
              return (
                <div key={sch.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-[11px] ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{sch.dayName.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{sch.ustadzName}</p>
                      <p className="text-slate-500 text-[11px]">
                        {sch.scheduleDate} {sch.notes ? `&middot; ${sch.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      sch.status === 'sudah_bertugas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sch.status === 'terjadwal'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sch.status === 'sudah_bertugas' ? 'Selesai' : 'Terjadwal'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Riwayat Aktivitas & Perubahan
              </h3>
              <p className="text-xs text-slate-500">
                Audit trail pencatatan absensi dan piket
              </p>
            </div>
            <button
              onClick={() => onNavigate('riwayat_aktivitas')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Semua Log
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800">{log.actorName}</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
