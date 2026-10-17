import React from 'react';
import { Clock, ShieldCheck, LogOut, PanelLeftClose, PanelLeft, Database, Zap } from 'lucide-react';
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
    <header className="no-print h-16 bg-[#A7F3D0] text-slate-950 border-b-2 border-slate-900 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      {/* Zone 1: Sidebar Toggle & Institutional Branding */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Sembunyikan bilah samping' : 'Tampilkan bilah samping'}
          title={isSidebarOpen ? 'Sembunyikan bilah samping' : 'Tampilkan bilah samping'}
          className="p-2 bg-white hover:bg-[#FEF08A] text-slate-950 rounded-xl border-1.5 border-slate-900 shadow-[2px_2px_0px_#1e293b] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-slate-950" />
          ) : (
            <PanelLeft className="w-5 h-5 text-slate-950" />
          )}
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border-1.5 border-slate-900 shrink-0 p-1 shadow-[2px_2px_0px_#1e293b]">
            <img
              src={settings.logoUrl || OFFICIAL_LOGO_URL}
              alt="Logo Muhiba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-display font-black text-slate-950 tracking-tight text-xs sm:text-sm block leading-tight truncate">
              Ponpes Baitul Arqom
            </span>
            <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wider block truncate">
              SMK Muhammadiyah Bawang
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Time & Database status */}
      <div className="hidden lg:flex items-center gap-2.5 text-xs shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-1.5 border-slate-900 rounded-full font-bold text-slate-900 shadow-[2px_2px_0px_#1e293b]">
          <Clock className="w-3.5 h-3.5 text-sky-700" />
          <span>{currentDateWIB}</span>
          <span className="text-slate-400">&middot;</span>
          <span className="font-mono tabular-nums font-black text-slate-950">{currentTimeWIB} WIB</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-[#FEF08A] border-1.5 border-slate-900 rounded-full font-black text-amber-950 shadow-[2px_2px_0px_#1e293b]">
          <Database className="w-3 h-3 text-amber-800" />
          <span className="text-amber-950 font-bold">Status:</span>
          {isSupabaseLive ? (
            <span className="font-black text-emerald-900">Supabase Cloud</span>
          ) : (
            <span className="font-black px-1.5 py-0.5 bg-amber-400 text-slate-950 border border-slate-900 rounded text-[9px]">
              MODE DEMO
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Role & Logout Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-white border-1.5 border-slate-900 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#1e293b]">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="text-left hidden sm:block min-w-0">
            <span className="text-[11px] font-black text-slate-950 block leading-none">
              {currentUser.role === 'ustadz_piket'
                ? 'Ustadz Piket'
                : currentUser.role === 'kepala_pengawas'
                ? 'Kepala Pengawas'
                : 'Admin Pesantren'}
            </span>
            <span className="text-[10px] text-emerald-800 font-bold block truncate max-w-[135px]">
              {currentUser.fullName || currentUser.email}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Keluar dari Akun"
          className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-950 bg-[#FECDD3] hover:bg-[#FDA4AF] border-1.5 border-slate-900 rounded-xl flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#1e293b] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-800" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
