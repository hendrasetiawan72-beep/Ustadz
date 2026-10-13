import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  ReportType,
  AppSettings,
} from '../types';
import { generatePesantrenPDF } from '../lib/pdf';
import { exportDataToExcel } from '../lib/excel';

interface CetakEksporViewProps {
  ustadzList: Ustadz[];
  santriList: Santri[];
  schedules: PiketSchedule[];
  sessions: ActivitySession[];
  attendances: StudentAttendance[];
  settings: AppSettings;
  onOpenPreview: (type: ReportType, title: string, periodText: string) => void;
}

interface ReportCardItem {
  id: ReportType;
  title: string;
  description: string;
  category: 'piket' | 'absensi' | 'rekap' | 'khusus';
  badge: string;
  badgeBg: string;
}

const REPORT_CATALOG: ReportCardItem[] = [
  {
    id: 'jadwal_mingguan',
    title: '1. Jadwal Piket Ustadz Mingguan',
    description: 'Daftar penugasan Ustadz piket selama satu pekan berjalan dengan aturan 1x tugas per minggu.',
    category: 'piket',
    badge: 'Mingguan',
    badgeBg: 'bg-[#E0F2FE] text-sky-950',
  },
  {
    id: 'jadwal_bulanan',
    title: '2. Jadwal Piket Ustadz Bulanan',
    description: 'Matriks pembagian tugas piket seluruh dewan Ustadz dalam satu bulan kalender.',
    category: 'piket',
    badge: 'Bulanan',
    badgeBg: 'bg-[#E0F2FE] text-sky-950',
  },
  {
    id: 'realisasi_piket',
    title: '3. Realisasi Piket Ustadz Bulanan',
    description: 'Laporan kepatuhan dan pencatatan jam masuk/selesai tugas Ustadz yang telah terlaksana.',
    category: 'piket',
    badge: 'Kepatuhan',
    badgeBg: 'bg-[#DCFCE7] text-emerald-950',
  },
  {
    id: 'absensi_harian',
    title: '4. Absensi Santri Harian',
    description: 'Daftar hadir santri pada tanggal operasional yang dipilih untuk seluruh sesi.',
    category: 'absensi',
    badge: 'Harian',
    badgeBg: 'bg-[#FEF9C3] text-amber-950',
  },
  {
    id: 'absensi_malam',
    title: '5. Absensi Kegiatan Malam (Maghrib - Isya)',
    description: 'Rekap kehadiran kajian kitab, tadarrus, dan sholat Maghrib berjamaah.',
    category: 'absensi',
    badge: 'Maghrib-Isya',
    badgeBg: 'bg-[#EDE9FE] text-purple-950',
  },
  {
    id: 'absensi_pagi',
    title: '6. Absensi Kegiatan Pagi (Subuh - 06:00 WIB)',
    description: 'Rekap kehadiran sholat Subuh berjamaah, kuliah Subuh, dan muhadatsah bahasa.',
    category: 'absensi',
    badge: 'Subuh',
    badgeBg: 'bg-[#FEF08A] text-amber-950',
  },
  {
    id: 'rekap_santri_bulanan',
    title: '7. Rekap Kehadiran Santri Bulanan',
    description: 'Tabel akumulasi Hadir, Izin, Sakit, Alpa, Terlambat, dan persentase kehadiran per santri.',
    category: 'rekap',
    badge: 'Akumulasi Santri',
    badgeBg: 'bg-[#BBF7D0] text-emerald-950',
  },
  {
    id: 'rekap_ustadz_bulanan',
    title: '8. Rekap Kehadiran Ustadz Bulanan',
    description: 'Statistik kepatuhan Ustadz terhadap jadwal piket pesantren dalam 1 bulan.',
    category: 'rekap',
    badge: 'Kepatuhan Ustadz',
    badgeBg: 'bg-[#DCFCE7] text-emerald-950',
  },
  {
    id: 'laporan_kegiatan',
    title: '9. Laporan Kegiatan Pesantren',
    description: 'Daftar materi kajian, topik kuliah Subuh, pembina bertugas, dan waktu pelaksanaan.',
    category: 'rekap',
    badge: 'Materi & Sesi',
    badgeBg: 'bg-[#FEF9C3] text-amber-950',
  },
  {
    id: 'santri_ketidakhadiran_tinggi',
    title: '10. Daftar Santri Ketidakhadiran Tinggi (Peringatan)',
    description: 'Dokumen khusus santri dengan jumlah Alpa & Sakit terbanyak untuk tindak lanjut wali santri.',
    category: 'khusus',
    badge: 'Evaluasi Disiplin',
    badgeBg: 'bg-[#FFE4E6] text-rose-950',
  },
  {
    id: 'catatan_kejadian',
    title: '11. Laporan Catatan Kejadian & Pelanggaran',
    description: 'Arsip berita acara kejadian khusus di asrama, santri sakit di UKS, atau pelanggaran tata tertib.',
    category: 'khusus',
    badge: 'Berita Acara',
    badgeBg: 'bg-[#FFE4E6] text-rose-950',
  },
  {
    id: 'laporan_lengkap_bulanan',
    title: '12. Laporan Lengkap Bulanan (Comprehensive Report)',
    description: 'Dokumen formal gabungan rekapitulasi menyeluruh yang diserahkan ke Pimpinan Ponpes.',
    category: 'khusus',
    badge: 'Laporan Utama',
    badgeBg: 'bg-[#DCFCE7] text-emerald-950',
  },
];

