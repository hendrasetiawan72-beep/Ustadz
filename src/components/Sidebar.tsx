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
} from 'lucide-react';

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
}

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Utama',
    icon: LayoutDashboard,
    color: 'hover:bg-emerald-50 hover:text-emerald-700 text-slate-700',
  },
  {
    id: 'jadwal_piket',
    label: 'Jadwal Piket (Malam & Pagi)',
    icon: CalendarDays,
    badge: 'Ustadz/ah',
    color: 'hover:bg-blue-50 hover:text-blue-700 text-slate-700',
  },
  {
    id: 'kegiatan_malam',
    label: 'Absen Kegiatan Malam',
    icon: Moon,
    badge: 'Maghrib-Isya',
    color: 'hover:bg-purple-50 hover:text-purple-700 text-slate-700',
  },
  {
    id: 'kegiatan_pagi',
    label: 'Absen Kegiatan Pagi',
    icon: Sun,
    badge: 'Subuh-06.00',
    color: 'hover:bg-amber-50 hover:text-amber-700 text-slate-700',
  },
  {
    id: 'rekap_bulanan',
    label: 'Rekapitulasi Bulanan',
    icon: BarChart3,
    color: 'hover:bg-emerald-50 hover:text-emerald-700 text-slate-700',
  },
  {
    id: 'data_ustadz',
    label: 'Data Ustadz & Ustadzah',
    icon: GraduationCap,
    color: 'hover:bg-indigo-50 hover:text-indigo-700 text-slate-700',
  },
  {
    id: 'data_santri',
    label: 'Data Santri Pesantren',
    icon: Users,
    color: 'hover:bg-teal-50 hover:text-teal-700 text-slate-700',
  },
  {
    id: 'cetak_ekspor',
    label: 'Cetak & Ekspor PDF',
    icon: Printer,
    badge: '12 Dokumen',
    color: 'hover:bg-rose-50 hover:text-rose-700 text-slate-700',
  },
  {
    id: 'impor_excel',
    label: 'Impor & Ekspor Excel',
    icon: FileSpreadsheet,
    color: 'hover:bg-green-50 hover:text-green-700 text-slate-700',
  },
  {
    id: 'riwayat_aktivitas',
    label: 'Riwayat Aktivitas',
    icon: History,
    color: 'hover:bg-slate-100 hover:text-slate-800 text-slate-700',
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan & Supabase',
    icon: Settings,
    color: 'hover:bg-slate-100 hover:text-slate-800 text-slate-700',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onToggleCollapse,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container: can be hidden on desktop as well as mobile! */}
      <aside
        className={`no-print fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? 'w-68 translate-x-0 opacity-100 shadow-2xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:-ml-0 overflow-hidden pointer-events-none md:border-r-0'
        }`}
      >
        <div className="flex flex-col h-full w-68 overflow-hidden">
          {/* Header in Sidebar with Hide Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Menu Navigasi
            </span>
            <button
              onClick={onToggleCollapse || onClose}
              title="Sembunyikan bilah samping"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 text-[11px]"
            >
              <PanelLeftClose className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px]">Tutup</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Menu Utama Admin
            </div>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    // On small screens, close after click
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : item.color
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-1.5 ${
                        isActive
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600'
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
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs">
                BA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">SMK Muhiba</p>
                <p className="text-[10px] text-slate-500 truncate">SMK Muhammadiyah Bawang</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
