import React, { useState } from 'react';
import { ShieldCheck, Plus, User, Key, CheckCircle2, Lock } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../lib/constants';

interface ManajemenPenggunaViewProps {
  userRole: UserRole;
}

export const ManajemenPenggunaView: React.FC<ManajemenPenggunaViewProps> = ({
  userRole,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(DEMO_USERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ustadz_piket');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      fullName,
      role,
      isActive: true,
    };
    setUsers([...users, newUser]);
    setIsAddModalOpen(false);
    setEmail('');
    setFullName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Manajemen Pengguna & Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan akun Admin, Ustadz Piket, dan Kepala/Pengawas Pesantren
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* RBAC Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            1. Peran Admin
          </div>
          <p className="text-slate-600 leading-relaxed">
            Akses menyeluruh: kelola akun, data ustadz & santri, tentukan jadwal piket, impor/ekspor Excel, pengaturan lembaga, dan cetak seluruh dokumen PDF.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-blue-800 text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            2. Peran Ustadz Piket
          </div>
          <p className="text-slate-600 leading-relaxed">
            Melihat jadwal piket pribadinya, mengisi absensi santri (harian, maghrib, subuh), mencatat topik kajian, catatan kejadian, dan memeriksa riwayat piket.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-purple-800 text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            3. Peran Kepala / Pengawas
          </div>
          <p className="text-slate-600 leading-relaxed">
            Melihat rekapitulasi kepatuhan piket, evaluasi absensi santri, memantau santri ketidakhadiran tinggi, dan mencetak laporan resmi bulanan.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-800">Daftar Akun Pengguna Terdaftar</span>
          <span className="text-slate-400 font-mono">Total {users.length} Akun</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">Nama Pengguna</th>
                <th className="p-3">Email Login</th>
                <th className="p-3 text-center">Peran (Role)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {u.fullName[0]}
                      </div>
                      <span>{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{u.email}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'ustadz_piket'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {u.role === 'admin'
                        ? 'Admin'
                        : u.role === 'ustadz_piket'
                        ? 'Ustadz Piket'
                        : 'Kepala / Pengawas'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Aktif
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-[11px] text-slate-400 font-mono flex items-center justify-end gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Terlindungi RLS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tambah Akun Pengguna Baru
            </h3>
            <p className="text-slate-500 mb-4">
              Ponpes Baitul Arqom SMK Muhiba
            </p>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ustadz H. Ahmad Dahlan"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@baitularqom.muhiba.id"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran / Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="admin">Admin (Akses Penuh)</option>
                  <option value="ustadz_piket">Ustadz Piket (Pencatatan Absensi & Tugas)</option>
                  <option value="kepala_pengawas">Kepala / Pengawas (Monitoring & Laporan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
