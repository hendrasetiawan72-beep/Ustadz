import {
  AppSettings,
  Ustadz,
  Santri,
  PiketSchedule,
  ActivitySession,
  StudentAttendance,
  AuditLog,
  PiketRealization,
  RecurringScheduleItem,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_RECURRING_TEMPLATE,
  OFFICIAL_LOGO_URL,
  INITIAL_USTADZ,
  INITIAL_SANTRI,
  INITIAL_SCHEDULES,
  INITIAL_ACTIVITY_SESSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_AUDIT_LOGS,
} from './constants';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'ponpes_settings',
  USTADZ: 'ponpes_ustadz',
  SANTRI: 'ponpes_santri',
  SCHEDULES: 'ponpes_schedules',
  REALIZATIONS: 'ponpes_realizations',
  SESSIONS: 'ponpes_sessions',
  ATTENDANCE: 'ponpes_attendance',
  AUDIT: 'ponpes_audit_logs',
};

// Local storage helpers - ONLY used in Demo Mode
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T): void {
  // Hanya simpan jika Supabase BELUM dikonfigurasi (Mode Demo)
  // Saat Supabase aktif, dilarang menyimpan data operasional pribadi anak ke localStorage
  if (isSupabaseConfigured()) {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export function getStartOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getDayIndoName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

// ==========================================
// 1. APP SETTINGS
// ==========================================
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('app_settings')
      .select(
        'id, institution_name, sub_title, logo_url, address, phone, email, website, timezone, week_starts_on, night_session_start, night_session_end, night_session_default_title, morning_session_start, morning_session_end, morning_session_default_title, leader_name, leader_nip, duty_supervisor_name, duty_supervisor_nip, kop_letterhead_enabled, document_city, document_date_mode, manual_document_date, recurring_template'
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memuat pengaturan lembaga dari database: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        institutionName: data.institution_name || DEFAULT_SETTINGS.institutionName,
        subTitle: data.sub_title || DEFAULT_SETTINGS.subTitle,
        logoUrl: OFFICIAL_LOGO_URL,
        address: data.address || DEFAULT_SETTINGS.address,
        phone: data.phone || DEFAULT_SETTINGS.phone,
        email: data.email || DEFAULT_SETTINGS.email,
        website: data.website || DEFAULT_SETTINGS.website,
        timezone: data.timezone || 'Asia/Jakarta',
        weekStartsOn: data.week_starts_on ?? 1,
        nightSessionStart: data.night_session_start || DEFAULT_SETTINGS.nightSessionStart,
        nightSessionEnd: data.night_session_end || DEFAULT_SETTINGS.nightSessionEnd,
        nightSessionDefaultTitle: data.night_session_default_title || DEFAULT_SETTINGS.nightSessionDefaultTitle,
        morningSessionStart: data.morning_session_start || DEFAULT_SETTINGS.morningSessionStart,
        morningSessionEnd: data.morning_session_end || DEFAULT_SETTINGS.morningSessionEnd,
        morningSessionDefaultTitle: data.morning_session_default_title || DEFAULT_SETTINGS.morningSessionDefaultTitle,
        leaderName: data.leader_name || DEFAULT_SETTINGS.leaderName,
        leaderNip: data.leader_nip || DEFAULT_SETTINGS.leaderNip,
        dutySupervisorName: data.duty_supervisor_name || DEFAULT_SETTINGS.dutySupervisorName,
        dutySupervisorNip: data.duty_supervisor_nip || DEFAULT_SETTINGS.dutySupervisorNip,
        kopLetterheadEnabled: data.kop_letterhead_enabled ?? true,
        documentCity: data.document_city || DEFAULT_SETTINGS.documentCity,
        documentDateMode: data.document_date_mode || DEFAULT_SETTINGS.documentDateMode,
        manualDocumentDate: data.manual_document_date || DEFAULT_SETTINGS.manualDocumentDate,
        recurringTemplate: data.recurring_template || DEFAULT_SETTINGS.recurringTemplate,
      };
    }
  }

  // Demo fallback only if Supabase not configured
  const local = loadLocal<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...local,
    institutionName: local.institutionName || DEFAULT_SETTINGS.institutionName,
    subTitle: local.subTitle || DEFAULT_SETTINGS.subTitle,
    logoUrl: OFFICIAL_LOGO_URL,
    documentCity: local.documentCity || DEFAULT_SETTINGS.documentCity,
    documentDateMode: local.documentDateMode || DEFAULT_SETTINGS.documentDateMode,
    manualDocumentDate: local.manualDocumentDate || DEFAULT_SETTINGS.manualDocumentDate,
    recurringTemplate:
      local.recurringTemplate && local.recurringTemplate.length > 0
        ? local.recurringTemplate
        : DEFAULT_RECURRING_TEMPLATE,
  };
}

