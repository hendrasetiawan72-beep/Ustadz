export type UserRole = 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin';
  isActive: boolean;
  avatarUrl?: string;
}

export type Gender = 'L' | 'P';

export interface Ustadz {
  id: string;
  employeeNumber: string; // NIP / NIU
  fullName: string;
  gender?: Gender; // L untuk Ustadz, P untuk Ustadzah
  titlePrefix?: 'Ustadz' | 'Ustadzah';
  phone: string;
  email?: string;
  specialization?: string; // Bidang (Tahfidz, Fiqih, Umum)
  isActive: boolean;
  createdAt: string;
}

export type SantriClass = 'X - SMK Muhiba' | 'XI - SMK Muhiba' | 'XII - SMK Muhiba';
export type SantriGroup = 'Reguler' | 'Tahfidz Al-Qur\'an' | 'Bahasa Arab & Inggris' | 'Kejuruan TI';
export type SantriDormitory = 'Asrama Abu Bakar' | 'Asrama Umar bin Khattab' | 'Asrama Utsman bin Affan' | 'Asrama Ali bin Abi Thalib';

export interface Santri {
  id: string;
  studentNumber: string; // NIS / NISN
  fullName: string;
  className: SantriClass | string;
  groupName: SantriGroup | string;
  dormitory: SantriDormitory | string;
  guardianName?: string;
  guardianPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export type PiketStatus = 'terjadwal' | 'sudah_bertugas' | 'belum_bertugas' | 'izin_diganti';

export type SessionType = 'night' | 'morning';

export interface PiketSchedule {
  id: string;
  ustadzId: string;
  ustadzName?: string;
  scheduleDate: string; // YYYY-MM-DD
  sessionType: 'night' | 'morning' | 'both'; // Piket Kegiatan Malam, Pagi, atau Keduanya
  dayName: string; // Senin, Selasa, dll
  weekStart: string; // YYYY-MM-DD (start of that calendar week)
  status: PiketStatus;
  notes?: string;
  overrideReason?: string; // Reason if multiple duties in the same week
  substituteUstadzId?: string; // If replaced
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PiketRealization {
  id: string;
  scheduleId: string;
  actualDate: string; // YYYY-MM-DD
  checkInAt: string; // HH:mm
  checkOutAt?: string; // HH:mm
  verificationStatus: 'menunggu' | 'terverifikasi' | 'ditolak';
  notes?: string;
  incidentNotes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ActivitySession {
  id: string;
  activityId?: string;
  activityName: string;
  sessionType: SessionType; // 'night' = Maghrib-Isya, 'morning' = Subuh-06.00 WIB
  activityDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  ustadzId: string;
  ustadzName: string;
  topic?: string;
  incidentNotes?: string;
  status: 'selesai' | 'berlangsung' | 'dibatalkan';
  createdBy: string;
  createdAt: string;
}

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa' | 'terlambat' | 'dispensasi';

export interface StudentAttendance {
  id: string;
  sessionId: string;
  santriId: string;
  santriName?: string;
  santriNis?: string;
  className?: string;
  attendanceStatus: AttendanceStatus;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  institutionName: string;
  subTitle: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  weekStartsOn: number; // 1 for Monday
  nightSessionStart: string;
  nightSessionEnd: string;
  nightSessionDefaultTitle: string;
  morningSessionStart: string;
  morningSessionEnd: string;
  morningSessionDefaultTitle: string;
  leaderName: string; // Nama Pimpinan Ponpes
  leaderNip: string;
  dutySupervisorName: string; // Nama Koordinator Piket
  dutySupervisorNip: string;
  kopLetterheadEnabled: boolean;
}

export type ReportType =
  | 'jadwal_mingguan'
  | 'jadwal_bulanan'
  | 'realisasi_piket'
  | 'absensi_harian'
  | 'absensi_malam'
  | 'absensi_pagi'
  | 'rekap_santri_bulanan'
  | 'rekap_ustadz_bulanan'
  | 'laporan_kegiatan'
  | 'santri_ketidakhadiran_tinggi'
  | 'catatan_kejadian'
  | 'laporan_lengkap_bulanan';
