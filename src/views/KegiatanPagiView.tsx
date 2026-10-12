import React, { useState } from 'react';
import {
  Sun,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  ArrowRightLeft,
} from 'lucide-react';
import {
  ActivitySession,
  Ustadz,
  Santri,
  StudentAttendance,
  UserRole,
  AppSettings,
  AttendanceStatus,
} from '../types';
import { addActivitySession, saveStudentAttendanceBatch } from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface KegiatanPagiViewProps {
  sessions: ActivitySession[];
  ustadzList: Ustadz[];
  santriList: Santri[];
  attendances: StudentAttendance[];
  userRole: UserRole;
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: 'absensi_pagi') => void;
}

export const KegiatanPagiView: React.FC<KegiatanPagiViewProps> = ({
  sessions,
  ustadzList,
  santriList,
  attendances,
  userRole,
  settings,
  onRefresh,
  onOpenReportModal,
}) => {
  const morningSessions = sessions.filter((s) => s.sessionType === 'morning');
  const [selectedSession, setSelectedSession] = useState<ActivitySession | null>(
    morningSessions[0] || null
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState(settings.morningSessionStart || '04:30');
  const [formEndTime, setFormEndTime] = useState(settings.morningSessionEnd || '06:00');
  const [formActivityName, setFormActivityName] = useState(settings.morningSessionDefaultTitle);
  const [formUstadzId, setFormUstadzId] = useState(ustadzList[0]?.id || '');
  const [formTopic, setFormTopic] = useState('');
  const [formIncidentNotes, setFormIncidentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-session attendance
  const sessionAttendances = selectedSession
    ? attendances.filter((a) => a.sessionId === selectedSession.id)
    : [];

  // Comparison with night session of previous or same date
  const counterpartNightSession = sessions.find(
    (s) => s.sessionType === 'night' && s.activityDate === selectedSession?.activityDate
  );

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = ustadzList.find((u) => u.id === formUstadzId);
    try {
      setIsSubmitting(true);
      const newSession = await addActivitySession({
        sessionType: 'morning',
        activityName: formActivityName,
        activityDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        ustadzId: formUstadzId,
        ustadzName: u?.fullName || 'Ustadz',
        topic: formTopic,
        incidentNotes: formIncidentNotes,
        status: 'selesai',
        createdBy: userRole,
      });

      // Default attendance to Hadir
      const defaultAttendances = santriList
        .filter((s) => s.isActive)
        .map((s) => ({
          santriId: s.id,
          attendanceStatus: 'hadir' as AttendanceStatus,
          notes: '',
        }));

      await saveStudentAttendanceBatch(newSession.id, defaultAttendances, userRole);

      setIsAddModalOpen(false);
      setSelectedSession(newSession);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal membuat sesi kegiatan: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedSession) return;
    const santriMap = new Map(santriList.map((s) => [s.id, s]));
    const data = sessionAttendances.map((a, idx) => {
      const s = santriMap.get(a.santriId);
      return {
        No: idx + 1,
        NIS: s?.studentNumber || '-',
        Nama_Santri: s?.fullName || '-',
        Kelas: s?.className || '-',
        Asrama: s?.dormitory || '-',
        Kegiatan: selectedSession.activityName,
        Tanggal: selectedSession.activityDate,
        Status_Kehadiran: a.attendanceStatus.toUpperCase(),
        Keterangan: a.notes || '-',
      };
    });
    exportDataToExcel(data, `Kegiatan_Pagi_${selectedSession.activityDate}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-500" />
            Kegiatan Pagi — Subuh sampai Pukul 06.00 WIB
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rentang operasional: {settings.morningSessionStart} - {settings.morningSessionEnd} WIB &middot; Sholat Subuh Berjamaah & Kuliah Subuh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReportModal('absensi_pagi')}
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kegiatan Baru</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sessions List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Morning Sessions List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Daftar Sesi Subuh & Pagi</h3>
            <div className="space-y-2">
              {morningSessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <button
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span>{sess.activityDate}</span>
                      <span className="font-semibold text-orange-600">
                        {sess.startTime} - {sess.endTime} WIB
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1">{sess.activityName}</div>
                    <div className="text-slate-600 mt-0.5 truncate">
                      Piket: {sess.ustadzName}
                    </div>
                  </button>
                );
              })}
              {morningSessions.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada sesi kegiatan pagi tercatat.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Session Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSession ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 uppercase">
                    Kegiatan Pagi (Subuh)
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedSession.activityName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSession.activityDate} &middot; {selectedSession.startTime} - {selectedSession.endTime} WIB &middot; Pembina: <span className="font-semibold text-slate-800">{selectedSession.ustadzName}</span>
                  </p>
                </div>
              </div>

              {/* Comparison Morning vs Night card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Perbandingan Kehadiran Sesi Pagi vs Malam:</span>
                </div>
                <div className="flex items-center gap-4 text-slate-800 font-mono">
                  <span>🌅 Pagi: <strong className="text-emerald-700">{sessionAttendances.filter((a) => a.attendanceStatus === 'hadir').length} Hadir</strong></span>
                  <span>🌙 Malam: <strong className="text-purple-700">{counterpartNightSession ? 'Tercatat' : 'Belum Ada'}</strong></span>
                </div>
              </div>

              {/* Topics & Incident Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    Materi Kuliah Subuh / Muhadatsah:
                  </span>
                  <p className="text-slate-600">{selectedSession.topic || 'Belum diisi'}</p>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="font-semibold text-amber-900 block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Catatan Disiplin Bangun Subuh:
                  </span>
                  <p className="text-amber-800">{selectedSession.incidentNotes || 'Seluruh santri hadir tepat waktu sebelum adzan Subuh.'}</p>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="mt-4">
                <h4 className="font-bold text-slate-800 text-xs mb-2">
                  Daftar Absensi Santri ({sessionAttendances.length} santri tercatat)
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Nama Santri</th>
                        <th className="p-2.5">Kelas</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionAttendances.map((att) => {
                        const s = santriList.find((santri) => santri.id === att.santriId);
                        return (
                          <tr key={att.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">{s?.fullName || 'Santri'}</td>
                            <td className="p-2.5 text-slate-500">{s?.className || '-'}</td>
                            <td className="p-2.5 text-center font-bold uppercase text-[10px]">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  att.attendanceStatus === 'hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : att.attendanceStatus === 'sakit'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {att.attendanceStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">{att.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400">
              Pilih salah satu sesi di samping atau buat sesi kegiatan baru.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Session */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Catat Kegiatan Pagi (Subuh - 06:00 WIB)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ponpes Baitul Arqom SMK Muhiba
            </p>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ustadz Piket Bertugas</label>
                  <select
                    value={formUstadzId}
                    onChange={(e) => setFormUstadzId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    {ustadzList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  value={formActivityName}
                  onChange={(e) => setFormActivityName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Materi Kuliah Subuh / Kosakata Arab</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Contoh: Kajian Hadits Arbain & Mufrodat Yaumiyyah"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kejadian / Kedisiplinan</label>
                <textarea
                  rows={2}
                  value={formIncidentNotes}
                  onChange={(e) => setFormIncidentNotes(e.target.value)}
                  placeholder="Catatan santri terlambat bangun atau tidak hadir sholat berjamaah"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-xl font-bold shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