export async function updateAppSettings(
  settings: Partial<AppSettings>,
  actorName: string = 'Pengelola Lembaga'
): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = { ...current, ...settings, logoUrl: OFFICIAL_LOGO_URL };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('app_settings').upsert({
      id: updated.id || 'setting-default',
      institution_name: updated.institutionName,
      sub_title: updated.subTitle,
      logo_url: updated.logoUrl,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      website: updated.website,
      timezone: updated.timezone,
      week_starts_on: updated.weekStartsOn,
      night_session_start: updated.nightSessionStart,
      night_session_end: updated.nightSessionEnd,
      night_session_default_title: updated.nightSessionDefaultTitle,
      morning_session_start: updated.morningSessionStart,
      morning_session_end: updated.morningSessionEnd,
      morning_session_default_title: updated.morningSessionDefaultTitle,
      leader_name: updated.leaderName,
      leader_nip: updated.leaderNip,
      duty_supervisor_name: updated.dutySupervisorName,
      duty_supervisor_nip: updated.dutySupervisorNip,
      kop_letterhead_enabled: updated.kopLetterheadEnabled,
      document_city: updated.documentCity,
      document_date_mode: updated.documentDateMode,
      manual_document_date: updated.manualDocumentDate,
      recurring_template: updated.recurringTemplate,
    });

    if (error) {
      throw new Error(`Gagal menyimpan pengaturan ke database: ${error.message}`);
    }
  } else {
    saveLocal(STORAGE_KEYS.SETTINGS, updated);
  }

  await addAuditLog({
    actorName,
    action: 'UPDATE_SETTINGS',
    entityType: 'app_settings',
    details: 'Memperbarui profil lembaga dan pengaturan operasional pesantren.',
  });

  return updated;
}

// ==========================================
// 2. USTADZ
// ==========================================
export async function getUstadzList(): Promise<Ustadz[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('ustadz')
      .select('id, employee_number, full_name, phone, email, specialization, is_active, created_at')
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(`Gagal memuat data Ustadz dari database: ${error.message}`);
    }

    return (data || []).map((u) => ({
      id: u.id,
      employeeNumber: u.employee_number,
      fullName: u.full_name,
      phone: u.phone,
      email: u.email,
      specialization: u.specialization,
      isActive: u.is_active,
      createdAt: u.created_at,
    }));
  }

  return loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
}

export async function addUstadz(
  ustadz: Omit<Ustadz, 'id' | 'createdAt'>,
  actorName: string = 'Pengelola Piket'
): Promise<Ustadz> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newUstadz: Ustadz = { ...ustadz, id, createdAt };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('ustadz').insert({
      id: newUstadz.id,
      employee_number: newUstadz.employeeNumber,
      full_name: newUstadz.fullName,
      phone: newUstadz.phone,
      email: newUstadz.email,
      specialization: newUstadz.specialization,
      is_active: newUstadz.isActive,
    });

    if (error) {
      throw new Error(`Gagal menambahkan data Ustadz: ${error.message}`);
    }
  } else {
    const current = loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
    saveLocal(STORAGE_KEYS.USTADZ, [newUstadz, ...current]);
  }

  await addAuditLog({
    actorName,
    action: 'TAMBAH_USTADZ',
    entityType: 'ustadz',
    entityId: newUstadz.id,
    details: `Menambahkan data Ustadz: ${newUstadz.fullName} (${newUstadz.employeeNumber}).`,
  });

  return newUstadz;
}

export async function updateUstadz(
  id: string,
  updates: Partial<Ustadz>,
  actorName: string = 'Pengelola Piket'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const dbPayload: Record<string, unknown> = {};
    if (updates.employeeNumber !== undefined) dbPayload.employee_number = updates.employeeNumber;
    if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.email !== undefined) dbPayload.email = updates.email;
    if (updates.specialization !== undefined) dbPayload.specialization = updates.specialization;
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

    const { error } = await supabase.from('ustadz').update(dbPayload).eq('id', id);
    if (error) {
      throw new Error(`Gagal memperbarui data Ustadz: ${error.message}`);
    }
  } else {
    const current = loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
    const idx = current.findIndex((u) => u.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      saveLocal(STORAGE_KEYS.USTADZ, current);
    }
  }

  await addAuditLog({
    actorName,
    action: 'EDIT_USTADZ',
    entityType: 'ustadz',
    entityId: id,
    details: `Mengubah data Ustadz: ${updates.fullName || id}.`,
  });
}