export const CetakEksporView: React.FC<CetakEksporViewProps> = ({
  ustadzList,
  santriList,
  schedules,
  sessions,
  attendances,
  settings,
  onOpenPreview,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [activeCategory, setActiveCategory] = useState<'all' | 'piket' | 'absensi' | 'rekap' | 'khusus'>('all');

  const filteredCatalog = REPORT_CATALOG.filter((item) =>
    activeCategory === 'all' ? true : item.category === activeCategory
  );

  const getPeriodText = (type: ReportType) => {
    if (type.includes('harian') || type === 'absensi_malam' || type === 'absensi_pagi') {
      return `Tanggal ${selectedDate}`;
    }
    if (type.includes('mingguan')) {
      return `Pekan Berjalan (${selectedDate})`;
    }
    return `Bulan ${selectedMonth}`;
  };

  const handleDownloadDirectPDF = async (item: ReportCardItem) => {
    const periodText = getPeriodText(item.id);
    const doc = await generatePesantrenPDF({
      reportType: item.id,
      title: item.title,
      periodText,
      settings,
      data: {
        ustadzList,
        santriList,
        schedules,
        sessions,
        attendances,
        filterDate: selectedDate,
        filterMonth: selectedMonth,
      },
    });
    doc.save(`${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedDate}.pdf`);
  };

  const handleExportDirectExcel = (item: ReportCardItem) => {
    if (item.id.includes('santri')) {
      const data = santriList.map((s, idx) => ({
        No: idx + 1,
        NIS: s.studentNumber,
        Nama_Santri: s.fullName,
        Kelas: s.className,
        Asrama: s.dormitory,
      }));
      exportDataToExcel(data, item.title.replace(/\s+/g, '_'));
    } else {
      const data = schedules.map((s, idx) => ({
        No: idx + 1,
        Hari: s.dayName,
        Tanggal: s.scheduleDate,
        Nama_Ustadz: s.ustadzName,
        Status: s.status,
      }));
      exportDataToExcel(data, item.title.replace(/\s+/g, '_'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#BBF7D0] text-emerald-950 uppercase tracking-wider inline-flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-emerald-800" />
              Pusat Dokumen Resmi
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Cetak dan Ekspor Dokumen Resmi
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            12 Format dokumen siap cetak standar A4 &middot; Kertas Putih Bersih &middot; Kop Surat Resmi Ponpes Baitul Arqom SMK Muhiba
          </p>
        </div>
      </div>

      {/* Filter and Period Selection Box */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-4 shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center p-1 bg-[#FAF7F2] rounded-xl border border-slate-900/20">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (12 Dokumen)
          </button>
          <button
            onClick={() => setActiveCategory('piket')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === 'piket'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jadwal &amp; Realisasi
          </button>
          <button
            onClick={() => setActiveCategory('absensi')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === 'absensi'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absensi Sesi
          </button>
          <button
            onClick={() => setActiveCategory('rekap')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === 'rekap'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekap Bulanan
          </button>
          <button
            onClick={() => setActiveCategory('khusus')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === 'khusus'
                ? 'bg-white text-emerald-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#1e293b]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Khusus
          </button>
        </div>

        {/* Dynamic Period Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-slate-900 rounded-xl px-2.5 py-1.5 font-mono font-bold bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-2 border-slate-900 rounded-xl px-2.5 py-1.5 font-mono font-bold bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid (12 Items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map((item) => (
          <div
            key={item.id}
            className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-5 shadow-[3.5px_3.5px_0px_#1e293b] hover:shadow-[5px_5px_0px_#1e293b] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`neo-badge px-2.5 py-0.5 text-[10px] font-black ${item.badgeBg}`}>
                  {item.badge}
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-medium">
                  {getPeriodText(item.id)}
                </span>
              </div>

              <h3 className="font-display font-black text-slate-950 text-sm tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                {item.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900/10 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => onOpenPreview(item.id, item.title, getPeriodText(item.id))}
                className="neo-btn px-3 py-1.5 font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExportDirectExcel(item)}
                  title="Ekspor Excel (.xlsx)"
                  className="neo-btn p-1.5 text-emerald-950 bg-[#DCFCE7] hover:bg-[#BBF7D0] rounded-xl cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadDirectPDF(item)}
                  title="Unduh PDF Resmi"
                  className="neo-btn px-3 py-1.5 font-black text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-950" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
