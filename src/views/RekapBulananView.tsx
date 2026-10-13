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

  // Totals
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
        Asrama: item.santri.dormitory,
        Total_Sesi: item.totalSesi,
        Hadir: item.hadir,
        Izin: item.izin,
        Sakit: item.sakit,
        Alpa: item.alpa,
        Terlambat: item.terlambat,
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
      {/* View Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#BBF7D0] text-emerald-950 uppercase tracking-wider inline-flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-800" />
              Laporan Evaluasi
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Rekapitulasi Bulanan Pesantren
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Laporan kepatuhan piket Ustadz dan statistik kehadiran santri terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenReportModal(activeTab === 'ustadz' ? 'rekap_ustadz_bulanan' : 'rekap_santri_bulanan')
            }
            className="neo-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="neo-btn px-3.5 py-2 text-xs font-bold text-emerald-950 bg-[#DCFCE7] hover:bg-[#BBF7D0] rounded-xl flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-4 shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-[#FAF7F2] rounded-xl border border-slate-900/20">
          <button
            onClick={() => setActiveTab('santri')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'santri'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekap Santri
          </button>
          <button
            onClick={() => setActiveTab('ustadz')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ustadz'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kepatuhan Piket Ustadz
          </button>
          <button
            onClick={() => setActiveTab('kegiatan')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'kegiatan'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Statistik Sesi Kegiatan
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-2 border-slate-900 rounded-xl px-3 py-1.5 bg-white font-mono font-bold text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
            />
          </div>

          {activeTab === 'santri' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border-2 border-slate-900 rounded-xl px-3 py-1.5 bg-white font-bold text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
            >
              <option value="all">Semua Kelas</option>
              <option value="X - SMK Muhiba">Kelas X</option>
              <option value="XI - SMK Muhiba">Kelas XI</option>
              <option value="XII - SMK Muhiba">Kelas XII</option>
            </select>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip: Colorful Soft Pastel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FEFCE8] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#1e293b]">
          <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block">
            Total Sesi Terlaksana
          </span>
          <span className="font-display text-2xl font-black text-slate-950 font-mono tabular-nums">
            {totalSesiBulanIni} Sesi
          </span>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            {sesiPagiCount} Subuh &middot; {sesiMalamCount} Maghrib
          </p>
        </div>

        <div className="bg-[#DCFCE7] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#1e293b]">
          <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">
            Rata-rata Kehadiran
          </span>
          <span className="font-display text-2xl font-black text-emerald-950 font-mono tabular-nums">
            {averageSantriAttendance}%
          </span>
          <p className="text-[11px] text-emerald-800 mt-0.5 font-bold">Kondisi Disiplin Tinggi</p>
        </div>

        <div className="bg-[#E0F2FE] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#1e293b]">
          <span className="text-[10px] font-black text-sky-950 uppercase tracking-wider block">
            Jadwal Piket Terlaksana
          </span>
          <span className="font-display text-2xl font-black text-sky-950 font-mono tabular-nums">
            {monthSchedules.filter((s) => s.status === 'sudah_bertugas').length} / {monthSchedules.length}
          </span>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Kepatuhan Ustadz Terverifikasi</p>
        </div>

        <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#1e293b]">
          <span className="text-[10px] font-black text-rose-950 uppercase tracking-wider block">
            Santri Perlu Pembinaan
          </span>
          <span className="font-display text-2xl font-black text-rose-950 font-mono tabular-nums">
            {santriStats.filter((s) => s.alpa >= 2).length} Santri
          </span>
          <p className="text-[11px] text-rose-800 mt-0.5 font-bold">&ge; 2 Kali Alpa Bulan Ini</p>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1e293b] overflow-hidden">
        {activeTab === 'santri' ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-[#FEF9C3] text-slate-900 border-b-2 border-slate-900 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Nama Lengkap Santri</th>
                  <th className="p-3">Kelas & Kelompok</th>
                  <th className="p-3 text-center">Sesi</th>
                  <th className="p-3 text-center text-emerald-900">Hadir</th>
                  <th className="p-3 text-center text-sky-900">Izin</th>
                  <th className="p-3 text-center text-amber-900">Sakit</th>
                  <th className="p-3 text-center text-rose-900">Alpa</th>
                  <th className="p-3 text-center">Terlambat</th>
                  <th className="p-3 text-center">Dispensasi</th>
                  <th className="p-3 text-center font-black text-slate-950">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900/10">
                {santriStats.map((item, idx) => (
                  <tr key={item.santri.id} className="hover:bg-[#FAF7F2]">
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] font-semibold">{item.santri.studentNumber}</td>
                    <td className="p-3 font-bold text-slate-950">{item.santri.fullName}</td>
                    <td className="p-3 text-slate-600 font-medium">
                      {item.santri.className} &middot; {item.santri.groupName}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{item.totalSesi}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">{item.hadir}</td>
                    <td className="p-3 text-center font-mono text-sky-800">{item.izin}</td>
                    <td className="p-3 text-center font-mono text-amber-800">{item.sakit}</td>
                    <td className="p-3 text-center font-mono font-bold text-rose-700">{item.alpa}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{item.terlambat}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{item.dispensasi}</td>
                    <td className="p-3 text-center font-bold font-mono">
                      <span
                        className={`neo-badge px-2.5 py-0.5 text-[10px] font-black ${
                          item.pct >= 85
                            ? 'bg-[#DCFCE7] text-emerald-950'
                            : item.pct >= 70
                            ? 'bg-[#FEF08A] text-amber-950'
                            : 'bg-[#FFE4E6] text-rose-950'
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#FEF9C3] text-slate-900 border-b-2 border-slate-900 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">NIP</th>
                  <th className="p-3">Nama Ustadz</th>
                  <th className="p-3 text-center">Jumlah Jadwal</th>
                  <th className="p-3 text-center text-emerald-900">Terlaksana</th>
                  <th className="p-3 text-center text-amber-900">Belum Bertugas</th>
                  <th className="p-3 text-center text-sky-900">Izin / Diganti</th>
                  <th className="p-3 text-center font-black">% Kepatuhan</th>
                  <th className="p-3 text-center">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900/10">
                {ustadzStats.map((item, idx) => (
                  <tr key={item.ustadz.id} className="hover:bg-[#FAF7F2]">
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] font-semibold">{item.ustadz.employeeNumber}</td>
                    <td className="p-3 font-bold text-slate-950">{item.ustadz.fullName}</td>
                    <td className="p-3 text-center font-mono font-bold">{item.totalJadwal}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">{item.terlaksana}</td>
                    <td className="p-3 text-center font-mono text-amber-800">{item.belum}</td>
                    <td className="p-3 text-center font-mono text-sky-800">{item.diganti}</td>
                    <td className="p-3 text-center font-bold font-mono">
                      <span
                        className={`neo-badge px-2.5 py-0.5 text-[10px] font-black ${
                          item.pct >= 80
                            ? 'bg-[#DCFCE7] text-emerald-950'
                            : item.pct >= 50
                            ? 'bg-[#E0F2FE] text-sky-950'
                            : 'bg-[#FFE4E6] text-rose-950'
                        }`}
                      >
                        {item.pct}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      {item.pct >= 80 ? (
                        <span className="text-emerald-800">Sangat Disiplin</span>
                      ) : (
                        <span className="text-amber-800">Perlu Verifikasi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h4 className="font-display font-black text-slate-900 text-sm">Daftar Sesi Terlaksana pada {selectedMonth}</h4>
            <div className="divide-y-2 divide-slate-900/10 text-xs">
              {monthSessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950">{sess.activityName}</span>
                      <span className="neo-badge px-2 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950 uppercase">
                        {sess.sessionType === 'morning' ? 'Pagi (Subuh)' : 'Malam (Maghrib)'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-medium">
                      {sess.activityDate} &middot; {sess.startTime} - {sess.endTime} WIB &middot; Pembina: {sess.ustadzName}
                    </p>
                  </div>
                  <span className="neo-badge font-black text-emerald-950 bg-[#DCFCE7] px-3 py-1">
                    Selesai &amp; Tervalidasi
                  </span>
                </div>
              ))}
              {monthSessions.length === 0 && (
                <p className="text-slate-500 py-8 text-center font-medium">
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
