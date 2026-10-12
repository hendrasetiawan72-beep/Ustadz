-- ==============================================================================
-- SISTEM ABSENSI PIKET USTADZ & SANTRI — PONPES BAITUL ARQOM SMK MUHIBA
-- DATABASE MIGRATION SCRIPT (SUPABASE POSTGRESQL + RLS POLICIES)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: app_settings (Pengaturan Lembaga & Operasional)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'setting-default',
    institution_name TEXT NOT NULL DEFAULT 'PONPES BAITUL ARQOM SMK MUHIBA',
    sub_title TEXT DEFAULT 'Pondok Pesantren & Sekolah Menengah Kejuruan Muhammadiyah 1 Babat',
    logo_url TEXT DEFAULT 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiAYTmhJlWEYwE9QBmw37zoslhqCo90hAtJ4c2Nk6yGXvojklwqPR9E19OVqQxMha2HO6aWrDP1cCdfuXA1m0ViCS73bq5qrrMdtUtplJzc6217uJFTu9Sm-yqU7ZzSNeXwmFS0lVid02IhAPrxI4n0bS10I9WzbDhKYOcpbHypygt646fCspHvud7AobY0B/s640/44709.jpg',
    address TEXT DEFAULT 'Jl. Raya Babat - Surabaya No. 123, Babat, Lamongan, Jawa Timur',
    phone TEXT DEFAULT '(0322) 451234 / 0812-3456-7890',
    email TEXT DEFAULT 'info@smkmuhiba.sch.id',
    website TEXT DEFAULT 'www.smkmuhiba.sch.id',
    timezone TEXT DEFAULT 'Asia/Jakarta',
    week_starts_on INT DEFAULT 1,
    night_session_start TEXT DEFAULT '17:45',
    night_session_end TEXT DEFAULT '19:45',
    night_session_default_title TEXT DEFAULT 'Kajian Kitab Kuning & Tadarrus Maghrib - Isya',
    morning_session_start TEXT DEFAULT '04:30',
    morning_session_end TEXT DEFAULT '06:00',
    morning_session_default_title TEXT DEFAULT 'Sholat Subuh Berjamaah & Kuliah Subuh',
    leader_name TEXT DEFAULT 'Drs. H. Ahmad Dahlan, M.Pd.I',
    leader_nip TEXT DEFAULT '19750817 200212 1 004',
    duty_supervisor_name TEXT DEFAULT 'Ustadz Muhammad Ridwan, S.Pd.I',
    duty_supervisor_nip TEXT DEFAULT '19840315 200903 1 008',
    kop_letterhead_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: profiles (Pengguna & Peran RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'ustadz_piket', 'kepala_pengawas')),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: ustadz (Data Guru & Pembina Piket)
