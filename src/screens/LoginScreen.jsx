import { useMemo, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import PinInput from '../components/PinInput.jsx';
import { validatePin } from '../lib/auth.js';
import { formatDate } from '../lib/dates.js';
import { curriculum, modules, totalLessons } from '../data/curriculum.js';
import { useApp } from '../state/AppStore.jsx';

export default function LoginScreen() {
  const { profiles, login, createProfile, busy, legacy, storageOk } = useApp();
  const [mode, setMode] = useState(profiles.length ? 'login' : 'create');
  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? null);
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [guest, setGuest] = useState(false);
  const [importLegacy, setImportLegacy] = useState(Boolean(legacy));

  const selected = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? null,
    [profiles, selectedId],
  );

  const legacyCount = legacy?.completed?.length ?? 0;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');
    if (!selected) {
      setError('Pilih profil terlebih dahulu.');
      return;
    }
    if (!selected.guest && validatePin(pin)) {
      setError('PIN harus 6 digit angka.');
      return;
    }
    const result = await login(selected.id, pin, remember);
    if (!result.ok) setError(result.error);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setError('');
    if (!guest) {
      const pinError = validatePin(newPin);
      if (pinError) {
        setError(pinError);
        return;
      }
      if (newPin !== confirmPin) {
        setError('Konfirmasi PIN tidak sama.');
        return;
      }
    }
    const result = await createProfile({ name, pin: newPin, guest, importLegacy });
    if (!result.ok) setError(result.error);
  };

  return (
    <main className="login">
      <section className="login-brand">
        <div className="login-brand-top">
          <span className="brand-mark brand-mark-lg" aria-hidden="true">{'</>'}</span>
          <span className="login-wordmark">BelajarKode</span>
        </div>

        <div className="login-thesis">
          <p className="eyebrow">RUANG KERJA PEMROGRAMAN</p>
          <h1>Belajar dengan menyelesaikan, bukan menonton.</h1>
          <p>
            {totalLessons} pelajaran, {modules.length} modul, satu jalur {curriculum.roadmap.length}{' '}
            minggu. Progres, catatan, dan laboratorium kode tersimpan di perangkat ini.
          </p>
        </div>

        <div className="login-specs">
          <span><b>{modules.length}</b> modul</span>
          <span><b>{totalLessons}</b> pelajaran</span>
          <span><b>{curriculum.roadmap.length}</b> minggu</span>
          <span><b>0</b> server</span>
        </div>

        <p className="login-foot">
          Portabel sebagai satu berkas HTML. Buka tanpa internet; materi dan lab tetap berjalan.
        </p>
      </section>

      <section className="login-panel">
        <div className="auth-tabs" role="tablist" aria-label="Akses profil">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => switchMode('login')}
            disabled={profiles.length === 0}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'is-active' : ''}
            onClick={() => switchMode('create')}
          >
            Profil baru
          </button>
        </div>

        {!storageOk && (
          <div className="notice notice-warn">
            <Icon name="alert" size={16} />
            <p>
              Penyimpanan browser tidak tersedia. Progres tidak akan tersimpan setelah tab ditutup.
            </p>
          </div>
        )}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <div className="field-label">
              <span>Pilih profil</span>
              <small>{profiles.length} profil di perangkat ini</small>
            </div>
            <div className="profile-list">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`profile-choice ${selectedId === profile.id ? 'is-active' : ''}`.trim()}
                  onClick={() => {
                    setSelectedId(profile.id);
                    setPin('');
                    setError('');
                  }}
                >
                  <Avatar name={profile.name} color={profile.color} guest={profile.guest} />
                  <span>
                    <strong>{profile.name}</strong>
                    <small>
                      {profile.guest ? 'Mode tamu' : 'PIN aktif'}
                      {profile.lastLoginAt ? ` · terakhir ${formatDate(profile.lastLoginAt)}` : ''}
                    </small>
                  </span>
                  {selectedId === profile.id && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>

            {selected && !selected.guest && (
              <label className="field">
                <span>PIN 6 digit</span>
                <PinInput value={pin} onChange={setPin} autoFocus disabled={busy} />
              </label>
            )}

            {selected?.guest && (
              <p className="field-hint">
                Mode tamu tidak memakai PIN. Siapa pun yang membuka perangkat ini dapat melihat
                progres.
              </p>
            )}

            <label className="check-line">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Tetap masuk di perangkat ini</span>
            </label>

            {error && (
              <p className="form-error" role="alert">
                <Icon name="alert" size={15} /> {error}
              </p>
            )}

            <button type="submit" className="btn btn-accent btn-block" disabled={busy || !selected}>
              {busy ? 'Memeriksa…' : selected?.guest ? 'Masuk sebagai tamu' : 'Masuk'}
            </button>

            <p className="field-hint">
              PIN mengunci profil di perangkat ini, bukan mengenkripsi data. Tidak ada pemulihan PIN;
              cadangan tetap dapat diunduh setelah masuk.
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitCreate}>
            <div className="field-label">
              <span>Buat profil</span>
              <small>Data tetap di browser ini</small>
            </div>

            <label className="field">
              <span>Nama</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama panggilan"
                maxLength={24}
                autoFocus
                autoComplete="nickname"
              />
            </label>

            {!guest && (
              <>
                <label className="field">
                  <span>PIN 6 digit</span>
                  <PinInput value={newPin} onChange={setNewPin} disabled={busy} />
                </label>
                <label className="field">
                  <span>Ulangi PIN</span>
                  <PinInput value={confirmPin} onChange={setConfirmPin} disabled={busy} />
                </label>
              </>
            )}

            <label className="check-line">
              <input
                type="checkbox"
                checked={guest}
                onChange={(event) => setGuest(event.target.checked)}
              />
              <span>Mulai tanpa PIN (mode tamu)</span>
            </label>

            {legacy && (
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={importLegacy}
                  onChange={(event) => setImportLegacy(event.target.checked)}
                />
                <span>
                  Pulihkan progres lama <b>({legacyCount} pelajaran)</b>
                </span>
              </label>
            )}

            {error && (
              <p className="form-error" role="alert">
                <Icon name="alert" size={15} /> {error}
              </p>
            )}

            <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
              {busy ? 'Menyiapkan profil…' : 'Buat profil'}
            </button>

            <p className="field-hint">
              Berkas cadangan dapat dipulihkan kapan saja dari halaman Pengaturan.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
