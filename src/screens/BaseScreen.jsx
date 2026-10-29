import { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import LessonRow from '../components/LessonRow.jsx';
import Meter from '../components/Meter.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import { PageHead, SectionTitle } from '../components/Page.jsx';
import {
  lessonById,
  moduleById,
  moduleProgress,
  modules,
  nextLesson,
  totalLessons,
} from '../data/curriculum.js';
import { daysSince, formatDate, todayKey } from '../lib/dates.js';
import { useApp } from '../state/AppStore.jsx';

export default function BaseScreen() {
  const { profile, state, level, xp, streak, quests, completedCount, setup } = useApp();

  const next = useMemo(() => nextLesson(state.completed), [state.completed]);
  const nextModule = moduleById.get(next.moduleId);
  const progress = moduleProgress(nextModule, state.completed);
  const allDone = completedCount >= totalLessons;

  const today = state.activity?.[todayKey()];
  const lessonsToday = today?.lessons?.length ?? 0;
  const questsDone = quests.filter((quest) => quest.done).length;
  const backupDays = daysSince(state.lastBackupAt);
  const overall = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  const activeModules = useMemo(() => {
    const all = modules.map((module) => ({ module, ...moduleProgress(module, state.completed) }));
    const inProgress = all.filter((item) => item.finished > 0 && item.finished < item.total);
    const notStarted = all.filter((item) => item.finished === 0);
    const done = all.filter((item) => item.finished === item.total);
    const pool = [...inProgress, ...notStarted, ...done];
    return pool.slice(0, 4);
  }, [state.completed]);

  const recent = state.history
    .map((id) => lessonById.get(id))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="screen dashboard-screen">
      <PageHead
        eyebrow={`BERANDA · ${formatDate(todayKey())}`}
        title={`Halo, ${profile?.name ?? 'Anda'}.`}
        description="Satu langkah kecil hari ini lebih berguna daripada rencana besar yang tidak dimulai. Lanjutkan dari titik terakhir."
        actions={
          !allDone && (
            <a className="btn btn-accent btn-lg" href={`#/lesson/${next.id}`}>
              Lanjut belajar <Icon name="arrowRight" size={17} />
            </a>
          )
        }
      />

      <section className="dashboard-hero" aria-label="Pelajaran berikutnya">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">{allDone ? 'KURIKULUM SELESAI' : 'PELAJARAN BERIKUTNYA'}</p>
          <span className="hero-module">
            {nextModule.id.toUpperCase()} · {nextModule.title}
          </span>
          <h2>{allDone ? 'Semua pelajaran sudah ditandai selesai.' : next.title}</h2>
          <p>
            {allDone
              ? 'Ulangi materi yang belum kuat, jalankan Lab kode, atau jaga runtutan dengan satu kuis.'
              : `${next.minutes} menit · ${next.level} · ${progress.finished}/${progress.total} pelajaran modul selesai.`}
          </p>
          <div className="hero-actions">
            {allDone ? (
              <a className="btn btn-accent" href="#/achievements">
                Lihat pencapaian <Icon name="arrowRight" size={16} />
              </a>
            ) : (
              <>
                <a className="btn btn-accent" href={`#/lesson/${next.id}`}>
                  Buka pelajaran <Icon name="arrowRight" size={16} />
                </a>
                <a className="btn btn-ghost-paper" href={`#/modules/${nextModule.id}`}>
                  Lihat modul
                </a>
              </>
            )}
          </div>
        </div>
        <div className="dashboard-hero-progress">
          <ProgressRing value={progress.percent} label="Progres modul" />
          <span className="mono-label">PROGRES MODUL</span>
          <strong>
            {progress.finished} dari {progress.total}
          </strong>
        </div>
      </section>

      <section className="stat-grid" aria-label="Ringkasan progres">
        <article className="stat-card">
          <span className="stat-icon"><Icon name="flame" size={19} /></span>
          <span className="mono-label">RUNTUTAN</span>
          <strong>{streak} hari</strong>
          <small>{streak > 0 ? 'Runtutan belajar aktif' : 'Mulai satu pelajaran hari ini'}</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Icon name="bolt" size={19} /></span>
          <span className="mono-label">TOTAL POIN</span>
          <strong>{xp.toLocaleString('id-ID')}</strong>
          <small>Jenjang {level.level} · {level.name}</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Icon name="target" size={19} /></span>
          <span className="mono-label">TARGET HARI INI</span>
          <strong>{lessonsToday}/{state.dailyGoal}</strong>
          <small>{questsDone}/3 target selesai</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Icon name="stack" size={19} /></span>
          <span className="mono-label">TOTAL PROGRES</span>
          <strong>{overall}%</strong>
          <small>{completedCount} dari {totalLessons} pelajaran</small>
        </article>
      </section>

      {!setup.complete && (
        <section className="paper-panel setup-callout" aria-label="Persiapan ruang kerja">
          <div>
            <p className="eyebrow">PERSIAPAN {setup.finished}/{setup.total}</p>
            <h2>Lengkapi daftar persiapan</h2>
            <p>
              Pasang alat yang diperlukan dan verifikasi satu per satu. Materi konsep tetap bisa
              dibaca sebelum semua alat siap.
            </p>
          </div>
          <div className="setup-callout-actions">
            <Meter value={setup.percent} size="sm" label="Progres persiapan" />
            <a className="btn btn-ghost-paper" href="#/mulai">
              Buka daftar persiapan <Icon name="arrowRight" size={14} />
            </a>
          </div>
        </section>
      )}

      <div className="dashboard-columns">
        <section className="paper-panel">
          <SectionTitle title="Target harian" meta="Tiga langkah kecil, satu bonus poin." />
          <ul className="quest-list">
            {quests.map((quest) => (
              <li key={quest.id} className={quest.done ? 'is-done' : ''}>
                <span className="quest-check">
                  {quest.done ? <Icon name="check" size={15} /> : <span />}
                </span>
                <span>{quest.label}</span>
                {quest.done && <small>selesai</small>}
              </li>
            ))}
          </ul>
          <p className="hint">
            {questsDone === 3
              ? 'Target hari ini selesai. Bonus harian sudah masuk.'
              : 'Selesaikan ketiganya untuk bonus 100 poin hari ini.'}
          </p>
        </section>

        <section className="paper-panel">
          <SectionTitle
            title="Modul berjalan"
            action={
              <a className="text-link text-link-paper" href="#/modules">
                Semua modul <Icon name="arrowRight" size={14} />
              </a>
            }
          />
          <div className="module-mini-list">
            {activeModules.map(({ module, finished, total, percent }) => (
              <a className="module-mini" key={module.id} href={`#/modules/${module.id}`}>
                <span className="module-code">{module.id.toUpperCase()}</span>
                <span className="module-mini-main">
                  <strong>{module.title}</strong>
                  <small>{finished}/{total} pelajaran · Minggu {module.weeks.join('–')}</small>
                  <Meter value={percent} size="sm" />
                </span>
                <span className="module-percent">{percent}%</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className="paper-panel backup-strip">
        <div>
          <span className="mono-label">CADANGAN</span>
          <strong>
            {backupDays === null ? 'Belum ada cadangan' : backupDays === 0 ? 'Cadangan hari ini' : `${backupDays} hari sejak cadangan terakhir`}
          </strong>
          <p>Progres tidak berpindah otomatis antarperangkat. Unduh cadangan secara berkala.</p>
        </div>
        <a className="btn btn-ghost-paper" href="#/settings">
          Unduh cadangan <Icon name="arrowRight" size={14} />
        </a>
      </section>

      {recent.length > 0 && (
        <section className="paper-panel recent-section">
          <SectionTitle
            title="Terakhir dibuka"
            action={
              <a className="text-link text-link-paper" href="#/saved">
                Materi tersimpan <Icon name="arrowRight" size={13} />
              </a>
            }
          />
          <div className="lesson-list">
            {recent.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={index + 1}
                completed={state.completed.includes(lesson.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
