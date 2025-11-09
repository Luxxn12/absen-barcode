# Absensi Barcode

Aplikasi absensi sekolah berbasis barcode + pengenalan wajah yang dibangun di atas Next.js 16 + Supabase. Portal guru menampilkan dashboard harian, pengelolaan siswa/kelas, generator QR, rekap bulanan, forum komunikasi, pendaftaran biometrik, serta manajemen akun super-admin. Portal siswa menyediakan pengalaman scan barcode atau wajah langsung melalui kamera perangkat dan tampilan status kehadiran secara real-time.

## Fitur utama

- **Portal Guru/Admin**
  - Dashboard harian dengan ringkasan statistik, deteksi streak ketidakhadiran, dan manajemen pengumuman.
  - Tabel status hadir per tanggal dengan kemampuan edit manual, filter kelas, dan input jam check-in.
  - CRUD data siswa & kelas lengkap dengan pencarian, paginasi, serta sinkronisasi instan via React Context + Server Actions.
  - Generator QR untuk setiap siswa (preview, unduh SVG, cetak massal).
  - Modal pendaftaran wajah per siswa: ambil foto dari webcam guru, validasi deteksi wajah, dan unggah descriptor ke Supabase.
  - Rekap bulanan per kelas dengan ekspor CSV.
  - Forum komunikasi kondisi emosional siswa beserta penandaan mood.
  - Halaman khusus super-admin untuk membuat/menghapus akun guru dengan password terenkripsi (bcrypt).

- **Portal Siswa**
  - Halaman scan berbasis `react-qr-barcode-scanner` untuk merekam kehadiran secara otomatis (status Hadir + jam lokal).
  - Mode alternatif pengenalan wajah (face-api.js) yang menyalakan kamera depan, melakukan pencocokan descriptor, dan langsung mengirim absensi.
  - Ringkasan status hari ini dan riwayat 3 hari terakhir.
  - Landing page berisi tips penggunaan dan tautan cepat.

- **Integrasi Supabase**
  - Server Actions (`app/actions`) menjadi gateway seluruh CRUD ke tabel Supabase.
  - API Routes (`app/api/auth/*`) menangani login guru/super-admin serta seeding akun default melalui service role.
  - Context Provider (`contexts/*`) menjaga cache klien (auth, siswa, attendance, pengumuman) agar UI responsif tanpa menulis ulang fetcher di tiap halaman.

## Teknologi