export async function deleteUstadz(
  id: string,
  ustadzName: string = '',
  actorName: string = 'Pengelola Piket'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('ustadz').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus data Ustadz: ${error.message}`);
    }
  } else {
    const current = loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
    saveLocal(
      STORAGE_KEYS.USTADZ,
      current.filter((u) => u.id !== id)
    );
  }

  await addAuditLog({
    actorName,
    action: 'HAPUS_USTADZ',
    entityType: 'ustadz',
    entityId: id,
    details: `Menghapus data Ustadz: ${ustadzName || id}.`,
  });
}

// Batch upsert for Excel import
export async function batchUpsertUstadz(
  ustadzList: Omit<Ustadz, 'id' | 'createdAt'>[],
  actorName: string = 'Pengelola Piket'
): Promise<{ count: number }> {
  if (ustadzList.length === 0) return { count: 0 };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const rows = ustadzList.map((u) => ({
      id: crypto.randomUUID(),
      employee_number: u.employeeNumber,
      full_name: u.fullName,
      phone: u.phone,
      email: u.email,
      specialization: u.specialization,
      is_active: u.isActive,
    }));

    const { error } = await supabase.from('ustadz').upsert(rows, { onConflict: 'employee_number' });
    if (error) {
      throw new Error(`Gagal melakukan impor batch Ustadz: ${error.message}`);
    }
  } else {
    const current = loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
    const existingMap = new Map(current.map((u) => [u.employeeNumber, u]));
    ustadzList.forEach((u) => {
      const existing = existingMap.get(u.employeeNumber);
      if (existing) {
        Object.assign(existing, u);
      } else {
        const item: Ustadz = {
          ...u,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        current.push(item);
        existingMap.set(u.employeeNumber, item);
      }
    });
    saveLocal(STORAGE_KEYS.USTADZ, current);
  }

  await addAuditLog({
    actorName,
    action: 'IMPOR_EXCEL_USTADZ',
    entityType: 'ustadz',
    details: `Mengimpor ${ustadzList.length} data Ustadz secara massal melalui file Excel.`,
  });

  return { count: ustadzList.length };
}

// ==========================================
// 3. SANTRI
// ==========================================
export async function getSantriList(): Promise<Santri[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('santri')
      .select('id, student_number, full_name, class_name, group_name, dormitory, guardian_name, guardian_phone, is_active, created_at')
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(`Gagal memuat data Santri dari database: ${error.message}`);
    }

    return (data || []).map((s) => ({
      id: s.id,
      studentNumber: s.student_number,
      fullName: s.full_name,
      className: s.class_name,
      groupName: s.group_name,
      dormitory: s.dormitory,
      guardianName: s.guardian_name,
      guardianPhone: s.guardian_phone,
      isActive: s.is_active,
      createdAt: s.created_at,
    }));
  }

  return loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
}

export async function addSantri(
  santri: Omit<Santri, 'id' | 'createdAt'>,
  actorName: string = 'Pengelola Santri'
): Promise<Santri> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newSantri: Santri = { ...santri, id, createdAt };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('santri').insert({
      id: newSantri.id,
      student_number: newSantri.studentNumber,
      full_name: newSantri.fullName,
      class_name: newSantri.className,
      group_name: newSantri.groupName,
      dormitory: newSantri.dormitory,
      guardian_name: newSantri.guardianName,
      guardian_phone: newSantri.guardianPhone,
      is_active: newSantri.isActive,
    });

    if (error) {
      throw new Error(`Gagal menambahkan data santri: ${error.message}`);
    }
  } else {
    const current = loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
    saveLocal(STORAGE_KEYS.SANTRI, [newSantri, ...current]);
  }

  await addAuditLog({
    actorName,
    action: 'TAMBAH_SANTRI',
    entityType: 'santri',
    entityId: newSantri.id,
    details: `Mendaftarkan santri baru: ${newSantri.fullName} (${newSantri.studentNumber}) - Kelas ${newSantri.className}.`,
  });

  return newSantri;
}

export async function updateSantri(
  id: string,
  updates: Partial<Santri>,
  actorName: string = 'Pengelola Santri'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const dbPayload: Record<string, unknown> = {};
    if (updates.studentNumber !== undefined) dbPayload.student_number = updates.studentNumber;
    if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
    if (updates.className !== undefined) dbPayload.class_name = updates.className;
    if (updates.groupName !== undefined) dbPayload.group_name = updates.groupName;
    if (updates.dormitory !== undefined) dbPayload.dormitory = updates.dormitory;
    if (updates.guardianName !== undefined) dbPayload.guardian_name = updates.guardianName;
    if (updates.guardianPhone !== undefined) dbPayload.guardian_phone = updates.guardianPhone;
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

    const { error } = await supabase.from('santri').update(dbPayload).eq('id', id);
    if (error) {
      throw new Error(`Gagal memperbarui data santri: ${error.message}`);
    }
  } else {
    const current = loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
    const idx = current.findIndex((s) => s.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      saveLocal(STORAGE_KEYS.SANTRI, current);
    }
  }

  await addAuditLog({
    actorName,
    action: 'EDIT_SANTRI',
    entityType: 'santri',
    entityId: id,
    details: `Memperbarui data santri: ${updates.fullName || id}.`,
  });
}

export async function deleteSantri(
  id: string,
  santriName: string = '',
  actorName: string = 'Pengelola Santri'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('santri').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus data santri: ${error.message}`);
    }
  } else {
    const current = loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
    saveLocal(
      STORAGE_KEYS.SANTRI,
      current.filter((s) => s.id !== id)
    );
  }

  await addAuditLog({
    actorName,
    action: 'HAPUS_SANTRI',
    entityType: 'santri',
    entityId: id,
    details: `Menghapus data santri: ${santriName || id}.`,
  });
}

