import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icon.jsx';
import PinInput from '../components/PinInput.jsx';
import { PageHead } from '../components/Page.jsx';
import { curriculum, totalLessons, totalModules } from '../data/curriculum.js';
import { formatDate, formatDateTime } from '../lib/dates.js';
import { useApp } from '../state/AppStore.jsx';

export default function SettingsScreen() {
  const {
    profile,
    state,
    level,
    xp,
    storageOk,
    legacy,
    renameProfile,
    logout,
    deleteProfile,
    setDailyGoal,
    setSettings,
    setProfilePin,
    exportBackup,
    importBackup,
    resetProgress,
    restoreLegacy,
    notify,
  } = useApp();

  const [name, setName] = useState(profile?.name ?? '');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pending, setPending] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setName(profile?.name ?? '');
  }, [profile?.name]);

  const saveName = () => {
    if (name.trim().length < 2) {
      notify('Nama minimal 2 karakter.', 'error');
      return;
    }
    renameProfile(name);
    notify('Nama profil diperbarui.');
  };

  const activatePin = async () => {
    if (pin !== pinConfirm) {
      notify('Konfirmasi PIN tidak sama.', 'error');
      return;
    }
    const result = await setProfilePin(pin);
    if (!result.ok) notify(result.error, 'error');
    else {
      setPin('');
      setPinConfirm('');
    }
  };

  const onPickFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPending({ type: 'import', file });
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.type === 'reset') {
      resetProgress();
    } else if (pending.type === 'delete') {
      deleteProfile(profile.id);
    } else if (pending.type === 'legacy') {
      restoreLegacy();
    } else if (pending.type === 'import') {
      exportBackup();
      const result = await importBackup(pending.file);
      if (!result.ok) notify(result.error, 'error');
    }
    setPending(null);
  };

  return (
    <div className="screen">
      <PageHead
        eyebrow="PENGATURAN"
        title="Pengaturan"
        description="Profil, preferensi, dan cadangan. Semua data tinggal di browser perangkat ini."
      />

      <section className="settings-section">
        <div className="settings-heading">
          <h2>Profil</h2>
          <span className="mono-label">LOKAL</span>
        </div>
        <div className="profile-row">
          <Avatar name={profile?.name} color={profile?.color} size="lg" guest={profile?.guest} />
          <div className="profile-row-main">
            <label className="field">
              <span>Nama tampilan</span>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <p className="hint">
              {profile?.guest ? 'Mode tamu · tanpa PIN' : 'PIN aktif · 6 digit'} · Jenjang{' '}
              {level.level} {level.name} · {xp.toLocaleString('id-ID')} poin
            </p>
          </div>
          <div className="profile-row-actions">
            <button type="button" className="btn btn-soft" onClick={saveName}>
              Simpan nama
            </button>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              <Icon name="logout" size={15} /> Ganti profil
            </button>
          </div>
        </div>

        {profile?.guest && (
          <div className="guest-upgrade">
            <div>
              <span className="mono-label">AKTIFKAN PIN</span>
              <p>
                Profil tamu tidak memakai PIN. Setelah PIN aktif, profil akan diminta setiap kali
                dibuka.
              </p>
            </div>
            <div className="guest-pin-fields">
              <label className="field">
                <span>PIN 6 digit</span>
                <PinInput value={pin} onChange={setPin} />
              </label>
              <label className="field">
                <span>Ulangi PIN</span>
                <PinInput value={pinConfirm} onChange={setPinConfirm} />
              </label>
            </div>
            <button type="button" className="btn btn-accent" onClick={activatePin}>
              Aktifkan PIN
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-heading">
          <h2>Preferensi</h2>
        </div>
        <div className="settings-grid">
          <div className="setting">
            <div>
              <strong>Target harian</strong>
              <p>Jumlah pelajaran yang ingin diselesaikan per hari.</p>
            </div>
            <select
              value={state.dailyGoal}
              onChange={(event) => setDailyGoal(Number(event.target.value))}
              aria-label="Target pelajaran per hari"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} pelajaran
                </option>
              ))}
            </select>
          </div>

          <div className="setting">
            <div>
              <strong>Tampilan</strong>
              <p>Nyaman memakai kertas gading yang lembut, Terang untuk ruangan sangat terang, Malam untuk cahaya rendah.</p>
            </div>
            <div className="segmented" role="group" aria-label="Tampilan">
              {[
                { id: 'nyaman', label: 'Nyaman' },
                { id: 'terang', label: 'Terang' },
                { id: 'malam', label: 'Malam' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={state.settings.appearance === item.id ? 'is-active' : ''}
                  onClick={() => setSettings({ appearance: item.id })}
                  aria-pressed={state.settings.appearance === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting">
            <div>
              <strong>Kontras</strong>
              <p>Mode tinggi menaikkan batas kontras teks dan garis.</p>
            </div>
            <div className="segmented" role="group" aria-label="Kontras">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'high', label: 'Tinggi' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={state.settings.contrast === item.id ? 'is-active' : ''}
                  onClick={() => setSettings({ contrast: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting">
            <div>
              <strong>Gerak</strong>
              <p>Kurangi animasi level-up dan transisi.</p>
            </div>
            <div className="segmented" role="group" aria-label="Gerak">
              {[
                { id: 'system', label: 'Sistem' },
                { id: 'reduce', label: 'Kurangi' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={state.settings.motion === item.id ? 'is-active' : ''}
                  onClick={() => setSettings({ motion: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-heading">
          <h2>Cadangan progres</h2>
          <span className="mono-label">
            {state.lastBackupAt ? `TERAKHIR ${formatDateTime(state.lastBackupAt)}` : 'BELUM PERNAH'}
          </span>
        </div>
        <p className="settings-copy">
          Progres tinggal di <code>localStorage</code> browser, bukan di berkas HTML. Pindah perangkat
          atau bersihkan data browser hanya aman jika Anda memiliki berkas cadangan.
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-accent" onClick={exportBackup}>
            <Icon name="download" size={15} /> Unduh cadangan
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={15} /> Pulihkan cadangan
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={onPickFile}
          />
        </div>
        {legacy && (
          <div className="notice notice-warn">
            <Icon name="alert" size={16} />
            <div>
              <strong>Progres versi lama ditemukan</strong>
              <p>
                {legacy.completed.length} pelajaran dari penyimpanan versi sebelumnya. Memulihkan akan
                menggantikan progres profil ini.
              </p>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => setPending({ type: 'legacy' })}
              >
                Pulihkan progres lama
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-heading">
          <h2>Hapus data</h2>
        </div>
        <div className="danger-row">
          <div>
            <strong>Hapus progres</strong>
            <p>Menghapus pelajaran, kuis, poin, lencana, catatan, dan isi Lab kode. Profil tetap ada.</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setPending({ type: 'reset' })}>
            <Icon name="reset" size={15} /> Hapus progres
          </button>
        </div>
        <div className="danger-row">
          <div>
            <strong>Hapus profil</strong>
            <p>Menghapus profil beserta seluruh progresnya dari perangkat ini.</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setPending({ type: 'delete' })}>
            <Icon name="trash" size={15} /> Hapus profil
          </button>
        </div>
      </section>

      <section className="settings-section about">
        <div className="settings-heading">
          <h2>Tentang</h2>
          <span className="mono-label">V{curriculum.version.toUpperCase()}</span>
        </div>
        <dl className="about-grid">
          <div>
            <dt>Kurikulum</dt>
            <dd>
              {totalModules} modul · {totalLessons} pelajaran
            </dd>
          </div>
          <div>
            <dt>Materi diperbarui</dt>
            <dd>{formatDate(curriculum.updated)}</dd>
          </div>
          <div>
            <dt>Penyimpanan</dt>
            <dd>{storageOk ? 'Aktif di browser ini' : 'Tidak tersedia'}</dd>
          </div>
          <div>
            <dt>Buku offline</dt>
            <dd>
              <a href="buku-belajarkode.html" target="_blank" rel="noopener noreferrer">
                Buka buku <Icon name="external" size={12} />
              </a>
            </dd>
          </div>
        </dl>
        <p className="hint">
          Tanpa akun server, analytics, atau sinkronisasi otomatis. PIN hanya mengunci profil, bukan
          mengenkripsi data.
        </p>
      </section>

      <section className="settings-section">
        <div className="settings-heading">
          <h2>Sumber resmi</h2>
          <span className="mono-label">{curriculum.sources.length} TAUTAN</span>
        </div>
        <ul className="source-list">
          {curriculum.sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                <span className="source-title">
                  {source.title}
                  <span className="source-meta">
                    {source.publisher}
                    {source.version ? ` · ${source.version}` : ''}
                  </span>
                </span>
                <Icon name="external" size={12} />
              </a>
            </li>
          ))}
        </ul>
        <p className="hint">
          Tautan memerlukan internet. Versi dan tanggal pemeriksaan tercatat agar klaim teknis dapat
          dilacak ke dokumentasi asalnya.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(pending)}
        danger={pending?.type !== 'import' && pending?.type !== 'legacy'}
        title={
          pending?.type === 'reset'
            ? 'Hapus seluruh progres?'
            : pending?.type === 'delete'
              ? `Hapus profil ${profile?.name}?`
              : pending?.type === 'legacy'
                ? 'Pulihkan progres lama?'
                : 'Pulihkan dan ganti progres?'
        }
        confirmLabel={
          pending?.type === 'reset'
            ? 'Hapus progres'
            : pending?.type === 'delete'
              ? 'Hapus profil'
              : 'Pulihkan'
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
      >
        {pending?.type === 'reset' && (
          <p>Pelajaran, kuis, poin, lencana, catatan, dan isi Lab kode akan dihapus dari profil ini.</p>
        )}
        {pending?.type === 'delete' && (
          <p>Profil dan seluruh progresnya akan dihapus permanen dari perangkat ini.</p>
        )}
        {pending?.type === 'legacy' && (
          <p>Progres dari versi lama akan menggantikan data profil saat ini.</p>
        )}
        {pending?.type === 'import' && (
          <p>
            Berkas <b>{pending.file?.name}</b> akan menggantikan seluruh progres. Sebelum memulihkan,
            aplikasi mengunduh cadangan keadaan sekarang.
          </p>
        )}
        <p className="hint">Tindakan ini tidak dapat dibatalkan tanpa berkas cadangan.</p>
      </ConfirmDialog>
    </div>
  );
}
