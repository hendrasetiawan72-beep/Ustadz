import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Clock,
  Filter,
} from 'lucide-react';
import { Ustadz, PiketSchedule, AppSettings } from '../types';
import {
  addPiketSchedule,
  updatePiketSchedule,
  deletePiketSchedule,
  checkWeeklyDutyConflict,
  getStartOfWeek,
  getDayIndoName,
} from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface JadwalPiketViewProps {
  schedules: PiketSchedule[];
  ustadzList: Ustadz[];
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: 'jadwal_mingguan' | 'jadwal_bulanan') => void;
}

export const JadwalPiketView: React.FC<JadwalPiketViewProps> = ({
  schedules,
  ustadzList,
  settings,
  onRefresh,
  onOpenReportModal,
}) => {
  const [sessionFilter, setSessionFilter] = useState<'all' | 'night' | 'morning' | 'both'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PiketSchedule | null>(null);

  // Form State
  const [formUstadzId, setFormUstadzId] = useState(ustadzList[0]?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSessionType, setFormSessionType] = useState<'night' | 'morning' | 'both'>('both');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<PiketSchedule['status']>('terjadwal');
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDateOrUstadzChange = async (uId: string, dStr: string, excludeId?: string) => {
    setFormUstadzId(uId);
    setFormDate(dStr);
    const result = await checkWeeklyDutyConflict(uId, dStr, excludeId);
    if (result.hasConflict) {
      setConflictWarning(
        `Perhatian: Ustadz/Ustadzah ini sudah memiliki jadwal piket pada tanggal ${result.existingDate} di minggu yang sama! Aturan baku Ponpes: 1 Ustadz/ah piket 1 kali per minggu.`
      );
    } else {
      setConflictWarning(null);
    }
  };

  const handleOpenAdd = () => {
    const defaultU = ustadzList[0]?.id || '';
    const defaultD = new Date().toISOString().split('T')[0];
    setFormUstadzId(defaultU);
    setFormDate(defaultD);
    setFormSessionType('both');
    setFormNotes('');
    setFormStatus('terjadwal');
    setAllowOverride(false);
    setOverrideReason('');
    setConflictWarning(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sch: PiketSchedule) => {
    setSelectedSchedule(sch);
    setFormUstadzId(sch.ustadzId);
    setFormDate(sch.scheduleDate);
    setFormSessionType(sch.sessionType || 'both');
    setFormNotes(sch.notes || '');
    setFormStatus(sch.status);
    setAllowOverride(Boolean(sch.overrideReason));
    setOverrideReason(sch.overrideReason || '');
    setConflictWarning(null);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictWarning && !allowOverride) {
      alert('Terdapat konflik jadwal ustadz pada pekan yang sama. Centang izin pengecualian jika ada izin pimpinan.');
      return;
    }

    try {
      setIsSubmitting(true);
      const u = ustadzList.find((item) => item.id === formUstadzId);
      const ustadzName = u?.fullName || 'Ustadz Piket';

      await addPiketSchedule({
        scheduleDate: formDate,
        ustadzId: formUstadzId,
        ustadzName,
        sessionType: formSessionType,
        status: formStatus,
        notes: formNotes,
        overrideReason: allowOverride ? overrideReason : undefined,
        createdBy: 'admin',
      });

      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal menambah jadwal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      setIsSubmitting(true);
      const u = ustadzList.find((item) => item.id === formUstadzId);
      const ustadzName = u?.fullName || selectedSchedule.ustadzName;
      const dayName = getDayIndoName(formDate);
      const weekStart = getStartOfWeek(formDate);

      await updatePiketSchedule(selectedSchedule.id, {
        scheduleDate: formDate,
        dayName,
        weekStart,
        ustadzId: formUstadzId,
        ustadzName,
        sessionType: formSessionType,
        status: formStatus,
        notes: formNotes,
        overrideReason: allowOverride ? overrideReason : undefined,
      });

      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal memperbarui jadwal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal piket untuk ${name}?`)) {
      try {
        await deletePiketSchedule(id);
        onRefresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Gagal menghapus: ${msg}`);
      }
    }
  };

  const handleToggleStatus = async (sch: PiketSchedule) => {
    const newStatus = sch.status === 'sudah_bertugas' ? 'terjadwal' : 'sudah_bertugas';
    try {
      await updatePiketSchedule(sch.id, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredSchedules.map((s, idx) => ({
      No: idx + 1,
      Hari: s.dayName,
      Tanggal: s.scheduleDate,
      Nama_Ustadz: s.ustadzName,
      Sesi:
        s.sessionType === 'morning'
          ? 'Kegiatan Pagi (Subuh)'
          : s.sessionType === 'night'
          ? 'Kegiatan Malam (Maghrib)'
          : 'Malam & Pagi',
      Status: s.status,
      Catatan: s.notes || '-',
    }));
    exportDataToExcel(data, `Jadwal_Piket_Ponpes_Baitul_Arqom_${todayStr}`);
  };

  const filteredSchedules = schedules.filter((s) => {
    if (sessionFilter === 'all') return true;
    if (sessionFilter === 'both') return s.sessionType === 'both';
    return s.sessionType === sessionFilter || s.sessionType === 'both';
  });

  return (
    <div className="space-y-6">
      {/* View Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950 uppercase tracking-wider inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-sky-700" />
              Manajemen Piket
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Jadwal Piket Ustadz & Ustadzah
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Penugasan piket untuk Kegiatan Malam (Maghrib - Isya) &amp; Kegiatan Pagi (Subuh - 06:00 WIB)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenReportModal('jadwal_mingguan')}
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
            onClick={handleOpenAdd}
            className="neo-btn px-4 py-2 text-xs font-black text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-900" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Session Filter Tabs */}
      <div className="bg-[#FFFDF9] p-3 border-2 border-slate-900 rounded-2xl shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-xl border border-slate-900/20">
          <button
            onClick={() => setSessionFilter('all')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              sessionFilter === 'all'
                ? 'bg-white text-slate-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Sesi
          </button>
          <button
            onClick={() => setSessionFilter('night')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              sessionFilter === 'night'
                ? 'bg-[#EDE9FE] text-purple-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3 h-3 text-purple-700" />
            <span>Kegiatan Malam</span>
          </button>
          <button
            onClick={() => setSessionFilter('morning')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              sessionFilter === 'morning'
                ? 'bg-[#FEF08A] text-amber-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3 h-3 text-amber-700" />
            <span>Kegiatan Pagi</span>
          </button>
        </div>

        <span className="text-slate-600 font-bold font-mono text-[11px] px-2">
          Total {filteredSchedules.length} Jadwal Terjadwal
        </span>
      </div>

      {/* Schedule Table */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1e293b] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#FEF9C3] text-slate-900 border-b-2 border-slate-900 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Hari &amp; Tanggal</th>
                <th className="py-3 px-4">Petugas Piket (Ustadz / Ustadzah)</th>
                <th className="py-3 px-4 text-center">Sesi Piket</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900/10">
              {filteredSchedules.map((sch) => {
                const isToday = sch.scheduleDate === todayStr;
                const isNight = sch.sessionType === 'night';
                const isMorning = sch.sessionType === 'morning';
                const isBoth = sch.sessionType === 'both' || !sch.sessionType;

                return (
                  <tr
                    key={sch.id}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      isToday ? 'bg-[#DCFCE7]/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-slate-950">{sch.dayName}</span>
                        <span className="text-slate-500 font-mono text-[11px] font-medium">{sch.scheduleDate}</span>
                        {isToday && (
                          <span className="neo-badge px-2 py-0.5 text-[10px] font-black bg-[#BBF7D0] text-emerald-950">
                            Hari Ini
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="font-bold text-slate-950 break-words">{sch.ustadzName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Pekan: {sch.weekStart}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isNight && (
                        <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#EDE9FE] text-purple-950">
                          <Moon className="w-3 h-3 text-purple-700" />
                          <span>Malam (Maghrib)</span>
                        </span>
                      )}
                      {isMorning && (
                        <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#FEF08A] text-amber-950">
                          <Sun className="w-3 h-3 text-amber-700" />
                          <span>Pagi (Subuh)</span>
                        </span>
                      )}
                      {isBoth && (
                        <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#DCFCE7] text-emerald-950">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          <span>Malam &amp; Pagi</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(sch)}
                        className={`neo-badge inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black transition-all cursor-pointer ${
                          sch.status === 'sudah_bertugas'
                            ? 'bg-[#BBF7D0] text-emerald-950'
                            : 'bg-[#BAE6FD] text-sky-950'
                        }`}
                        title="Klik untuk ubah status tugas"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sch.status === 'sudah_bertugas' ? 'Sudah Bertugas' : 'Terjadwal'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-xs font-medium">
                      <div className="truncate" title={sch.notes || ''}>{sch.notes || '-'}</div>
                      {sch.overrideReason && (
                        <span className="block text-[10px] text-amber-900 font-bold truncate" title={sch.overrideReason}>
                          Alasan: {sch.overrideReason}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEdit(sch)}
                        title="Edit Jadwal"
                        className="p-1.5 text-slate-800 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sch.id, sch.ustadzName || 'Ustadz')}
                        title="Hapus Jadwal"
                        className="p-1.5 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Jadwal Piket with Neobrutalist Rounded Styling */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-[2rem] shadow-[8px_8px_0px_#1e293b] w-full max-w-lg p-6 sm:p-7 border-2 border-slate-900">
            <h3 className="font-display text-lg font-black text-slate-950 mb-1">
              {isEditModalOpen ? 'Edit Jadwal Piket' : 'Tetapkan Jadwal Piket Baru'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Pilih petugas Ustadz/Ustadzah dan sesi penugasan (Malam / Pagi)
            </p>

            <form
              onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveAdd}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
                  Pilih Ustadz / Ustadzah
                </label>
                <select
                  value={formUstadzId}
                  onChange={(e) => handleDateOrUstadzChange(e.target.value, formDate)}
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  required
                >
                  {ustadzList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
                  Tanggal Piket
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => handleDateOrUstadzChange(formUstadzId, e.target.value)}
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                  Hari: {getDayIndoName(formDate)} &middot; Awal Pekan: {getStartOfWeek(formDate)}
                </span>
              </div>

              {/* Sesi Penugasan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
                  Sesi Kegiatan Piket
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSessionType('both')}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      formSessionType === 'both'
                        ? 'border-slate-900 bg-[#DCFCE7] text-emerald-950 font-black shadow-[2px_2px_0px_#1e293b]'
                        : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Malam &amp; Pagi</span>
                    <span className="text-[10px] text-emerald-800 font-semibold">Piket Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSessionType('night')}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      formSessionType === 'night'
                        ? 'border-slate-900 bg-[#EDE9FE] text-purple-950 font-black shadow-[2px_2px_0px_#1e293b]'
                        : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Kegiatan Malam</span>
                    <span className="text-[10px] text-purple-800 font-semibold">Maghrib - Isya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSessionType('morning')}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      formSessionType === 'morning'
                        ? 'border-slate-900 bg-[#FEF08A] text-amber-950 font-black shadow-[2px_2px_0px_#1e293b]'
                        : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Kegiatan Pagi</span>
                    <span className="text-[10px] text-amber-800 font-semibold">Subuh - 06:00</span>
                  </button>
                </div>
              </div>

              {conflictWarning && (
                <div className="p-3 bg-[#FEF3C7] border-2 border-slate-900 rounded-xl text-amber-950 shadow-[2px_2px_0px_#1e293b]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px]">{conflictWarning}</p>
                      <label className="flex items-center gap-2 mt-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowOverride}
                          onChange={(e) => setAllowOverride(e.target.checked)}
                          className="rounded text-amber-800"
                        />
                        <span>Izinkan Jadwal Ganda (Pengecualian / Pergantian Petugas)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {allowOverride && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Alasan Pengecualian / Pergantian Petugas
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Contoh: Menggantikan Ustadzah Aisyah izin dinas"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                    required={allowOverride}
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Catatan / Tugas Khusus
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Piket malam kajian & memimpin doa santri"
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-slate-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (Boolean(conflictWarning) && !allowOverride)}
                  className="neo-btn px-4 py-2 text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] disabled:opacity-50 rounded-xl font-black cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal Piket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