// Batch upsert for Excel import (1 single upsert query + 1 audit log summary)
export async function batchUpsertSantri(
  santriList: Omit<Santri, 'id' | 'createdAt'>[],
  actorName: string = 'Pengelola Santri'
): Promise<{ count: number }> {
  if (santriList.length === 0) return { count: 0 };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const rows = santriList.map((s) => ({
      id: crypto.randomUUID(),
      student_number: s.studentNumber,
      full_name: s.fullName,
      class_name: s.className,
      group_name: s.groupName,
      dormitory: s.dormitory,
      guardian_name: s.guardianName,
      guardian_phone: s.guardianPhone,
      is_active: s.isActive,
    }));

    const { error } = await supabase.from('santri').upsert(rows, { onConflict: 'student_number' });
    if (error) {
      throw new Error(`Gagal melakukan impor batch Santri: ${error.message}`);
    }
  } else {
    const current = loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
    const existingMap = new Map(current.map((s) => [s.studentNumber, s]));
    santriList.forEach((s) => {
      const existing = existingMap.get(s.studentNumber);
      if (existing) {
        Object.assign(existing, s);
      } else {
        const item: Santri = {
          ...s,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        current.push(item);
        existingMap.set(s.studentNumber, item);
      }
    });
    saveLocal(STORAGE_KEYS.SANTRI, current);
  }

  await addAuditLog({
    actorName,
    action: 'IMPOR_EXCEL_SANTRI',
    entityType: 'santri',
    details: `Mengimpor ${santriList.length} data Santri secara massal melalui file Excel.`,
  });

  return { count: santriList.length };
}

