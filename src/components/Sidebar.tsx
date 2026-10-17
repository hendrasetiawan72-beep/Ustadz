import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Moon,
  Sun,
  BarChart3,
  GraduationCap,
  Users,
  Printer,
  FileSpreadsheet,
  History,
  Settings,
  PanelLeftClose,
  X,
  Zap,
} from 'lucide-react';
import { OFFICIAL_LOGO_URL } from '../lib/constants';
import { UserRole } from '../types';

export type NavigationTab =
  | 'dashboard'
  | 'jadwal_piket'
  | 'kegiatan_malam'
  | 'kegiatan_pagi'
  | 'rekap_bulanan'
  | 'data_ustadz'
  | 'data_santri'
  | 'cetak_ekspor'
  | 'impor_excel'
  | 'riwayat_aktivitas'
  | 'pengaturan';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
  userRole?: UserRole;
}

export interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeBg?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Utama',
    icon: LayoutDashboard,
  },
  {
    id: 'jadwal_piket',
    label: 'Jadwal Piket (Malam & Pagi)',
    icon: CalendarDays,
    badge: 'Ustadz/ah',
    badgeBg: 'bg-[#A7F3D0] text-emerald-950 border-slate-900',
  },
  {
    id: 'kegiatan_malam',
    label: 'Absen Kegiatan Malam',
    icon: Moon,
    badge: 'Maghrib-Isya',
    badgeBg: 'bg-[#EDE9FE] text-purple-950 border-slate-900',
  },
  {
    id: 'kegiatan_pagi',
    label: 'Absen Kegiatan Pagi',
    icon: Sun,
    badge: 'Subuh-06.00',
    badgeBg: 'bg-[#FEF08A] text-amber-950 border-slate-900',
  },
  {
    id: 'rekap_bulanan',
    label: 'Rekapitulasi Bulanan',
    icon: BarChart3,
  },
  {
    id: 'data_ustadz',
    label: 'Data Ustadz & Ustadzah',
    icon: GraduationCap,
  },
  {
    id: 'data_santri',
    label: 'Data Santri Pesantren',
    icon: Users,
  },
  {
    id: 'cetak_ekspor',
    label: 'Cetak & Ekspor PDF',
    icon: Printer,
    badge: '12 Dokumen',
    badgeBg: 'bg-[#FECDD3] text-rose-950 border-slate-900',
  },
  {
    id: 'impor_excel',
    label: 'Impor & Ekspor Excel',
    icon: FileSpreadsheet,
  },
  {
    id: 'riwayat_aktivitas',
    label: 'Riwayat Aktivitas',
    icon: History,
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan & Supabase',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onToggleCollapse,
  userRole = 'admin',
}) => {
  // Saring menu sesuai role pengguna
  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (userRole === 'admin') return true;

    if (userRole === 'ustadz_piket') {
      // ustadz_piket hanya melihat Kegiatan Malam, Kegiatan Pagi, dan Jadwal Piket
      return ['kegiatan_malam', 'kegiatan_pagi', 'jadwal_piket'].includes(item.id);
    }

    if (userRole === 'kepala_pengawas') {
      // kepala_pengawas hanya bisa melihat dan mencetak
      return [
        'dashboard',
        'jadwal_piket',
        'kegiatan_malam',
        'kegiatan_pagi',
        'rekap_bulanan',
        'data_ustadz',
        'data_santri',
        'cetak_ekspor',
      ].includes(item.id);
    }

    return true;
  });

  const roleLabel =
    userRole === 'ustadz_piket'
      ? 'Akses Ustadz Piket'
      : userRole === 'kepala_pengawas'
      ? 'Akses Pengawas'
      : 'Navigasi Admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container: High-Contrast Pastel Sky Blue */}
      <aside
        className={`no-print fixed md:static inset-y-0 left-0 z-40 bg-[#E0F2FE] border-r-2 border-slate-900 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 shadow-sm ${
          isOpen
            ? 'w-72 translate-x-0 opacity-100 shadow-[6px_0px_0px_rgba(30,41,59,0.15)] md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:-ml-0 overflow-hidden pointer-events-none md:border-r-0'
        }`}
      >
        <div className="flex flex-col h-full w-72 overflow-hidden bg-[#E0F2FE]">
          {/* Header in Sidebar with Hide Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-slate-900 bg-[#BAE6FD]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-400 shrink-0" />
              <span className="font-display font-black text-slate-950 text-xs uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={onToggleCollapse || onClose}
              title="Sembunyikan bilah samping"
              className="p-1.5 bg-white hover:bg-[#FECDD3] text-slate-900 rounded-lg border-1.5 border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px]">Tutup</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-sky-300">
            <div className="px-3 pb-1.5 text-[10px] font-black tracking-wider text-sky-950 uppercase">
              Menu Terotorisasi
            </div>
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#FEF08A] text-slate-950 border-1.5 border-slate-900 shadow-[3px_3px_0px_#1e293b]'
                      : 'text-slate-800 hover:bg-white hover:text-slate-950 hover:border-slate-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-900' : 'text-slate-700'}`} />
                    <span className="truncate text-left font-black">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 ml-1.5 border border-slate-900 ${
                        isActive
                          ? 'bg-[#A7F3D0] text-emerald-950 shadow-2xs'
                          : item.badgeBg || 'bg-white text-slate-900 shadow-2xs'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Institution Footer */}
          <div className="p-3.5 border-t-2 border-slate-900 bg-[#BAE6FD]">
            <div className="flex items-center gap-2.5 min-w-0 p-2 bg-white rounded-xl border-1.5 border-slate-900 shadow-[2px_2px_0px_#1e293b]">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A] border border-slate-900 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                <img
                  src={OFFICIAL_LOGO_URL}
                  alt="Logo SMK Muhiba"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xs font-black text-slate-950 truncate">SMK Muhiba</p>
                <p className="text-[10px] font-bold text-slate-700 truncate">SMK Muhammadiyah Bawang</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