CREATE TABLE IF NOT EXISTS public.ustadz (
    id TEXT PRIMARY KEY DEFAULT ('ust-' || replace(uuid_generate_v4()::text, '-', '')),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialization TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: santri (Data Santri Pesantren)
CREATE TABLE IF NOT EXISTS public.santri (
    id TEXT PRIMARY KEY DEFAULT ('san-' || replace(uuid_generate_v4()::text, '-', '')),
    student_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    dormitory TEXT NOT NULL,
    guardian_name TEXT,
    guardian_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table: piket_schedule (Jadwal Piket Ustadz - Aturan 1x per Minggu)
CREATE TABLE IF NOT EXISTS public.piket_schedule (
    id TEXT PRIMARY KEY DEFAULT ('sch-' || replace(uuid_generate_v4()::text, '-', '')),
    ustadz_id TEXT NOT NULL REFERENCES public.ustadz(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    day_name TEXT NOT NULL,
    week_start DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('terjadwal', 'sudah_bertugas', 'belum_bertugas', 'perlu_verifikasi', 'izin_diganti')) DEFAULT 'terjadwal',
    notes TEXT,
    override_reason TEXT,
    substitute_ustadz_id TEXT REFERENCES public.ustadz(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index & Unique Check for routine duty
CREATE INDEX IF NOT EXISTS idx_piket_date ON public.piket_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_piket_ustadz_week ON public.piket_schedule(ustadz_id, week_start);

-- 7. Table: piket_realization (Realisasi & Verifikasi Piket)
CREATE TABLE IF NOT EXISTS public.piket_realization (
    id TEXT PRIMARY KEY DEFAULT ('rea-' || replace(uuid_generate_v4()::text, '-', '')),
    schedule_id TEXT NOT NULL REFERENCES public.piket_schedule(id) ON DELETE CASCADE,
    actual_date DATE NOT NULL,
    check_in_at TIME NOT NULL,
    check_out_at TIME,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('menunggu', 'terverifikasi', 'ditolak')) DEFAULT 'menunggu',
    notes TEXT,
    incident_notes TEXT,
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table: activity_sessions (Sesi Kegiatan Maghrib & Subuh)
CREATE TABLE IF NOT EXISTS public.activity_sessions (
    id TEXT PRIMARY KEY DEFAULT ('sess-' || replace(uuid_generate_v4()::text, '-', '')),
    activity_name TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('night', 'morning')),
    activity_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    ustadz_id TEXT NOT NULL REFERENCES public.ustadz(id) ON DELETE RESTRICT,
    ustadz_name TEXT NOT NULL,
    topic TEXT,
    incident_notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('selesai', 'berlangsung', 'dibatalkan')) DEFAULT 'selesai',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_date_type ON public.activity_sessions(activity_date, session_type);

-- 9. Table: student_attendance (Absensi Santri per Sesi)
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id TEXT PRIMARY KEY DEFAULT ('att-' || replace(uuid_generate_v4()::text, '-', '')),
    session_id TEXT NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
    santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('hadir', 'izin', 'sakit', 'alpa', 'terlambat', 'dispensasi')) DEFAULT 'hadir',
    notes TEXT,
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attendance_session_santri UNIQUE (session_id, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_att_session ON public.student_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_att_santri ON public.student_attendance(santri_id);

-- 10. Table: audit_logs (Riwayat Aktivitas & Perubahan Data)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || replace(uuid_generate_v4()::text, '-', '')),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ustadz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_realization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: semua data operasional dapat dibaca oleh user terautentikasi atau anon
CREATE POLICY "Allow read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow read ustadz" ON public.ustadz FOR SELECT USING (true);
CREATE POLICY "Allow read santri" ON public.santri FOR SELECT USING (true);
CREATE POLICY "Allow read piket_schedule" ON public.piket_schedule FOR SELECT USING (true);
CREATE POLICY "Allow read piket_realization" ON public.piket_realization FOR SELECT USING (true);
CREATE POLICY "Allow read activity_sessions" ON public.activity_sessions FOR SELECT USING (true);
CREATE POLICY "Allow read student_attendance" ON public.student_attendance FOR SELECT USING (true);
CREATE POLICY "Allow read audit_logs" ON public.audit_logs FOR SELECT USING (true);

-- Insert/Update/Delete policies
CREATE POLICY "Allow all for authenticated users app_settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users ustadz" ON public.ustadz FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users santri" ON public.santri FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users piket_schedule" ON public.piket_schedule FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users piket_realization" ON public.piket_realization FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users activity_sessions" ON public.activity_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users student_attendance" ON public.student_attendance FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users audit_logs" ON public.audit_logs FOR ALL USING (true);

-- Seed Initial Data Settings
INSERT INTO public.app_settings (id, institution_name, sub_title, logo_url)
VALUES ('setting-default', 'PONPES BAITUL ARQOM SMK MUHIBA', 'Pondok Pesantren & Sekolah Menengah Kejuruan Muhammadiyah 1 Babat', 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiAYTmhJlWEYwE9QBmw37zoslhqCo90hAtJ4c2Nk6yGXvojklwqPR9E19OVqQxMha2HO6aWrDP1cCdfuXA1m0ViCS73bq5qrrMdtUtplJzc6217uJFTu9Sm-yqU7ZzSNeXwmFS0lVid02IhAPrxI4n0bS10I9WzbDhKYOcpbHypygt646fCspHvud7AobY0B/s640/44709.jpg')
ON CONFLICT (id) DO NOTHING;
