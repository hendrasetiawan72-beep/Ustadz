import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, ReportType, Ustadz, Santri, PiketSchedule, ActivitySession, StudentAttendance } from '../types';
import { OFFICIAL_LOGO_URL } from './constants';

export interface PDFReportOptions {
  reportType: ReportType;
  title: string;
  periodText: string;
  settings: AppSettings;
  data: {
    ustadzList?: Ustadz[];
    santriList?: Santri[];
    schedules?: PiketSchedule[];
    sessions?: ActivitySession[];
    attendances?: StudentAttendance[];
    extraNotes?: string;
    filterDate?: string;
    filterMonth?: string; // YYYY-MM
  };
}

export function formatDocumentDate(settings: AppSettings): { city: string; dateStr: string; fullTitimangsa: string } {
  const city = (settings.documentCity || 'Bawang').trim();
  let dateStr = '';
  if (settings.documentDateMode === 'manual' && settings.manualDocumentDate) {
    try {
      const d = new Date(settings.manualDocumentDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } else {
        dateStr = settings.manualDocumentDate;
      }
    } catch {
      dateStr = settings.manualDocumentDate;
    }
  } else {
    dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return {
    city,
    dateStr,
    fullTitimangsa: `${city}, ${dateStr}`,
  };
}

// Convert image url to base64 for jsPDF
export async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  // First attempt: HTMLImageElement with canvas
  try {
    const base64 = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
            return;
          }
        } catch {
          // canvas tainted or error
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
    if (base64) return base64;
  } catch {
    // ignore
  }

  // Second attempt: fetch blob
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not convert image to base64 for PDF, using vector fallback mark:', e);
    return null;
  }
}

