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
                specialization: String(row.specialization || match.specialization),
                phone: String(row.phone || match.phone),
                email: String(row.email || match.email),
              });
              successCount++;
            }
          } else {
            await addUstadz({
              employeeNumber: nip,
              fullName: String(row.fullName),
              specialization: String(row.specialization || 'Umum'),
              phone: String(row.phone || '-'),
              email: String(row.email || ''),
              isActive: true,
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
                className: String(row.className || match.className),
                dormitory: String(row.dormitory || match.dormitory),
                guardianName: String(row.guardianName || match.guardianName),
                guardianPhone: String(row.guardianPhone || match.guardianPhone),
              });
              successCount++;
            }
          } else {
            await addSantri({
              studentNumber: nis,
              fullName: String(row.fullName),
              className: String(row.className || 'X - SMK Muhiba'),
              groupName: 'Reguler',
              dormitory: String(row.dormitory || 'Asrama Abu Bakar'),
              guardianName: String(row.guardianName || '-'),
              guardianPhone: String(row.guardianPhone || '-'),
              isActive: true,
            });
            successCount++;
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
      {/* Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#DCFCE7] text-emerald-950 uppercase tracking-wider inline-flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
              Integrasi Excel
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Impor Data Melalui Excel
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Unduh template resmi &middot; Unggah &amp; verifikasi baris valid &middot; Penanganan data ganda
          </p>
        </div>
      </div>

      {/* Module Selector & Template Download Bar */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs">
        <div>
          <label className="block font-bold text-slate-900 mb-1 text-sm uppercase tracking-wide">
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
                className={`neo-btn px-4 py-2 font-bold rounded-xl transition-all cursor-pointer ${
                  selectedModule === mod.id
                    ? 'bg-[#BBF7D0] text-emerald-950 border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
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
            className="neo-btn px-4 py-2.5 font-bold text-emerald-950 bg-[#DCFCE7] hover:bg-[#BBF7D0] rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-900" />
            <span>Unduh Template Resmi (.xlsx)</span>
          </button>
          <p className="text-[11px] text-slate-500 font-medium mt-1 text-center md:text-right">
            Sesuai skema database Ponpes Baitul Arqom
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      {!validationResult && (
        <div className="bg-[#FFFDF9] border-2 border-dashed border-slate-900 rounded-3xl p-10 text-center shadow-[4px_4px_0px_#1e293b]">
          <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] border-2 border-slate-900 text-emerald-950 mx-auto flex items-center justify-center mb-4 shadow-[2px_2px_0px_#1e293b]">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-display font-black text-slate-950 text-base">
            Pilih File Excel untuk Diimpor
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto font-medium">
            Format file wajib .xlsx atau .xls dengan susunan kolom sesuai template resmi di atas.
          </p>
          <div className="mt-5">
            <label className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-amber-950 font-black rounded-xl text-xs cursor-pointer">
              <span>{isProcessing ? 'Memproses File...' : 'Pilih File Excel'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Validation Result Box */}
      {validationResult && (
        <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900/10 pb-4">
            <div>
              <span className="font-display text-sm font-black text-slate-950 block">
                Hasil Validasi File: {uploadedFile?.name}
              </span>
              <span className="text-slate-600 font-medium">
                Total {validationResult.totalRows} baris diperiksa
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="neo-btn px-3 py-1.5 bg-white text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Ganti File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#DCFCE7] border-2 border-slate-900 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
              <span className="font-bold text-emerald-950 block text-[11px] uppercase">Baris Valid &amp; Siap Impor</span>
              <span className="font-display text-2xl font-black text-emerald-950 font-mono">
                {validationResult.validRows.length} Baris
              </span>
            </div>
            <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
              <span className="font-bold text-rose-950 block text-[11px] uppercase">Baris Error / Tidak Lengkap</span>
              <span className="font-display text-2xl font-black text-rose-950 font-mono">
                {validationResult.invalidRows.length} Baris
              </span>
            </div>
          </div>

          {validationResult.invalidRows.length > 0 && (
            <div className="p-4 bg-[#FEF3C7] border-2 border-slate-900 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-xs">
                  Terdapat {validationResult.invalidRows.length} baris data yang mengandung kesalahan:
                </span>
                <button
                  onClick={handleDownloadErrors}
                  className="neo-btn px-2.5 py-1 bg-white text-amber-950 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Unduh Laporan Error (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Strategy & Commit Button */}
          <div className="pt-4 border-t-2 border-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">Jika Data Sudah Ada:</span>
              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateStrategy === 'skip'}
                  onChange={() => setDuplicateStrategy('skip')}
                />
                <span>Lewati (Skip)</span>
              </label>
              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateStrategy === 'update'}
                  onChange={() => setDuplicateStrategy('update')}
                />
                <span>Perbarui (Update)</span>
              </label>
            </div>

            <button
              onClick={handleCommitImport}
              disabled={isProcessing || validationResult.validRows.length === 0}
              className="neo-btn px-5 py-2.5 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 font-black rounded-xl cursor-pointer"
            >
              {isProcessing ? 'Memasukkan ke Database...' : `Simpan ${validationResult.validRows.length} Data ke Database`}
            </button>
          </div>
        </div>
      )}

      {/* Summary Box */}
      {importSummary && (
        <div className="bg-[#DCFCE7] border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#1e293b] text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-display text-base font-black">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
            <span>Impor Selesai Diproses!</span>
          </div>
          <p className="text-xs font-semibold">
            Berhasil masuk: {importSummary.success} data &middot; Dilewati: {importSummary.skipped} data &middot; Gagal: {importSummary.failed} data.
          </p>
        </div>
      )}
    </div>
  );
};
