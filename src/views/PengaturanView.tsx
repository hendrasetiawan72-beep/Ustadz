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
} from 'lucide-react';
import { AppSettings, UserRole } from '../types';
import { updateAppSettings, resetToInitialData } from '../lib/db';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabase';
import { OFFICIAL_LOGO_URL } from '../lib/constants';

interface PengaturanViewProps {
  settings: AppSettings;
  userRole: UserRole;
  onRefresh: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  userRole,
  onRefresh,
}) => {
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Supabase connection config
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAppSettings(formSettings);
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
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);
      if (res.success) {
        saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    alert('Kredensial Supabase berhasil disimpan! Muat ulang aplikasi untuk mengaktifkan koneksi database.');
    window.location.reload();
  };

  const handleResetLogo = () => {
    setFormSettings((prev) => ({
      ...prev,
      logoUrl: OFFICIAL_LOGO_URL,
    }));
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

  const handleCopySqlScript = () => {
    const sqlText = `-- Salin file /supabase_schema.sql di root project aplikasi`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Pengaturan Lembaga & Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas pesantren, kop surat resmi, jadwal operasional, dan integrasi database Supabase
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan lembaga berhasil disimpan dan langsung diterapkan ke seluruh dokumen PDF!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Identitas Lembaga & Logo */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            1. Identitas Resmi Lembaga & Kop Surat
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Resmi Lembaga (Tampil di Kop Surat & PDF)
              </label>
              <input
                type="text"
                value={formSettings.institutionName}
                onChange={(e) => setFormSettings({ ...formSettings, institutionName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Sub-Judul / Keterangan Lembaga
              </label>
              <input
                type="text"
                value={formSettings.subTitle}
                onChange={(e) => setFormSettings({ ...formSettings, subTitle: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">
                  Logo Resmi Pesantren & Sekolah
                </label>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Terkunci di Seluruh Aplikasi
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={OFFICIAL_LOGO_URL}
                  readOnly
                  disabled
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-500 cursor-not-allowed select-all"
                />
              </div>

              {/* Logo Preview */}
              <div className="mt-3 flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-emerald-200/60 shadow-2xs">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={OFFICIAL_LOGO_URL}
                    alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Logo Resmi Terkunci (SMK Muhammadiyah Bawang)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Logo ini terkunci aktif secara serentak di bilah atas (header), bilah navigasi samping, halaman login, kop surat dinas, pratinjau, dan ekspor cetak PDF.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lembaga</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={formSettings.website}
                onChange={(e) => setFormSettings({ ...formSettings, website: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Jadwal Operasional & Sesi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            2. Jam Operasional Sesi Kegiatan Pesantren
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning */}
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
              <span className="font-bold text-orange-900 block text-xs">
                🌅 Sesi Pagi (Subuh sampai Pukul 06.00 WIB)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formSettings.morningSessionStart}
                    onChange={(e) => setFormSettings({ ...formSettings, morningSessionStart: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formSettings.morningSessionEnd}
                    onChange={(e) => setFormSettings({ ...formSettings, morningSessionEnd: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 font-mono bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nama Kegiatan Standar</label>
                <input
                  type="text"
                  value={formSettings.morningSessionDefaultTitle}
                  onChange={(e) => setFormSettings({ ...formSettings, morningSessionDefaultTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-white"
                />
              </div>
            </div>

            {/* Night */}
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
              <span className="font-bold text-purple-900 block text-xs">
                🌙 Sesi Malam (Maghrib sampai Isya)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formSettings.nightSessionStart}
                    onChange={(e) => setFormSettings({ ...formSettings, nightSessionStart: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formSettings.nightSessionEnd}
                    onChange={(e) => setFormSettings({ ...formSettings, nightSessionEnd: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 font-mono bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nama Kegiatan Standar</label>
                <input
                  type="text"
                  value={formSettings.nightSessionDefaultTitle}
                  onChange={(e) => setFormSettings({ ...formSettings, nightSessionDefaultTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pejabat Penandatangan Laporan PDF */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            3. Pejabat Penandatangan Dokumen Resmi & Laporan PDF
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Pimpinan Ponpes</label>
              <input
                type="text"
                value={formSettings.leaderName}
                onChange={(e) => setFormSettings({ ...formSettings, leaderName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Pimpinan Ponpes</label>
              <input
                type="text"
                value={formSettings.leaderNip}
                onChange={(e) => setFormSettings({ ...formSettings, leaderNip: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Koordinator Piket</label>
              <input
                type="text"
                value={formSettings.dutySupervisorName}
                onChange={(e) => setFormSettings({ ...formSettings, dutySupervisorName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Koordinator Piket</label>
              <input
                type="text"
                value={formSettings.dutySupervisorNip}
                onChange={(e) => setFormSettings({ ...formSettings, dutySupervisorNip: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Lembaga</span>
          </button>
        </div>
      </form>

      {/* Section 4: Supabase Cloud Database Manager */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              4. Integrasi Backend Cloud Supabase
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            PostgreSQL & RLS
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Aplikasi mendukung koneksi langsung ke project Supabase Anda. Seluruh skema database PostgreSQL, Row Level Security (RLS), tabel ustadz, santri, piket, dan absensi sudah tersedia di file <code>/supabase_schema.sql</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supabase Project URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supabase Anon Key (Public)</label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTesting}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              {isTesting ? 'Menguji...' : 'Uji Koneksi Supabase'}
            </button>
            <button
              type="button"
              onClick={handleSaveSupabaseConfig}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              Simpan Kredensial Supabase
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Demo Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
