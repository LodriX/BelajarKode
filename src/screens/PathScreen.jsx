import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { PageHead, SectionTitle } from '../components/Page.jsx';
import { moduleProgress, modules, nextLesson, weekModule, curriculum } from '../data/curriculum.js';
import { useApp } from '../state/AppStore.jsx';

const PHASE_LABELS = [
  { label: 'Fondasi', detail: 'Logika, JavaScript, web, dan tooling dasar.' },
  { label: 'Web, data, backend', detail: 'TypeScript, Git, SQL, PHP, dan Laravel.' },
  { label: 'API, mobile, produksi', detail: 'REST, Flutter, keamanan, dan deployment.' },
];

export default function PathScreen() {
  const { state } = useApp();
  const next = nextLesson(state.completed);
  const activeId = next.moduleId;
  const totalWeeks = curriculum.roadmap.length;
  const phaseSize = Math.ceil(totalWeeks / PHASE_LABELS.length);
  const phases = PHASE_LABELS.map((phase, index) => ({
    ...phase,
    from: index * phaseSize,
    to: index === PHASE_LABELS.length - 1 ? totalWeeks : (index + 1) * phaseSize,
  }));

  return (
    <div className="screen">
      <PageHead
        eyebrow={`JALUR BELAJAR · ${totalWeeks} MINGGU`}
        title="Jalur belajar"
        description={`${modules.length} modul berurutan. Tidak ada konten yang dikunci; urutan ini rekomendasi, bukan syarat.`}
      />

      <section className="track">
        {modules.map((module, index) => {
          const progress = moduleProgress(module, state.completed);
          const status =
            progress.finished === progress.total
              ? 'Selesai'
              : module.id === activeId
                ? 'Sedang di sini'
                : 'Berikutnya';
          return (
            <a
              key={module.id}
              href={`#/modules/${module.id}`}
              className={`track-node ${module.id === activeId ? 'is-active' : ''} ${
                progress.finished === progress.total ? 'is-done' : ''
              }`.trim()}
            >
              <span className="track-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="track-body">
                <span className="track-meta">
                  {module.id.toUpperCase()} · MINGGU {module.weeks.join('–')} · {status.toUpperCase()}
                </span>
                <strong>{module.title}</strong>
                <small>{module.subtitle}</small>
                <span className="track-progress">
                  <Meter value={progress.percent} size="sm" />
                  <em>
                    {progress.finished}/{progress.total} · {progress.percent}%
                  </em>
                </span>
              </span>
              <Icon name="chevronRight" size={16} />
            </a>
          );
        })}
      </section>

      <SectionTitle
        title="Rencana mingguan"
        meta="Estimasi 4–5 jam per minggu. Ukur hasil dari artefak, bukan durasi."
      />
      <div className="roadmap">
        {phases.map((phase) => (
          <section className="roadmap-phase" key={phase.label}>
            <header>
              <p className="eyebrow">
                PEKAN {phase.from + 1}–{phase.to}
              </p>
              <h3>{phase.label}</h3>
              <p>{phase.detail}</p>
            </header>
            <div className="roadmap-rows">
              {curriculum.roadmap.slice(phase.from, phase.to).map((week) => {
                const module = weekModule(week.week);
                return (
                  <div className="roadmap-row" key={week.week}>
                    <span className="week-num">{String(week.week).padStart(2, '0')}</span>
                    <span className="week-main">
                      <strong>{week.focus}</strong>
                      <small>{week.deliverable}</small>
                    </span>
                    {module && (
                      <a className="week-link" href={`#/modules/${module.id}`}>
                        {module.id.toUpperCase()}
                        <Icon name="arrowRight" size={13} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <SectionTitle title="Proyek praktik" meta="Bukti kemampuan: aplikasi yang berjalan dan keputusan yang bisa dijelaskan." />
      <div className="project-list">
        {curriculum.projects.map((project) => (
          <details className="project" key={project.title}>
            <summary>
              <span className="project-phase">{project.phase}</span>
              <strong>{project.title}</strong>
              <Icon name="chevronRight" size={15} />
            </summary>
            <div className="project-body">
              <p>{project.description}</p>
              <span className="mono-label">KRITERIA PENERIMAAN</span>
              <ul>
                {project.acceptance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