// ==========================================
// 4. JADWAL PIKET USTADZ
// ==========================================
export async function getPiketSchedules(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<PiketSchedule[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    let query = supabase
      .from('piket_schedule')
      .select('id, ustadz_id, schedule_date, session_type, day_name, week_start, status, notes, override_reason, substitute_ustadz_id, created_by, created_at, updated_at, ustadz:ustadz_id(full_name)')
      .order('schedule_date', { ascending: true });

    if (options?.startDate) {
      query = query.gte('schedule_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('schedule_date', options.endDate);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal memuat jadwal piket dari database: ${error.message}`);
    }

    return (data || []).map((s) => {
      const ustadzObj = s.ustadz as unknown as { full_name?: string } | null;
      return {
        id: s.id,
        ustadzId: s.ustadz_id,
        ustadzName: ustadzObj?.full_name || 'Ustadz',
        scheduleDate: s.schedule_date,
        sessionType: s.session_type || 'both',
        dayName: s.day_name || getDayIndoName(s.schedule_date),
        weekStart: s.week_start,
        status: s.status,
        notes: s.notes,
        overrideReason: s.override_reason,
        substituteUstadzId: s.substitute_ustadz_id,
        createdBy: s.created_by,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });
  }

  return loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
}

export async function checkWeeklyDutyConflict(
  ustadzId: string,
  scheduleDate: string,
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; existingDate?: string }> {
  const weekStart = getStartOfWeek(scheduleDate);
  const supabase = getSupabaseClient();

  if (supabase && isSupabaseConfigured()) {
    let query = supabase
      .from('piket_schedule')
      .select('id, schedule_date')
      .eq('ustadz_id', ustadzId)
      .eq('week_start', weekStart)
      .neq('status', 'izin_diganti');

    if (excludeScheduleId) {
      query = query.neq('id', excludeScheduleId);
    }

    const { data } = await query.limit(1);
    if (data && data.length > 0) {
      return { hasConflict: true, existingDate: data[0].schedule_date };
    }
    return { hasConflict: false };
  }

  const schedules = loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  const conflict = schedules.find(
    (s) =>
      s.ustadzId === ustadzId &&
      s.weekStart === weekStart &&
      s.id !== excludeScheduleId &&
      s.status !== 'izin_diganti'
  );
  if (conflict) {
    return { hasConflict: true, existingDate: conflict.scheduleDate };
  }
  return { hasConflict: false };
}

export async function addPiketSchedule(
  schedule: Omit<PiketSchedule, 'id' | 'createdAt' | 'updatedAt' | 'weekStart' | 'dayName'> & {
    allowOverride?: boolean;
    overrideReason?: string;
  },
  actorName: string = 'Pengelola Jadwal'
): Promise<PiketSchedule> {
  const weekStart = getStartOfWeek(schedule.scheduleDate);
  const dayName = getDayIndoName(schedule.scheduleDate);

  if (!schedule.allowOverride) {
    const { hasConflict, existingDate } = await checkWeeklyDutyConflict(
      schedule.ustadzId,
      schedule.scheduleDate
    );
    if (hasConflict) {
      throw new Error(
        `Aturan Pelanggaran Piket: Ustadz ini telah memiliki jadwal pada pekan berjalan (${existingDate}). Setiap ustadz hanya boleh bertugas 1x per pekan kecuali ada penugasan khusus.`
      );
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newSchedule: PiketSchedule = {
    ...schedule,
    id,
    weekStart,
    dayName,
    createdAt: now,
    updatedAt: now,
  };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('piket_schedule').insert({
      id: newSchedule.id,
      ustadz_id: newSchedule.ustadzId,
      schedule_date: newSchedule.scheduleDate,
      session_type: newSchedule.sessionType,
      day_name: newSchedule.dayName,
      week_start: newSchedule.weekStart,
      status: newSchedule.status,
      notes: newSchedule.notes,
      override_reason: newSchedule.overrideReason,
      substitute_ustadz_id: newSchedule.substituteUstadzId,
    });

    if (error) {
      throw new Error(`Gagal menyimpan jadwal piket: ${error.message}`);
    }
  } else {
    const current = loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    saveLocal(STORAGE_KEYS.SCHEDULES, [...current, newSchedule]);
  }

  await addAuditLog({
    actorName,
    action: 'TAMBAH_JADWAL_PIKET',
    entityType: 'piket_schedule',
    entityId: newSchedule.id,
    details: `Menetapkan jadwal piket: ${newSchedule.ustadzName} (${newSchedule.sessionType === 'morning' ? 'Pagi' : newSchedule.sessionType === 'night' ? 'Malam' : 'Malam & Pagi'}) hari ${newSchedule.dayName}, ${newSchedule.scheduleDate}.`,
  });

  return newSchedule;
}

export async function updatePiketSchedule(
  id: string,
  updates: Partial<PiketSchedule>,
  actorName: string = 'Pengelola Jadwal'
): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase && isSupabaseConfigured()) {
    const dbPayload: Record<string, unknown> = { updated_at: now };
    if (updates.ustadzId !== undefined) dbPayload.ustadz_id = updates.ustadzId;
    if (updates.scheduleDate !== undefined) {
      dbPayload.schedule_date = updates.scheduleDate;
      dbPayload.week_start = getStartOfWeek(updates.scheduleDate);
      dbPayload.day_name = getDayIndoName(updates.scheduleDate);
    }
    if (updates.sessionType !== undefined) dbPayload.session_type = updates.sessionType;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.notes !== undefined) dbPayload.notes = updates.notes;
    if (updates.overrideReason !== undefined) dbPayload.override_reason = updates.overrideReason;
    if (updates.substituteUstadzId !== undefined) dbPayload.substitute_ustadz_id = updates.substituteUstadzId;

    const { error } = await supabase.from('piket_schedule').update(dbPayload).eq('id', id);
    if (error) {
      throw new Error(`Gagal memperbarui jadwal piket: ${error.message}`);
    }
  } else {
    const current = loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    const idx = current.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const existing = current[idx];
      const updated = { ...existing, ...updates, updatedAt: now };
      if (updates.scheduleDate) {
        updated.weekStart = getStartOfWeek(updates.scheduleDate);
        updated.dayName = getDayIndoName(updates.scheduleDate);
      }
      current[idx] = updated;
      saveLocal(STORAGE_KEYS.SCHEDULES, current);
    }
  }

  await addAuditLog({
    actorName,
    action: 'UPDATE_JADWAL_PIKET',
    entityType: 'piket_schedule',
    entityId: id,
    details: `Memperbarui jadwal piket (Status: ${updates.status || 'diubah'}).`,
  });
}

