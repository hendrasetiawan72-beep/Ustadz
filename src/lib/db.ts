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
import { getSupabaseClient } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'ponpes_settings',
  USTADZ: 'ponpes_ustadz',
  SANTRI: 'ponpes_santri',
  SCHEDULES: 'ponpes_schedules',
  REALIZATIONS: 'ponpes_realizations',
  SESSIONS: 'ponpes_sessions',
  ATTENDANCE: 'ponpes_attendance',
  AUDIT: 'ponpes_audit_logs',
  RECURRING_TEMPLATE: 'ponpes_recurring_template',
};

// Helpers for localStorage
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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

// ==========================================
// 1. APP SETTINGS
// ==========================================
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').single();
      if (!error && data) {
        return {
          id: data.id,
          institutionName: data.institution_name,
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
    } catch {
      // fallback to local
    }
  }
  const local = loadLocal<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...local,
    institutionName: local.institutionName || DEFAULT_SETTINGS.institutionName,
    subTitle: local.subTitle || DEFAULT_SETTINGS.subTitle,
    logoUrl: OFFICIAL_LOGO_URL, // Terkunci permanen dengan logo resmi
    documentCity: local.documentCity || DEFAULT_SETTINGS.documentCity,
    documentDateMode: local.documentDateMode || DEFAULT_SETTINGS.documentDateMode,
    manualDocumentDate: local.manualDocumentDate || DEFAULT_SETTINGS.manualDocumentDate,
    recurringTemplate: local.recurringTemplate && local.recurringTemplate.length > 0 ? local.recurringTemplate : DEFAULT_RECURRING_TEMPLATE,
  };
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = { ...current, ...settings, logoUrl: OFFICIAL_LOGO_URL };
  saveLocal(STORAGE_KEYS.SETTINGS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('app_settings').upsert({
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
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
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
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ustadz')
        .select('*')
        .order('full_name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((u) => ({
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
    } catch {
      // fallback
    }
  }
  return loadLocal<Ustadz[]>(STORAGE_KEYS.USTADZ, INITIAL_USTADZ);
}

export async function addUstadz(ustadz: Omit<Ustadz, 'id' | 'createdAt'>): Promise<Ustadz> {
  const current = await getUstadzList();
  const newUstadz: Ustadz = {
    ...ustadz,
    id: `ust-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = [newUstadz, ...current];
  saveLocal(STORAGE_KEYS.USTADZ, list);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ustadz').insert({
        id: newUstadz.id,
        employee_number: newUstadz.employeeNumber,
        full_name: newUstadz.fullName,
        phone: newUstadz.phone,
        email: newUstadz.email,
        specialization: newUstadz.specialization,
        is_active: newUstadz.isActive,
      });
    } catch (e) {
      console.warn('Supabase insert failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
    action: 'TAMBAH_USTADZ',
    entityType: 'ustadz',
    entityId: newUstadz.id,
    details: `Menambahkan data Ustadz: ${newUstadz.fullName} (${newUstadz.employeeNumber}).`,
  });

  return newUstadz;
}

export async function updateUstadz(id: string, updates: Partial<Ustadz>): Promise<Ustadz> {
  const current = await getUstadzList();
  const index = current.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('Data Ustadz tidak ditemukan');

  const updated = { ...current[index], ...updates };
  current[index] = updated;
  saveLocal(STORAGE_KEYS.USTADZ, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ustadz').update({
        employee_number: updated.employeeNumber,
        full_name: updated.fullName,
        phone: updated.phone,
        email: updated.email,
        specialization: updated.specialization,
        is_active: updated.isActive,
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
    action: 'EDIT_USTADZ',
    entityType: 'ustadz',
    entityId: id,
    details: `Mengubah data Ustadz: ${updated.fullName}.`,
  });

  return updated;
}

export async function deleteUstadz(id: string): Promise<void> {
  const current = await getUstadzList();
  const target = current.find((u) => u.id === id);
  const filtered = current.filter((u) => u.id !== id);
  saveLocal(STORAGE_KEYS.USTADZ, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ustadz').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  if (target) {
    await addAuditLog({
      actorId: 'admin',
      actorName: 'Admin Pondok',
      action: 'HAPUS_USTADZ',
      entityType: 'ustadz',
      entityId: id,
      details: `Menghapus data Ustadz: ${target.fullName}.`,
    });
  }
}

// ==========================================
// 3. SANTRI
// ==========================================
export async function getSantriList(): Promise<Santri[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('*')
        .order('full_name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((s) => ({
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
    } catch {
      // fallback
    }
  }
  return loadLocal<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI);
}

export async function addSantri(santri: Omit<Santri, 'id' | 'createdAt'>): Promise<Santri> {
  const current = await getSantriList();
  const newSantri: Santri = {
    ...santri,
    id: `san-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = [newSantri, ...current];
  saveLocal(STORAGE_KEYS.SANTRI, list);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('santri').insert({
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
    } catch (e) {
      console.warn('Supabase insert failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
    action: 'TAMBAH_SANTRI',
    entityType: 'santri',
    entityId: newSantri.id,
    details: `Mendaftarkan santri baru: ${newSantri.fullName} (${newSantri.studentNumber}) - Kelas ${newSantri.className}.`,
  });

  return newSantri;
}

export async function updateSantri(id: string, updates: Partial<Santri>): Promise<Santri> {
  const current = await getSantriList();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Data santri tidak ditemukan');

  const updated = { ...current[index], ...updates };
  current[index] = updated;
  saveLocal(STORAGE_KEYS.SANTRI, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('santri').update({
        student_number: updated.studentNumber,
        full_name: updated.fullName,
        class_name: updated.className,
        group_name: updated.groupName,
        dormitory: updated.dormitory,
        guardian_name: updated.guardianName,
        guardian_phone: updated.guardianPhone,
        is_active: updated.isActive,
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
    action: 'EDIT_SANTRI',
    entityType: 'santri',
    entityId: id,
    details: `Memperbarui data santri: ${updated.fullName}.`,
  });

  return updated;
}

export async function deleteSantri(id: string): Promise<void> {
  const current = await getSantriList();
  const target = current.find((s) => s.id === id);
  const filtered = current.filter((s) => s.id !== id);
  saveLocal(STORAGE_KEYS.SANTRI, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('santri').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  if (target) {
    await addAuditLog({
      actorId: 'admin',
      actorName: 'Admin Pondok',
      action: 'HAPUS_SANTRI',
      entityType: 'santri',
      entityId: id,
      details: `Menghapus data santri: ${target.fullName}.`,
    });
  }
}

// ==========================================
// 4. JADWAL PIKET USTADZ (Rule: 1x / minggu)
// ==========================================
export function getStartOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getDayIndoName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export async function getPiketSchedules(): Promise<PiketSchedule[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('piket_schedule')
        .select('*, ustadz:ustadz_id(full_name)')
        .order('schedule_date', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((s) => ({
          id: s.id,
          ustadzId: s.ustadz_id,
          ustadzName: s.ustadz?.full_name || 'Ustadz',
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
        }));
      }
    } catch {
      // fallback
    }
  }
  return loadLocal<PiketSchedule[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
}

export async function checkWeeklyDutyConflict(
  ustadzId: string,
  scheduleDate: string,
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; existingDate?: string }> {
  const schedules = await getPiketSchedules();
  const weekStart = getStartOfWeek(scheduleDate);

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
  }
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
        `Ustadz/Ustadzah ini sudah memiliki jadwal piket pada minggu yang sama (${existingDate}). Aturan Ponpes: 1 Ustadz/Ustadzah hanya boleh piket 1 kali per minggu. Jika ada pergantian, beri alasan pengecualian.`
      );
    }
  }

  const ustadzList = await getUstadzList();
  const ustadz = ustadzList.find((u) => u.id === schedule.ustadzId);

  const current = await getPiketSchedules();
  const newSchedule: PiketSchedule = {
    id: `sch-${Date.now()}`,
    ustadzId: schedule.ustadzId,
    ustadzName: ustadz?.fullName || schedule.ustadzName || 'Ustadz',
    scheduleDate: schedule.scheduleDate,
    sessionType: schedule.sessionType || 'both',
    dayName,
    weekStart,
    status: schedule.status || 'terjadwal',
    notes: schedule.notes || '',
    overrideReason: schedule.overrideReason || '',
    substituteUstadzId: schedule.substituteUstadzId,
    createdBy: schedule.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = [...current, newSchedule];
  saveLocal(STORAGE_KEYS.SCHEDULES, list);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('piket_schedule').insert({
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
        created_by: newSchedule.createdBy,
      });
    } catch (e) {
      console.warn('Supabase insert schedule failed:', e);
    }
  }

  await addAuditLog({
    actorId: schedule.createdBy || 'admin',
    actorName: 'Admin Pondok',
    action: 'TAMBAH_JADWAL_PIKET',
    entityType: 'piket_schedule',
    entityId: newSchedule.id,
    details: `Menetapkan jadwal piket: ${newSchedule.ustadzName} (${newSchedule.sessionType === 'morning' ? 'Pagi' : newSchedule.sessionType === 'night' ? 'Malam' : 'Malam & Pagi'}) hari ${newSchedule.dayName}, ${newSchedule.scheduleDate}.`,
  });

  return newSchedule;
}

