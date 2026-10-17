import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Home, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Santri, UserRole } from '../types';
import { addSantri, updateSantri, deleteSantri } from '../lib/db';
import { exportDataToExcel } from '../lib/excel';

interface DataSantriViewProps {
  santriList: Santri[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const DataSantriView: React.FC<DataSantriViewProps> = ({
  santriList,
  userRole,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);

  // Form State
  const [nis, setNis] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('X - SMK Muhiba');
  const [groupName, setGroupName] = useState('Reguler');
  const [dormitory, setDormitory] = useState('Asrama Abu Bakar');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingSantri(null);
    setNis(`SAN-${new Date().getFullYear().toString().slice(-2)}${String(santriList.length + 1).padStart(2, '0')}`);
    setFullName('');
    setClassName('X - SMK Muhiba');
    setGroupName('Reguler');
    setDormitory('Asrama Abu Bakar');
    setGuardianName('');
    setGuardianPhone('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Santri) => {
    setEditingSantri(s);
    setNis(s.studentNumber);
    setFullName(s.fullName);
    setClassName(s.className);
    setGroupName(s.groupName);
    setDormitory(s.dormitory);
    setGuardianName(s.guardianName || '');
    setGuardianPhone(s.guardianPhone || '');
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSantri) {
        await updateSantri(editingSantri.id, {
          studentNumber: nis,
          fullName,
          className,
          groupName,
          dormitory,
          guardianName,
          guardianPhone,
          isActive,
        });
      } else {
        await addSantri({
          studentNumber: nis,
          fullName,
          className,
          groupName,
          dormitory,
          guardianName,
          guardianPhone,
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

  const handleDelete = async (s: Santri) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data santri ${s.fullName}?`)) {
      try {
        await deleteSantri(s.id);
        onRefresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Gagal menghapus: ${msg}`);
      }
    }
  };

  const handleExportExcel = () => {
    const data = santriList.map((s, idx) => ({
      No: idx + 1,
      NIS: s.studentNumber,
      Nama_Santri: s.fullName,
      Kelas: s.className,
      Kelompok: s.groupName,
      Asrama: s.dormitory,
      Nama_Wali: s.guardianName || '-',
      Kontak_Wali: s.guardianPhone || '-',
      Status: s.isActive ? 'Aktif' : 'Nonaktif',
    }));
    exportDataToExcel(data, `Data_Santri_Ponpes_${new Date().toISOString().split('T')[0]}`);
  };

  const filteredList = santriList.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchClass = classFilter === 'all' || s.className === classFilter;
    const matchDorm = dormFilter === 'all' || s.dormitory === dormFilter;

    return matchSearch && matchClass && matchDorm;
  });

  return (
    <div className="space-y-6">
      {/* View Header: Postmodern Neobrutalist Rounded Canvas */}
      <div className="bg-white border-2 border-slate-900 rounded-[1.75rem] p-6 shadow-[4.5px_4.5px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge px-3 py-0.5 text-[10px] font-black bg-[#DCFCE7] text-emerald-950 uppercase tracking-wider inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-800" />
              Database Santri
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Data Santri Pesantren
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Manajemen data santri, kelas, kelompok tahfidz/kejuruan, dan asrama Ponpes Baitul Arqom
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
              <span>Tambah Santri</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 border-2 border-slate-900 rounded-2xl shadow-[3.5px_3.5px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri berdasarkan nama atau NIS..."
            className="w-full pl-9 pr-4 py-2 border-2 border-slate-900 rounded-xl bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          >
            <option value="all">Semua Kelas</option>
            <option value="X - SMK Muhiba">Kelas X</option>
            <option value="XI - SMK Muhiba">Kelas XI</option>
            <option value="XII - SMK Muhiba">Kelas XII</option>
          </select>

          <select
            value={dormFilter}
            onChange={(e) => setDormFilter(e.target.value)}
            className="border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
          >
            <option value="all">Semua Asrama</option>
            <option value="Asrama Abu Bakar">Asrama Abu Bakar</option>
            <option value="Asrama Umar bin Khattab">Asrama Umar</option>
            <option value="Asrama Utsman bin Affan">Asrama Utsman</option>
            <option value="Asrama Ali bin Abi Thalib">Asrama Ali</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1e293b] overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900/10 flex items-center justify-between text-xs bg-[#FAF7F2]">
          <span className="font-display font-black text-slate-950">
            Daftar Santri ({filteredList.length} dari {santriList.length})
          </span>
          <span className="text-slate-500 font-mono font-medium">Diperbarui real-time</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#FEF9C3] text-slate-900 border-b-2 border-slate-900 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Santri</th>
                <th className="py-3 px-4">Kelas &amp; Kelompok</th>
                <th className="py-3 px-4">Asrama / Kamar</th>
                <th className="py-3 px-4">Wali &amp; Kontak</th>
                <th className="py-3 px-4 text-center">Status</th>
                {userRole === 'admin' && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900/10">
              {filteredList.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 font-bold text-[11px]">{s.studentNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-950">{s.fullName}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {s.className} &middot; <span className="text-emerald-800 font-bold">{s.groupName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{s.dormitory}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    <div>{s.guardianName || '-'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.guardianPhone || '-'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`neo-badge px-2.5 py-0.5 text-[10px] font-black ${
                        s.isActive ? 'bg-[#DCFCE7] text-emerald-950' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {userRole === 'admin' && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-800 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Santri"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Data Santri"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Santri */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-[8px_8px_0px_#1e293b] w-full max-w-lg p-6 sm:p-7 border-2 border-slate-900">
            <h3 className="font-display text-lg font-black text-slate-950 mb-1">
              {editingSantri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Data santri mukim Ponpes Baitul Arqom SMK Muhiba
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    NIS (Nomor Induk)
                  </label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Kelas
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  >
                    <option value="X - SMK Muhiba">Kelas X</option>
                    <option value="XI - SMK Muhiba">Kelas XI</option>
                    <option value="XII - SMK Muhiba">Kelas XII</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Fakhri Al-Ghifari"
                  className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Kelompok Tahfidz/Jurusan
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Contoh: Tahfidz Reguler"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-medium shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Asrama / Kamar
                  </label>
                  <select
                    value={dormitory}
                    onChange={(e) => setDormitory(e.target.value)}
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-bold shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  >
                    <option value="Asrama Abu Bakar">Asrama Abu Bakar</option>
                    <option value="Asrama Umar bin Khattab">Asrama Umar</option>
                    <option value="Asrama Utsman bin Affan">Asrama Utsman</option>
                    <option value="Asrama Ali bin Abi Thalib">Asrama Ali</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Nama Wali Santri
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Nama orang tua/wali"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                    Nomor WhatsApp Wali
                  </label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2 bg-white text-slate-900 font-mono shadow-[1.5px_1.5px_0px_rgba(30,41,59,0.1)] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSantri"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-2 border-slate-900 cursor-pointer"
                />
                <label htmlFor="isActiveSantri" className="font-bold text-slate-800 cursor-pointer text-xs">
                  Status Santri Aktif Mukim
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
                  {editingSantri ? 'Perbarui Data' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
