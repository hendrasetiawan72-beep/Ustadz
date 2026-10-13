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
    if (confirm(`Apakah Anda yakin ingin menghapus data ${u.fullName}?`)) {
      try {
        await deleteUstadz(u.id);
        onRefresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Gagal menghapus: ${msg}`);
      }
    }
  };

  const handleExportExcel = () => {
    const data = ustadzList.map((u, idx) => ({
      No: idx + 1,
      NIP: u.employeeNumber,
      Nama_Lengkap: u.fullName,
      Bidang_Tugas: u.specialization || '-',
      No_HP_WA: u.phone,
      Email: u.email || '-',
      Status: u.isActive ? 'Aktif' : 'Nonaktif',
    }));
    exportDataToExcel(data, `Data_Ustadz_Ponpes_${new Date().toISOString().split('T')[0]}`);
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
      {/* View Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-[#FFFDF9] border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#E0F2FE] text-sky-950 uppercase tracking-wider inline-flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
              Dewan Asatidz
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Data Ustadz &amp; Ustadzah (Pembina Piket)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Daftar dewan guru dan pembina piket putra &amp; putri Ponpes Baitul Arqom SMK Muhiba
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="neo-btn px-3.5 py-2 text-xs font-bold text-emerald-950 bg-[#DCFCE7] hover:bg-[#BBF7D0] rounded-xl flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
            <span>Ekspor Excel</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="neo-btn px-4 py-2 text-xs font-black text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-900" />
              <span>Tambah Ustadz</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFDF9] p-4 border-2 border-slate-900 rounded-2xl shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, NIP, atau bidang tugas..."
            className="w-full pl-9 pr-4 py-2 border-2 border-slate-900 rounded-xl text-xs bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="border-2 border-slate-900 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Ustadz Cards Grid: Postmodern Neobrutalist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((u) => (
          <div
            key={u.id}
            className="bg-[#FFFDF9] border-2 border-slate-900 rounded-2xl p-5 shadow-[3.5px_3.5px_0px_#1e293b] hover:shadow-[4.5px_4.5px_0px_#1e293b] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border-1.5 border-slate-900 text-emerald-950 flex items-center justify-center font-black text-sm shrink-0 shadow-[1.5px_1.5px_0px_#1e293b]">
                    {u.fullName.split(' ')[1]?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-slate-950 text-sm truncate" title={u.fullName}>
                      {u.fullName}
                    </h4>
                    <p className="text-[11px] font-mono font-medium text-slate-500 truncate">{u.employeeNumber}</p>
                  </div>
                </div>

                <span
                  className={`neo-badge px-2.5 py-0.5 text-[10px] font-black shrink-0 ${
                    u.isActive ? 'bg-[#BBF7D0] text-emerald-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {u.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Bidang:</span>
                  <span className="font-bold text-slate-900">{u.specialization || 'Umum'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{u.phone || '-'}</span>
                </div>
                {u.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{u.email}</span>
                  </div>
                )}
              </div>
            </div>

            {userRole === 'admin' && (
              <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t-2 border-slate-900/10">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="neo-btn px-2.5 py-1 text-slate-900 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-slate-800" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="neo-btn px-2.5 py-1 text-rose-950 bg-[#FFE4E6] hover:bg-[#FECDD3] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-800" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Ustadz */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-[2rem] shadow-[8px_8px_0px_#1e293b] w-full max-w-md p-6 sm:p-7 border-2 border-slate-900">
            <h3 className="font-display text-lg font-black text-slate-950 mb-1">
              {editingUstadz ? 'Edit Data Ustadz/ah' : 'Tambah Ustadz/ah Baru'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Data pembina piket Ponpes Baitul Arqom SMK Muhiba
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  NIP / Nomor Pegawai
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad Dahlan, S.Pd.I"
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Bidang Keahlian / Tugas
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Contoh: Tahfidz Al-Qur'an & Bahasa Arab"
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ustadz@muhiba.sch.id"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-2 border-slate-900 cursor-pointer"
                />
                <label htmlFor="isActive" className="font-bold text-slate-800 cursor-pointer text-xs">
                  Status Aktif Bertugas Piket
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-slate-900/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neo-btn px-4 py-2 text-emerald-950 bg-[#BBF7D0] hover:bg-[#86EFAC] rounded-xl font-black cursor-pointer"
                >
                  {editingUstadz ? 'Perbarui Data' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