export async function deletePiketSchedule(
  id: string,
  scheduleDetails: string = '',
  actorName: string = 'Pengelola Jadwal'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('piket_schedule').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus jadwal piket: ${error.message}`);
    }
  } else {
    const current = loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    saveLocal(
      STORAGE_KEYS.SCHEDULES,
      current.filter((s) => s.id !== id)
    );
  }

  await addAuditLog({
    actorName,
    action: 'HAPUS_JADWAL_PIKET',
    entityType: 'piket_schedule',
    entityId: id,
    details: `Menghapus jadwal piket: ${scheduleDetails || id}.`,
  });
}

// Generates recurring schedules, upserting ONLY changed or newly created rows!
export async function generateRecurringPiketSchedules(options: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  template: RecurringScheduleItem[];
  overwriteExisting: boolean;
  actorName?: string;
}): Promise<{ totalCreated: number; totalUpdated: number; totalSkipped: number }> {
  const { startDate, endDate, template, overwriteExisting, actorName = 'Pengelola Jadwal' } = options;

  const currentSchedules = await getPiketSchedules({ startDate, endDate });
  const ustadzList = await getUstadzList();
  const ustadzMap = new Map(ustadzList.map((u) => [u.id, u.fullName]));

  // Map template by dayOfWeek
  const templateByDay = new Map<number, RecurringScheduleItem>();
  template.forEach((item) => {
    if (item.isEnabled && item.ustadzId) {
      templateByDay.set(item.dayOfWeek, item);
    }
  });

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    throw new Error('Tanggal mulai tidak boleh melebihi tanggal selesai.');
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  const existingMap = new Map<string, PiketSchedule>();
  currentSchedules.forEach((s) => existingMap.set(s.scheduleDate, s));

  // Rows that are actually new or modified (ONLY these are sent to DB)
  const rowsToUpsert: PiketSchedule[] = [];
  const cur = new Date(start);

  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0];
    const dayOfWeek = cur.getDay(); // 0 = Ahad, 1 = Senin, ...
    const pattern = templateByDay.get(dayOfWeek);

    if (pattern) {
      const existing = existingMap.get(dateStr);
      const uName = ustadzMap.get(pattern.ustadzId) || pattern.ustadzName || 'Ustadz Piket';
      const dayName = getDayIndoName(dateStr);
      const weekStart = getStartOfWeek(dateStr);

      if (existing) {
        if (overwriteExisting) {
          const updated: PiketSchedule = {
            ...existing,
            ustadzId: pattern.ustadzId,
            ustadzName: uName,
            sessionType: pattern.sessionType || 'both',
            notes: pattern.notes || existing.notes || 'Jadwal berulang otomatis',
            updatedAt: new Date().toISOString(),
          };
          rowsToUpsert.push(updated);
          totalUpdated++;
        } else {
          totalSkipped++;
        }
      } else {
        const newSchedule: PiketSchedule = {
          id: crypto.randomUUID(),
          ustadzId: pattern.ustadzId,
          ustadzName: uName,
          scheduleDate: dateStr,
          sessionType: pattern.sessionType || 'both',
          dayName,
          weekStart,
          status: 'terjadwal',
          notes: pattern.notes || 'Jadwal berulang otomatis',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        rowsToUpsert.push(newSchedule);
        existingMap.set(dateStr, newSchedule);
        totalCreated++;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured() && rowsToUpsert.length > 0) {
    const upsertRows = rowsToUpsert.map((s) => ({
      id: s.id,
      ustadz_id: s.ustadzId,
      schedule_date: s.scheduleDate,
      session_type: s.sessionType,
      day_name: s.dayName,
      week_start: s.weekStart,
      status: s.status,
      notes: s.notes,
    }));

    const { error } = await supabase.from('piket_schedule').upsert(upsertRows);
    if (error) {
      throw new Error(`Gagal menyimpan jadwal berulang ke database: ${error.message}`);
    }
  } else if (!isSupabaseConfigured()) {
    const all = loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    const allMap = new Map(all.map((s) => [s.id, s]));
    rowsToUpsert.forEach((r) => allMap.set(r.id, r));
    const merged = Array.from(allMap.values()).sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
    saveLocal(STORAGE_KEYS.SCHEDULES, merged);
  }

  await addAuditLog({
    actorName,
    action: 'GENERATE_JADWAL_BERULANG',
    entityType: 'piket_schedule',
    details: `Men-generate jadwal berulang ${startDate} s/d ${endDate}: ${totalCreated} baru, ${totalUpdated} diperbarui, ${totalSkipped} dilewati.`,
  });

  return { totalCreated, totalUpdated, totalSkipped };
}

// ==========================================
// 5. KEGIATAN SESI (Malam & Pagi)
// ==========================================
export async function getActivitySessions(options?: {
  limit?: number;
  daysBack?: number;
}): Promise<ActivitySession[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const days = options?.daysBack ?? 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const query = supabase
      .from('activity_sessions')
      .select('id, activity_id, activity_name, session_type, activity_date, start_time, end_time, ustadz_id, ustadz_name, topic, incident_notes, status, created_by, created_at')
      .gte('activity_date', cutoffStr)
      .order('activity_date', { ascending: false })
      .limit(options?.limit ?? 250);

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal memuat sesi kegiatan dari database: ${error.message}`);
    }

    return (data || []).map((s) => ({
      id: s.id,
      activityId: s.activity_id,
      activityName: s.activity_name,
      sessionType: s.session_type,
      activityDate: s.activity_date,
      startTime: s.start_time,
      endTime: s.end_time,
      ustadzId: s.ustadz_id,
      ustadzName: s.ustadz_name,
      topic: s.topic,
      incidentNotes: s.incident_notes,
      status: s.status,
      createdBy: s.created_by,
      createdAt: s.created_at,
    }));
  }

  return loadLocal<ActivitySession[]>(STORAGE_KEYS.SESSIONS, INITIAL_ACTIVITY_SESSIONS);
}

