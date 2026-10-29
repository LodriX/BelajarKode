export const SETUP_PLATFORMS = Object.freeze([
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
]);

export const SETUP_ITEMS = Object.freeze([
  {
    id: 'perangkat',
    title: 'Siapkan perangkat',
    why: 'Pastikan ada ruang untuk editor, runtime, database, dan emulator.',
    install: {
      windows: 'Gunakan Windows 10/11 64-bit. Sisakan minimal 10 GB ruang disk.',
      macos: 'Gunakan macOS versi yang masih didukung. Sisakan minimal 10 GB ruang disk.',
      linux: 'Gunakan distro 64-bit yang masih didukung. Sisakan minimal 10 GB ruang disk.',
    },
    verify: ['Minimal 8 GB RAM, idealnya 16 GB.', 'Ada koneksi internet untuk tahap instalasi.'],
    official: '',
  },
  {
    id: 'browser',
    title: 'Browser modern + DevTools',
    why: 'Browser menjalankan HTML, CSS, dan JavaScript; DevTools membantu membaca error.',
    install: {
      windows: 'Pasang Chrome, Edge, atau Firefox versi terbaru.',
      macos: 'Pasang Chrome, Safari, atau Firefox versi terbaru.',
      linux: 'Pasang Chrome, Chromium, atau Firefox versi terbaru.',
    },
    verify: ['Buka DevTools dengan F12 atau Ctrl+Shift+I.', 'Tab Console dan Network terlihat.'],
    official: 'https://developer.chrome.com/docs/devtools/',
  },
  {
    id: 'editor',
    title: 'Editor kode',
    why: 'Editor memberi sorotan sintaks, terminal, Git, dan debugging dalam satu tempat.',
    install: {
      windows: 'Pasang VS Code dari situs resmi, lalu aktifkan opsi "Add to PATH".',
      macos: 'Pasang VS Code, lalu jalankan "Shell Command: Install code command in PATH".',
      linux: 'Pasang VS Code dari repositori resmi atau paket distro Anda.',
    },
    verify: ['Buka VS Code.', 'Terminal terintegrasi dapat dijalankan.'],
    official: 'https://code.visualstudio.com/',
  },
  {
    id: 'git',
    title: 'Git',
    why: 'Git menyimpan riwayat perubahan dan menjadi dasar kolaborasi.',
    install: {
      windows: 'Pasang Git for Windows. Biarkan pilihan default HTTPS dan line ending.',
      macos: 'Jalankan xcode-select --install atau pasang Git dari git-scm.com.',
      linux: 'Pasang paket git dari manajer paket distro Anda.',
    },
    verify: ['git --version', 'git config --global user.name "Nama Anda"', 'git config --global user.email "email@contoh.com"'],
    official: 'https://git-scm.com/downloads',
  },
  {
    id: 'node',
    title: 'Node.js 24 LTS + npm',
    why: 'JavaScript modern, Vite, dan banyak alat pengembangan berjalan di Node.',
    install: {
      windows: 'Pasang Node.js 24 LTS dari nodejs.org. Jangan centang alat tambahan yang tidak dipahami.',
      macos: 'Pasang Node.js 24 LTS dari nodejs.org atau gunakan fnm/nvm.',
      linux: 'Pasang Node.js 24 LTS dari nodejs.org atau gunakan fnm/nvm.',
    },
    verify: ['node --version', 'npm --version'],
    official: 'https://nodejs.org/en/download',
  },
  {
    id: 'php',
    title: 'PHP 8.5',
    why: 'Materi backend memakai PHP modern sebelum masuk Laravel.',
    install: {
      windows: 'Gunakan Laragon atau paket PHP 8.5 resmi. Pastikan ekstensi openssl dan pdo_pgsql aktif.',
      macos: 'Pasang PHP 8.5 melalui Homebrew atau paket resmi php.net.',
      linux: 'Pasang PHP 8.5 dari repositori distro atau paket resmi php.net.',
    },
    verify: ['php --version', 'php -m'],
    official: 'https://www.php.net/downloads',
  },
  {
    id: 'composer',
    title: 'Composer 2',
    why: 'Composer mengelola dependensi dan membuat proyek Laravel.',
    install: {
      windows: 'Pasang Composer lewat installer resmi setelah PHP tersedia.',
      macos: 'Pasang Composer lewat Homebrew atau installer resmi.',
      linux: 'Pasang Composer lewat manajer paket atau installer resmi.',
    },
    verify: ['composer --version', 'composer diagnose'],
    official: 'https://getcomposer.org/download/',
  },
  {
    id: 'postgres',
    title: 'PostgreSQL 18',
    why: 'Latihan SQL dan Laravel memakai database relasional yang nyata.',
    install: {
      windows: 'Pasang PostgreSQL 18 dari installer EDB. Simpan kata sandi superuser dengan aman.',
      macos: 'Pasang PostgreSQL 18 lewat Homebrew atau Postgres.app.',
      linux: 'Pasang PostgreSQL 18 dari repositori distro atau paket resmi.',
    },
    verify: ['psql --version', 'psql -U postgres -c "SELECT version();"'],
    official: 'https://www.postgresql.org/download/',
  },
  {
    id: 'flutter',
    title: 'Flutter 3.47 + Dart',
    why: 'Modul mobile memakai Flutter untuk membangun aplikasi Android dan iOS.',
    install: {
      windows: 'Pasang Flutter SDK, Android Studio, dan emulator Android.',
      macos: 'Pasang Flutter SDK, Xcode, dan Android Studio.',
      linux: 'Pasang Flutter SDK, Android Studio, dan emulator Android.',
    },
    verify: ['flutter --version', 'flutter doctor'],
    official: 'https://docs.flutter.dev/get-started/install',
  },
  {
    id: 'proyek',
    title: 'Folder proyek dan backup',
    why: 'Kebiasaan menyimpan proyek dan backup mencegah kehilangan progres.',
    install: {
      windows: 'Buat folder C:\\proyek. Jangan menyimpan proyek di folder sinkronisasi yang tidak Anda pahami.',
      macos: 'Buat folder ~/proyek. Jangan menyimpan proyek di folder sinkronisasi yang tidak Anda pahami.',
      linux: 'Buat folder ~/proyek. Jangan menyimpan proyek di folder sinkronisasi yang tidak Anda pahami.',
    },
    verify: ['Buka folder proyek dari terminal.', 'Ekspor backup JSON dari halaman Settings secara berkala.'],
    official: '',
  },
]);

export function setupProgress(completed = []) {
  const done = new Set(Array.isArray(completed) ? completed : []);
  const finished = SETUP_ITEMS.filter((item) => done.has(item.id)).length;
  const total = SETUP_ITEMS.length;
  return {
    total,
    finished,
    percent: total ? Math.round((finished / total) * 100) : 0,
    complete: total > 0 && finished === total,
  };
}
