# BelajarKode v2

Ruang belajar pemrograman mandiri yang berjalan sebagai **satu berkas HTML**. React + Vite dipakai untuk membangun, tetapi hasil akhirnya tidak membutuhkan server, npm, atau internet.

Isi saat ini: 14 modul, 97 pelajaran, roadmap 52 minggu (~4-5 jam/minggu), halaman **Mulai** dengan checklist instalasi, kuis, catatan, bookmark, kamus, laboratorium kode, gamifikasi, dan buku offline dengan 5 bab pendalaman. M00 (dasar komputer, internet, keamanan) dan M01 (orientasi/cara belajar) ditulis dengan schema v2 dan sumber registry tepercaya. M02 (logika & algoritma) ditulis ulang penuh dengan schema v3: outcome, kartu sintaks pseudocode, latihan bertingkat dengan hint, verifikasi, dan edge case; `m05-l02` menjadi pilot integrasi schema v3. Dua pelajaran M03 (`m03-l01` variabel dan `m03-l03` operator) memakai schema v3.1: kartu sintaks dengan cara baca, aturan penulisan, kode beroutput dengan bedah baris, dan jembatan ke pelajaran berikutnya. Tersedia tiga mode tampilan: **Nyaman**, **Terang**, dan **Malam**. Struktur target adalah 16 modul / 108 pelajaran; M14 (AI) dan M15 (deployment) menyusul.

## Cara membuka

1. Klik dua kali **`BelajarKode.html`**.
2. Buku offline: klik dua kali **`buku-belajarkode.html`**, atau buka menu **Buku**.
3. Buat profil atau masuk sebagai tamu.
4. Buka **Mulai** untuk checklist alat dan verifikasi instalasi.

Tidak ada proses install, server lokal, atau koneksi internet yang diperlukan untuk membaca materi.

> Hasil build adalah berkas mandiri. Jangan membuka `index.html` dari source; itu hanya entry Vite untuk pengembangan.

## Login dan profil

- Multi-profil lokal di satu perangkat.
- PIN 6 digit di-hash dengan **PBKDF2-SHA256** (`@noble/hashes`, 150.000 iterasi, salt acak 16 byte). Tidak memakai WebCrypto agar tetap berjalan di `file://`.
- Mode tamu tanpa PIN; PIN dapat diaktifkan kemudian dari **Settings**.
- Batas 5 percobaan salah, lalu jeda 30 detik.
- Sesi bertahan saat refresh; opsi "Tetap masuk" menyimpan sesi di browser.
- **PIN mengunci profil, bukan mengenkripsi data.** Data `localStorage` masih dapat dibaca lewat DevTools. Tidak ada pemulihan PIN; gunakan backup JSON.

Data tersimpan dengan kunci:

```text
bk.v2.profiles
bk.v2.state.<profileId>
bk.v2.session
bk.v2.remember
```

Progres versi lama (`belajarkode-user-v1`) ditawarkan untuk diimpor saat membuat profil pertama.

## Mulai dan checklist

Halaman `#/mulai` berisi checklist per sistem operasi untuk browser/DevTools, VS Code, Git, Node 24, PHP 8.5, Composer, PostgreSQL 18, Flutter 3.47, folder proyek, dan backup. Aplikasi **tidak mendeteksi instalasi otomatis**; pengguna mencentang item setelah menjalankan perintah verifikasi. Progres checklist disimpan per profil di `state.setup` dan ditampilkan sebagai pengingat di Base.

## Tampilan

Pengaturan menyediakan tiga mode warna: **Nyaman** (default, shell hangat dan kertas lembut), **Terang** (latar krem untuk ruangan terang), dan **Malam** (permukaan baca gelap). Mode **Kontras Tinggi** tetap terpisah dan diterapkan setelah mode warna. Semua kombinasi teks/latar diuji dengan axe pada halaman utama, pelajaran, dan pengaturan.

## Gamifikasi

| Sumber | XP |
| --- | --- |
| Pelajaran selesai | 200 |
| Kuis benar, percobaan pertama | 80 |
| Kuis benar setelah salah | 20 |
| Modul tuntas | 300 |
| Quest harian lengkap | 100 |
| Streak 7 hari | 200 (sekali) |
| Streak 30 hari | 1.000 (sekali) |

- 10 level dengan ambang kumulatif 0, 600, 1.400, 2.600, 4.200, 6.200, 8.600, 11.400, 14.600, 18.200.
- Quest harian: satu pelajaran, satu kuis benar, satu eksekusi Lab.
- 12 badge untuk penyelesaian, konsistensi, dan latihan.
- Streak dihitung dari hari dengan pelajaran selesai atau kuis benar.
- Kuis multi-pertanyaan: XP percobaan pertama dihitung dari percobaan maksimum per pertanyaan.

## Progres dan portabilitas

Progres hidup di `localStorage` browser, bukan di berkas HTML. Menyalin `BelajarKode.html` **tidak** membawa progres.

- Pindah perangkat: **Settings → Ekspor JSON**, lalu **Impor JSON** di perangkat baru.
- Impor menggantikan seluruh progres; aplikasi mengunduh backup keadaan sekarang terlebih dahulu.
- Progres terikat pada perangkat, browser, dan lokasi berkas. Jangan memindahkan atau mengganti nama HTML jika tidak perlu.
- Membersihkan data situs browser akan menghapus progres yang belum dibackup.
- Backup schema 2 berisi pelajaran, kuis, catatan, bookmark, progres baca, checklist persiapan, XP, activity, badge, dan pengaturan. Backup schema 1 dari versi lama tetap dapat diimpor.

## Pengembangan

