import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { PageHead } from '../components/Page.jsx';
import { lessons } from '../data/curriculum.js';
import { SETUP_ITEMS, SETUP_PLATFORMS } from '../lib/setup.js';
import { useApp } from '../state/AppStore.jsx';

export default function StartScreen() {
  const { state, setup, setSetupPlatform, toggleSetupItem } = useApp();
  const platform = state.setup?.platform ?? 'windows';
  const completed = new Set(state.setup?.completed ?? []);
  const firstLesson = lessons[0];

  return (
    <div className="screen start-screen">
      <PageHead
        eyebrow="MULAI · PERSIAPAN"
        title="Siapkan ruang kerja"
        description="Daftar ini membantu Anda memasang alat yang dipakai sepanjang kurikulum. Centang setelah memverifikasi sendiri; aplikasi tidak mendeteksi instalasi secara otomatis."
      />

      <section className="setup-hero">
        <div>
          <span className="mono-label">PROGRES PERSIAPAN</span>
          <strong>
            {setup.finished}/{setup.total}
          </strong>
          <Meter value={setup.percent} label="Progres persiapan" />
          <p className="setup-meta">
            {setup.complete
              ? 'Ruang kerja siap. Mulai dari pelajaran pertama atau lanjutkan modul yang sedang berjalan.'
              : 'Kerjakan berurutan. Jika satu alat belum diperlukan, Anda tetap dapat membaca materi konsep.'}
          </p>
        </div>
        <div className="setup-platform" role="group" aria-label="Pilih sistem operasi">
          <span className="mono-label">SISTEM OPERASI</span>
          <div className="setup-platform-buttons">
            {SETUP_PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${platform === item.id ? 'is-active' : ''}`.trim()}
                aria-pressed={platform === item.id}
                onClick={() => setSetupPlatform(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="setup-list">
        {SETUP_ITEMS.map((item, index) => {
          const done = completed.has(item.id);
          return (
            <article className={`setup-item ${done ? 'is-done' : ''}`.trim()} key={item.id}>
              <label className="setup-check">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleSetupItem(item.id)}
                  aria-label={`Tandai ${item.title} selesai`}
                />
                <span className="setup-checkmark" aria-hidden="true">
                  {done ? <Icon name="check" size={14} /> : String(index + 1).padStart(2, '0')}
                </span>
              </label>

              <div className="setup-item-body">
                <div className="setup-item-head">
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.why}</p>
                  </div>
                  {done && <span className="setup-done-label">SELESAI</span>}
                </div>

                <div className="setup-install">
                  <span className="mono-label">LANGKAH · {platform.toUpperCase()}</span>
                  <p>{item.install[platform]}</p>
                </div>

                <div className="setup-verify">
                  <span className="mono-label">VERIFIKASI</span>
                  <ul>
                    {item.verify.map((line) => (
                      <li key={line}>
                        <code>{line}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                {item.official && (
                  <a
                    className="text-link setup-link"
                    href={item.official}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Dokumentasi resmi <Icon name="external" size={13} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className={`setup-finish ${setup.complete ? 'is-ready' : ''}`.trim()}>
        <div>
          <span className="mono-label">{setup.complete ? 'SIAP' : 'SETELAH SEMUA DICENTANG'}</span>
          <h2>{setup.complete ? 'Ruang kerja Anda siap.' : 'Belum semua langkah selesai.'}</h2>
          <p>
            {setup.complete
              ? 'Buka pelajaran pertama, lalu kembali ke Beranda untuk melihat target harian.'
              : 'Tidak perlu menunggu sempurna. Materi konsep bisa dibaca lebih dulu; lengkapi alat saat modul terkait dimulai.'}
          </p>
        </div>
        <div className="setup-finish-actions">
          <a className="btn btn-accent" href={`#/lesson/${firstLesson.id}`}>
            Mulai pelajaran <Icon name="arrowRight" size={15} />
          </a>
          <a className="btn btn-ghost" href="#/">
            Buka Beranda
          </a>
        </div>
      </section>
    </div>
  );
}
