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
    if (confirm(`Yakin ingin menghapus data santri ${s.fullName}?`)) {
      await deleteSantri(s.id);
      onRefresh();
    }
  };

  const handleExportExcel = () => {
    const data = santriList.map((s, idx) => ({
      No: idx + 1,
      NIS: s.studentNumber,
      Nama_Lengkap: s.fullName,
      Kelas: s.className,
      Kelompok: s.groupName,
      Asrama: s.dormitory,
      Wali_Santri: s.guardianName || '-',
      No_HP_Wali: s.guardianPhone || '-',
      Status: s.isActive ? 'Aktif' : 'Nonaktif',
    }));
    exportDataToExcel(data, 'Data_Santri_Ponpes_Baitul_Arqom');
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
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Data Santri Pesantren
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen data santri, kelas, kelompok tahfidz/kejuruan, dan asrama
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
              <span>Tambah Santri</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri berdasarkan nama atau NIS..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">Semua Kelas</option>
            <option value="X - SMK Muhiba">Kelas X</option>
            <option value="XI - SMK Muhiba">Kelas XI</option>
            <option value="XII - SMK Muhiba">Kelas XII</option>
          </select>

          <select
            value={dormFilter}
            onChange={(e) => setDormFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
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
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Daftar Santri ({filteredList.length} dari {santriList.length})
          </span>
          <span className="text-slate-400">Diperbarui real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                <th className="py-3 px-4 font-semibold">NIS</th>
                <th className="py-3 px-4 font-semibold">Nama Lengkap Santri</th>
                <th className="py-3 px-4 font-semibold">Kelas & Kelompok</th>
                <th className="py-3 px-4 font-semibold">Asrama / Kamar</th>
                <th className="py-3 px-4 font-semibold">Wali & Kontak</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {userRole === 'admin' && (
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-600 text-[11px] whitespace-nowrap">
                    {s.studentNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{s.fullName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{s.className}</div>
                    <div className="text-[11px] text-emerald-700">{s.groupName}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.dormitory}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{s.guardianName || '-'}</div>
                    <div className="text-[11px] font-mono text-slate-400">{s.guardianPhone || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {userRole === 'admin' && (
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Data Santri"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Santri"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingSantri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ponpes Baitul Arqom SMK Muhiba
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS Santri</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="X - SMK Muhiba">X - SMK Muhiba</option>
                    <option value="XI - SMK Muhiba">XI - SMK Muhiba</option>
                    <option value="XII - SMK Muhiba">XII - SMK Muhiba</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai akte / ijazah"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok</label>
                  <select
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Tahfidz Al-Qur'an">Tahfidz Al-Qur'an</option>
                    <option value="Bahasa Arab & Inggris">Bahasa Arab & Inggris</option>
                    <option value="Kejuruan TI">Kejuruan TI</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asrama / Kamar</label>
                  <select
                    value={dormitory}
                    onChange={(e) => setDormitory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="Asrama Abu Bakar">Asrama Abu Bakar</option>
                    <option value="Asrama Umar bin Khattab">Asrama Umar bin Khattab</option>
                    <option value="Asrama Utsman bin Affan">Asrama Utsman bin Affan</option>
                    <option value="Asrama Ali bin Abi Thalib">Asrama Ali bin Abi Thalib</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Nama bapak/ibu wali"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP / WA Wali</label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveSantri"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="isActiveSantri" className="font-semibold text-slate-700 cursor-pointer">
                  Status Santri Aktif Mengikuti Kegiatan Pesantren
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
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