export async function generatePesantrenPDF(options: PDFReportOptions): Promise<jsPDF> {
  const { reportType, title, periodText, settings, data } = options;

  // Decide orientation: Landscape for wide tables (Rekap santri, Laporan lengkap), Portrait for others
  const isLandscape =
    reportType === 'rekap_santri_bulanan' ||
    reportType === 'laporan_lengkap_bulanan' ||
    reportType === 'realisasi_piket';

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const marginLeft = 20; // 20mm left margin as requested
  const marginRight = 15;
  const marginTop = 15;
  const marginBottom = 15;
  const printableWidth = pageWidth - marginLeft - marginRight;

  // Try fetching logo
  const logoBase64 = await getBase64ImageFromUrl(settings.logoUrl || OFFICIAL_LOGO_URL);

  // Function to draw Kop Surat on page
  const drawKopSurat = (yStart: number) => {
    // Logo on the left
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', marginLeft, yStart, 20, 20);
      } catch {
        // Fallback badge if image fails to render in canvas
        drawFallbackLogo(yStart);
      }
    } else {
      drawFallbackLogo(yStart);
    }

    // Institution text in the center
    const textCenterX = marginLeft + 24 + (printableWidth - 24) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(settings.institutionName || 'PONPES BAITUL ARQOM SMK MUHIBA', textCenterX, yStart + 5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(settings.subTitle || 'SMK MUHAMMADIYAH BAWANG', textCenterX, yStart + 10, { align: 'center' });

    let currentY = yStart + 11;
    if (settings.address || settings.phone || settings.email) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const contactParts = [settings.address, settings.phone ? `Telp/WA: ${settings.phone}` : '', settings.email ? `Email: ${settings.email}` : ''].filter(Boolean);
      doc.text(contactParts.join(' | '), textCenterX, yStart + 14, { align: 'center' });
      currentY = yStart + 16;
    }

    // Double divider line (Formal standard)
    const lineY = Math.max(currentY + 4, yStart + 22);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, lineY + 1.2, pageWidth - marginRight, lineY + 1.2);

    return lineY + 6;
  };

  const drawFallbackLogo = (yStart: number) => {
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(marginLeft, yStart, 20, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('MUHIBA', marginLeft + 10, yStart + 12, { align: 'center' });
  };

  const startContentY = drawKopSurat(marginTop);

  // Document Title & Period
  let currentY = startContentY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), marginLeft + printableWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodText} | Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, marginLeft + printableWidth / 2, currentY, { align: 'center' });

  currentY += 6;

  // Build Table content based on reportType
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  const santriMap = new Map((data.santriList || []).map((s) => [s.id, s]));
  const ustadzMap = new Map((data.ustadzList || []).map((u) => [u.id, u]));

  if (reportType === 'jadwal_mingguan' || reportType === 'jadwal_bulanan') {
    tableHeaders = ['No', 'Hari', 'Tanggal', 'Petugas Piket (Ustadz/ah)', 'Sesi Piket', 'NIP', 'Status', 'Catatan'];
    const schedules = data.schedules || [];
    tableRows = schedules.map((s, idx) => {
      const u = ustadzMap.get(s.ustadzId);
      const sessionLabel =
        s.sessionType === 'morning'
          ? 'Pagi (Subuh)'
          : s.sessionType === 'night'
          ? 'Malam (Maghrib)'
          : 'Malam & Pagi';
      const statusText =
        s.status === 'sudah_bertugas'
          ? 'Sudah Bertugas'
          : s.status === 'terjadwal'
          ? 'Terjadwal'
          : s.status === 'izin_diganti'
          ? 'Izin / Diganti'
          : 'Belum Bertugas';
      return [
        idx + 1,
        s.dayName,
        s.scheduleDate,
        s.ustadzName || u?.fullName || '-',
        sessionLabel,
        u?.employeeNumber || '-',
        statusText,
        s.notes || (s.overrideReason ? `Pengecualian: ${s.overrideReason}` : '-'),
      ];
    });
  } else if (reportType === 'realisasi_piket' || reportType === 'rekap_ustadz_bulanan') {
    tableHeaders = ['No', 'Nama Ustadz', 'NIP', 'Jml Jadwal', 'Terlaksana', 'Belum/Izin', 'Persentase', 'Kepatuhan'];
    const ustadzList = data.ustadzList || [];
    const schedules = data.schedules || [];

    tableRows = ustadzList.map((u, idx) => {
      const uSchedules = schedules.filter((s) => s.ustadzId === u.id);
      const total = uSchedules.length;
      const completed = uSchedules.filter((s) => s.status === 'sudah_bertugas').length;
      const remaining = total - completed;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const kepatuhan = pct >= 80 ? 'Sangat Baik' : pct >= 50 ? 'Cukup' : 'Perlu Evaluasi';
      return [
        idx + 1,
        u.fullName,
        u.employeeNumber,
        total,
        completed,
        remaining,
        `${pct}%`,
        kepatuhan,
      ];
    });
  } else if (reportType === 'absensi_harian' || reportType === 'absensi_malam' || reportType === 'absensi_pagi') {
    tableHeaders = ['No', 'NIS', 'Nama Santri', 'Kelas', 'Kelompok / Asrama', 'Status Kehadiran', 'Keterangan'];
    const attendances = data.attendances || [];
    tableRows = attendances.map((a, idx) => {
      const s = santriMap.get(a.santriId);
      const st = a.attendanceStatus.toUpperCase();
      return [
        idx + 1,
        s?.studentNumber || '-',
        s?.fullName || 'Santri',
        s?.className || '-',
        `${s?.groupName || '-'} / ${s?.dormitory || '-'}`,
        st,
        a.notes || '-',
      ];
    });
  } else if (reportType === 'rekap_santri_bulanan' || reportType === 'laporan_lengkap_bulanan') {
    tableHeaders = ['No', 'NIS', 'Nama Santri', 'Kelas', 'Total Sesi', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Terlambat', 'Dispensasi', '% Hadir'];
    const santriList = data.santriList || [];
    const attendances = data.attendances || [];

    tableRows = santriList.map((s, idx) => {
      const sAtt = attendances.filter((a) => a.santriId === s.id);
      const total = sAtt.length;
      const hadir = sAtt.filter((a) => a.attendanceStatus === 'hadir').length;
      const izin = sAtt.filter((a) => a.attendanceStatus === 'izin').length;
      const sakit = sAtt.filter((a) => a.attendanceStatus === 'sakit').length;
      const alpa = sAtt.filter((a) => a.attendanceStatus === 'alpa').length;
      const terlambat = sAtt.filter((a) => a.attendanceStatus === 'terlambat').length;
      const dispensasi = sAtt.filter((a) => a.attendanceStatus === 'dispensasi').length;
      const pct = total > 0 ? Math.round(((hadir + dispensasi) / total) * 100) : 0;
      return [
        idx + 1,
        s.studentNumber,
        s.fullName,
        s.className,
        total,
        hadir,
        izin,
        sakit,
        alpa,
        terlambat,
        dispensasi,
        `${pct}%`,
      ];
    });
  } else if (reportType === 'santri_ketidakhadiran_tinggi') {
    tableHeaders = ['No', 'NIS', 'Nama Santri', 'Kelas', 'Alpa', 'Sakit', 'Izin', 'Total Absen', 'Status Tindak Lanjut'];
    const santriList = data.santriList || [];
    const attendances = data.attendances || [];

    const highAbsentList = santriList
      .map((s) => {
        const sAtt = attendances.filter((a) => a.santriId === s.id);
        const alpa = sAtt.filter((a) => a.attendanceStatus === 'alpa').length;
        const sakit = sAtt.filter((a) => a.attendanceStatus === 'sakit').length;
        const izin = sAtt.filter((a) => a.attendanceStatus === 'izin').length;
        const totalAbsent = alpa + sakit + izin;
        return { s, alpa, sakit, izin, totalAbsent };
      })
      .filter((item) => item.totalAbsent > 0)
      .sort((a, b) => b.totalAbsent - a.totalAbsent);

    tableRows = highAbsentList.map((item, idx) => [
      idx + 1,
      item.s.studentNumber,
      item.s.fullName,
      item.s.className,
      item.alpa,
      item.sakit,
      item.izin,
      item.totalAbsent,
      item.alpa >= 2 ? 'Surat Panggilan Orang Tua' : 'Bimbingan Konseling Ustadz',
    ]);
  } else if (reportType === 'catatan_kejadian') {
    tableHeaders = ['No', 'Tanggal', 'Sesi / Kegiatan', 'Ustadz Bertugas', 'Topik / Materi', 'Catatan Kejadian / Pelanggaran'];
    const sessions = data.sessions || [];
    tableRows = sessions.map((sess, idx) => [
      idx + 1,
      sess.activityDate,
      sess.activityName,
      sess.ustadzName,
      sess.topic || '-',
      sess.incidentNotes || 'Tidak ada kejadian khusus. Kondisi kondusif.',
    ]);
  } else {
    // Laporan Kegiatan Pesantren
    tableHeaders = ['No', 'Tanggal', 'Sesi', 'Waktu', 'Ustadz Piket', 'Materi / Aktivitas', 'Status'];
    const sessions = data.sessions || [];
    tableRows = sessions.map((sess, idx) => [
      idx + 1,
      sess.activityDate,
      sess.sessionType === 'morning' ? 'Pagi (Subuh)' : 'Malam (Maghrib)',
      `${sess.startTime} - ${sess.endTime} WIB`,
      sess.ustadzName,
      sess.topic || sess.activityName,
      sess.status.toUpperCase(),
    ]);
  }

  // Draw autotable
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'Data belum tersedia pada sistem', '-', '-', '-', '-']],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225], // slate-300
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [241, 245, 249], // Very light gray #f1f5f9
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom + 30 },
    didDrawPage: (dataHook) => {
      // Add page numbers
      const pageCount = doc.internal.pages.length - 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${dataHook.pageNumber} dari ${pageCount}`,
        pageWidth - marginRight,
        pageHeight - 8,
        { align: 'right' }
      );
      doc.text(
        `Dokumen Resmi Sistem Piket - ${settings.institutionName}`,
        marginLeft,
        pageHeight - 8
      );
    },
  });

  // Calculate position for Signatures
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = doc.lastAutoTable?.finalY || currentY + 40;
  let signatureY = finalY + 12;

  // If signature overflows page, add page
  if (signatureY + 35 > pageHeight - marginBottom) {
    doc.addPage();
    signatureY = marginTop + 10;
  }

  const sigBlockWidth = 70;
  const sigLeftX = marginLeft + 10;
  const sigRightX = pageWidth - marginRight - sigBlockWidth - 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Left Signature: Koordinator Piket
  doc.text('Mengetahui / Memeriksa,', sigLeftX, signatureY, { align: 'center' });
  doc.text('Koordinator Piket & Kesantrian', sigLeftX, signatureY + 4, { align: 'center' });

  // Right Signature: Pimpinan Ponpes
  const titimangsa = formatDocumentDate(settings);
  doc.text(titimangsa.fullTitimangsa, sigRightX, signatureY, { align: 'center' });
  doc.text('Pimpinan Pondok Pesantren', sigRightX, signatureY + 4, { align: 'center' });

  // Signature names & NIP (after spacing for ink signature)
  doc.setFont('helvetica', 'bold');
  doc.text(settings.dutySupervisorName, sigLeftX, signatureY + 24, { align: 'center' });
  doc.text(settings.leaderName, sigRightX, signatureY + 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP: ${settings.dutySupervisorNip}`, sigLeftX, signatureY + 28, { align: 'center' });
  doc.text(`NIP: ${settings.leaderNip}`, sigRightX, signatureY + 28, { align: 'center' });

  return doc;
}
