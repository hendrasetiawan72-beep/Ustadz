import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  UserRole,
  AppSettings,
} from '../types';
import { exportDataToExcel } from '../lib/excel';

interface RekapBulananViewProps {
  ustadzList: Ustadz[];
  santriList: Santri[];
  schedules: PiketSchedule[];
  sessions: ActivitySession[];
  attendances: StudentAttendance[];
  userRole: UserRole;
  settings: AppSettings;
  onOpenReportModal: (type: 'rekap_santri_bulanan' | 'rekap_ustadz_bulanan') => void;
}

export const RekapBulananView: React.FC<RekapBulananViewProps> = ({
  ustadzList,
  santriList,
  schedules,
  sessions,
  attendances,
  userRole,
  settings,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'santri' | 'ustadz' | 'kegiatan'>('santri');
  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // YYYY-MM
  const [selectedClass, setSelectedClass] = useState('all');

  // Filter schedules by selected month
  const monthSchedules = schedules.filter((s) => s.scheduleDate.startsWith(selectedMonth));
  const monthSessions = sessions.filter((s) => s.activityDate.startsWith(selectedMonth));
  const monthSessionIds = monthSessions.map((s) => s.id);
  const monthAttendances = attendances.filter((a) => monthSessionIds.includes(a.sessionId));

  // Compute Ustadz stats
  const ustadzStats = ustadzList.map((u) => {
    const uSch = monthSchedules.filter((s) => s.ustadzId === u.id);
    const totalJadwal = uSch.length;
    const terlaksana = uSch.filter((s) => s.status === 'sudah_bertugas').length;
    const diganti = uSch.filter((s) => s.status === 'izin_diganti').length;
    const belum = totalJadwal - terlaksana - diganti;
    const pct = totalJadwal > 0 ? Math.round((terlaksana / totalJadwal) * 100) : 0;
    return {
      ustadz: u,
      totalJadwal,
      terlaksana,
      diganti,
      belum,
      pct,
    };
  });

  // Compute Santri stats
  const filteredSantri = santriList.filter((s) =>
    selectedClass === 'all' ? true : s.className === selectedClass
  );

  const santriStats = filteredSantri.map((s) => {
    const sAtt = monthAttendances.filter((a) => a.santriId === s.id);
    const totalSesi = sAtt.length;
    const hadir = sAtt.filter((a) => a.attendanceStatus === 'hadir').length;
    const izin = sAtt.filter((a) => a.attendanceStatus === 'izin').length;
    const sakit = sAtt.filter((a) => a.attendanceStatus === 'sakit').length;
    const alpa = sAtt.filter((a) => a.attendanceStatus === 'alpa').length;
    const terlambat = sAtt.filter((a) => a.attendanceStatus === 'terlambat').length;
    const dispensasi = sAtt.filter((a) => a.attendanceStatus === 'dispensasi').length;
    const pct = totalSesi > 0 ? Math.round(((hadir + dispensasi) / totalSesi) * 100) : 0;

    return {
      santri: s,
      totalSesi,
      hadir,
      izin,
      sakit,
      alpa,
      terlambat,
      dispensasi,
      pct,
    };
  });

  // Overall KPI
  const totalSesiBulanIni = monthSessions.length;
  const sesiPagiCount = monthSessions.filter((s) => s.sessionType === 'morning').length;
  const sesiMalamCount = monthSessions.filter((s) => s.sessionType === 'night').length;
  const averageSantriAttendance =
    santriStats.length > 0
      ? Math.round(
          santriStats.reduce((acc, curr) => acc + curr.pct, 0) / santriStats.length
        )
      : 0;

  const handleExportExcel = () => {
    if (activeTab === 'santri') {
      const data = santriStats.map((item, idx) => ({
        No: idx + 1,
        NIS: item.santri.studentNumber,
        Nama_Santri: item.santri.fullName,
        Kelas: item.santri.className,
        Kelompok: item.santri.groupName,
        Total_Sesi: item.totalSesi,
        Hadir: item.hadir,
        Izin: item.izin,
        Sakit: item.sakit,
        Alpa: item.alpa,
        Terlambat: item.terlambat,
        Dispensasi: item.dispensasi,
        Persentase_Kehadiran: `${item.pct}%`,
      }));
      exportDataToExcel(data, `Rekap_Kehadiran_Santri_${selectedMonth}`);
    } else {
      const data = ustadzStats.map((item, idx) => ({
        No: idx + 1,
        NIP: item.ustadz.employeeNumber,
        Nama_Ustadz: item.ustadz.fullName,
        Total_Jadwal: item.totalJadwal,
        Terlaksana: item.terlaksana,
        Belum_Bertugas: item.belum,
        Diganti_Izin: item.diganti,
        Persentase_Kepatuhan: `${item.pct}%`,
      }));
      exportDataToExcel(data, `Rekap_Kepatuhan_Piket_Ustadz_${selectedMonth}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Rekapitulasi Bulanan Pesantren
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan kepatuhan piket Ustadz dan statistik kehadiran santri terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenReportModal(activeTab === 'ustadz' ? 'rekap_ustadz_bulanan' : 'rekap_santri_bulanan')
            }
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('santri')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'santri' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Rekap Santri
          </button>
          <button
            onClick={() => setActiveTab('ustadz')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'ustadz' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Kepatuhan Piket Ustadz
          </button>
          <button
            onClick={() => setActiveTab('kegiatan')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'kegiatan' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Statistik Sesi Kegiatan
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-mono"
            />
          </div>

          {activeTab === 'santri' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
            >
              <option value="all">Semua Kelas</option>
              <option value="X - SMK Muhiba">Kelas X</option>
              <option value="XI - SMK Muhiba">Kelas XI</option>
              <option value="XII - SMK Muhiba">Kelas XII</option>
            </select>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi Terlaksana
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalSesiBulanIni} Sesi
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {sesiPagiCount} Subuh &middot; {sesiMalamCount} Maghrib
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Rata-rata Kehadiran
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {averageSantriAttendance}%
          </span>
          <p className="text-[11px] text-emerald-600 mt-0.5">Kondisi Disiplin Tinggi</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Jadwal Piket Terlaksana
          </span>
          <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
            {monthSchedules.filter((s) => s.status === 'sudah_bertugas').length} / {monthSchedules.length}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Kepatuhan Ustadz Terverifikasi</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Santri Perlu Pembinaan
          </span>
          <span className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums">
            {santriStats.filter((s) => s.alpa >= 2).length} Santri
          </span>
          <p className="text-[11px] text-rose-500 mt-0.5">&ge; 2 Kali Alpa Bulan Ini</p>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {activeTab === 'santri' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Nama Lengkap Santri</th>
                  <th className="p-3">Kelas & Kelompok</th>
                  <th className="p-3 text-center">Sesi</th>
                  <th className="p-3 text-center text-emerald-700">Hadir</th>
                  <th className="p-3 text-center text-blue-700">Izin</th>
                  <th className="p-3 text-center text-amber-700">Sakit</th>
                  <th className="p-3 text-center text-rose-700">Alpa</th>
                  <th className="p-3 text-center">Terlambat</th>
                  <th className="p-3 text-center">Dispensasi</th>
                  <th className="p-3 text-center font-bold text-slate-900">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriStats.map((item, idx) => (
                  <tr key={item.santri.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{item.santri.studentNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{item.santri.fullName}</td>
                    <td className="p-3 text-slate-600">
                      {item.santri.className} &middot; {item.santri.groupName}
                    </td>
                    <td className="p-3 text-center font-mono">{item.totalSesi}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">{item.hadir}</td>
                    <td className="p-3 text-center font-mono text-blue-700">{item.izin}</td>
                    <td className="p-3 text-center font-mono text-amber-700">{item.sakit}</td>
                    <td className="p-3 text-center font-mono font-bold text-rose-600">{item.alpa}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{item.terlambat}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{item.dispensasi}</td>
                    <td className="p-3 text-center font-bold font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          item.pct >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'ustadz' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">NIP</th>
                  <th className="p-3">Nama Ustadz</th>
                  <th className="p-3 text-center">Jumlah Jadwal</th>
                  <th className="p-3 text-center text-emerald-700">Terlaksana</th>
                  <th className="p-3 text-center text-amber-700">Belum Bertugas</th>
                  <th className="p-3 text-center text-blue-700">Izin / Diganti</th>
                  <th className="p-3 text-center font-bold">% Kepatuhan</th>
                  <th className="p-3 text-center">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ustadzStats.map((item, idx) => (
                  <tr key={item.ustadz.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{item.ustadz.employeeNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{item.ustadz.fullName}</td>
                    <td className="p-3 text-center font-mono font-medium">{item.totalJadwal}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">{item.terlaksana}</td>
                    <td className="p-3 text-center font-mono text-amber-700">{item.belum}</td>
                    <td className="p-3 text-center font-mono text-blue-700">{item.diganti}</td>
                    <td className="p-3 text-center font-bold font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          item.pct >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.pct >= 50
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.pct}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium">
                      {item.pct >= 80 ? (
                        <span className="text-emerald-700">Sangat Disiplin</span>
                      ) : (
                        <span className="text-amber-700">Perlu Verifikasi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Daftar Sesi Terlaksana pada {selectedMonth}</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {monthSessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sess.activityName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {sess.sessionType === 'morning' ? 'Pagi (Subuh)' : 'Malam (Maghrib)'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {sess.activityDate} &middot; {sess.startTime} - {sess.endTime} WIB &middot; Pembina: {sess.ustadzName}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Selesai & Tervalidasi
                  </span>
                </div>
              ))}
              {monthSessions.length === 0 && (
                <p className="text-slate-400 py-8 text-center">
                  Tidak ada catatan sesi kegiatan pada bulan ini.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
