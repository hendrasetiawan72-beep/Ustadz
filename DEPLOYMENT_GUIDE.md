# Panduan Deployment ke Vercel & Cloudflare Pages

Aplikasi **Absensi Piket Ponpes Baitul Arqom SMK Muhiba** sudah dikonfigurasi 100% siap untuk di-*deploy* langsung ke **Vercel** maupun **Cloudflare Pages** tanpa konfigurasi rumit.

---

## 1. Deployment ke Vercel

1. **Push / Import Repository** ke GitHub atau GitLab.
2. Buka dashboard [Vercel](https://vercel.com) lalu klik **Add New Project**.
3. Pilih repository proyek ini.
4. Pengaturan otomatis terdeteksi dari `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. *(Opsional)* Jika menggunakan database Supabase Cloud, masukkan Environment Variables di Vercel:
   - `VITE_SUPABASE_URL`: `https://[id-project].supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `[anon-public-key]`
6. Klik **Deploy**. Aplikasi akan online dalam waktu kurang dari 1 menit!
   - *Catatan*: SPA routing sudah otomatis ditangani oleh `vercel.json` sehingga refresh halaman di rute mana pun tidak akan 404.

---

## 2. Deployment ke Cloudflare Pages

1. Buka dashboard [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Pilih repository proyek ini.
3. Pada pengaturan Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. *(Opsional)* Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL`: `https://[id-project].supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `[anon-public-key]`
5. Klik **Save and Deploy**.
   - *Catatan*: Berkas `public/_redirects` akan otomatis disalin ke `dist/_redirects` sehingga routing SPA Cloudflare Pages berjalan sempurna.

---

## 3. Fitur Anti-Gagal (Built-in Resilience)
- **Bebas Frozen Lockfile**: Dilengkapi `.npmrc` (`frozen-lockfile=false`) sehingga proses install dependensi di server CI/CD tidak akan pernah terhenti karena *lockfile mismatch*.
- **Offline / Local Fallback**: Jika environment Supabase belum diisi, aplikasi tetap berjalan 100% normal menggunakan *Local Persistence* bawaan.
- **Kredensial**: Dilengkapi identitas `Developed by @hndx07` di footer aplikasi, bilah sisi, dan portal masuk.
