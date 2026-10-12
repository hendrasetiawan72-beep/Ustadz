import React from 'react';
import { Shield, Clock, UserCheck, Menu, Database } from 'lucide-react';
import { UserRole, AppSettings } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleSidebar: () => void;
  settings: AppSettings;
  isSupabaseLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onToggleSidebar,
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
    <header className="no-print h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Brand title & Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-emerald-50 border border-emerald-200/60 shrink-0">
            <img
              src={settings.logoUrl}
              alt="Logo Muhiba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-sm md:text-base whitespace-nowrap">
            Ponpes Baitul Arqom
          </span>
        </div>
      </div>

      {/* Zone 2: Time & Zone Status */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentDateWIB}</span>
          <span className="text-slate-400">&middot;</span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">{currentTimeWIB} WIB</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>Database:</span>
          <span className={`font-semibold ${isSupabaseLive ? 'text-emerald-600' : 'text-blue-600'}`}>
            {isSupabaseLive ? 'Supabase Cloud' : 'Lokal (Siap Sinkron)'}
          </span>
        </div>
      </div>

      {/* Zone 3: Role Switcher & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Peran:</span>
          </div>

          <button
            onClick={() => onRoleChange('admin')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentRole === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => onRoleChange('ustadz_piket')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentRole === 'ustadz_piket'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ustadz Piket
          </button>
          <button
            onClick={() => onRoleChange('kepala_pengawas')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentRole === 'kepala_pengawas'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengawas
          </button>
        </div>

        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm" title={`Aktif sebagai: ${currentRole}`}>
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
