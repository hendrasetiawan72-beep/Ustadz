import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserProfile, AppSettings } from '../types';
import { DEFAULT_ADMIN, OFFICIAL_LOGO_URL } from '../lib/constants';
import { getSupabaseClient } from '../lib/supabase';

interface LoginFormProps {
  settings: AppSettings;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ settings, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan isi email dan kata sandi terlebih dahulu.');
      return;
    }

    setIsLoading(true);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setErrorMessage(error.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
          setIsLoading(false);
          return;
        }

        let role: UserProfile['role'] = 'admin';
        let fullName = 'Administrator Pesantren';

        if (data.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', data.user.id)
              .single();

            if (profile) {
              role = (profile.role as UserProfile['role']) || 'admin';
              fullName = profile.full_name || fullName;
            }
          } catch {
            // fallback
          }
        }

        const authenticatedUser: UserProfile = {
          id: data.user?.id || 'user-admin',
          email: data.user?.email || email.trim(),
          fullName,
          role,
          isActive: true,
        };
        localStorage.setItem('ponpes_auth_user', JSON.stringify(authenticatedUser));
        onLoginSuccess(authenticatedUser);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Terjadi kesalahan: ${msg}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Fallback mode jika Supabase belum dikonfigurasi
    setTimeout(() => {
      const adminUser: UserProfile = {
        ...DEFAULT_ADMIN,
        email: email.trim(),
        fullName: 'Administrator Pesantren',
        role: 'admin',
      };
      localStorage.setItem('ponpes_auth_user', JSON.stringify(adminUser));
      onLoginSuccess(adminUser);
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative vintage postmodern pastel shapes */}
      <div className="absolute top-10 left-10 w-36 h-36 rounded-full bg-rose-200/40 blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-44 h-44 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 right-12 w-28 h-28 rounded-full bg-amber-200/40 blur-xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card with Neobrutalist Rounded Postmodern Pastel Aesthetic */}
        <div className="bg-[#FFFDF9] rounded-[2rem] border-2 border-slate-900 shadow-[6px_6px_0px_#1e293b] overflow-hidden">
          {/* Top Vintage Pastel Header Bar */}
          <div className="bg-[#FEF9C3] border-b-2 border-slate-900 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 border border-slate-900" />
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-slate-900" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
              <span>Portal Admin Pesantren</span>
            </div>
          </div>

          {/* Institutional Emblem & Title Section */}
          <div className="p-7 pb-5 text-center bg-white border-b-2 border-slate-900/10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#DCFCE7] border-2 border-slate-900 p-2 flex items-center justify-center mb-4 shadow-[3px_3px_0px_#1e293b]">
              <img
                src={settings.logoUrl || OFFICIAL_LOGO_URL}
                alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="neo-badge px-3.5 py-1 text-[11px] font-bold bg-[#E0F2FE] text-sky-950 uppercase tracking-wider inline-block mb-2">
              Absensi Piket Harian
            </span>

            <h1 className="font-display text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
              {settings.institutionName || 'PONPES BAITUL ARQOM SMK MUHIBA'}
            </h1>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mt-0.5">
              {settings.subTitle || 'SMK MUHAMMADIYAH BAWANG'}
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">
              Kegiatan Malam (Maghrib - Isya) &amp; Kegiatan Pagi (Subuh - 06.00)
            </p>
          </div>

          {/* Form Body: Simple Email & Password */}
          <div className="p-7 pt-6 bg-[#FFFDF9]">
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-100 border-2 border-slate-900 text-rose-950 rounded-xl text-xs flex items-center gap-2 shadow-[2px_2px_0px_#1e293b] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Field */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.sch.id"
                    className="w-full pl-10 pr-3.5 py-2.5 border-2 border-slate-900 rounded-xl bg-white focus:outline-none focus:bg-[#FFFDF0] text-slate-900 text-xs font-medium shadow-[2px_2px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-900 rounded-xl bg-white focus:outline-none focus:bg-[#FFFDF0] text-slate-900 text-xs font-medium shadow-[2px_2px_0px_rgba(30,41,59,0.1)] focus:shadow-[2px_2px_0px_#1e293b] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-600 hover:text-slate-900 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="neo-btn w-full mt-3 py-3 bg-[#BBF7D0] hover:bg-[#86EFAC] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-slate-900" />
                    <span>Masuk Portal Absensi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Vintage Postmodern Footer stamp */}
        <div className="text-center mt-4 text-[11px] font-semibold text-slate-500">
          Ponpes Baitul Arqom &middot; SMK Muhammadiyah Bawang
        </div>
      </div>
    </div>
  );
};
