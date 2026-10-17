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
  Sparkles,
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

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeBg?: string;
}

const MENU_ITEMS: MenuItem[] = [
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
    badgeBg: 'bg-[#E0F2FE] text-sky-900 border-sky-300',
  },
  {
    id: 'kegiatan_malam',
    label: 'Absen Kegiatan Malam',
    icon: Moon,
    badge: 'Maghrib-Isya',
    badgeBg: 'bg-[#EDE9FE] text-purple-900 border-purple-300',
  },
  {
    id: 'kegiatan_pagi',
    label: 'Absen Kegiatan Pagi',
    icon: Sun,
    badge: 'Subuh-06.00',
    badgeBg: 'bg-[#FEF08A] text-amber-950 border-amber-300',
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
    badgeBg: 'bg-[#FFE4E6] text-rose-900 border-rose-300',
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed md:static inset-y-0 left-0 z-40 bg-[#FAF7F2] border-r-2 border-slate-900 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? 'w-72 translate-x-0 opacity-100 shadow-[6px_0px_0px_rgba(30,41,59,0.1)] md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:-ml-0 overflow-hidden pointer-events-none md:border-r-0'
        }`}
      >
        <div className="flex flex-col h-full w-72 overflow-hidden bg-[#FAF7F2]">
          {/* Header in Sidebar with Hide Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-slate-900/10 bg-[#FFFDF9]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
              <span className="font-display font-black text-slate-900 text-xs uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={onToggleCollapse || onClose}
              title="Sembunyikan bilah samping"
              className="p-1.5 bg-white text-slate-800 hover:bg-[#FEE2E2] rounded-lg border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px]">Tutup</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            <div className="px-3 pb-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
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
                      ? 'bg-[#BBF7D0] text-slate-950 border-1.5 border-slate-900 shadow-[2.5px_2.5px_0px_#1e293b]'
                      : 'text-slate-800 hover:bg-white hover:text-slate-950 hover:border-slate-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-950' : 'text-slate-600'}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ml-1.5 border ${
                        item.badgeBg || 'bg-white text-slate-800 border-slate-300'
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
          <div className="p-3.5 border-t-2 border-slate-900/10 bg-[#FFFDF9]">
            <div className="flex items-center gap-2.5 min-w-0 p-2 bg-[#FEF9C3] rounded-xl border-1.5 border-slate-900 shadow-[2px_2px_0px_#1e293b]">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-900 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
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
