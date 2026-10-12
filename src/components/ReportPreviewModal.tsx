import React, { useState } from 'react';
import { Printer, Download, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { AppSettings, ReportType, Ustadz, Santri, PiketSchedule, ActivitySession, StudentAttendance } from '../types';
import { KopSurat } from './KopSurat';
import { generatePesantrenPDF } from '../lib/pdf';
import { exportDataToExcel } from '../lib/excel';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  title: string;
  periodText: string;
  settings: AppSettings;
  data: {
    ustadzList: Ustadz[];
    santriList: Santri[];
    schedules: PiketSchedule[];
    sessions: ActivitySession[];
    attendances: StudentAttendance[];
    filterMonth?: string;
  };
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  title,
  periodText,
  settings,
  data,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const doc = await generatePesantrenPDF({
        reportType,
        title,
        periodText,
        settings,
        data,
      });
      const safeName = title.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Terjadi kesalahan saat memproses PDF. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportExcel = () => {
    let exportRows: Record<string, unknown>[] = [];
    const santriMap = new Map(data.santriList.map((s) => [s.id, s]));
    const ustadzMap = new Map(data.ustadzList.map((u) => [u.id, u]));

    if (reportType === 'jadwal_mingguan' || reportType === 'jadwal_bulanan') {
      exportRows = data.schedules.map((s, idx) => ({
        No: idx + 1,
        Hari: s.dayName,
        Tanggal: s.scheduleDate,
        Nama_Ustadz: s.ustadzName,
        Status_Piket: s.status,
        Catatan: s.notes || '-',
      }));
    } else if (reportType === 'realisasi_piket' || reportType === 'rekap_ustadz_bulanan') {
      exportRows = data.ustadzList.map((u, idx) => {
        const uSchedules = data.schedules.filter((s) => s.ustadzId === u.id);
        const total = uSchedules.length;
        const completed = uSchedules.filter((s) => s.status === 'sudah_bertugas').length;
        return {
          No: idx + 1,
          Nama_Ustadz: u.fullName,
          NIP: u.employeeNumber,
          Total_Jadwal: total,
          Terlaksana: completed,
          Belum_Bertugas: total - completed,
          Persentase: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
        };
      });
    } else if (reportType === 'absensi_harian' || reportType === 'absensi_malam' || reportType === 'absensi_pagi') {
      exportRows = data.attendances.map((a, idx) => {
        const s = santriMap.get(a.santriId);
        return {
          No: idx + 1,
          NIS: s?.studentNumber || '-',
          Nama_Santri: s?.fullName || '-',
          Kelas: s?.className || '-',
          Asrama: s?.dormitory || '-',
          Status_Kehadiran: a.attendanceStatus.toUpperCase(),
          Catatan: a.notes || '-',
        };
      });
    } else {
      exportRows = data.santriList.map((s, idx) => {
        const sAtt = data.attendances.filter((a) => a.santriId === s.id);
        const total = sAtt.length;
        const hadir = sAtt.filter((a) => a.attendanceStatus === 'hadir').length;
        return {
          No: idx + 1,
          NIS: s.studentNumber,
          Nama_Santri: s.fullName,
          Kelas: s.className,
          Total_Sesi: total,
          Hadir: hadir,
          Persentase: total > 0 ? `${Math.round((hadir / total) * 100)}%` : '0%',
        };
      });
    }

    exportDataToExcel(exportRows, `Laporan_${title.replace(/\s+/g, '_')}`);
  };

  const santriMap = new Map(data.santriList.map((s) => [s.id, s]));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Pratinjau Dokumen Resmi & Cetak
              </h3>
              <p className="text-xs text-slate-500">
                Format standar A4 &middot; Kertas Putih &middot; Kop Surat Resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Printable Sheet Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-100 flex justify-center">
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-md border border-slate-200 text-slate-900 text-sm">
            {/* Kop Surat Resmi */}
            <KopSurat
              settings={settings}
              reportTitle={title}
              reportPeriod={periodText}
            />

            {/* Document Content Table */}
            <div className="mt-4">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-center w-10">No</th>
                    {reportType.includes('jadwal') ? (
                      <>
                        <th className="border border-slate-300 p-2 text-left">Hari / Tanggal</th>
                        <th className="border border-slate-300 p-2 text-left">Petugas Piket</th>
                        <th className="border border-slate-300 p-2 text-center">Sesi</th>
                        <th className="border border-slate-300 p-2 text-center">Status</th>
                        <th className="border border-slate-300 p-2 text-left">Catatan</th>
                      </>
                    ) : reportType.includes('absensi') ? (
                      <>
                        <th className="border border-slate-300 p-2 text-left">NIS</th>
                        <th className="border border-slate-300 p-2 text-left">Nama Santri</th>
                        <th className="border border-slate-300 p-2 text-left">Kelas / Asrama</th>
                        <th className="border border-slate-300 p-2 text-center">Status</th>
                        <th className="border border-slate-300 p-2 text-left">Keterangan</th>
                      </>
                    ) : (
                      <>
                        <th className="border border-slate-300 p-2 text-left">Nama Lengkap</th>
                        <th className="border border-slate-300 p-2 text-left">Identitas / Kelas</th>
                        <th className="border border-slate-300 p-2 text-center">Kehadiran</th>
                        <th className="border border-slate-300 p-2 text-center">Persentase</th>
                        <th className="border border-slate-300 p-2 text-left">Keterangan</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportType.includes('jadwal') ? (
                    data.schedules.length > 0 ? (
                      data.schedules.map((s, idx) => (
                        <tr key={s.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-medium">
                            {s.dayName}, {s.scheduleDate}
                          </td>
                          <td className="border border-slate-300 p-2">{s.ustadzName}</td>
                          <td className="border border-slate-300 p-2 text-center font-semibold text-[10px]">
                            {s.sessionType === 'morning' ? 'Pagi (Subuh)' : s.sessionType === 'night' ? 'Malam' : 'Malam & Pagi'}
                          </td>
                          <td className="border border-slate-300 p-2 text-center uppercase font-semibold text-[10px]">
                            {s.status.replace('_', ' ')}
                          </td>
                          <td className="border border-slate-300 p-2 text-slate-600">{s.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          Data jadwal belum tersedia
                        </td>
                      </tr>
                    )
                  ) : reportType.includes('absensi') ? (
                    data.attendances.length > 0 ? (
                      data.attendances.map((a, idx) => {
                        const s = santriMap.get(a.santriId);
                        return (
                          <tr key={a.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 font-mono text-[11px]">{s?.studentNumber || '-'}</td>
                            <td className="border border-slate-300 p-2 font-medium">{s?.fullName || 'Santri'}</td>
                            <td className="border border-slate-300 p-2 text-slate-600">{s?.className || '-'} &middot; {s?.dormitory}</td>
                            <td className="border border-slate-300 p-2 text-center font-bold text-[11px] uppercase">
                              {a.attendanceStatus}
                            </td>
                            <td className="border border-slate-300 p-2 text-slate-600">{a.notes || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          Belum ada catatan absensi untuk sesi ini
                        </td>
                      </tr>
                    )
                  ) : (
                    data.santriList.slice(0, 20).map((s, idx) => {
                      const sAtt = data.attendances.filter((a) => a.santriId === s.id);
                      const total = sAtt.length;
                      const hadir = sAtt.filter((a) => a.attendanceStatus === 'hadir').length;
                      const pct = total > 0 ? Math.round((hadir / total) * 100) : 100;
                      return (
                        <tr key={s.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-medium">{s.fullName}</td>
                          <td className="border border-slate-300 p-2 text-slate-600">{s.className}</td>
                          <td className="border border-slate-300 p-2 text-center font-mono">
                            {hadir} / {total || 1}
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-semibold text-emerald-700">
                            {pct}%
                          </td>
                          <td className="border border-slate-300 p-2 text-slate-600">
                            {pct >= 85 ? 'Disiplin' : 'Perlu Pembinaan'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Formal Signature Blocks */}
            <div className="mt-12 pt-6 grid grid-cols-2 text-xs text-slate-800">
              <div className="text-center">
                <p>Mengetahui / Memeriksa,</p>
                <p className="font-semibold mt-1">Koordinator Piket & Kesantrian</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{settings.dutySupervisorName}</p>
                <p className="text-[10px] text-slate-500">NIP: {settings.dutySupervisorNip}</p>
              </div>

              <div className="text-center">
                <p>
                  Babat, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-semibold mt-1">Pimpinan Pondok Pesantren</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{settings.leaderName}</p>
                <p className="text-[10px] text-slate-500">NIP: {settings.leaderNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