export async function updatePiketSchedule(
  id: string,
  updates: Partial<PiketSchedule>
): Promise<PiketSchedule> {
  const current = await getPiketSchedules();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Jadwal piket tidak ditemukan');

  const existing = current[index];
  const updated: PiketSchedule = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.scheduleDate) {
    updated.weekStart = getStartOfWeek(updates.scheduleDate);
    updated.dayName = getDayIndoName(updates.scheduleDate);
  }

  current[index] = updated;
  saveLocal(STORAGE_KEYS.SCHEDULES, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('piket_schedule').update({
        ustadz_id: updated.ustadzId,
        schedule_date: updated.scheduleDate,
        day_name: updated.dayName,
        week_start: updated.weekStart,
        status: updated.status,
        notes: updated.notes,
        override_reason: updated.overrideReason,
        substitute_ustadz_id: updated.substituteUstadzId,
        updated_at: updated.updatedAt,
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update schedule failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Pengelola Jadwal',
    action: 'UPDATE_JADWAL_PIKET',
    entityType: 'piket_schedule',
    entityId: id,
    details: `Memperbarui status/jadwal piket: ${updated.ustadzName} (${updated.scheduleDate}) status: ${updated.status}.`,
  });

  return updated;
}

export async function deletePiketSchedule(id: string): Promise<void> {
  const current = await getPiketSchedules();
  const target = current.find((s) => s.id === id);
  const filtered = current.filter((s) => s.id !== id);
  saveLocal(STORAGE_KEYS.SCHEDULES, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('piket_schedule').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete schedule failed:', e);
    }
  }

  if (target) {
    await addAuditLog({
      actorId: 'admin',
      actorName: 'Pengelola Jadwal',
      action: 'HAPUS_JADWAL_PIKET',
      entityType: 'piket_schedule',
      entityId: id,
      details: `Menghapus jadwal piket: ${target.ustadzName} tanggal ${target.scheduleDate}.`,
    });
  }
}

