import React, { useState } from 'react';
import { History, Search, FileSpreadsheet, ShieldAlert, Clock, User } from 'lucide-react';
import { AuditLog, UserRole } from '../types';
import { exportDataToExcel } from '../lib/excel';

interface RiwayatAktivitasViewProps {
  auditLogs: AuditLog[];
  userRole: UserRole;
}

export const RiwayatAktivitasView: React.FC<RiwayatAktivitasViewProps> = ({
  auditLogs,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchAction = actionFilter === 'all' || log.action === actionFilter;

    return matchSearch && matchAction;
  });

  const handleExportExcel = () => {
    const data = auditLogs.map((l, idx) => ({
      No: idx + 1,
      Waktu_WIB: new Date(l.createdAt).toLocaleString('id-ID'),
      Pelaku_Aktor: l.actorName,
      Aksi: l.action,
      Entitas: l.entityType,
      Detail_Aktivitas: l.details,
    }));
    exportDataToExcel(data, 'Riwayat_Aktivitas_Audit_Log');
  };

  return (
    <div className="space-y-6">
      {/* Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-white border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950 uppercase tracking-wider inline-flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-sky-700" />
              Audit Trail
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Riwayat Aktivitas &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Pencatatan seluruh perubahan data piket, absensi santri, jadwal, dan pengaturan sistem
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="neo-btn px-3.5 py-2 text-xs font-bold text-emerald-950 bg-[#DCFCE7] hover:bg-[#BBF7D0] rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
          <span>Ekspor Log ke Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border-2 border-slate-900 rounded-2xl shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelaku, jenis aksi, atau detail perubahan..."
            className="w-full pl-9 pr-4 py-2 border-2 border-slate-900 rounded-xl bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
        >
          <option value="all">Semua Jenis Aksi</option>
          <option value="SIMPAN_ABSENSI_SANTRI">Absensi Santri</option>
          <option value="INPUT_KEGIATAN_MALAM">Kegiatan Malam</option>
          <option value="INPUT_KEGIATAN_PAGI">Kegiatan Pagi</option>
          <option value="TAMBAH_JADWAL_PIKET">Jadwal Piket</option>
          <option value="TAMBAH_SANTRI">Data Santri</option>
          <option value="TAMBAH_USTADZ">Data Ustadz</option>
          <option value="UPDATE_SETTINGS">Pengaturan</option>
        </select>
      </div>

      {/* Audit Logs Feed Table */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1e293b] overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900/10 flex items-center justify-between text-xs bg-[#FAF7F2]">
          <span className="font-display font-black text-slate-950">
            Daftar Log Aktivitas ({filteredLogs.length})
          </span>
          <span className="text-slate-500 font-mono font-medium">Keamanan &amp; Integritas Terjaga</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#FEF9C3] text-slate-900 border-b-2 border-slate-900 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Petugas / Aktor</th>
                <th className="py-3 px-4">Aksi / Modul</th>
                <th className="py-3 px-4">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900/10">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 font-medium">
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-950">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.actorName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="neo-badge px-2.5 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada riwayat aktivitas yang sesuai pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
