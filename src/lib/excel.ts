import * as XLSX from 'xlsx';
import { Ustadz, Santri, PiketSchedule, StudentAttendance, AttendanceStatus } from '../types';

export interface ExcelValidationResult<T> {
  validRows: T[];
  invalidRows: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
  totalRows: number;
}

// 1. Download official template
export function downloadExcelTemplate(
  moduleType: 'ustadz' | 'santri' | 'piket' | 'absensi' | 'kegiatan'
): void {
  let headers: string[] = [];
  let sampleData: Record<string, string | number>[] = [];
  let fileName = '';

  if (moduleType === 'ustadz') {
    headers = ['Nomor_Induk_Pegawai', 'Nama_Lengkap', 'Nomor_HP_WA', 'Email', 'Bidang_Tugas', 'Status_Aktif'];
    sampleData = [
      {
        Nomor_Induk_Pegawai: 'UST-2023008',
        Nama_Lengkap: 'Ustadz Lukman Hakim, S.Pd',
        Nomor_HP_WA: '081234567899',
        Email: 'lukman@smkmuhiba.sch.id',
        Bidang_Tugas: 'Tahfidz Al-Qur\'an',
        Status_Aktif: 'Aktif',
      },
      {
        Nomor_Induk_Pegawai: 'UST-2023009',
        Nama_Lengkap: 'Ustadz Wildan Firdaus, M.Ag',
        Nomor_HP_WA: '081234567898',
        Email: 'wildan@smkmuhiba.sch.id',
        Bidang_Tugas: 'Fiqih & Kedisiplinan',
        Status_Aktif: 'Aktif',
      },
    ];
    fileName = 'Template_Data_Ustadz_BaitulArqom.xlsx';
  } else if (moduleType === 'santri') {
    headers = ['NIS_Santri', 'Nama_Lengkap', 'Kelas', 'Kelompok', 'Asrama', 'Nama_Wali', 'No_HP_Wali', 'Status_Aktif'];
    sampleData = [
      {
        NIS_Santri: 'SAN-2450',
        Nama_Lengkap: 'Muhammad Yusuf Al-Farabi',
        Kelas: 'X - SMK Muhiba',
        Kelompok: 'Tahfidz Al-Qur\'an',
        Asrama: 'Asrama Abu Bakar',
        Nama_Wali: 'H. Suryanto',
        No_HP_Wali: '081211223344',
        Status_Aktif: 'Aktif',
      },
      {
        NIS_Santri: 'SAN-2451',
        Nama_Lengkap: 'Fatih Robbani',
        Kelas: 'XI - SMK Muhiba',
        Kelompok: 'Reguler',
        Asrama: 'Asrama Umar bin Khattab',
        Nama_Wali: 'Supriyanto',
        No_HP_Wali: '081211223345',
        Status_Aktif: 'Aktif',
      },
    ];
    fileName = 'Template_Data_Santri_BaitulArqom.xlsx';
  } else if (moduleType === 'piket') {
    headers = ['Nomor_Induk_Ustadz', 'Nama_Ustadz', 'Tanggal_Piket', 'Catatan_Tugas'];
    sampleData = [
      {
        Nomor_Induk_Ustadz: 'UST-2023001',
        Nama_Ustadz: 'Ustadz Muhammad Ridwan, S.Pd.I',
        Tanggal_Piket: '2026-10-19',
        Catatan_Tugas: 'Piket rutin pekan depan',
      },
      {
        Nomor_Induk_Ustadz: 'UST-2023002',
        Nama_Ustadz: 'Ustadz Fauzan Azhim, Lc',
        Tanggal_Piket: '2026-10-20',
        Catatan_Tugas: 'Piket hari Selasa',
      },
    ];
    fileName = 'Template_Jadwal_Piket_BaitulArqom.xlsx';
  } else if (moduleType === 'absensi') {
    headers = ['NIS_Santri', 'Nama_Santri', 'Tanggal', 'Sesi', 'Status_Kehadiran', 'Keterangan'];
    sampleData = [
      {
        NIS_Santri: 'SAN-2401',
        Nama_Santri: 'Abdullah Azzam',
        Tanggal: '2026-10-12',
        Sesi: 'Malam',
        Status_Kehadiran: 'Hadir',
        Keterangan: '',
      },
      {
        NIS_Santri: 'SAN-2402',
        Nama_Santri: 'Ahmad Faizurrahman',
        Tanggal: '2026-10-12',
        Sesi: 'Malam',
        Status_Kehadiran: 'Sakit',
        Keterangan: 'Demam di UKS',
      },
    ];
    fileName = 'Template_Absensi_Santri_BaitulArqom.xlsx';
  } else {
    headers = ['Tanggal', 'Jenis_Sesi', 'Nama_Kegiatan', 'Nomor_Induk_Ustadz', 'Waktu_Mulai', 'Waktu_Selesai', 'Materi_Kajian', 'Catatan_Kejadian'];
    sampleData = [
      {
        Tanggal: '2026-10-12',
        Jenis_Sesi: 'Malam',
        Nama_Kegiatan: 'Kajian Kitab Kuning Maghrib - Isya',
        Nomor_Induk_Ustadz: 'UST-2023001',
        Waktu_Mulai: '17:45',
        Waktu_Selesai: '19:45',
        Materi_Kajian: 'Kitab Arbain Nawawi Bab 1-3',
        Catatan_Kejadian: 'Seluruh santri hadir tertib',
      },
    ];
    fileName = 'Template_Catatan_Kegiatan_BaitulArqom.xlsx';
  }

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  // Set column widths
  const colWidths = headers.map(() => ({ wch: 22 }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, fileName);
}

// 2. Parse and Validate Excel file
export async function parseAndValidateExcel(
  file: File,
  moduleType: 'ustadz' | 'santri' | 'piket' | 'absensi'
): Promise<ExcelValidationResult<Record<string, unknown>>> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validRows: Record<string, unknown>[] = [];
  const invalidRows: Array<{ rowNumber: number; data: Record<string, unknown>; errors: string[] }> = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];

    if (moduleType === 'ustadz') {
      const nip = String(row['Nomor_Induk_Pegawai'] || '').trim();
      const nama = String(row['Nama_Lengkap'] || '').trim();
      const hp = String(row['Nomor_HP_WA'] || '').trim();

      if (!nip) errors.push('Nomor Induk Pegawai (NIP) wajib diisi');
      if (!nama) errors.push('Nama Lengkap wajib diisi');
      if (!hp) errors.push('Nomor HP/WA wajib diisi');

      if (errors.length === 0) {
        validRows.push({
          employeeNumber: nip,
          fullName: nama,
          phone: hp,
          email: String(row['Email'] || '').trim(),
          specialization: String(row['Bidang_Tugas'] || 'Pengajar & Piket').trim(),
          isActive: String(row['Status_Aktif'] || 'Aktif').toLowerCase() !== 'nonaktif',
        });
      } else {
        invalidRows.push({ rowNumber, data: row, errors });
      }
    } else if (moduleType === 'santri') {
      const nis = String(row['NIS_Santri'] || '').trim();
      const nama = String(row['Nama_Lengkap'] || '').trim();
      const kelas = String(row['Kelas'] || '').trim();

      if (!nis) errors.push('NIS Santri wajib diisi');
      if (!nama) errors.push('Nama Lengkap wajib diisi');
      if (!kelas) errors.push('Kelas wajib diisi');

      if (errors.length === 0) {
        validRows.push({
          studentNumber: nis,
          fullName: nama,
          className: kelas,
          groupName: String(row['Kelompok'] || 'Reguler').trim(),
          dormitory: String(row['Asrama'] || 'Asrama Abu Bakar').trim(),
          guardianName: String(row['Nama_Wali'] || '').trim(),
          guardianPhone: String(row['No_HP_Wali'] || '').trim(),
          isActive: String(row['Status_Aktif'] || 'Aktif').toLowerCase() !== 'nonaktif',
        });
      } else {
        invalidRows.push({ rowNumber, data: row, errors });
      }
    } else if (moduleType === 'piket') {
      const nip = String(row['Nomor_Induk_Ustadz'] || '').trim();
      const tgl = String(row['Tanggal_Piket'] || '').trim();

      if (!nip) errors.push('Nomor Induk Ustadz wajib diisi');
      if (!tgl) errors.push('Tanggal Piket wajib diisi');
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        errors.push('Format tanggal harus YYYY-MM-DD (contoh: 2026-10-19)');
      }

      if (errors.length === 0) {
        validRows.push({
          employeeNumber: nip,
          scheduleDate: tgl,
          notes: String(row['Catatan_Tugas'] || '').trim(),
        });
      } else {
        invalidRows.push({ rowNumber, data: row, errors });
      }
    } else if (moduleType === 'absensi') {
      const nis = String(row['NIS_Santri'] || '').trim();
      const tgl = String(row['Tanggal'] || '').trim();
      const statusRaw = String(row['Status_Kehadiran'] || '').trim().toLowerCase();

      if (!nis) errors.push('NIS Santri wajib diisi');
      if (!tgl) errors.push('Tanggal wajib diisi');
      const validStatuses = ['hadir', 'izin', 'sakit', 'alpa', 'terlambat', 'dispensasi'];
      if (!validStatuses.includes(statusRaw)) {
        errors.push(`Status kehadiran "${statusRaw}" tidak valid. Pilihan: Hadir, Izin, Sakit, Alpa, Terlambat, Dispensasi`);
      }

      if (errors.length === 0) {
        validRows.push({
          studentNumber: nis,
          date: tgl,
          sessionType: String(row['Sesi'] || 'Malam').toLowerCase().includes('pagi') ? 'morning' : 'night',
          attendanceStatus: statusRaw as AttendanceStatus,
          notes: String(row['Keterangan'] || '').trim(),
        });
      } else {
        invalidRows.push({ rowNumber, data: row, errors });
      }
    }
  });

  return {
    validRows,
    invalidRows,
    totalRows: rawRows.length,
  };
}

// 3. Export Error Report
export function downloadErrorReport(
  invalidRows: Array<{ rowNumber: number; data: Record<string, unknown>; errors: string[] }>
): void {
  const exportData = invalidRows.map((r) => ({
    Baris_Ke: r.rowNumber,
    Pesan_Kesalahan: r.errors.join('; '),
    ...r.data,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');
  XLSX.writeFile(wb, `Laporan_Kesalahan_Impor_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 4. Export generic data to Excel
export function exportDataToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Sheet1'
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
