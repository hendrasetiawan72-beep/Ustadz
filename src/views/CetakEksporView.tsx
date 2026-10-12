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
}

const REPORT_CATALOG: ReportCardItem[] = [
  {
    id: 'jadwal_mingguan',
    title: '1. Jadwal Piket Ustadz Mingguan',
    description: 'Daftar penugasan Ustadz piket selama satu pekan berjalan dengan aturan 1x tugas per minggu.',
    category: 'piket',
    badge: 'Mingguan',
  },
  {
    id: 'jadwal_bulanan',
    title: '2. Jadwal Piket Ustadz Bulanan',
    description: 'Matriks pembagian tugas piket seluruh dewan Ustadz dalam satu bulan kalender.',
    category: 'piket',
    badge: 'Bulanan',
  },
  {
    id: 'realisasi_piket',
    title: '3. Realisasi Piket Ustadz Bulanan',
    description: 'Laporan kepatuhan dan pencatatan jam masuk/selesai tugas Ustadz yang telah terlaksana.',
    category: 'piket',
    badge: 'Kepatuhan',
  },
  {
    id: 'absensi_harian',
    title: '4. Absensi Santri Harian',
    description: 'Daftar hadir santri pada tanggal operasional yang dipilih untuk seluruh sesi.',
    category: 'absensi',
    badge: 'Harian',
  },
  {
    id: 'absensi_malam',
    title: '5. Absensi Kegiatan Malam (Maghrib - Isya)',
    description: 'Rekap kehadiran kajian kitab, tadarrus, dan sholat Maghrib berjamaah.',
    category: 'absensi',
    badge: 'Maghrib-Isya',
  },
  {
    id: 'absensi_pagi',
    title: '6. Absensi Kegiatan Pagi (Subuh - 06:00 WIB)',
    description: 'Rekap kehadiran sholat Subuh berjamaah, kuliah Subuh, dan muhadatsah bahasa.',
    category: 'absensi',
    badge: 'Subuh',
  },
  {
    id: 'rekap_santri_bulanan',
    title: '7. Rekap Kehadiran Santri Bulanan',
    description: 'Tabel akumulasi Hadir, Izin, Sakit, Alpa, Terlambat, dan persentase kehadiran per santri.',
    category: 'rekap',
    badge: 'Akumulasi Santri',
  },
  {
    id: 'rekap_ustadz_bulanan',
    title: '8. Rekap Kehadiran Ustadz Bulanan',
    description: 'Statistik kepatuhan Ustadz terhadap jadwal piket pesantren dalam 1 bulan.',
    category: 'rekap',
    badge: 'Kepatuhan Ustadz',
  },
  {
    id: 'laporan_kegiatan',
    title: '9. Laporan Kegiatan Pesantren',
    description: 'Daftar materi kajian, topik kuliah Subuh, pembina bertugas, dan waktu pelaksanaan.',
    category: 'rekap',
    badge: 'Materi & Sesi',
  },
  {
    id: 'santri_ketidakhadiran_tinggi',
    title: '10. Daftar Santri Ketidakhadiran Tinggi (Peringatan)',
    description: 'Dokumen khusus santri dengan jumlah Alpa & Sakit terbanyak untuk tindak lanjut wali santri.',
    category: 'khusus',
    badge: 'Evaluasi Disiplin',
  },
  {
    id: 'catatan_kejadian',
    title: '11. Laporan Catatan Kejadian & Pelanggaran',
    description: 'Arsip berita acara kejadian khusus di asrama, santri sakit di UKS, atau pelanggaran tata tertib.',
    category: 'khusus',
    badge: 'Berita Acara',
  },
  {
    id: 'laporan_lengkap_bulanan',
    title: '12. Laporan Lengkap Bulanan (Comprehensive Report)',
    description: 'Dokumen formal gabungan rekapitulasi menyeluruh yang diserahkan ke Pimpinan Ponpes.',
    category: 'khusus',
    badge: 'Laporan Utama',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            Cetak dan Ekspor Dokumen Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            12 Format dokumen siap cetak standar A4 &middot; Kertas Putih Bersih &middot; Kop Surat Resmi Ponpes Baitul Arqom SMK Muhiba
          </p>
        </div>
      </div>

      {/* Filter and Period Selection Box */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeCategory === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Semua (12 Dokumen)
          </button>
          <button
            onClick={() => setActiveCategory('piket')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeCategory === 'piket' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Jadwal & Realisasi
          </button>
          <button
            onClick={() => setActiveCategory('absensi')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeCategory === 'absensi' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Absensi Sesi
          </button>
          <button
            onClick={() => setActiveCategory('rekap')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeCategory === 'rekap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Rekap Bulanan
          </button>
          <button
            onClick={() => setActiveCategory('khusus')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeCategory === 'khusus' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Laporan Khusus
          </button>
        </div>

        {/* Dynamic Period Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Tanggal Harian:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Bulan Periode:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono bg-white"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid (12 Items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  {item.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {getPeriodText(item.id)}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => onOpenPreview(item.id, item.title, getPeriodText(item.id))}
                className="px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExportDirectExcel(item)}
                  title="Ekspor Excel (.xlsx)"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200/60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadDirectPDF(item)}
                  title="Unduh PDF Resmi"
                  className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
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
