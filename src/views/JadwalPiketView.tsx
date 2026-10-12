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
    handleDateOrUstadzChange(defaultU, defaultD);
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
    try {
      setIsSubmitting(true);
      await addPiketSchedule({
        ustadzId: formUstadzId,
        scheduleDate: formDate,
        sessionType: formSessionType,
        status: formStatus,
        notes: formNotes,
        allowOverride,
        overrideReason: allowOverride ? overrideReason : undefined,
        createdBy: 'admin',
      });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal menyimpan: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    try {
      setIsSubmitting(true);
      await updatePiketSchedule(selectedSchedule.id, {
        ustadzId: formUstadzId,
        scheduleDate: formDate,
        sessionType: formSessionType,
        status: formStatus,
        notes: formNotes,
        overrideReason: allowOverride ? overrideReason : undefined,
      });
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal mengubah jadwal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus jadwal piket untuk ${name}?`)) {
      await deletePiketSchedule(id);
      onRefresh();
    }
  };

  const handleToggleStatus = async (sch: PiketSchedule) => {
    const nextStatus = sch.status === 'sudah_bertugas' ? 'terjadwal' : 'sudah_bertugas';
    await updatePiketSchedule(sch.id, { status: nextStatus });
    onRefresh();
  };

  const handleExportExcel = () => {
    const data = schedules.map((s, idx) => ({
      No: idx + 1,
      Hari: s.dayName,
      Tanggal: s.scheduleDate,
      Nama_Ustadz_Ustadzah: s.ustadzName,
      Sesi_Piket:
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
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Jadwal Piket Ustadz & Ustadzah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penugasan piket untuk Kegiatan Malam (Maghrib - Isya) & Kegiatan Pagi (Subuh - 06:00 WIB)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenReportModal('jadwal_mingguan')}
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
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Piket</span>
          </button>
        </div>
      </div>

      {/* Session Filter Tabs */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSessionFilter('all')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              sessionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Semua Sesi
          </button>
          <button
            onClick={() => setSessionFilter('night')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              sessionFilter === 'night' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Moon className="w-3 h-3 text-purple-600" />
            <span>Kegiatan Malam</span>
          </button>
          <button
            onClick={() => setSessionFilter('morning')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              sessionFilter === 'morning' ? 'bg-white text-orange-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Sun className="w-3 h-3 text-orange-600" />
            <span>Kegiatan Pagi</span>
          </button>
        </div>

        <span className="text-slate-500 font-mono text-[11px]">
          Total {filteredSchedules.length} Jadwal Terjadwal
        </span>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Hari & Tanggal</th>
                <th className="py-3 px-4 font-semibold">Petugas Piket (Ustadz / Ustadzah)</th>
                <th className="py-3 px-4 font-semibold text-center">Sesi Piket</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Keterangan</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((sch) => {
                const isToday = sch.scheduleDate === todayStr;
                const isNight = sch.sessionType === 'night';
                const isMorning = sch.sessionType === 'morning';
                const isBoth = sch.sessionType === 'both' || !sch.sessionType;

                return (
                  <tr
                    key={sch.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isToday ? 'bg-emerald-50/50 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{sch.dayName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{sch.scheduleDate}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                            Hari Ini
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="font-bold text-slate-900 break-words">{sch.ustadzName}</div>
                      <div className="text-[11px] text-slate-400">Pekan: {sch.weekStart}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isNight && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <Moon className="w-3 h-3 text-purple-600" />
                          <span>Malam (Maghrib)</span>
                        </span>
                      )}
                      {isMorning && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                          <Sun className="w-3 h-3 text-orange-600" />
                          <span>Pagi (Subuh)</span>
                        </span>
                      )}
                      {isBoth && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Malam & Pagi</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(sch)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          sch.status === 'sudah_bertugas'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title="Klik untuk ubah status tugas"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sch.status === 'sudah_bertugas' ? 'Sudah Bertugas' : 'Terjadwal'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div className="truncate" title={sch.notes || ''}>{sch.notes || '-'}</div>
                      {sch.overrideReason && (
                        <span className="block text-[10px] text-amber-700 font-semibold truncate" title={sch.overrideReason}>
                          Alasan: {sch.overrideReason}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEdit(sch)}
                        title="Edit Jadwal"
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sch.id, sch.ustadzName || 'Ustadz')}
                        title="Hapus Jadwal"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* Modal Add / Edit Jadwal Piket */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isEditModalOpen ? 'Edit Jadwal Piket' : 'Tetapkan Jadwal Piket Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih petugas Ustadz/Ustadzah dan sesi penugasan (Malam / Pagi)
            </p>

            <form
              onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveAdd}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Ustadz / Ustadzah
                </label>
                <select
                  value={formUstadzId}
                  onChange={(e) => handleDateOrUstadzChange(e.target.value, formDate)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Piket
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => handleDateOrUstadzChange(formUstadzId, e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Hari: {getDayIndoName(formDate)} &middot; Awal Pekan: {getStartOfWeek(formDate)}
                </span>
              </div>

              {/* Sesi Penugasan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Sesi Kegiatan Piket
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSessionType('both')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formSessionType === 'both'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Malam & Pagi</span>
                    <span className="text-[10px] text-slate-400">Piket Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSessionType('night')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formSessionType === 'night'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Kegiatan Malam</span>
                    <span className="text-[10px] text-purple-600">Maghrib - Isya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSessionType('morning')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formSessionType === 'morning'
                        ? 'border-orange-600 bg-orange-50 text-orange-900 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Kegiatan Pagi</span>
                    <span className="text-[10px] text-orange-600">Subuh - 06:00</span>
                  </button>
                </div>
              </div>

              {conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px]">{conflictWarning}</p>
                      <label className="flex items-center gap-2 mt-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowOverride}
                          onChange={(e) => setAllowOverride(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Izinkan Jadwal Ganda (Pengecualian / Pergantian Petugas)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {allowOverride && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alasan Pengecualian / Pergantian Petugas
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Contoh: Menggantikan Ustadzah Aisyah izin dinas"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
                    required={allowOverride}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Tugas Khusus
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Piket malam kajian & memimpin doa santri"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (Boolean(conflictWarning) && !allowOverride)}
                  className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-bold shadow-xs"
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
