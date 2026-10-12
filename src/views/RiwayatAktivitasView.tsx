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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Riwayat Aktivitas & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan seluruh perubahan data piket, absensi santri, jadwal, dan pengaturan sistem
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Ekspor Log ke Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelaku, jenis aksi, atau detail perubahan..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-emerald-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
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
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Daftar Log Aktivitas ({filteredLogs.length})
          </span>
          <span className="text-slate-400 font-mono">Keamanan & Integritas Terjaga</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">Waktu (WIB)</th>
                <th className="p-3">Pengguna / Aktor</th>
                <th className="p-3">Aksi</th>
                <th className="p-3">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-slate-900">{log.actorName}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
