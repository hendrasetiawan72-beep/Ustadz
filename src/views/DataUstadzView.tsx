import React, { useState } from 'react';
import { GraduationCap, Plus, Search, Edit2, Trash2, Phone, Mail, FileSpreadsheet } from 'lucide-react';
import { Ustadz, UserRole } from '../types';
import { addUstadz, updateUstadz, deleteUstadz } from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface DataUstadzViewProps {
  ustadzList: Ustadz[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const DataUstadzView: React.FC<DataUstadzViewProps> = ({
  ustadzList,
  userRole,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUstadz, setEditingUstadz] = useState<Ustadz | null>(null);

  // Form State
  const [nip, setNip] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('Tahfidz Al-Qur\'an');
  const [isActive, setIsActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingUstadz(null);
    setNip(`UST-${new Date().getFullYear()}${String(ustadzList.length + 1).padStart(3, '0')}`);
    setFullName('');
    setPhone('');
    setEmail('');
    setSpecialization('Tahfidz & Kesantrian');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Ustadz) => {
    setEditingUstadz(u);
    setNip(u.employeeNumber);
    setFullName(u.fullName);
    setPhone(u.phone);
    setEmail(u.email || '');
    setSpecialization(u.specialization || 'Tahfidz & Kesantrian');
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUstadz) {
        await updateUstadz(editingUstadz.id, {
          employeeNumber: nip,
          fullName,
          phone,
          email,
          specialization,
          isActive,
        });
      } else {
        await addUstadz({
          employeeNumber: nip,
          fullName,
          phone,
          email,
          specialization,
          isActive,
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal menyimpan: ${msg}`);
    }
  };

  const handleDelete = async (u: Ustadz) => {
    if (confirm(`Yakin ingin menghapus data Ustadz ${u.fullName}?`)) {
      await deleteUstadz(u.id);
      onRefresh();
    }
  };

  const handleExportExcel = () => {
    const data = ustadzList.map((u, idx) => ({
      No: idx + 1,
      NIP: u.employeeNumber,
      Nama_Lengkap: u.fullName,
      No_HP_WA: u.phone,
      Email: u.email || '-',
      Bidang_Tugas: u.specialization || '-',
      Status: u.isActive ? 'Aktif' : 'Nonaktif',
    }));
    exportDataToExcel(data, 'Data_Ustadz_Ponpes_Baitul_Arqom');
  };

  const filteredList = ustadzList.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.specialization && u.specialization.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? u.isActive
        : !u.isActive;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Data Ustadz & Ustadzah (Pembina Piket)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar dewan guru dan pembina piket putra & putri Ponpes Baitul Arqom SMK Muhiba
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ustadz</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, NIP, atau bidang tugas..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Ustadz Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    {u.fullName.split(' ')[1]?.[0] || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{u.fullName}</h4>
                    <p className="text-[11px] font-mono text-slate-400">{u.employeeNumber}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Bidang:</span>
                  <span className="font-medium text-slate-800">{u.specialization || 'Umum'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.phone || '-'}</span>
                </div>
                {u.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                )}
              </div>
            </div>

            {userRole === 'admin' && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingUstadz ? 'Edit Data Ustadz' : 'Tambah Ustadz Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Lengkapi informasi guru atau pembina piket
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk / NIP</label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad Fauzan, S.Pd.I"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@smkmuhiba.sch.id"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bidang Tugas / Keahlian</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Tahfidz, Fiqih, Kesantrian"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="isActiveCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Status Ustadz Aktif (Mendapatkan Jadwal Piket)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
