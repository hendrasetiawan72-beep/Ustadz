import React, { useState, useEffect } from 'react';
import {
  Moon,
  Save,
  CheckCheck,
  Search,
  CheckCircle2,
  BookOpen,
  Printer,
  FileSpreadsheet,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ActivitySession,
  Ustadz,
  Santri,
  StudentAttendance,
  AppSettings,
  AttendanceStatus,
} from '../types';
import {
  addActivitySession,
  saveStudentAttendanceBatch,
  getActivitySessions,
  getStudentAttendances,
} from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface KegiatanMalamViewProps {
  sessions: ActivitySession[];
  ustadzList: Ustadz[];
  santriList: Santri[];
  attendances: StudentAttendance[];
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: 'absensi_malam') => void;
}

export const KegiatanMalamView: React.FC<KegiatanMalamViewProps> = ({
  sessions,
  ustadzList,
  santriList,
  attendances,
  settings,
  onRefresh,
  onOpenReportModal,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUstadzId, setSelectedUstadzId] = useState(ustadzList[0]?.id || '');
  const [topic, setTopic] = useState('Kajian Kitab Kuning & Tadarrus Al-Qur\'an');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // In-memory attendance map for fast clicking
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  // Active night session for the selected date if exists
  const existingSession = sessions.find(
    (s) => s.sessionType === 'night' && s.activityDate === selectedDate
  );

  // Sync state when date or existing session changes
  useEffect(() => {
    if (existingSession) {
      setSelectedUstadzId(existingSession.ustadzId);
      setTopic(existingSession.topic || settings.nightSessionDefaultTitle);
      setIncidentNotes(existingSession.incidentNotes || '');

      const sessionAtts = attendances.filter((a) => a.sessionId === existingSession.id);
      const newMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

      santriList.forEach((s) => {
        const found = sessionAtts.find((a) => a.santriId === s.id);
        if (found) {
          newMap[s.id] = { status: found.attendanceStatus, notes: found.notes || '' };
        } else {
          newMap[s.id] = { status: 'hadir', notes: '' };
        }
      });
      setAttendanceMap(newMap);
    } else {
      // Default new state
      setTopic(settings.nightSessionDefaultTitle);
      setIncidentNotes('');
      const defaultMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      santriList.forEach((s) => {
        defaultMap[s.id] = { status: 'hadir', notes: '' };
      });
      setAttendanceMap(defaultMap);
    }
    setSavedSuccessMsg(false);
  }, [selectedDate, existingSession, santriList, attendances, settings]);

  const activeSantri = santriList.filter((s) => s.isActive);
  const hadirCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'hadir').length;
  const izinCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'izin').length;
  const sakitCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'sakit').length;
  const alpaCount = activeSantri.filter((s) => attendanceMap[s.id]?.status === 'alpa').length;

  const handleSetStatus = (santriId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: { ...prev[santriId], status },
    }));
    setSavedSuccessMsg(false);
  };

  const handleSetNotes = (santriId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: { ...prev[santriId], notes },
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

  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true);
      const u = ustadzList.find((item) => item.id === selectedUstadzId);
      const ustadzName = u?.fullName || 'Ustadz Piket';

      let sessionId = existingSession?.id;

      if (!sessionId) {
        // Create session
        const newSession = await addActivitySession({
          sessionType: 'night',
          activityName: settings.nightSessionDefaultTitle,
          activityDate: selectedDate,
          startTime: settings.nightSessionStart,
          endTime: settings.nightSessionEnd,
          ustadzId: selectedUstadzId,
          ustadzName,
          topic,
          incidentNotes,
          status: 'selesai',
          createdBy: 'admin',
        });
        sessionId = newSession.id;
      }

      // Save student attendance batch
      const batchPayload = activeSantri.map((s) => ({
        santriId: s.id,
        attendanceStatus: attendanceMap[s.id]?.status || 'hadir',
        notes: attendanceMap[s.id]?.notes || '',
      }));

      await saveStudentAttendanceBatch(sessionId, batchPayload, 'admin');

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
      Asrama: s.dormitory,
      Tanggal: selectedDate,
      Sesi: 'Malam (Maghrib - Isya)',
      Status: (attendanceMap[s.id]?.status || 'hadir').toUpperCase(),
      Keterangan: attendanceMap[s.id]?.notes || '-',
    }));
    exportDataToExcel(data, `Absensi_Malam_Ponpes_${selectedDate}`);
  };

  const filteredSantri = activeSantri.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Absensi Kegiatan Malam (Maghrib — Isya)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan kehadiran santri kajian kitab kuning & tadarrus Al-Qur’an ba’da Maghrib
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReportModal('absensi_malam')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Berhasil menyimpan absensi santri kegiatan malam ke database!</span>
        </div>
      )}

      {/* Control Session Bar (Date, Duty Ustadz, Topic) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ustadz / Ustadzah Piket Bertugas
            </label>
            <select
              value={selectedUstadzId}
              onChange={(e) => setSelectedUstadzId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-medium"
            >
              {ustadzList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleMarkAllHadir}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-purple-600" />
              <span>Tandai Semua Santri Hadir</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Materi Kajian / Pembelajaran Maghrib
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Kitab Ta'limul Muta'allim Pasal Keutamaan Ilmu"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Khusus / Santri Sakit / Kejadian
            </label>
            <input
              type="text"
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Contoh: 1 santri izin di asrama karena demam"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200/70 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-emerald-800 uppercase block">Hadir</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">{hadirCount}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200/70 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-blue-800 uppercase block">Izin</span>
          <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">{izinCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">Sakit</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">{sakitCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200/70 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-rose-800 uppercase block">Alpa</span>
          <span className="text-2xl font-extrabold text-rose-700 font-mono tabular-nums">{alpaCount}</span>
        </div>
      </div>

      {/* Santri Attendance List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Search */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>
          <span className="text-slate-400 font-mono">
            {filteredSantri.length} Santri
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {filteredSantri.map((s, idx) => {
            const currentStatus = attendanceMap[s.id]?.status || 'hadir';
            const currentNotes = attendanceMap[s.id]?.notes || '';

            return (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:min-w-[220px]">
                  <span className="w-6 text-center text-slate-400 font-mono text-xs shrink-0">{idx + 1}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs md:text-sm truncate" title={s.fullName}>
                      {s.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {s.studentNumber} &middot; {s.className} &middot; {s.dormitory}
                    </p>
                  </div>
                </div>

                {/* 4 Simple Status Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(['hadir', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((st) => {
                    const isSelected = currentStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleSetStatus(s.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                          isSelected
                            ? st === 'hadir'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'izin'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : st === 'sakit'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'hadir'
                          ? 'Hadir'
                          : st === 'izin'
                          ? 'Izin'
                          : st === 'sakit'
                          ? 'Sakit'
                          : 'Alpa'}
                      </button>
                    );
                  })}
                </div>

                {/* Note */}
                <div className="w-full sm:w-44 shrink-0">
                  <input
                    type="text"
                    value={currentNotes}
                    onChange={(e) => handleSetNotes(s.id, e.target.value)}
                    placeholder="Catatan..."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
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
