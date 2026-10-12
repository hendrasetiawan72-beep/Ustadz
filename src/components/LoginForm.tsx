import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile, AppSettings } from '../types';
import { DEFAULT_ADMIN } from '../lib/constants';

interface LoginFormProps {
  settings: AppSettings;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ settings, onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@smkmuhiba.sch.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Simple validation: accepts default credentials, user's email, or any valid email with password min 4 chars
    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMessage('Masukkan alamat email yang valid.');
        setIsLoading(false);
        return;
      }

      if (!password || password.length < 4) {
        setErrorMessage('Password minimal 4 karakter.');
        setIsLoading(false);
        return;
      }

      const user: UserProfile = {
        ...DEFAULT_ADMIN,
        email: cleanEmail,
        fullName: cleanEmail.includes('hendra') ? 'Hendra Setiawan (Admin)' : 'Administrator Ponpes Baitul Arqom',
      };

      localStorage.setItem('ponpes_auth_user', JSON.stringify(user));
      setIsLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  const handleQuickFill = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Top Header Card */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-white">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/70 p-2 flex items-center justify-center mb-4 shadow-xs">
            <img
              src={settings.logoUrl}
              alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-1.5">
            Portal Admin Pesantren
          </span>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {settings.institutionName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Sistem Absensi Piket Ustadz & Santri — Kegiatan Malam & Pagi
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smkmuhiba.sch.id"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-emerald-500 text-slate-900 text-xs"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-emerald-500 text-slate-900 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-xs"
            >
              {isLoading ? (
                <span>Memverifikasi Masuk...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Sebagai Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Login Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2">
              Akses Cepat Login Akun:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@smkmuhiba.sch.id')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
              >
                admin@smkmuhiba.sch.id
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hendrasetiawan72@guru.smk.belajar.id')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-[11px] transition-colors"
              >
                Akun Guru Belajar.id
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Password default: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
