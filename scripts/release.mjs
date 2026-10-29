import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');

const files = ['BelajarKode.html', 'buku-belajarkode.html'];
let copied = 0;

for (const file of files) {
  const source = path.join(dist, file);
  if (!fs.existsSync(source)) {
    console.warn(`lewati ${file}: belum ada di dist/`);
    continue;
  }
  fs.copyFileSync(source, path.join(root, file));
  copied += 1;
  console.log(`disalin ke root: ${file}`);
}

const guide = `BelajarKode — cara membuka
==========================

1. Klik dua kali BelajarKode.html.
2. Buku offline: klik dua kali buku-belajarkode.html.
3. Buka menu Mulai untuk daftar persiapan alat dan verifikasi instalasi.
4. Tidak perlu server, npm, atau internet untuk membaca materi.
5. Progres tersimpan di browser perangkat ini, bukan di berkas HTML.
   Untuk pindah perangkat: Pengaturan -> Unduh cadangan, lalu Pulihkan di perangkat baru.
6. Jangan membersihkan data situs browser jika progres belum dibuatkan cadangan.

Berkas ini dihasilkan otomatis oleh "npm run build".
`;

for (const target of [path.join(root, 'CARA-BUKA.txt'), path.join(dist, 'CARA-BUKA.txt')]) {
  fs.writeFileSync(target, guide, 'utf8');
}

console.log(`Selesai: ${copied} berkas portabel diperbarui.`);
