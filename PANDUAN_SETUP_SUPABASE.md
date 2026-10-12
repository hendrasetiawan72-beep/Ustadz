# PANDUAN DEPLOYMENT & INTEGRASI DATABASE SUPABASE
## Sistem Absensi Piket Ustadz & Santri — Ponpes Baitul Arqom SMK Muhiba

Dokumentasi ini menjelaskan langkah-langkah penyiapan database cloud Supabase, konfigurasi hak akses (RLS), akun administrator pertama, dan pengoperasian harian.

---

### 1. CARA MENYIAPKAN PROJECT SUPABASE

1. Buka [https://supabase.com](https://supabase.com) dan masuk / daftar akun.
2. Klik tombol **"New Project"**.
3. Isi informasi project:
   - **Name**: `ponpes-baitul-arqom-muhiba`
   - **Database Password**: Buat password yang kuat dan simpan dengan aman.
   - **Region**: Pilih `Singapore (ap-southeast-1)` untuk latensi tercepat di Indonesia.
   - **Pricing Plan**: Free tier sudah mencukupi untuk ribuan data absensi.
4. Tunggu proses pembuatan database (sekitar 1-2 menit).

---

### 2. MENJALANKAN SQL MIGRATION (DATABASE SCHEMA)

1. Pada dashboard project Supabase Anda, buka menu **SQL Editor** (ikon terminal di sidebar kiri).
2. Klik **"New query"**.
3. Buka berkas `supabase_schema.sql` yang berada di direktori utama aplikasi ini.
4. Salin seluruh isi SQL tersebut, tempelkan ke query editor Supabase, lalu klik tombol **"Run"**.
5. Skema database akan otomatis membuat:
   - Tabel `app_settings` (Kop surat, identitas lembaga, jam Subuh & Maghrib)
   - Tabel `profiles` (Peran pengguna: Admin, Ustadz Piket, Kepala/Pengawas)
   - Tabel `ustadz` (Data dewan ustadz & pembina)
   - Tabel `santri` (Data santri, kelas, kelompok tahfidz/kejuruan, asrama)
   - Tabel `piket_schedule` (Aturan 1 Ustadz 1 kali per minggu)
   - Tabel `piket_realization` (Verifikasi kehadiran & jam bertugas)
   - Tabel `activity_sessions` (Sesi Maghrib-Isya dan Subuh-06:00 WIB)
   - Tabel `student_attendance` (Status hadir, izin, sakit, alpa, terlambat, dispensasi)
   - Tabel `audit_logs` (Audit trail perubahan data)
   - Aturan **Row Level Security (RLS)** untuk keamanan data pesantren.

---

### 3. MENGAMBIL KREDENSIAL API SUPABASE

1. Di dashboard Supabase, buka menu **Project Settings** > **API**.
2. Salin 2 nilai berikut:
   - **Project URL**: contoh `https://abcdefghijkl.supabase.co`
   - **anon / public key**: string token panjang `eyJhbGciOi...`
3. Masukkan ke file `.env` di komputer atau server:
   ```env
   VITE_SUPABASE_URL="https://abcdefghijkl.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```
4. **Atau**, Anda dapat langsung mengisinya melalui halaman **Pengaturan Lembaga** di dalam aplikasi web pada bagian **"Integrasi Backend Cloud Supabase"** lalu klik **"Simpan Kredensial Supabase"**.

---

### 4. MEMBUAT AKUN PENGGUNA PERTAMA

1. Buka menu **Authentication** > **Users** di dashboard Supabase.
2. Klik **"Add user"** > **"Create user"**.
3. Masukkan email dan password untuk Admin, contoh: `admin@smkmuhiba.sch.id`.
4. Di tabel `public.profiles`, masukkan record dengan role `admin`:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role, is_active)
   VALUES (
     'UUID_DARI_AUTH_USERS',
     'admin@smkmuhiba.sch.id',
     'Ustadz H. Ahmad Dahlan (Admin)',
     'admin',
     true
   );
   ```

---

### 5. ATURAN BISNIS SISTEM

1. **Aturan 1 Ustadz 1 Kali Piket per Minggu**:
   - Sistem secara otomatis menghitung minggu kalender (`week_start`).
   - Apabila Ustadz yang sama dijadwalkan lebih dari 1 kali dalam minggu tersebut, sistem menampilkan peringatan pencegahan ganda.
   - Jika terjadi penggantian atau darurat, admin dapat mencentang *"Izinkan Jadwal Ganda"* dengan mengisi alasan tertulis.
2. **Pemisahan Jadwal & Realisasi**:
   - Jadwal adalah rencana penugasan.
   - Realisasi dicatat melalui form realisasi atau saat pengisian sesi kegiatan malam/pagi.
3. **Dokumen PDF Resmi**:
   - Standar kertas A4 warna putih bersih tanpa background warna-warni.
   - Margin: Kiri 20mm, Kanan 15mm, Atas 15mm, Bawah 15mm.
   - Kop surat formal menampilkan logo asli Ponpes Baitul Arqom SMK Muhiba.
   - Tersedia 12 jenis laporan formal yang dapat dipratinjau, diunduh PDF, dicetak langsung, atau diekspor ke Excel.
4. **Impor Excel**:
   - Format didukung: `.xlsx` dan `.xls`.
   - Menggunakan validasi per baris dengan pesan error dan nomor baris jelas.
   - Pilihan lewati data duplikat atau perbarui data yang cocok.
