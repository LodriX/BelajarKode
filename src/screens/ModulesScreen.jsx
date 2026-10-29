import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { PageHead } from '../components/Page.jsx';
import { moduleProgress, modules, totalLessons } from '../data/curriculum.js';
import { useApp } from '../state/AppStore.jsx';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'progress', label: 'Berjalan' },
  { id: 'new', label: 'Belum mulai' },
  { id: 'done', label: 'Selesai' },
];

export default function ModulesScreen() {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return modules
      .map((module) => {
        const progress = moduleProgress(module, state.completed);
        const status =
          progress.finished === progress.total ? 'done' : progress.finished > 0 ? 'progress' : 'new';
        return { module, progress, status };
      })
      .filter((row) => {
        if (filter !== 'all' && row.status !== filter) return false;
        if (!term) return true;
        const haystack = `${row.module.title} ${row.module.subtitle} ${row.module.lessons
          .map(
            (lesson) =>
              `${lesson.title} ${(lesson.sections ?? [])
                .map((section) => `${section.title} ${(section.body ?? []).join(' ')}`)
                .join(' ')} ${(lesson.summary ?? []).join(' ')}`,
          )
          .join(' ')}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [filter, query, state.completed]);

  return (
    <div className="screen">
      <PageHead
        eyebrow="MODUL"
        title="Modul belajar"
        description={`${modules.length} modul · ${totalLessons} pelajaran · ${state.completed.length} ditandai selesai.`}
      />

      <div className="catalog-tools">
        <label className="input-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari modul atau pelajaran…"
            aria-label="Cari modul"
          />
        </label>
        <div className="chips" role="group" aria-label="Filter modul">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${filter === item.id ? 'is-active' : ''}`.trim()}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="result-count">{rows.length} modul</span>
      </div>

      <div className="module-table">
        {rows.map(({ module, progress }) => (
          <a className="module-row" key={module.id} href={`#/modules/${module.id}`}>
            <span className="module-code">{module.id.toUpperCase()}</span>
            <span className="module-row-main">
              <strong>{module.title}</strong>
              <small>{module.subtitle}</small>
              <span className="module-tags">
                <span>{module.lessons.length} pelajaran</span>
                <span>Minggu {module.weeks.join('–')}</span>
              </span>
            </span>
            <span className="module-row-progress">
              <Meter value={progress.percent} size="sm" />
              <small>
                {progress.finished}/{progress.total}
              </small>
            </span>
            <Icon name="chevronRight" size={16} />
          </a>
        ))}

        {rows.length === 0 && (
          <div className="empty-state">
            <h3>Tidak ada modul yang cocok</h3>
            <p>Ubah kata kunci atau filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