```powershell
npm install          # sekali
npm run dev          # content + book + http://localhost:5173
npm run content:build
npm run content:check
npm run sources:check # cek URL registry sumber (butuh internet)
npm run build        # content check + book + single-file build + salin artefak
npm run book         # content + buku offline
npm run test         # unit test (Vitest)
npm run lint         # ESLint
npm run smoke        # E2E file:// dengan Chrome lokal
npm run a11y         # audit axe (WCAG 2.1/2.2 AA)
```

Persyaratan: Node.js 20.19+ (diuji pada 24), Chrome/Edge untuk skrip smoke. Jika Chrome tidak ada di lokasi default, set `CHROME_PATH`.

### Struktur

```text
BelajarKode.html            # artefak: aplikasi satu berkas (hasil build)
buku-belajarkode.html       # artefak: buku offline (hasil build)
CARA-BUKA.txt               # petunjuk singkat untuk pengguna
index.html                  # entry Vite
content/
  index.json                # metadata, roadmap, tools, policy
  m00/ .. m02/              # modul yang sudah ditulis ulang (module.json + lesson-*.json)
  m03.json .. m13.json      # modul legacy; m03-l01/l03 sudah v3.1, sisanya menyusul
data/curriculum.json        # hasil generate dari content/
src/
  App.jsx                   # shell, router hash, guard login
  screens/                  # Mulai, Base, Path, Modules, Lesson, Lab, dll.
  components/               # Rail, TopBar, Quiz, PinInput, dialogs
  lib/                      # auth, storage, xp, streak, badges, setup
  state/AppStore.jsx        # state, aksi, persistensi, notifikasi
  styles/app.css            # warm mint dashboard design system
book/
  book.css                  # tema buku
  deep-dive/01..05.html     # konten pendalaman hasil ekstraksi
scripts/
  build-content.mjs         # content/ -> data/curriculum.json, resolve sourceId
  check-content.mjs         # validasi schema, kata, kuis, bahasa, sumber
  check-sources.mjs         # cek URL registry sumber (online, terpisah dari build)
  build-book.mjs            # generator buku
  extract-deep-dive.mjs     # ekstraksi sekali dari buku lama
  release.mjs               # salin artefak ke root
  smoke*.mjs, a11y.mjs      # verifikasi browser
```

### Mengubah materi

1. Edit `content/mXX.json` atau `content/index.json`.
2. Untuk sumber baru, tambahkan entri ke `content/index.json` → `sources`, lalu rujuk dengan `sourceId` di lesson.
3. Jalankan `npm run content:check`.
4. Jalankan `npm run sources:check` saat ada perubahan URL.
5. Jalankan `npm run build`.

`data/curriculum.json` adalah artefak generate; jangan mengeditnya langsung. Schema v2 memakai `objectives`, `prerequisites`, `terms`, `sections`, `practice[]`, `troubleshooting[]`, `quiz.questions[]`, `resources`, dan `summary`. Pelajaran lama dinormalkan otomatis, lalu modul yang sudah ditulis ulang didaftarkan di `contentPolicy.requireV2` agar wajib memenuhi target kata, 3 kuis, 3 latihan, 3 troubleshooting, dan sapaan formal "Anda". Schema v3 menambahkan `outcome`, `depth`, `syntax[]`, `hints[]`, dan `verification`; pelajaran pilot didaftarkan di `contentPolicy.requireV3` dan wajib berada dalam rentang kata `depthWordBands`. Schema v3.1 menambahkan `syntax[].readAs`, `sections[].code.annotations[]` berisi `line`/`code`/`note`, `conventions[]`, dan `next`; validator memastikan setiap blok kode punya output, penjelasan, dan bedah baris yang cocok dengan kode. Modul/pelajaran ketat juga wajib memakai minimal dua sumber registry, satu di antaranya tier `standard`/`official`, dengan URL HTTPS dan tanggal pemeriksaan.

### Buku offline

`npm run book` menggabungkan `data/curriculum.json` dengan 5 blok pendalaman di `book/deep-dive/`. Blok tersebut berisi ~65 KB materi yang tidak ada di JSON; **jangan hapus** folder itu. Generator memvalidasi keberadaan 5 blok dan kurikulum yang tidak kosong, bukan angka pelajaran hardcoded.

## Batasan yang disengaja

- Tidak ada backend, akun server, sinkronisasi otomatis, analytics, atau tracker.
- Tidak ada PWA/service worker: keduanya tidak berfungsi di `file://` dan tidak diperlukan karena aplikasi sudah lokal.
- Lab JavaScript memakai Web Worker dengan batas 2 detik; jika Worker diblokir, otomatis memakai iframe sandbox.
- Lab HTML/CSS tidak mengeksekusi script. Lab JSON hanya memvalidasi format.
- Beberapa browser memisahkan `localStorage` per lokasi berkas; perilaku `file://` berbeda antar browser.

## Verifikasi

- `npm run test`: XP, level, streak, quest, auth, normalisasi state, backup/migrasi.
- `npm run smoke`: alur file:// — buat profil, checklist Mulai, tandai selesai, kuis, lab, reload, logout/login PIN, ekspor/impor, pencarian, drawer mobile, dan buku.
- `npm run smoke:legacy`: migrasi `belajarkode-user-v1` ke profil baru.
- `npm run smoke:guest`: profil tamu, aktivasi PIN, lalu login dengan PIN.
- `npm run a11y`: axe pada permukaan desktop/mobile; saat ini 0 pelanggaran WCAG 2.1/2.2 AA.

Materi merujuk pada MDN, TypeScript Handbook, PHP Manual, Laravel docs, PostgreSQL docs, Flutter/Dart docs, OWASP Top 10, WCAG 2.2, dan Git docs. Versi teknologi berubah; periksa dokumentasi resmi saat membangun proyek baru.
