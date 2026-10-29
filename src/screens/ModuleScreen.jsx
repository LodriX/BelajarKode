import Icon from '../components/Icon.jsx';
import LessonRow from '../components/LessonRow.jsx';
import Meter from '../components/Meter.jsx';
import { PageHead } from '../components/Page.jsx';
import { moduleById, moduleProgress } from '../data/curriculum.js';
import { useApp } from '../state/AppStore.jsx';
import NotFound from './NotFound.jsx';

export default function ModuleScreen({ moduleId }) {
  const { state } = useApp();
  const module = moduleById.get(moduleId);
  if (!module) return <NotFound />;

  const progress = moduleProgress(module, state.completed);
  const nextLesson = module.lessons.find((lesson) => !state.completed.includes(lesson.id));

  return (
    <div className="screen">
      <a className="back-link" href="#/modules">
        <Icon name="chevronLeft" size={14} /> Modul
      </a>

      <PageHead
        eyebrow={`${module.id.toUpperCase()} · MINGGU ${module.weeks.join('–')}`}
        title={module.title}
        description={module.subtitle}
        actions={
          nextLesson ? (
            <a className="btn btn-accent" href={`#/lesson/${nextLesson.id}`}>
              {progress.finished > 0 ? 'Lanjutkan' : 'Mulai modul'} <Icon name="arrowRight" size={15} />
            </a>
          ) : (
            <a className="btn btn-ghost" href="#/achievements">
              Modul selesai <Icon name="check" size={15} />
            </a>
          )
        }
      />

      <section className="module-overview">
        <div>
          <span className="mono-label">TUJUAN MODUL</span>
          <p>{module.goal}</p>
        </div>
        <div className="module-overview-meter">
          <strong>{progress.percent}%</strong>
          <Meter value={progress.percent} />
          <small>
            {progress.finished} dari {progress.total} pelajaran selesai
          </small>
        </div>
      </section>

      <section className="lesson-list module-lessons">
        {module.lessons.map((lesson, index) => (
          <LessonRow
            key={lesson.id}
            lesson={{ ...lesson, moduleId: module.id }}
            index={index + 1}
            completed={state.completed.includes(lesson.id)}
            showModule={false}
          />
        ))}
      </section>
    </div>
  );
}