export async function addActivitySession(
  session: Omit<ActivitySession, 'id' | 'createdAt'>,
  actorName?: string
): Promise<ActivitySession> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newSession: ActivitySession = { ...session, id, createdAt };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('activity_sessions').insert({
      id: newSession.id,
      activity_id: newSession.activityId,
      activity_name: newSession.activityName,
      session_type: newSession.sessionType,
      activity_date: newSession.activityDate,
      start_time: newSession.startTime,
      end_time: newSession.endTime,
      ustadz_id: newSession.ustadzId,
      ustadz_name: newSession.ustadzName,
      topic: newSession.topic,
      incident_notes: newSession.incidentNotes,
      status: newSession.status,
    });

    if (error) {
      throw new Error(`Gagal mencatat kegiatan sesi: ${error.message}`);
    }
  } else {
    const current = loadLocal<ActivitySession[]>(STORAGE_KEYS.SESSIONS, INITIAL_ACTIVITY_SESSIONS);
    saveLocal(STORAGE_KEYS.SESSIONS, [newSession, ...current]);
  }

  await addAuditLog({
    actorName: actorName || session.ustadzName || 'Ustadz Bertugas',
    action: newSession.sessionType === 'morning' ? 'INPUT_KEGIATAN_PAGI' : 'INPUT_KEGIATAN_MALAM',
    entityType: 'activity_sessions',
    entityId: newSession.id,
    details: `Mencatat sesi ${newSession.sessionType === 'morning' ? 'Pagi' : 'Malam'} (${newSession.activityName}) tanggal ${newSession.activityDate}.`,
  });

  return newSession;
}

export async function updateActivitySession(
  id: string,
  updates: Partial<ActivitySession>,
  actorName?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const dbPayload: Record<string, unknown> = {};
    if (updates.activityName !== undefined) dbPayload.activity_name = updates.activityName;
    if (updates.startTime !== undefined) dbPayload.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbPayload.end_time = updates.endTime;
    if (updates.ustadzId !== undefined) dbPayload.ustadz_id = updates.ustadzId;
    if (updates.ustadzName !== undefined) dbPayload.ustadz_name = updates.ustadzName;
    if (updates.topic !== undefined) dbPayload.topic = updates.topic;
    if (updates.incidentNotes !== undefined) dbPayload.incident_notes = updates.incidentNotes;
    if (updates.status !== undefined) dbPayload.status = updates.status;

    const { error } = await supabase.from('activity_sessions').update(dbPayload).eq('id', id);
    if (error) {
      throw new Error(`Gagal memperbarui kegiatan sesi: ${error.message}`);
    }
  } else {
    const current = loadLocal<ActivitySession[]>(STORAGE_KEYS.SESSIONS, INITIAL_ACTIVITY_SESSIONS);
    const idx = current.findIndex((s) => s.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      saveLocal(STORAGE_KEYS.SESSIONS, current);
    }
  }

  await addAuditLog({
    actorName: actorName || 'Ustadz Bertugas',
    action: 'UPDATE_KEGIATAN',
    entityType: 'activity_sessions',
    entityId: id,
    details: 'Memperbarui materi atau catatan kegiatan sesi.',
  });
}