export async function generateRecurringPiketSchedules(options: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  template: RecurringScheduleItem[];
  overwriteExisting: boolean;
}): Promise<{ totalCreated: number; totalUpdated: number; totalSkipped: number }> {
  const { startDate, endDate, template, overwriteExisting } = options;
  const currentSchedules = await getPiketSchedules();
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

  const schedulesMap = new Map<string, PiketSchedule>();
  currentSchedules.forEach((s) => {
    schedulesMap.set(s.scheduleDate, s);
  });

  const updatedList: PiketSchedule[] = [...currentSchedules];

  // Loop through days
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0];
    const dayOfWeek = cur.getDay(); // 0 = Ahad, 1 = Senin, ...
    const pattern = templateByDay.get(dayOfWeek);

    if (pattern) {
      const existing = schedulesMap.get(dateStr);
      const uName = ustadzMap.get(pattern.ustadzId) || pattern.ustadzName || 'Ustadz Piket';
      const dayName = getDayIndoName(dateStr);
      const weekStart = getStartOfWeek(dateStr);

      if (existing) {
        if (overwriteExisting) {
          const idx = updatedList.findIndex((s) => s.id === existing.id);
          if (idx !== -1) {
            updatedList[idx] = {
              ...existing,
              ustadzId: pattern.ustadzId,
              ustadzName: uName,
              sessionType: pattern.sessionType || 'both',
              notes: pattern.notes || existing.notes || 'Jadwal berulang otomatis',
              updatedAt: new Date().toISOString(),
            };
            totalUpdated++;
          }
        } else {
          totalSkipped++;
        }
      } else {
        const newSchedule: PiketSchedule = {
          id: `sch-rec-${dateStr}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ustadzId: pattern.ustadzId,
          ustadzName: uName,
          scheduleDate: dateStr,
          sessionType: pattern.sessionType || 'both',
          dayName,
          weekStart,
          status: 'terjadwal',
          notes: pattern.notes || 'Jadwal berulang otomatis',
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedList.push(newSchedule);
        schedulesMap.set(dateStr, newSchedule);
        totalCreated++;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Sort by date ascending
  updatedList.sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
  saveLocal(STORAGE_KEYS.SCHEDULES, updatedList);

  const supabase = getSupabaseClient();
  if (supabase && (totalCreated > 0 || totalUpdated > 0)) {
    try {
      const upsertRows = updatedList.map((s) => ({
        id: s.id,
        ustadz_id: s.ustadzId,
        schedule_date: s.scheduleDate,
        session_type: s.sessionType,
        day_name: s.dayName,
        week_start: s.weekStart,
        status: s.status,
        notes: s.notes,
        created_by: s.createdBy,
      }));
      await supabase.from('piket_schedule').upsert(upsertRows);
    } catch (e) {
      console.warn('Supabase batch upsert failed:', e);
    }
  }

  await addAuditLog({
    actorId: 'admin',
    actorName: 'Admin Pondok',
    action: 'GENERATE_JADWAL_BERULANG',
    entityType: 'piket_schedule',
    details: `Men-generate jadwal berulang periode ${startDate} s/d ${endDate}: ${totalCreated} baru, ${totalUpdated} diperbarui, ${totalSkipped} dilewati.`,
  });

  return { totalCreated, totalUpdated, totalSkipped };
}

// ==========================================
// 5. KEGIATAN SESI (Malam & Pagi)
// ==========================================
export async function getActivitySessions(): Promise<ActivitySession[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_sessions')
        .select('*')
        .order('activity_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((s) => ({
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
    } catch {
      // fallback
    }
  }
  return loadLocal<ActivitySession[]>(STORAGE_KEYS.SESSIONS, INITIAL_ACTIVITY_SESSIONS);
}

export async function addActivitySession(
  session: Omit<ActivitySession, 'id' | 'createdAt'>
): Promise<ActivitySession> {
  const current = await getActivitySessions();
  const newSession: ActivitySession = {
    ...session,
    id: `sess-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const list = [newSession, ...current];
  saveLocal(STORAGE_KEYS.SESSIONS, list);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('activity_sessions').insert({
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
        created_by: newSession.createdBy,
      });
    } catch (e) {
      console.warn('Supabase insert activity_sessions failed:', e);
    }
  }

  // Update schedule status to 'sudah_bertugas' if matches date & ustadz
  const schedules = await getPiketSchedules();
  const matchingSchedule = schedules.find(
    (s) => s.scheduleDate === newSession.activityDate && s.ustadzId === newSession.ustadzId
  );
  if (matchingSchedule && matchingSchedule.status === 'terjadwal') {
    await updatePiketSchedule(matchingSchedule.id, { status: 'sudah_bertugas' });
  }

  await addAuditLog({
    actorId: session.createdBy || 'ustadz',
    actorName: session.ustadzName,
    action: newSession.sessionType === 'morning' ? 'INPUT_KEGIATAN_PAGI' : 'INPUT_KEGIATAN_MALAM',
    entityType: 'activity_sessions',
    entityId: newSession.id,
    details: `Mencatat sesi ${newSession.sessionType === 'morning' ? 'Pagi' : 'Malam'} (${newSession.activityName}) tanggal ${newSession.activityDate}.`,
  });

  return newSession;
}

