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
    color: 'hover:bg-orange-50 hover:text-orange-700 text-slate-700',
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
    label: 'Cetak & Ekspor PDF Resmi',
    icon: Printer,
    badge: '12 PDF',
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

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed md:static inset-y-0 left-0 z-40 w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile Header in Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 md:hidden">
            <span className="font-bold text-slate-800 text-sm">Navigasi Admin</span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Menu Utama
            </div>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : item.color
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-emerald-700/60 text-white'
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
          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                BA
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">SMK Muhiba</p>
                <p className="text-[10px] text-slate-500 truncate">Ponpes Baitul Arqom</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
