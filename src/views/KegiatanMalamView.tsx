import React, { useState, useEffect } from 'react';
import {
  Moon,
  Save,
  CheckCheck,
  Printer,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Calendar,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import {
  ActivitySession,
  Ustadz,
  Santri,
  StudentAttendance,
  AppSettings,
  AttendanceStatus,
  ReportType,
} from '../types';
import { addActivitySession, saveStudentAttendanceBatch } from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface KegiatanMalamViewProps {
  sessions: ActivitySession[];
  ustadzList: Ustadz[];
  santriList: Santri[];
  attendances: StudentAttendance[];
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: ReportType) => void;
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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedUstadzId, setSelectedUstadzId] = useState<string>('');
  const [topic, setTopic] = useState<string>('Kajian Kitab Kuning & Tadarrus Al-Qur’an');
  const [incidentNotes, setIncidentNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Map of studentId -> status
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  // Check existing session for this date & night
  const existingSession = sessions.find(
    (s) => s.activityDate === selectedDate && s.sessionType === 'night'
  );

  useEffect(() => {
    if (existingSession) {
      setSelectedUstadzId(existingSession.ustadzId);
      setTopic(existingSession.topic || '');
      setIncidentNotes(existingSession.incidentNotes || '');

      const sessionAttendances = attendances.filter((a) => a.sessionId === existingSession.id);
      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
      sessionAttendances.forEach((a) => {
        map[a.santriId] = { status: a.attendanceStatus, notes: a.notes || '' };
      });
      setAttendanceMap(map);
    } else {
      const defaultUstadz = ustadzList[0]?.id || '';
      setSelectedUstadzId(defaultUstadz);
      setTopic('Kajian Kitab Kuning & Tadarrus Al-Qur’an');
      setIncidentNotes('');

      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
      santriList.forEach((s) => {
        map[s.id] = { status: 'hadir', notes: '' };
      });
      setAttendanceMap(map);
    }
  }, [selectedDate, existingSession, ustadzList, santriList, attendances]);

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
      {/* Top Header Card */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#EDE9FE] text-purple-950 uppercase tracking-wider inline-flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-purple-700" />
              Sesi Maghrib &ndash; Isya
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Absensi Kegiatan Malam Santri
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Kajian Kitab Kuning & Tadarrus Al-Qur’an ba’da Maghrib &middot; Ponpes Baitul Arqom
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenReportModal('absensi_malam')}
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

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="neo-btn px-4 py-2 text-xs font-black text-purple-950 bg-[#DDD6FE] hover:bg-[#C4B5FD] disabled:opacity-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-purple-900" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 bg-[#DCFCE7] border-2 border-slate-900 rounded-xl flex items-center gap-2 text-emerald-950 text-xs font-bold shadow-[2px_2px_0px_#1e293b]">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Berhasil menyimpan absensi santri kegiatan malam ke database!</span>
        </div>
      )}

      {/* Control Session Bar (Date, Duty Ustadz, Topic) */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-mono bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
              Ustadz / Ustadzah Piket Bertugas
            </label>
            <select
              value={selectedUstadzId}
              onChange={(e) => setSelectedUstadzId(e.target.value)}
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] outline-none"
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
              className="neo-btn w-full py-2 bg-[#FEF9C3] hover:bg-[#FEF08A] text-amber-950 font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-amber-800" />
              <span>Tandai Semua Santri Hadir</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-slate-900/10">
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Materi Kajian / Pembelajaran Maghrib
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Kitab Ta'limul Muta'allim Pasal Keutamaan Ilmu"
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
              Catatan Khusus / Santri Sakit / Kejadian
            </label>
            <input
              type="text"
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Contoh: 1 santri izin di asrama karena demam"
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Counter Strip: Soft Pastel Neobrutalist Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#DCFCE7] border-2 border-slate-900 rounded-2xl p-3 text-center shadow-[2.5px_2.5px_0px_#1e293b]">
          <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">Hadir</span>
          <span className="font-display text-2xl font-black text-emerald-950 font-mono tabular-nums">{hadirCount}</span>
        </div>
        <div className="bg-[#E0F2FE] border-2 border-slate-900 rounded-2xl p-3 text-center shadow-[2.5px_2.5px_0px_#1e293b]">
          <span className="text-[10px] font-black text-sky-950 uppercase tracking-wider block">Izin</span>
          <span className="font-display text-2xl font-black text-sky-950 font-mono tabular-nums">{izinCount}</span>
        </div>
        <div className="bg-[#FEF9C3] border-2 border-slate-900 rounded-2xl p-3 text-center shadow-[2.5px_2.5px_0px_#1e293b]">
          <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block">Sakit</span>
          <span className="font-display text-2xl font-black text-amber-950 font-mono tabular-nums">{sakitCount}</span>
        </div>
        <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-2xl p-3 text-center shadow-[2.5px_2.5px_0px_#1e293b]">
          <span className="text-[10px] font-black text-rose-950 uppercase tracking-wider block">Alpa</span>
          <span className="font-display text-2xl font-black text-rose-950 font-mono tabular-nums">{alpaCount}</span>
        </div>
      </div>

      {/* Santri Attendance List */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1e293b] overflow-hidden">
        {/* Search header */}
        <div className="p-3.5 border-b-2 border-slate-900/10 flex items-center justify-between gap-3 text-xs bg-[#FAF7F2]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, NIS, kelas..."
              className="w-full pl-9 pr-3 py-1.5 border-2 border-slate-900 rounded-xl bg-white text-slate-900 font-medium text-xs shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
            />
          </div>
          <span className="text-slate-600 font-bold font-mono text-xs">
            {filteredSantri.length} Santri
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y-2 divide-slate-900/10">
          {filteredSantri.map((s, idx) => {
            const currentStatus = attendanceMap[s.id]?.status || 'hadir';
            const currentNotes = attendanceMap[s.id]?.notes || '';

            return (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:min-w-[220px]">
                  <span className="w-6 text-center text-slate-400 font-mono text-xs shrink-0 font-bold">{idx + 1}</span>
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-slate-950 text-xs md:text-sm truncate" title={s.fullName}>
                      {s.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-mono font-medium truncate">
                      {s.studentNumber} &middot; {s.className} &middot; {s.dormitory}
                    </p>
                  </div>
                </div>

                {/* 4 Neobrutalist Rounded Status Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(['hadir', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((st) => {
                    const isSelected = currentStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleSetStatus(s.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? st === 'hadir'
                              ? 'bg-[#BBF7D0] text-emerald-950 border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
                              : st === 'izin'
                              ? 'bg-[#BAE6FD] text-sky-950 border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
                              : st === 'sakit'
                              ? 'bg-[#FEF08A] text-amber-950 border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
                              : 'bg-[#FECDD3] text-rose-950 border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
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
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:border-slate-900 outline-none"
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