export async function updateActivitySession(
  id: string,
  updates: Partial<ActivitySession>
): Promise<ActivitySession> {
  const current = await getActivitySessions();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Sesi kegiatan tidak ditemukan');

  const updated = { ...current[index], ...updates };
  current[index] = updated;
  saveLocal(STORAGE_KEYS.SESSIONS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('activity_sessions').update({
        activity_name: updated.activityName,
        start_time: updated.startTime,
        end_time: updated.endTime,
        ustadz_id: updated.ustadzId,
        ustadz_name: updated.ustadzName,
        topic: updated.topic,
        incident_notes: updated.incidentNotes,
        status: updated.status,
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update activity_sessions failed:', e);
    }
  }

  return updated;
}

// ==========================================
// 6. ABSENSI SANTRI
// ==========================================
export async function getStudentAttendances(): Promise<StudentAttendance[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('student_attendance').select('*');
      if (!error && data && data.length > 0) {
        return data.map((a) => ({
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
    } catch {
      // fallback
    }
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
  actorId: string = 'ustadz'
): Promise<StudentAttendance[]> {
  const current = await getStudentAttendances();

  // Remove existing attendance for this session to prevent duplicates
  const filtered = current.filter((a) => a.sessionId !== sessionId);

  const now = new Date().toISOString();
  const createdList: StudentAttendance[] = attendances.map((item, idx) => ({
    id: `att-${Date.now()}-${idx}`,
    sessionId,
    santriId: item.santriId,
    attendanceStatus: item.attendanceStatus,
    notes: item.notes || '',
    recordedBy: actorId,
    createdAt: now,
    updatedAt: now,
  }));

  const allUpdated = [...filtered, ...createdList];
  saveLocal(STORAGE_KEYS.ATTENDANCE, allUpdated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Upsert into Supabase
      const rows = createdList.map((a) => ({
        id: a.id,
        session_id: a.sessionId,
        santri_id: a.santriId,
        attendance_status: a.attendanceStatus,
        notes: a.notes,
        recorded_by: a.recordedBy,
        updated_at: now,
      }));
      await supabase.from('student_attendance').upsert(rows, { onConflict: 'session_id,santri_id' });
    } catch (e) {
      console.warn('Supabase upsert attendance failed:', e);
    }
  }

  const hadirCount = attendances.filter((a) => a.attendanceStatus === 'hadir').length;
  await addAuditLog({
    actorId,
    actorName: 'Petugas Piket',
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
export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        return data.map((l) => ({
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
    } catch {
      // fallback
    }
  }
  return loadLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
}

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const current = loadLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = [newLog, ...current].slice(0, 100);
  saveLocal(STORAGE_KEYS.AUDIT, list);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        actor_id: newLog.actorId,
        actor_name: newLog.actorName,
        action: newLog.action,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        details: newLog.details,
      });
    } catch {
      // ignore
    }
  }

  return newLog;
}

// Reset data to demo state
export function resetToInitialData(): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.USTADZ, JSON.stringify(INITIAL_USTADZ));
  localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_ACTIVITY_SESSIONS));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
}
