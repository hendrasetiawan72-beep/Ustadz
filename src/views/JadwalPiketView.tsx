import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { Ustadz, PiketSchedule, UserRole, AppSettings } from '../types';
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
  userRole: UserRole;
  settings: AppSettings;
  onRefresh: () => void;
  onOpenReportModal: (type: 'jadwal_mingguan' | 'jadwal_bulanan') => void;
}

export const JadwalPiketView: React.FC<JadwalPiketViewProps> = ({
  schedules,
  ustadzList,
  userRole,
  settings,
  onRefresh,
  onOpenReportModal,
}) => {
  const [viewMode, setViewMode] = useState<'mingguan' | 'bulanan' | 'daftar'>('mingguan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PiketSchedule | null>(null);

  // Form State
  const [formUstadzId, setFormUstadzId] = useState(ustadzList[0]?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<PiketSchedule['status']>('terjadwal');
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Realization Modal State
  const [isRealizationModalOpen, setIsRealizationModalOpen] = useState(false);
  const [realizationCheckIn, setRealizationCheckIn] = useState('17:45');
  const [realizationCheckOut, setRealizationCheckOut] = useState('06:00');
  const [realizationNotes, setRealizationNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Check conflicts dynamically when form date or ustadz changes
  const handleDateOrUstadzChange = async (uId: string, dStr: string, excludeId?: string) => {
    setFormUstadzId(uId);
    setFormDate(dStr);
    const result = await checkWeeklyDutyConflict(uId, dStr, excludeId);
    if (result.hasConflict) {
      setConflictWarning(
        `Perhatian: Ustadz ini sudah memiliki jadwal piket pada tanggal ${result.existingDate} di minggu yang sama! Aturan baku Ponpes: 1 Ustadz piket 1 kali per minggu.`
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
        status: formStatus,
        notes: formNotes,
        allowOverride,
        overrideReason: allowOverride ? overrideReason : undefined,
        createdBy: userRole,
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

  const handleOpenRealization = (sch: PiketSchedule) => {
    setSelectedSchedule(sch);
    setRealizationNotes(sch.notes || '');
    setIsRealizationModalOpen(true);
  };

  const handleSaveRealization = async () => {
    if (!selectedSchedule) return;
    try {
      await updatePiketSchedule(selectedSchedule.id, {
        status: 'sudah_bertugas',
        notes: `${selectedSchedule.notes || ''} [Tugas terlaksana: Masuk ${realizationCheckIn} - Selesai ${realizationCheckOut}. ${realizationNotes}]`.trim(),
      });
      setIsRealizationModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat realisasi');
    }
  };

  const handleExportExcel = () => {
    const data = schedules.map((s, idx) => ({
      No: idx + 1,
      Hari: s.dayName,
      Tanggal: s.scheduleDate,
      Nama_Ustadz: s.ustadzName,
      Status: s.status,
      Catatan: s.notes || '-',
      Alasan_Pengecualian: s.overrideReason || '-',
    }));
    exportDataToExcel(data, `Jadwal_Piket_Ponpes_Baitul_Arqom_${todayStr}`);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Jadwal Piket Ustadz
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan jadwal 1 Ustadz 1 kali per minggu &middot; Realisasi dan verifikasi kehadiran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('mingguan')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                viewMode === 'mingguan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setViewMode('daftar')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                viewMode === 'daftar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Semua Jadwal
            </button>
          </div>

          <button
            onClick={() => onOpenReportModal('jadwal_mingguan')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Rules Banner */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Ketentuan Piket Pesantren:</span> Setiap Ustadz mendapatkan giliran piket 1 (satu) kali dalam sepekan (Senin s.d. Ahad). Sistem secara otomatis memvalidasi jadwal ganda. Realisasi piket dibuktikan dengan pengisian kegiatan malam (Maghrib-Isya) dan pagi (Subuh).
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            {viewMode === 'mingguan' ? 'Daftar Piket Pekan Berjalan' : 'Seluruh Arsip Jadwal'}
          </h3>
          <span className="text-xs text-slate-500">
            Total {schedules.length} Jadwal Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Hari & Tanggal</th>
                <th className="py-3 px-4 font-semibold">Nama Ustadz Bertugas</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Keterangan / Pengecualian</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((sch) => {
                const isToday = sch.scheduleDate === todayStr;
                return (
                  <tr
                    key={sch.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isToday ? 'bg-emerald-50/40 font-medium' : ''
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

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sch.ustadzName}</div>
                      <div className="text-[11px] text-slate-400">Pekan: {sch.weekStart}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          sch.status === 'sudah_bertugas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sch.status === 'terjadwal'
                            ? 'bg-blue-100 text-blue-800'
                            : sch.status === 'izin_diganti'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sch.status === 'sudah_bertugas'
                          ? 'Sudah Bertugas'
                          : sch.status === 'terjadwal'
                          ? 'Terjadwal'
                          : sch.status === 'izin_diganti'
                          ? 'Izin / Diganti'
                          : 'Belum Bertugas'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {sch.notes || '-'}
                      {sch.overrideReason && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Alasan: {sch.overrideReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      {/* Button Realisasi */}
                      <button
                        onClick={() => handleOpenRealization(sch)}
                        title="Catat Realisasi Tugas"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Realisasi</span>
                      </button>

                      {userRole === 'admin' && (
                        <>
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
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Jadwal Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tetapkan Jadwal Piket Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aturan: 1 Ustadz mendapatkan 1 jadwal dalam sepekan.
            </p>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Ustadz
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
                    placeholder="Contoh: Menggantikan Ustadz Fauzan yang sedang sakit"
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
                  placeholder="Contoh: Piket malam & memimpin dzikir bakda Maghrib"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
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
                  disabled={isSubmitting || (Boolean(conflictWarning) && !allowOverride)}
                  className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-bold shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Realisasi Piket */}
      {isRealizationModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Catat Realisasi Piket
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedSchedule.ustadzName} &middot; {selectedSchedule.dayName}, {selectedSchedule.scheduleDate}
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai Tugas</label>
                  <input
                    type="time"
                    value={realizationCheckIn}
                    onChange={(e) => setRealizationCheckIn(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai Tugas</label>
                  <input
                    type="time"
                    value={realizationCheckOut}
                    onChange={(e) => setRealizationCheckOut(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Realisasi / Laporan Ringkas</label>
                <textarea
                  rows={3}
                  value={realizationNotes}
                  onChange={(e) => setRealizationNotes(e.target.value)}
                  placeholder="Seluruh kegiatan malam dan pagi berjalan tertib. Tidak ada pelanggaran berat."
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRealizationModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRealization}
                  className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-xs"
                >
                  Verifikasi Realisasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
