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

async function getWorkbookInstance() {
  const ExcelJS = await import('exceljs');
  const WorkbookClass = ExcelJS.Workbook || (ExcelJS.default ? ExcelJS.default.Workbook : null);
  if (!WorkbookClass) {
    throw new Error('Gagal memuat modul ExcelJS');
  }
  return new WorkbookClass();
}

async function triggerDownload(buffer: ArrayBuffer | Uint8Array, fileName: string) {
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Download official template
export async function downloadExcelTemplate(
  moduleType: 'ustadz' | 'santri' | 'piket' | 'absensi' | 'kegiatan'
): Promise<void> {
  const workbook = await getWorkbookInstance();
  const worksheet = workbook.addWorksheet('Data');

  let headers: string[] = [];
  let sampleData: Record<string, string | number>[] = [];
  let fileName = '';

  if (moduleType === 'ustadz') {
    headers = ['Nomor_Baku_Muhammadiyah_NBM', 'Nama_Lengkap', 'Nomor_HP_WA', 'Email', 'Bidang_Tugas', 'Status_Aktif'];
    sampleData = [
      {
        Nomor_Baku_Muhammadiyah_NBM: 'NBM-2023008',
        Nama_Lengkap: 'Ustadz Lukman Hakim, S.Pd',
        Nomor_HP_WA: '081234567899',
        Email: 'lukman@smkmuhiba.sch.id',
        Bidang_Tugas: "Tahfidz Al-Qur'an",
        Status_Aktif: 'Aktif',
      },
      {
        Nomor_Baku_Muhammadiyah_NBM: 'NBM-2023009',
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
        Kelompok: "Tahfidz Al-Qur'an",
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

  worksheet.columns = headers.map((h) => ({
    header: h,
    key: h,
    width: 24,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' },
  };

  sampleData.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  await triggerDownload(buffer, fileName);
}

// 2. Parse and Validate Excel file (Safe & Efficient)
export async function parseAndValidateExcel(
  file: File,
  moduleType: 'ustadz' | 'santri' | 'piket' | 'absensi'
): Promise<ExcelValidationResult<Record<string, unknown>>> {
  // 1. Validasi Ukuran File (Maksimal 2 MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (maksimal 2 MB). Silakan periksa kembali file Anda.');
  }

  // 2. Validasi Tipe MIME / Ekstensi
  const validExtensions = ['.xlsx', '.xls'];
  const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasValidExt) {
    throw new Error('Format file tidak didukung. Harap unggah file spreadsheet Excel (.xlsx).');
  }

  const workbook = await getWorkbookInstance();
  const data = await file.arrayBuffer();
  await workbook.xlsx.load(data);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Lembar kerja Excel kosong atau tidak ditemukan.');
  }

  // Baca Header dari Baris 1
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim();
  });

  const rawRows: Record<string, unknown>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Lewati header
    const rowObj: Record<string, unknown> = {};
    let hasContent = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colName = headers[colNumber];
      if (colName) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = cell.value;
        if (val && typeof val === 'object') {
          if ('result' in val) val = val.result;
          else if ('text' in val) val = val.text;
        }
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          hasContent = true;
        }
        rowObj[colName] = val ?? '';
      }
    });

    if (hasContent) {
      rawRows.push(rowObj);
    }
  });

  // 3. Batasi Jumlah Baris (Maksimal 2.000 baris)
  if (rawRows.length > 2000) {
    throw new Error(`File memuat ${rawRows.length} baris, melebihi batas maksimal 2.000 baris.`);
  }

  const validRows: Record<string, unknown>[] = [];
  const invalidRows: Array<{ rowNumber: number; data: Record<string, unknown>; errors: string[] }> = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];

    if (moduleType === 'ustadz') {
      const nip = String(row['Nomor_Baku_Muhammadiyah_NBM'] || row['NBM'] || row['Nomor_Induk_Pegawai'] || row['NIP'] || '').trim();
      const nama = String(row['Nama_Lengkap'] || '').trim();
      const hp = String(row['Nomor_HP_WA'] || '').trim();

      if (!nip) errors.push('Nomor Baku Muhammadiyah (NBM) wajib diisi');
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
      const nip = String(row['NBM_Ustadz'] || row['Nomor_Induk_Ustadz'] || row['NBM'] || row['NIP'] || '').trim();
      const tgl = String(row['Tanggal_Piket'] || '').trim();

      if (!nip) errors.push('Nomor Baku Muhammadiyah (NBM) Ustadz wajib diisi');
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
export async function downloadErrorReport(
  invalidRows: Array<{ rowNumber: number; data: Record<string, unknown>; errors: string[] }>
): Promise<void> {
  const workbook = await getWorkbookInstance();
  const worksheet = workbook.addWorksheet('Error_Report');

  const exportData = invalidRows.map((r) => ({
    Baris_Ke: r.rowNumber,
    Pesan_Kesalahan: r.errors.join('; '),
    ...r.data,
  }));

  if (exportData.length > 0) {
    const keys = Object.keys(exportData[0]);
    worksheet.columns = keys.map((k) => ({
      header: k,
      key: k,
      width: Math.max(k.length + 4, 18),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE4E6' },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportData.forEach((row) => worksheet.addRow(row as any));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  await triggerDownload(buffer, `Laporan_Kesalahan_Impor_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 4. Export generic data to Excel
export async function exportDataToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const workbook = await getWorkbookInstance();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map((key) => ({
      header: key,
      key: key,
      width: Math.max(key.length + 4, 16),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((item) => worksheet.addRow(item as any));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  await triggerDownload(buffer, fileName);
}
