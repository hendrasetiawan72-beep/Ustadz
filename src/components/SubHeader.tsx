import React from 'react';
import {
  ChevronRight,
  Compass,
  MapPin,
  Calendar,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { NavigationTab, MENU_ITEMS } from './Sidebar';
import { AppSettings, UserRole } from '../types';
import { formatDocumentDate } from '../lib/pdf';

interface SubHeaderProps {
  currentTab: NavigationTab;
  settings: AppSettings;
  userRole: UserRole;
  isSupabaseLive: boolean;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  currentTab,
  settings,
  userRole,
  isSupabaseLive,
}) => {
  const currentItem = MENU_ITEMS.find((m) => m.id === currentTab);
  const CurrentIcon = currentItem?.icon || Compass;

  const currentHour = new Date().getHours();
  const isMorningSession = currentHour >= 4 && currentHour < 12;
  const isNightSession = currentHour >= 17 && currentHour < 22;

  const titimangsa = formatDocumentDate(settings);

  return (
    <div className="no-print bg-[#FEF08A] border-b-2 border-slate-900 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-950 shadow-xs shrink-0 z-20">
      {/* Left: Breadcrumbs & Active Page Indicator */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <div className="flex items-center gap-1.5 text-amber-950 font-black text-[11px]">
          <span className="hover:text-amber-800 transition-colors cursor-default">Baitul Arqom</span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-900/60 shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border-1.5 border-slate-900 rounded-lg text-slate-950 font-black shadow-[1.5px_1.5px_0px_#1e293b]">
          <CurrentIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="text-xs truncate">{currentItem?.label || 'Modul Sistem'}</span>
        </div>

        {currentItem?.badge && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md font-black bg-[#BAE6FD] text-sky-950 border-1.5 border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b] uppercase tracking-wider">
            <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
            {currentItem.badge}
          </span>
        )}
      </div>

      {/* Right: Operational Status & Document Context */}
      <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
        {/* Active Session Indicator */}
        {isMorningSession && (
          <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 bg-white border-1.5 border-slate-900 rounded-full text-amber-950 shadow-xs">
            <Sun className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-extrabold">Sesi Pagi</span>
          </div>
        )}
        {isNightSession && (
          <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 bg-white border-1.5 border-slate-900 rounded-full text-purple-950 shadow-xs">
            <Moon className="w-3 h-3 text-purple-700" />
            <span className="text-[10px] font-extrabold">Sesi Malam</span>
          </div>
        )}

        {/* Petir Quick Indicator */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-[#A7F3D0] border-1.5 border-slate-900 rounded-full text-emerald-950 text-[10px] font-black shadow-xs">
          <Zap className="w-3 h-3 text-amber-600 fill-amber-400" />
          <span>Sistem Siap</span>
        </div>

        {/* Titimangsa Cetak Aktif */}
        <div
          title={`Tempat & Tanggal Dokumen: ${titimangsa.fullTitimangsa}`}
          className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white border-1.5 border-slate-900 rounded-full text-slate-950 shadow-xs"
        >
          <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
          <span className="hidden lg:inline text-[10px] text-slate-600 font-bold">Titimangsa:</span>
          <span className="text-[10px] font-black text-slate-950 truncate max-w-[170px]">
            {titimangsa.fullTitimangsa}
          </span>
        </div>

        {/* Tahun Ajaran */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 bg-[#BAE6FD] border-1.5 border-slate-900 rounded-full text-sky-950 text-[10px] font-black shadow-xs">
          <Calendar className="w-3 h-3 text-sky-800" />
          <span>T.A. 2026/2027</span>
        </div>
      </div>
    </div>
  );
};
