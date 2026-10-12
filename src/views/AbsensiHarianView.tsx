import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCheck,
  Search,
  Filter,
  Save,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  Santri,
  ActivitySession,
  StudentAttendance,
  AttendanceStatus,
  UserRole,
  AppSettings,
} from '../types';
import { saveStudentAttendanceBatch, getActivitySessions } from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface AbsensiHarianViewProps {
  santriList: Santri[];
  sessions: ActivitySession[];
  attendances: StudentAttendance[];
  userRole: UserRole;
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: 'absensi_harian') => void;
}

export const AbsensiHarianView: React.FC<AbsensiHarianViewProps> = ({
  santriList,
  sessions,
  attendances,
  userRole,
  settings,
  onRefresh,
  onOpenReportModal,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dormFilter, setDormFilter] = useState('all');

  // Local attendance state for fast in-place editing
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Available sessions for the selected date
  const dateSessions = sessions.filter((s) => s.activityDate === selectedDate);

  // Automatically select the first session or create dummy id
  useEffect(() => {
    if (dateSessions.length > 0) {
      if (!selectedSessionId || !dateSessions.some((s) => s.id === selectedSessionId)) {
        setSelectedSessionId(dateSessions[0].id);
      }
    } else {
      setSelectedSessionId('');
    }
  }, [selectedDate, sessions]);

  // Load attendance whenever selectedSessionId changes
  useEffect(() => {
    const newMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    santriList.forEach((s) => {
      // Find existing record
      const existing = attendances.find(
        (a) => a.sessionId === selectedSessionId && a.santriId === s.id
      );
      if (existing) {
        newMap[s.id] = { status: existing.attendanceStatus, notes: existing.notes || '' };
      } else {
        // default to hadir
        newMap[s.id] = { status: 'hadir', notes: '' };
      }
    });

    setAttendanceMap(newMap);
    setSavedSuccessMsg(false);
  }, [selectedSessionId, santriList, attendances]);

  // Status counters
  const activeSantri = santriList.filter((s) => s.isActive);
  const hadirCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'hadir').length;
  const izinCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'izin').length;
  const sakitCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'sakit').length;
  const alpaCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'alpa').length;
  const terlambatCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'terlambat').length;
  const dispensasiCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'dispensasi').length;

  const handleSetStatus = (santriId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        status,
      },
    }));
    setSavedSuccessMsg(false);
  };

  const handleSetNotes = (santriId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        notes,
      },
    }));
    setSavedSuccessMsg(false);
  };

  const handleMarkAllHadir = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      activeSantri.forEach((s) => {
        next[s.id] = { ...next[s.id], status: 'hadir' };
      });
      return next;
    });
    setSavedSuccessMsg(false);
  };

  const handleSaveBatch = async () => {
    if (!selectedSessionId) {
      alert('Pilih atau buat sesi kegiatan terlebih dahulu sebelum menyimpan absensi santri.');
      return;
    }

    try {
      setIsSaving(true);
      const batchPayload = activeSantri.map((s) => ({
        santriId: s.id,
        attendanceStatus: attendanceMap[s.id]?.status || 'hadir',
        notes: attendanceMap[s.id]?.notes || '',
      }));

      await saveStudentAttendanceBatch(selectedSessionId, batchPayload, userRole);
      setSavedSuccessMsg(true);
      onRefresh();
      setTimeout(() => setSavedSuccessMsg(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal menyimpan absensi: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const data = activeSantri.map((s, idx) => ({
      No: idx + 1,
      NIS: s.studentNumber,
      Nama_Santri: s.fullName,
      Kelas: s.className,
      Kelompok: s.groupName,
      Asrama: s.dormitory,
      Tanggal: selectedDate,
      Status_Kehadiran: (attendanceMap[s.id]?.status || 'hadir').toUpperCase(),
      Keterangan: attendanceMap[s.id]?.notes || '-',
    }));
    exportDataToExcel(data, `Absensi_Santri_${selectedDate}`);
  };

  const filteredSantri = activeSantri.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = classFilter === 'all' || s.className === classFilter;
    const matchDorm = dormFilter === 'all' || s.dormitory === dormFilter;
    return matchSearch && matchClass && matchDorm;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            Absensi Santri Harian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengisian absensi cepat &middot; Sholat berjamaah & kajian kepesantrenan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReportModal('absensi_harian')}
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

          <button
            onClick={handleSaveBatch}
            disabled={isSaving || !selectedSessionId}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Berhasil menyimpan seluruh data absensi santri ke database!</span>
        </div>
      )}

      {/* Date & Session Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tanggal Absensi</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Pilih Sesi Kegiatan</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
          >
            {dateSessions.length > 0 ? (
              dateSessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.sessionType === 'morning' ? '🌅 Pagi' : '🌙 Malam'} &middot; {sess.activityName} ({sess.ustadzName})
                </option>
              ))
            ) : (
              <option value="">Belum ada sesi pada tanggal ini (Buat di Kegiatan Malam/Pagi)</option>
            )}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleMarkAllHadir}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-emerald-200"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tandai Semua Hadir</span>
          </button>
        </div>
      </div>

      {/* Live Status Counter Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Hadir</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">{hadirCount}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200/70 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">Izin</span>
          <span className="text-xl font-extrabold text-blue-700 font-mono tabular-nums">{izinCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Sakit</span>
          <span className="text-xl font-extrabold text-amber-700 font-mono tabular-nums">{sakitCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Alpa</span>
          <span className="text-xl font-extrabold text-rose-700 font-mono tabular-nums">{alpaCount}</span>
        </div>
        <div className="bg-purple-50 border border-purple-200/70 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">Terlambat</span>
          <span className="text-xl font-extrabold text-purple-700 font-mono tabular-nums">{terlambatCount}</span>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">Dispensasi</span>
          <span className="text-xl font-extrabold text-slate-800 font-mono tabular-nums">{dispensasiCount}</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
        >
          <option value="all">Semua Kelas</option>
          <option value="X - SMK Muhiba">Kelas X</option>
          <option value="XI - SMK Muhiba">Kelas XI</option>
          <option value="XII - SMK Muhiba">Kelas XII</option>
        </select>

        <select
          value={dormFilter}
          onChange={(e) => setDormFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
        >
          <option value="all">Semua Asrama</option>
          <option value="Asrama Abu Bakar">Asrama Abu Bakar</option>
          <option value="Asrama Umar bin Khattab">Asrama Umar</option>
          <option value="Asrama Utsman bin Affan">Asrama Utsman</option>
          <option value="Asrama Ali bin Abi Thalib">Asrama Ali</option>
        </select>
      </div>

      {/* Attendance Form List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredSantri.map((s, idx) => {
            const currentStatus = attendanceMap[s.id]?.status || 'hadir';
            const currentNotes = attendanceMap[s.id]?.notes || '';

            return (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                {/* Santri Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:min-w-[200px]">
                  <span className="w-6 text-center text-slate-400 font-mono text-xs shrink-0">{idx + 1}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs md:text-sm truncate" title={s.fullName}>{s.fullName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {s.studentNumber} &middot; {s.className} &middot; {s.dormitory}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  {(['hadir', 'izin', 'sakit', 'alpa', 'terlambat', 'dispensasi'] as AttendanceStatus[]).map((st) => {
                    const isSelected = currentStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleSetStatus(s.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                          isSelected
                            ? st === 'hadir'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'izin'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : st === 'sakit'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : st === 'alpa'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : st === 'terlambat'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'hadir'
                          ? 'H'
                          : st === 'izin'
                          ? 'I'
                          : st === 'sakit'
                          ? 'S'
                          : st === 'alpa'
                          ? 'A'
                          : st === 'terlambat'
                          ? 'T'
                          : 'D'}
                        <span className="hidden md:inline ml-1 lowercase font-medium">
                          {st.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Individual Note Input */}
                <div className="w-full sm:w-44 shrink-0">
                  <input
                    type="text"
                    value={currentNotes}
                    onChange={(e) => handleSetNotes(s.id, e.target.value)}
                    placeholder="Catatan santri..."
                    className="w-full text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
