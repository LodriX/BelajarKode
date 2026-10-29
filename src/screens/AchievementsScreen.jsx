import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { PageHead } from '../components/Page.jsx';
import { totalLessons } from '../data/curriculum.js';
import { LEVELS, levelForXp } from '../lib/constants.js';
import { formatDate } from '../lib/dates.js';
import { useApp } from '../state/AppStore.jsx';

export default function AchievementsScreen() {
  const { state, xp, level, badges, completedCount, streak } = useApp();
  const earned = badges.filter((badge) => badge.earnedAt);
  const labRuns = Object.values(state.activity ?? {}).reduce(
    (sum, entry) => sum + (Number(entry?.lab) || 0),
    0,
  );

  return (
    <div className="screen">
      <PageHead
        eyebrow="PENCAPAIAN"
        title="Pencapaian"
        description="Jenjang naik dari poin, lencana terbuka dari kebiasaan. Semua dihitung dari progres yang benar-benar tercatat."
      />

      <section className="achievement-stats">
        <div>
          <span className="mono-label">TOTAL POIN</span>
          <strong>{xp.toLocaleString('id-ID')}</strong>
        </div>
        <div>
          <span className="mono-label">JENJANG</span>
          <strong>{String(level.level).padStart(2, '0')}</strong>
          <small>{level.name}</small>
        </div>
        <div>
          <span className="mono-label">PELAJARAN</span>
          <strong>{completedCount}</strong>
          <small>dari {totalLessons}</small>
        </div>
        <div>
          <span className="mono-label">RUNTUTAN</span>
          <strong>{streak}</strong>
          <small>hari</small>
        </div>
        <div>
          <span className="mono-label">LENCANA</span>
          <strong>{earned.length}</strong>
          <small>dari {badges.length}</small>
        </div>
      </section>

      <section className="level-section">
        <div className="section-title">
          <div>
            <h2>Jenjang belajar</h2>
            <p className="section-meta">Ambang poin kumulatif untuk setiap jenjang.</p>
          </div>
        </div>
        <div className="level-ladder">
          {LEVELS.map((item, index) => {
            const reached = xp >= item.min;
            const current = levelForXp(xp).level === index + 1;
            return (
              <div key={item.name} className={`level-step ${reached ? 'is-reached' : ''} ${current ? 'is-current' : ''}`.trim()}>
                <span className="level-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="level-main">
                  <strong>{item.name}</strong>
                  <small>{item.min.toLocaleString('id-ID')} poin</small>
                </span>
                {current && <span className="level-tag">SEKARANG</span>}
                {reached && !current && <Icon name="check" size={15} />}
              </div>
            );
          })}
        </div>
        <div className="level-progress">
          <Meter value={level.progress * 100} />
          <small>
            {level.remaining ? `${level.remaining} poin lagi menuju jenjang ${level.level + 1}` : 'Jenjang tertinggi sudah tercapai'}
          </small>
        </div>
      </section>

      <section className="badge-section">
        <div className="section-title">
          <div>
            <h2>Lencana</h2>
            <p className="section-meta">Dua belas penanda kebiasaan belajar dan penyelesaian.</p>
          </div>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <article className={`badge ${badge.earnedAt ? 'is-earned' : 'is-locked'}`.trim()} key={badge.id}>
              <span className="badge-icon">
                <Icon name={badge.icon} size={20} />
              </span>
              <div>
                <strong>{badge.title}</strong>
                <p>{badge.detail}</p>
                <small>{badge.earnedAt ? `Dibuka ${formatDate(badge.earnedAt)}` : 'Belum terbuka'}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="achievement-foot">
        <p>
          {labRuns} eksekusi Lab kode tercatat. Runtutan dihitung dari hari dengan pelajaran selesai
          atau kuis benar.
        </p>
        <a className="text-link" href="#/path">
          Lihat jalur belajar <Icon name="arrowRight" size={13} />
        </a>
      </section>
    </div>
  );
}
