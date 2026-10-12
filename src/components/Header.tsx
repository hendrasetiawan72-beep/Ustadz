import React from 'react';
import { Clock, ShieldCheck, LogOut, PanelLeftClose, PanelLeft, Database } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { OFFICIAL_LOGO_URL } from '../lib/constants';

interface HeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  settings: AppSettings;
  isSupabaseLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onToggleSidebar,
  isSidebarOpen,
  settings,
  isSupabaseLive,
}) => {
  const currentTimeWIB = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const currentDateWIB = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <header className="no-print h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Zone 1: Sidebar Toggle & Institutional Branding */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Sembunyikan bilah samping' : 'Tampilkan bilah samping'}
          title={isSidebarOpen ? 'Sembunyikan bilah samping' : 'Tampilkan bilah samping'}
          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200/60 shrink-0"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-slate-700 hover:text-emerald-700" />
          ) : (
            <PanelLeft className="w-5 h-5 text-slate-700 hover:text-emerald-700" />
          )}
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-emerald-50 border border-emerald-200/60 shrink-0 p-0.5 shadow-xs">
            <img
              src={settings.logoUrl || OFFICIAL_LOGO_URL}
              alt="Logo Muhiba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm block leading-tight truncate">
              Ponpes Baitul Arqom
            </span>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block truncate">
              SMK Muhammadiyah Bawang
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Time & Zone Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentDateWIB}</span>
          <span className="text-slate-400">&middot;</span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">{currentTimeWIB} WIB</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full">
          <Database className="w-3 h-3 text-blue-500" />
          <span>Database:</span>
          <span className={`font-semibold ${isSupabaseLive ? 'text-emerald-600' : 'text-blue-600'}`}>
            {isSupabaseLive ? 'Supabase' : 'Lokal/Sync'}
          </span>
        </div>
      </div>

      {/* Zone 3: Single Role (Admin) & Logout Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 sm:px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="text-left hidden sm:block min-w-0">
            <span className="text-[11px] font-bold text-emerald-950 block leading-none">
              Admin Pesantren
            </span>
            <span className="text-[10px] text-emerald-700 font-medium block truncate max-w-[120px]">
              {currentUser.email}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Keluar dari Akun"
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
