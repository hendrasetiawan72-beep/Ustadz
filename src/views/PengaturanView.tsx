import React, { useState } from 'react';
import {
  Settings,
  Save,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Upload,
  Copy,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Repeat,
  Sparkles,
  CalendarDays,
  FileCheck,
} from 'lucide-react';
import { AppSettings, UserRole, Ustadz, RecurringScheduleItem } from '../types';
import { updateAppSettings, resetToInitialData, generateRecurringPiketSchedules } from '../lib/db';
import {
  getSupabaseCredentials,
  isSupabaseConfigured,
  testSupabaseConnection,
} from '../lib/supabase';
import { OFFICIAL_LOGO_URL, DEFAULT_RECURRING_TEMPLATE, INITIAL_USTADZ } from '../lib/constants';

interface PengaturanViewProps {
  settings: AppSettings;
  userRole: UserRole;
  onRefresh: () => void;
  ustadzList?: Ustadz[];
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  userRole,
  onRefresh,
  ustadzList = [],
}) => {
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Recurring schedule template state
  const [recurringList, setRecurringList] = useState<RecurringScheduleItem[]>(() => {
    return formSettings.recurringTemplate && formSettings.recurringTemplate.length > 0
      ? formSettings.recurringTemplate
      : DEFAULT_RECURRING_TEMPLATE;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  const ustadzOptions = ustadzList.length > 0 ? ustadzList : INITIAL_USTADZ;

  // Supabase connection config from environment variables
  const creds = getSupabaseCredentials();
  const isCloudConfigured = isSupabaseConfigured();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const previewTitimangsa = () => {
    const city = (formSettings.documentCity || 'Bawang').trim();
    let dateStr = '';
    if (formSettings.documentDateMode === 'manual' && formSettings.manualDocumentDate) {
      try {
        const d = new Date(formSettings.manualDocumentDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        } else {
          dateStr = formSettings.manualDocumentDate;
        }
      } catch {
        dateStr = formSettings.manualDocumentDate;
      }
    } else {
      dateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return `${city}, ${dateStr}`;
  };

  const handleDayItemChange = (dayIndex: number, field: keyof RecurringScheduleItem, val: unknown) => {
    setRecurringList((prev) => {
      const updated = [...prev];
      const item = { ...updated[dayIndex], [field]: val };
      if (field === 'ustadzId') {
        const found = ustadzOptions.find((u) => u.id === val);
        item.ustadzName = found?.fullName || '';
      }
      updated[dayIndex] = item;
      return updated;
    });
  };

  const handleGenerateFromSettings = async (period: 'this_month' | 'next_month') => {
    try {
      setIsGenerating(true);
      setGenerateResult(null);

      const now = new Date();
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth();

      if (period === 'next_month') {
        targetMonth += 1;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear += 1;
        }
      }

      const firstDate = new Date(targetYear, targetMonth, 1);
      const lastDate = new Date(targetYear, targetMonth + 1, 0);

      const startDate = firstDate.toISOString().split('T')[0];
      const endDate = lastDate.toISOString().split('T')[0];

      // Save template to settings too
      await updateAppSettings({
        ...formSettings,
        recurringTemplate: recurringList,
      });

      const res = await generateRecurringPiketSchedules({
        startDate,
        endDate,
        template: recurringList,
        overwriteExisting: false,
      });

      const monthName = firstDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      setGenerateResult(
        `Berhasil! Jadwal berulang ${monthName} telah dibuat: ${res.totalCreated} jadwal baru ditambahkan, ${res.totalUpdated} diperbarui, ${res.totalSkipped} jadwal yang sudah ada dilewati.`
      );
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal generate jadwal berulang: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: AppSettings = {
        ...formSettings,
        recurringTemplate: recurringList,
      };
      await updateAppSettings(payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan.');
    }
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: 'Koneksi gagal. Periksa kembali env VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDemoData = () => {
    if (
      confirm(
        'Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi awal (demo data)? Semua data baru yang belum tersinkronisasi ke cloud akan hilang.'
      )
    ) {
      resetToInitialData();
      alert('Data berhasil di-reset.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#FEF08A] text-amber-950 uppercase tracking-wider inline-flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-amber-800" />
              Konfigurasi Sistem
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Pengaturan Lembaga &amp; Sistem
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Konfigurasi identitas pesantren, kop surat resmi, jadwal operasional, dan integrasi database Supabase
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3.5 bg-[#DCFCE7] border-2 border-slate-900 rounded-xl flex items-center gap-2 text-emerald-950 text-xs font-bold shadow-[2px_2px_0px_#1e293b]">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Pengaturan lembaga berhasil disimpan dan langsung diterapkan ke seluruh dokumen PDF!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Identitas Lembaga & Logo */}
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
          <h3 className="font-display font-black text-slate-950 text-sm border-b-2 border-slate-900/10 pb-2">
            1. Identitas Resmi Lembaga &amp; Kop Surat
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                Nama Resmi Lembaga (Tampil di Kop Surat &amp; PDF)
              </label>
              <input
                type="text"
                value={formSettings.institutionName}
                onChange={(e) => setFormSettings({ ...formSettings, institutionName: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-display font-black text-slate-950 bg-white shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                Sub-Judul / Keterangan Lembaga
              </label>
              <input
                type="text"
                value={formSettings.subTitle}
                onChange={(e) => setFormSettings({ ...formSettings, subTitle: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Logo Resmi Pesantren &amp; Sekolah
                </label>
                <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#DCFCE7] text-emerald-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                  Terkunci di Seluruh Aplikasi
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={OFFICIAL_LOGO_URL}
                  readOnly
                  disabled
                  className="flex-1 bg-[#FAF7F2] border-2 border-slate-900 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-600 cursor-not-allowed select-all"
                />
              </div>

              {/* Logo Preview */}
              <div className="mt-3 flex items-center gap-4 p-3.5 bg-[#FAF7F2] rounded-2xl border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#1e293b]">
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-[1.5px_1.5px_0px_#1e293b]">
                  <img
                    src={OFFICIAL_LOGO_URL}
                    alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-display font-black text-slate-950 block text-xs">
                    Logo Resmi Terkunci (SMK Muhammadiyah Bawang)
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                    Logo ini terkunci aktif secara serentak di header, sidebar, login, kop surat dinas, dan ekspor cetak PDF.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Alamat Lembaga</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Email Resmi</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Website</label>
              <input
                type="text"
                value={formSettings.website}
                onChange={(e) => setFormSettings({ ...formSettings, website: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Jadwal Operasional & Sesi */}
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
          <h3 className="font-display font-black text-slate-950 text-sm border-b-2 border-slate-900/10 pb-2">
            2. Jam Operasional Sesi Kegiatan Pesantren
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning */}
            <div className="p-4 bg-[#FEFCE8] border-2 border-slate-900 rounded-2xl space-y-3 shadow-[2.5px_2.5px_0px_#1e293b]">
              <span className="font-display font-black text-amber-950 block text-xs">
                Sesi Pagi (Subuh sampai Pukul 06.00 WIB)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Jam Mulai</label>
                  <input
                    type="time"
                    value={formSettings.morningSessionStart}
                    onChange={(e) => setFormSettings({ ...formSettings, morningSessionStart: e.target.value })}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Jam Selesai</label>
                  <input
                    type="time"
                    value={formSettings.morningSessionEnd}
                    onChange={(e) => setFormSettings({ ...formSettings, morningSessionEnd: e.target.value })}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 font-mono font-bold bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Nama Kegiatan Standar</label>
                <input
                  type="text"
                  value={formSettings.morningSessionDefaultTitle}
                  onChange={(e) => setFormSettings({ ...formSettings, morningSessionDefaultTitle: e.target.value })}
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 bg-white font-medium"
                />
              </div>
            </div>

            {/* Night */}
            <div className="p-4 bg-[#FAF5FF] border-2 border-slate-900 rounded-2xl space-y-3 shadow-[2.5px_2.5px_0px_#1e293b]">
              <span className="font-display font-black text-purple-950 block text-xs">
                Sesi Malam (Maghrib sampai Isya)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Jam Mulai</label>
                  <input
                    type="time"
                    value={formSettings.nightSessionStart}
                    onChange={(e) => setFormSettings({ ...formSettings, nightSessionStart: e.target.value })}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Jam Selesai</label>
                  <input
                    type="time"
                    value={formSettings.nightSessionEnd}
                    onChange={(e) => setFormSettings({ ...formSettings, nightSessionEnd: e.target.value })}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 font-mono font-bold bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Nama Kegiatan Standar</label>
                <input
                  type="text"
                  value={formSettings.nightSessionDefaultTitle}
                  onChange={(e) => setFormSettings({ ...formSettings, nightSessionDefaultTitle: e.target.value })}
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-1.5 bg-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pejabat Penandatangan Laporan PDF */}
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
          <h3 className="font-display font-black text-slate-950 text-sm border-b-2 border-slate-900/10 pb-2">
            3. Pejabat Penandatangan Dokumen Resmi &amp; Laporan PDF
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Nama Pimpinan Ponpes</label>
              <input
                type="text"
                value={formSettings.leaderName}
                onChange={(e) => setFormSettings({ ...formSettings, leaderName: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-bold bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">NIP Pimpinan Ponpes</label>
              <input
                type="text"
                value={formSettings.leaderNip}
                onChange={(e) => setFormSettings({ ...formSettings, leaderNip: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-mono font-bold bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Nama Koordinator Piket</label>
              <input
                type="text"
                value={formSettings.dutySupervisorName}
                onChange={(e) => setFormSettings({ ...formSettings, dutySupervisorName: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-bold bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">NIP Koordinator Piket</label>
              <input
                type="text"
                value={formSettings.dutySupervisorNip}
                onChange={(e) => setFormSettings({ ...formSettings, dutySupervisorNip: e.target.value })}
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-mono font-bold bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Tempat & Tanggal Dokumen Siap Cetak (Tanda Tangan & Titimangsa) */}
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-800" />
              <h3 className="font-display font-black text-slate-950 text-sm">
                4. Tempat &amp; Tanggal Dokumen Siap Cetak (Tanda Tangan &amp; Titimangsa)
              </h3>
            </div>
            <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950">
              <Calendar className="w-3 h-3 text-sky-700" />
              Tanda Tangan Resmi
            </span>
          </div>

          <p className="text-slate-600 font-medium leading-relaxed">
            Atur tempat/kota serta tanggal penandatanganan dokumen yang tercantum di atas tanda tangan resmi Pimpinan Pondok Pesantren pada seluruh 12 berkas PDF dan lembar cetak formal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Input Tempat / Kota */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>Tempat / Kota Dokumen</span>
              </label>
              <input
                type="text"
                value={formSettings.documentCity || ''}
                onChange={(e) => setFormSettings({ ...formSettings, documentCity: e.target.value })}
                placeholder="Contoh: Bawang atau Bawang, Batang"
                className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Kota/kecamatan yang tertera pada titimangsa surat resmi (misal: "Bawang, 16 Oktober 2026").
              </p>
            </div>

            {/* Mode Tanggal Dokumen */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Mode Penentuan Tanggal Dokumen</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormSettings({ ...formSettings, documentDateMode: 'auto' })}
                  className={`p-2.5 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    (formSettings.documentDateMode || 'auto') === 'auto'
                      ? 'border-slate-900 bg-[#DCFCE7] text-emerald-950 shadow-[2px_2px_0px_#1e293b]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span className="block text-xs font-black">Otomatis Hari Ini</span>
                  <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                    Mengikuti tanggal real-time saat dokumen dicetak.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormSettings({ ...formSettings, documentDateMode: 'manual' })}
                  className={`p-2.5 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    formSettings.documentDateMode === 'manual'
                      ? 'border-slate-900 bg-[#FEF08A] text-amber-950 shadow-[2px_2px_0px_#1e293b]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span className="block text-xs font-black">Edit Tanggal Manual</span>
                  <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                    Tentukan tanggal khusus / tutup buku / mundur.
                  </span>
                </button>
              </div>
            </div>

            {/* Manual Date Input Picker (shown when manual mode selected) */}
            {formSettings.documentDateMode === 'manual' && (
              <div className="md:col-span-2 p-4 bg-[#FFFBEB] border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#1e293b] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-amber-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-700" />
                    <span>Pilih Tanggal Manual Dokumen:</span>
                  </label>
                  <span className="text-[11px] font-mono text-amber-900 font-bold">
                    Mode Tanggal Khusus Aktif
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      value={formSettings.manualDocumentDate || ''}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, manualDocumentDate: e.target.value })
                      }
                      className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                    />
                  </div>
                  <div className="flex items-center text-xs text-amber-950 bg-white/70 border border-slate-900/20 px-3 py-2 rounded-xl font-medium">
                    <span>Terbaca di dokumen:&nbsp;</span>
                    <strong className="font-bold text-slate-900">
                      {previewTitimangsa().split(',')[1]?.trim() || '-'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Live Titimangsa Preview Badge */}
            <div className="md:col-span-2 p-4 bg-[#FAF7F2] border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#1e293b]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-display font-black text-slate-950 text-xs flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Pratinjau Titimangsa Tanda Tangan Dokumen</span>
                </span>
                <span className="neo-badge px-2.5 py-0.5 text-[9px] font-black bg-[#BBF7D0] text-emerald-950 uppercase">
                  Tampil di Seluruh PDF
                </span>
              </div>
              <div className="bg-white border border-slate-900/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Teks Titimangsa yang Tercetak:</p>
                  <p className="font-display text-base font-black text-slate-950 mt-0.5">
                    {previewTitimangsa()}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <p className="font-bold text-slate-800">Pimpinan Pondok Pesantren</p>
                  <p className="underline font-bold text-slate-900">{formSettings.leaderName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP: {formSettings.leaderNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Pola Jadwal Berulang Mingguan */}
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-purple-700" />
              <h3 className="font-display font-black text-slate-950 text-sm">
                5. Pola Jadwal Piket Berulang Mingguan (Tanpa Input Manual Berulang)
              </h3>
            </div>
            <span className="neo-badge inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-[#EDE9FE] text-purple-950">
              <Sparkles className="w-3 h-3 text-purple-700" />
              Generator Otomatis
            </span>
          </div>

          <p className="text-slate-600 font-medium leading-relaxed">
            Atur petugas Ustadz/Ustadzah piket tetap untuk setiap hari dalam sepekan (Senin s/d Ahad). Jadwal harian sebulan penuh dapat langsung di-generate otomatis dalam satu klik tanpa perlu menginput manual setiap hari!
          </p>

          {generateResult && (
            <div className="p-3.5 bg-[#DCFCE7] border-2 border-slate-900 rounded-xl flex items-center gap-2 text-emerald-950 text-xs font-bold shadow-[2px_2px_0px_#1e293b]">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{generateResult}</span>
            </div>
          )}

          {/* Table of 7 Days */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden bg-white shadow-[2.5px_2.5px_0px_#1e293b]">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b-2 border-slate-900/20 text-slate-900 font-black">
                    <th className="p-3 w-28">Hari</th>
                    <th className="p-3 w-24 text-center">Status</th>
                    <th className="p-3">Petugas Piket Tetap</th>
                    <th className="p-3 w-48">Sesi Piket</th>
                    <th className="p-3">Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recurringList.map((item, idx) => (
                    <tr key={item.dayOfWeek} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-display font-black text-slate-950">
                        <span className="inline-block px-2.5 py-1 bg-[#FEF9C3] rounded-lg border border-slate-900 text-xs shadow-2xs">
                          {item.dayName}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.isEnabled}
                          onChange={(e) => handleDayItemChange(idx, 'isEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.ustadzId}
                          onChange={(e) => handleDayItemChange(idx, 'ustadzId', e.target.value)}
                          disabled={!item.isEnabled}
                          className="w-full border-2 border-slate-900 rounded-lg px-2.5 py-1.5 font-bold bg-white text-slate-900 disabled:opacity-40 disabled:bg-slate-100 text-xs outline-none"
                        >
                          <option value="">-- Pilih Ustadz/Ustadzah --</option>
                          {ustadzOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} {u.gender === 'P' ? '(Ustadzah)' : '(Ustadz)'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={item.sessionType}
                          onChange={(e) => handleDayItemChange(idx, 'sessionType', e.target.value)}
                          disabled={!item.isEnabled}
                          className="w-full border-2 border-slate-900 rounded-lg px-2.5 py-1.5 font-bold bg-white text-slate-900 disabled:opacity-40 disabled:bg-slate-100 text-xs outline-none"
                        >
                          <option value="both">Malam &amp; Pagi (Lengkap)</option>
                          <option value="night">Malam (Maghrib - Isya)</option>
                          <option value="morning">Pagi (Subuh - 06.00)</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleDayItemChange(idx, 'notes', e.target.value)}
                          disabled={!item.isEnabled}
                          placeholder="Catatan piket..."
                          className="w-full border border-slate-300 focus:border-slate-900 rounded-lg px-2 py-1.5 bg-white text-slate-800 disabled:opacity-40 text-xs outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick 1-Click Generation Action Bar */}
          <div className="p-4 bg-[#FAF5FF] border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="font-display font-black text-purple-950 text-xs">
                Generate Jadwal Otomatis Berdasarkan Pola di Atas
              </p>
              <p className="text-[11px] text-purple-900/80 font-medium mt-0.5">
                Sistem akan membuat seluruh jadwal harian sebulan penuh. Jadwal yang sudah ada tidak akan terhapus.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateFromSettings('this_month')}
                disabled={isGenerating}
                className="neo-btn px-3.5 py-2 text-xs font-bold text-purple-950 bg-[#DDD6FE] hover:bg-[#C4B5FD] disabled:opacity-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-purple-800" />
                <span>{isGenerating ? 'Memproses...' : 'Generate Bulan Ini'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateFromSettings('next_month')}
                disabled={isGenerating}
                className="neo-btn px-3.5 py-2 text-xs font-black text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] disabled:opacity-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                <span>{isGenerating ? 'Memproses...' : 'Generate Bulan Depan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="neo-btn px-6 py-2.5 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-900" />
            <span>Simpan Seluruh Pengaturan Lembaga</span>
          </button>
        </div>
      </form>

      {/* Section 6: Supabase Cloud Database Status (Env-Only) */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
        <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h3 className="font-display font-black text-slate-950 text-sm">
              6. Status Integrasi Cloud Supabase (Environment Variables)
            </h3>
          </div>
          <span
            className={`neo-badge px-2.5 py-0.5 text-[10px] font-black ${
              isCloudConfigured
                ? 'bg-[#DCFCE7] text-emerald-950'
                : 'bg-[#FEF08A] text-amber-950'
            }`}
          >
            {isCloudConfigured ? 'Cloud Supabase Terhubung' : 'MODE DEMO AKTIF'}
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed font-medium">
          Demi keamanan data privasi santri dan ustadz, kredensial Supabase dikonfigurasi secara ketat melalui variabel lingkungan (<code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>) serta tidak pernah disimpan di localStorage browser. Kunci hak akses tingkat tinggi (<em>service_role</em>) tidak pernah digunakan di frontend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-600 text-[10px] uppercase tracking-wider block">
              VITE_SUPABASE_URL (Environment)
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs truncate block">
              {creds.url ? `${creds.url.slice(0, 24)}...` : '(Belum diatur di environment)'}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-600 text-[10px] uppercase tracking-wider block">
              VITE_SUPABASE_ANON_KEY (Public Key)
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs truncate block">
              {creds.anonKey ? `${creds.anonKey.slice(0, 16)}...` : '(Belum diatur di environment)'}
            </span>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border-2 border-slate-900 flex items-start gap-2 shadow-[2px_2px_0px_#1e293b] font-bold ${
              testResult.success
                ? 'bg-[#DCFCE7] text-emerald-950'
                : 'bg-[#FFE4E6] text-rose-950'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestSupabase}
            disabled={isTesting}
            className="neo-btn px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl cursor-pointer flex items-center gap-2"
          >
            <Database className="w-3.5 h-3.5 text-slate-700" />
            <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase Cloud'}</span>
          </button>

          {!isCloudConfigured && (
            <button
              type="button"
              onClick={handleResetDemoData}
              className="neo-btn px-3.5 py-2 text-rose-950 bg-[#FFE4E6] hover:bg-[#FECDD3] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-800" />
              <span>Reset Data Demo Awal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
