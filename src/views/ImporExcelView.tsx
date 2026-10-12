import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  XCircle,
  FileDown,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  downloadExcelTemplate,
  parseAndValidateExcel,
  downloadErrorReport,
  ExcelValidationResult,
} from '../lib/excel';
import {
  addUstadz,
  updateUstadz,
  addSantri,
  updateSantri,
  addPiketSchedule,
  getUstadzList,
  getSantriList,
  getPiketSchedules,
} from '../lib/db';
import { Ustadz, Santri, UserRole } from '../types';

interface ImporExcelViewProps {
  userRole: UserRole;
  onRefresh: () => void;
}

type ImportModule = 'ustadz' | 'santri' | 'piket' | 'absensi';

export const ImporExcelView: React.FC<ImporExcelViewProps> = ({
  userRole,
  onRefresh,
}) => {
  const [selectedModule, setSelectedModule] = useState<ImportModule>('santri');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult<Record<string, unknown>> | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [importSummary, setImportSummary] = useState<{
    success: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(selectedModule);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('File harus berformat Excel (.xlsx atau .xls)');
      return;
    }

    setUploadedFile(file);
    setImportSummary(null);
    setIsProcessing(true);

    try {
      const result = await parseAndValidateExcel(file, selectedModule);
      setValidationResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal membaca file Excel: ${msg}`);
      setValidationResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      if (selectedModule === 'ustadz') {
        const existingUstadz = await getUstadzList();
        for (const row of validationResult.validRows) {
          const nip = String(row.employeeNumber);
          const match = existingUstadz.find((u) => u.employeeNumber === nip);

          if (match) {
            if (duplicateStrategy === 'skip') {
              skippedCount++;
            } else {
              await updateUstadz(match.id, {
                fullName: String(row.fullName),
                phone: String(row.phone),
                email: String(row.email || ''),
                specialization: String(row.specialization || ''),
              });
              successCount++;
            }
          } else {
            await addUstadz({
              employeeNumber: nip,
              fullName: String(row.fullName),
              phone: String(row.phone),
              email: String(row.email || ''),
              specialization: String(row.specialization || ''),
              isActive: Boolean(row.isActive),
            });
            successCount++;
          }
        }
      } else if (selectedModule === 'santri') {
        const existingSantri = await getSantriList();
        for (const row of validationResult.validRows) {
          const nis = String(row.studentNumber);
          const match = existingSantri.find((s) => s.studentNumber === nis);

          if (match) {
            if (duplicateStrategy === 'skip') {
              skippedCount++;
            } else {
              await updateSantri(match.id, {
                fullName: String(row.fullName),
                className: String(row.className),
                groupName: String(row.groupName),
                dormitory: String(row.dormitory),
                guardianName: String(row.guardianName || ''),
                guardianPhone: String(row.guardianPhone || ''),
              });
              successCount++;
            }
          } else {
            await addSantri({
              studentNumber: nis,
              fullName: String(row.fullName),
              className: String(row.className),
              groupName: String(row.groupName),
              dormitory: String(row.dormitory),
              guardianName: String(row.guardianName || ''),
              guardianPhone: String(row.guardianPhone || ''),
              isActive: Boolean(row.isActive),
            });
            successCount++;
          }
        }
      } else if (selectedModule === 'piket') {
        const existingUstadz = await getUstadzList();
        for (const row of validationResult.validRows) {
          const nip = String(row.employeeNumber);
          const u = existingUstadz.find((item) => item.employeeNumber === nip);
          if (!u) {
            failedCount++;
            continue;
          }

          try {
            await addPiketSchedule({
              ustadzId: u.id,
              scheduleDate: String(row.scheduleDate),
              status: 'terjadwal',
              notes: String(row.notes || ''),
              allowOverride: true,
              overrideReason: 'Impor Excel Massal',
              createdBy: userRole,
            });
            successCount++;
          } catch {
            failedCount++;
          }
        }
      }

      setImportSummary({
        success: successCount,
        skipped: skippedCount,
        failed: failedCount + validationResult.invalidRows.length,
      });

      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan saat menyimpan data: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrors = () => {
    if (validationResult && validationResult.invalidRows.length > 0) {
      downloadErrorReport(validationResult.invalidRows);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Impor Data Melalui Excel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh template resmi &middot; Unggah & verifikasi baris valid &middot; Penanganan data ganda
          </p>
        </div>
      </div>

      {/* Module Selector & Template Download Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1 text-sm">
            Pilih Modul Data yang Ingin Diimpor:
          </label>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {[
              { id: 'santri', label: 'Data Santri' },
              { id: 'ustadz', label: 'Data Ustadz' },
              { id: 'piket', label: 'Jadwal Piket' },
              { id: 'absensi', label: 'Absensi Santri' },
            ].map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  setSelectedModule(mod.id as ImportModule);
                  handleReset();
                }}
                className={`px-3.5 py-2 font-bold rounded-xl transition-all ${
                  selectedModule === mod.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template Resmi (.xlsx)</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-1 text-center md:text-right">
            Sesuai skema database Ponpes Baitul Arqom
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      {!validationResult && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:border-emerald-500 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            Pilih atau Tarik File Excel ke Sini
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Mendukung format file <strong>.xlsx</strong> dan <strong>.xls</strong>. Sistem akan memeriksa validitas setiap baris sebelum disimpan ke database.
          </p>

          <label className="inline-block mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors">
            <span>Pilih Berkas Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Preview & Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Pratinjau Hasil Pembacaan File: {uploadedFile?.name}
                </h4>
                <p className="text-slate-500 mt-0.5">
                  Total {validationResult.totalRows} baris &middot;{' '}
                  <span className="text-emerald-700 font-bold">
                    {validationResult.validRows.length} Valid
                  </span>{' '}
                  &middot;{' '}
                  <span className="text-rose-600 font-bold">
                    {validationResult.invalidRows.length} Tidak Valid
                  </span>
                </p>
              </div>
            </div>

            {/* Duplicate Strategy Option */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Jika Data Duplikat:</span>
                <select
                  value={duplicateStrategy}
                  onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'update')}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium"
                >
                  <option value="skip">Lewati Data Duplikat</option>
                  <option value="update">Perbarui Data yang Cocok</option>
                </select>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Ganti File
              </button>

              <button
                onClick={handleCommitImport}
                disabled={isProcessing || validationResult.validRows.length === 0}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Menyimpan...'
                    : `Konfirmasi & Simpan (${validationResult.validRows.length} Baris)`}
                </span>
              </button>
            </div>
          </div>

          {/* Import Result Notification if committed */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h5 className="font-bold text-emerald-950">Impor Data Selesai!</h5>
                  <p className="text-emerald-800">
                    {importSummary.success} baris berhasil disimpan, {importSummary.skipped} baris dilewati, {importSummary.failed} baris gagal.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl font-bold"
              >
                Impor File Lain
              </button>
            </div>
          )}

          {/* Invalid Rows Warning & Error Downloader */}
          {validationResult.invalidRows.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">
                    Terdapat {validationResult.invalidRows.length} baris tidak valid dalam file Excel!
                  </p>
                  <p className="text-rose-700 mt-0.5">
                    Baris yang tidak valid tidak akan disimpan. Anda dapat mengunduh rincian kesalahan untuk diperbaiki.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadErrors}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh Laporan Kesalahan (.xlsx)</span>
              </button>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Pratinjau Data Baris Valid (Sampel 20 Baris Pertama)
              </span>
              <span className="text-emerald-700 font-semibold">Siap Disimpan</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    {selectedModule === 'ustadz' ? (
                      <>
                        <th className="p-3">NIP</th>
                        <th className="p-3">Nama Ustadz</th>
                        <th className="p-3">No. HP</th>
                        <th className="p-3">Bidang</th>
                      </>
                    ) : selectedModule === 'santri' ? (
                      <>
                        <th className="p-3">NIS</th>
                        <th className="p-3">Nama Santri</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Kelompok</th>
                        <th className="p-3">Asrama</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3">NIP Ustadz</th>
                        <th className="p-3">Tanggal Piket</th>
                        <th className="p-3">Catatan</th>
                      </>
                    )}
                    <th className="p-3 text-center">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.validRows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      {selectedModule === 'ustadz' ? (
                        <>
                          <td className="p-3 font-mono font-medium">{String(row.employeeNumber)}</td>
                          <td className="p-3 font-bold text-slate-900">{String(row.fullName)}</td>
                          <td className="p-3">{String(row.phone)}</td>
                          <td className="p-3 text-slate-600">{String(row.specialization || '-')}</td>
                        </>
                      ) : selectedModule === 'santri' ? (
                        <>
                          <td className="p-3 font-mono font-medium">{String(row.studentNumber)}</td>
                          <td className="p-3 font-bold text-slate-900">{String(row.fullName)}</td>
                          <td className="p-3">{String(row.className)}</td>
                          <td className="p-3 text-emerald-700">{String(row.groupName)}</td>
                          <td className="p-3 text-slate-600">{String(row.dormitory)}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-mono">{String(row.employeeNumber)}</td>
                          <td className="p-3 font-mono">{String(row.scheduleDate)}</td>
                          <td className="p-3 text-slate-600">{String(row.notes || '-')}</td>
                        </>
                      )}
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          VALID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