- [Next.js 16 (App Router)](https://nextjs.org)
- [React 19](https://react.dev) + TypeScript
- Supabase (`@supabase/supabase-js`) untuk database & auth kustom
- Tailwind CSS 4 (via `@tailwindcss/postcss`) untuk styling utility-first
- `react-qr-barcode-scanner` dan `qrcode.react` untuk proses scan & generator
- `face-api.js` + WebRTC `getUserMedia()` untuk registrasi dan verifikasi wajah
- `lucide-react` untuk ikon, `bcryptjs` untuk hashing password
- `tsx` + skrip CLI untuk memastikan akun guru default

## Struktur proyek

```
.
├─ app/                    # App Router (guru, siswa, login, API routes, server actions)
│  ├─ actions/             # Server Actions terhubung ke Supabase
│  ├─ api/auth/*           # Route handler login & seeding guru
│  ├─ guru/*               # Seluruh halaman portal guru
│  └─ siswa/*              # Seluruh halaman portal siswa
├─ contexts/               # Auth, Student, Attendance, Announcement providers
├─ lib/
│  ├─ supabase/            # Client & server helper
│  └─ ids.ts               # Util pembentuk ID khusus (STD-/CLS-)
├─ scripts/ensureGuruUser.ts
├─ hooks/useHydrated.ts    # Utility menghindari mismatch saat SSR
├─ types/react-qr-barcode-scanner.d.ts
└─ public/                 # Asset statis
```

## Skema data Supabase

Tabel berikut wajib dibuat sebelum menjalankan aplikasi (ganti tipe/constraint sesuai kebutuhan, contoh di bawah menggunakan Postgres + ekstensi `pgcrypto` untuk `gen_random_uuid()`):

```sql
create extension if not exists "pgcrypto";

create table "ClassGroup" (
  id text primary key,
  name text not null unique,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "Student" (
  id text primary key,
  name text not null,
  "classId" text not null references "ClassGroup"(id) on delete restrict,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "GuruAccounts" (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'guru' check (role in ('guru','superadmin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table "AttendanceRecord" (
  id uuid primary key,
  "studentId" text not null references "Student"(id) on delete cascade,
  date date not null,
  status text not null check (status in ('Hadir','Sakit','Izin','Alfa')),
  "checkIn" text not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now(),
  unique ("studentId","date")
);

create table "Announcement" (
  id uuid primary key,
  time text not null,
  title text not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "ForumEntry" (
  id uuid primary key default gen_random_uuid(),
  "studentId" text not null references "Student"(id) on delete cascade,
  mood text not null check (mood in ('Senang','Netral','Sedih','PerluPerhatian')),
  message text not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "StudentFaces" (
  id uuid primary key default gen_random_uuid(),
  studentid text not null references "Student"(id) on delete cascade,
  descriptor double precision[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (studentid)
);
```

Aktifkan Row-Level Security sesuai kebijakan sekolah bila aplikasi akan dipakai produksi. Pada mode demo/local, server actions berjalan menggunakan `SUPABASE_SERVICE_ROLE_KEY`, jadi pastikan kredensial tersebut tidak diekspose ke publik.

## Pengenalan wajah (opsional tetapi direkomendasikan)

- **Registrasi wajah siswa** terjadi melalui halaman `Guru > Siswa`. Tombol “Daftarkan Wajah” membuka modal, memuat model `face-api.js` dari CDN, menyalakan kamera guru, memastikan hanya satu wajah terdeteksi, lalu mengirim descriptor (128 angka `Float32`) ke `/api/faces/register`.
- **Pencocokan wajah siswa** tersedia pada halaman `/siswa/scan`. Siswa dapat berganti mode `Barcode` ↔ `Face`. Pada mode wajah aplikasi mengunduh seluruh descriptor dari `/api/faces`, menghitung jarak Euclidean antar embedding, dan otomatis menjalankan `upsertAttendanceAction` ketika skor berada di bawah ambang batas (default `0.38`).
- **Tabel `StudentFaces` bersifat opsional**. Jika belum dibuat, API akan mengembalikan peringatan ramah dan aplikasi tetap dapat digunakan dengan barcode biasa. Buat tabel tersebut untuk mengaktifkan mode wajah.
- Pastikan browser memiliki izin kamera, pencahayaan memadai, dan koneksi ke CDN model tidak diblokir. Untuk lingkungan intranet tanpa akses internet, salin bobot model ke storage lokal dan sesuaikan konstanta `MODEL_BASES` di `lib/faceApi.ts`.

## Variabel lingkungan

Buat file `.env` di root dengan nilai sesuai proyek Supabase Anda:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key   # hanya dipakai di server actions & script CLI

# Opsional, untuk mempermudah seeding akun guru default
SEED_GURU_EMAIL=guru@sekolah.id
SEED_GURU_PASSWORD=super-secret
SEED_GURU_NAME=Guru Piket
```

> catatan: jangan commit `SUPABASE_SERVICE_ROLE_KEY`. Simpan di secret manager saat deploy.

## Menjalankan proyek lokal

1. **Prasyarat**
   - Node.js 18.18+ / 20+
   - npm 9+ (atau pnpm/bun jika diinginkan)
   - Akses ke instance Supabase/Postgres

2. **Instal dependensi**

   ```bash
   npm install
   ```

3. **Siapkan Supabase**
   - Buat database sesuai skema di atas.
   - Masukkan kredensial ke `.env`.

4. **Seed akun guru pertama (opsional tapi disarankan)**

   Gunakan variabel `SEED_GURU_*` atau override via argumen:

   ```bash
   npm run ensure:guru -- \
     --email=admin@sekolah.id \
     --password=changeme \
     --name="Super Admin" \
     --role=superadmin
   ```

   Perintah di atas akan membuat/memperbarui akun pada tabel `GuruAccounts` dengan password yang sudah di-hash.

5. **Jalankan dev server**

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`. Login sebagai guru/super-admin menggunakan kredensial yang sudah disediakan. Untuk siswa, cukup buka `/siswa/scan` dan pindai barcode (atau masukkan ID manual di UI guru untuk melihat efeknya).

6. **Perintah tambahan**

   | Script | Keterangan |
   | ------ | ---------- |
   | `npm run build` | Build Next.js untuk produksi. |
   | `npm run start` | Menjalankan hasil build. |
   | `npm run lint` | Menjalankan ESLint sesuai konfigurasi Next.js. |

## Alur kerja inti

- **Login Guru/Super Admin**: `AuthContext` memanggil `/api/auth/guru-login`, menyimpan sesi di `localStorage`, dan mengarahkan user ke halaman yang sesuai (`/guru/dashboard` atau `/guru/accounts`).
- **Pengelolaan data**: Seluruh halaman guru dibungkus oleh `StudentProvider`, `AttendanceProvider`, dan `AnnouncementProvider`. Server Actions melakukan query Supabase dan memicu `revalidatePath` agar halaman terkait tetap konsisten.
- **Absensi Barcode**: Guru menerbitkan QR dari halaman `/guru/barcode`. Siswa memindai melalui `/siswa/scan`, lalu klien memanggil `upsertAttendanceAction` untuk menyimpan status `Hadir` beserta jamnya.
- **Rekap dan ekspor**: `/guru/rekap` mengagregasi `AttendanceRecord` di sisi klien, kemudian membuat file CSV menggunakan `Blob` API.
- **Forum komunikasi**: `/guru/forum` mengirim catatan ke tabel `ForumEntry`, menampilkan mood badge per siswa, dan memungkinkan penghapusan laporan.
- **Akun Guru**: Hanya super-admin yang dapat mengakses `/guru/accounts`. Semua password disimpan sebagai hash `bcrypt` melalui aksi server dan skrip CLI.

## Tips pengembangan & deployment

- Simpan `SUPABASE_SERVICE_ROLE_KEY` sebagai environment server-side (mis. Vercel/Netlify project secret). Jangan kirim ke browser.
- Tambahkan middleware atau proteksi tambahan jika ingin memaksa HTTPS / domain tertentu.
- Pertimbangkan memasang RLS + policy Supabase agar layanan aman jika kunci service nantinya tidak digunakan.
- Untuk integrasi metode absensi lain (mis. pengenalan wajah), buat tabel baru untuk metadata biometrik dan tambahkan flow ke `app/actions/attendance.ts` sebelum memanggil `upsertAttendanceAction`.

Selamat mengembangkan! Jika menemukan bug atau ingin menambahkan fitur baru, mulai dari memahami Server Actions di `app/actions/*` lalu sesuaikan konteks yang memakainya.