// ==========================================
// 6. ABSENSI SANTRI
// ==========================================
export async function getStudentAttendances(options?: {
  daysBack?: number;
  limit?: number;
}): Promise<StudentAttendance[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const days = options?.daysBack ?? 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    const { data, error } = await supabase
      .from('student_attendance')
      .select('id, session_id, santri_id, attendance_status, notes, recorded_by, created_at, updated_at')
      .gte('created_at', cutoffStr)
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 1500);

    if (error) {
      throw new Error(`Gagal memuat absensi santri dari database: ${error.message}`);
    }

    return (data || []).map((a) => ({
      id: a.id,
      sessionId: a.session_id,
      santriId: a.santri_id,
      attendanceStatus: a.attendance_status,
      notes: a.notes,
      recordedBy: a.recorded_by,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  }

  return loadLocal<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
}

export async function saveStudentAttendanceBatch(
  sessionId: string,
  attendances: Array<{
    santriId: string;
    attendanceStatus: StudentAttendance['attendanceStatus'];
    notes?: string;
  }>,
  actorName: string = 'Petugas Piket'
): Promise<StudentAttendance[]> {
  const now = new Date().toISOString();
  const createdList: StudentAttendance[] = attendances.map((item) => ({
    id: crypto.randomUUID(),
    sessionId,
    santriId: item.santriId,
    attendanceStatus: item.attendanceStatus,
    notes: item.notes || '',
    recordedBy: actorName,
    createdAt: now,
    updatedAt: now,
  }));

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const rows = createdList.map((a) => ({
      id: a.id,
      session_id: a.sessionId,
      santri_id: a.santriId,
      attendance_status: a.attendanceStatus,
      notes: a.notes,
      updated_at: now,
    }));

    const { error } = await supabase
      .from('student_attendance')
      .upsert(rows, { onConflict: 'session_id,santri_id' });

    if (error) {
      throw new Error(`Gagal menyimpan absensi santri: ${error.message}`);
    }
  } else {
    const current = loadLocal<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const filtered = current.filter((a) => a.sessionId !== sessionId);
    saveLocal(STORAGE_KEYS.ATTENDANCE, [...filtered, ...createdList]);
  }

  const hadirCount = attendances.filter((a) => a.attendanceStatus === 'hadir').length;
  await addAuditLog({
    actorName,
    action: 'SIMPAN_ABSENSI_SANTRI',
    entityType: 'student_attendance',
    entityId: sessionId,
    details: `Menyimpan absensi ${attendances.length} santri (Hadir: ${hadirCount}, Lainnya: ${attendances.length - hadirCount}).`,
  });

  return createdList;
}

// ==========================================
// 7. AUDIT LOGS
// ==========================================
export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_id, actor_name, action, entity_type, entity_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Gagal memuat log audit: ${error.message}`);
    }

    return (data || []).map((l) => ({
      id: l.id,
      actorId: l.actor_id,
      actorName: l.actor_name,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      details: l.details,
      createdAt: l.created_at,
    }));
  }

  return loadLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
}

export async function addAuditLog(
  log: Omit<AuditLog, 'id' | 'createdAt' | 'actorId'> & { actorId?: string }
): Promise<AuditLog> {
  const newLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    actorId: log.actorId || '',
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    // Database RLS/trigger automatically assigns actor_id from auth.uid()
    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        actor_name: newLog.actorName,
        action: newLog.action,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        details: newLog.details,
      });
    } catch {
      // Audit log silent fail if restricted by RLS
    }
  } else {
    const current = loadLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    saveLocal(STORAGE_KEYS.AUDIT, [newLog, ...current].slice(0, 100));
  }

  return newLog;
}

// Reset data to demo state (Demo Mode only)
export function resetToInitialData(): void {
  if (isSupabaseConfigured()) {
    alert('Operasi ditolak: Reset data lokal dinonaktifkan saat database Supabase cloud aktif.');
    return;
  }
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.USTADZ, JSON.stringify(INITIAL_USTADZ));
  localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_ACTIVITY_SESSIONS));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
}
