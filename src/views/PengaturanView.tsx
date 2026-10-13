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
    } catch {
      setTestResult({
        success: false,
        message: 'Koneksi gagal. Pastikan URL dan Anon Key sudah benar.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    alert('Kredensial Supabase disimpan. Silakan muat ulang halaman untuk sinkronisasi.');
    window.location.reload();
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

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="neo-btn px-6 py-2.5 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-900" />
            <span>Simpan Pengaturan Lembaga</span>
          </button>
        </div>
      </form>

      {/* Section 4: Supabase Cloud Database Manager */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-4 text-xs">
        <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h3 className="font-display font-black text-slate-950 text-sm">
              4. Integrasi Backend Cloud Supabase
            </h3>
          </div>
          <span className="neo-badge px-2.5 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950">
            PostgreSQL &amp; RLS
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed font-medium">
          Aplikasi mendukung koneksi langsung ke project Supabase Anda. Seluruh skema database PostgreSQL, Row Level Security (RLS), tabel ustadz, santri, piket, dan absensi sudah tersedia di file <code>/supabase_schema.sql</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Supabase Project URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-mono font-medium bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Supabase Anon Key (Public)</label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 font-mono font-medium bg-white"
            />
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTesting}
              className="neo-btn px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl cursor-pointer"
            >
              {isTesting ? 'Menguji...' : 'Uji Koneksi Supabase'}
            </button>
            <button
              type="button"
              onClick={handleSaveSupabaseConfig}
              className="neo-btn px-3.5 py-2 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 font-black rounded-xl cursor-pointer"
            >
              Simpan Kredensial Supabase
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="neo-btn px-3.5 py-2 text-rose-950 bg-[#FFE4E6] hover:bg-[#FECDD3] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-800" />
            <span>Reset Data Demo Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
