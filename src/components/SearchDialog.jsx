import { useEffect, useMemo, useRef, useState } from 'react';
import { lessonById, moduleById, searchLessons } from '../data/curriculum.js';
import { navigate } from '../router.js';
import { useApp } from '../state/AppStore.jsx';
import Icon from './Icon.jsx';

export default function SearchDialog({ open, onClose }) {
  const { state } = useApp();
  const ref = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (query.trim()) return searchLessons(query, 14);
    return state.history.map((id) => lessonById.get(id)).filter(Boolean).slice(0, 8);
  }, [query, state.history]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const openLesson = (id) => {
    onClose();
    navigate(`lesson/${id}`);
  };

  return (
    <dialog
      ref={ref}
      className="dialog search-dialog"
      aria-label="Cari materi"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="search-dialog-head">
        <Icon name="search" size={20} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) openLesson(results[0].id);
            if (event.key === 'Escape') onClose();
          }}
          placeholder="Cari konsep, modul, atau teknologi…"
          aria-label="Kata kunci"
          autoComplete="off"
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Esc
        </button>
      </div>
      <div className="search-results">
        {results.length === 0 && (
          <p className="search-empty">
            {query.trim() ? 'Tidak ada pelajaran yang cocok.' : 'Belum ada riwayat. Coba cari "variabel", "SQL", atau "Flutter".'}
          </p>
        )}
        {results.map((lesson) => {
          const module = moduleById.get(lesson.moduleId);
          const done = state.completed.includes(lesson.id);
          return (
            <button key={lesson.id} type="button" className="search-result" onClick={() => openLesson(lesson.id)}>
              <span className="search-result-index">
                <Icon name={done ? 'check' : 'code'} size={14} />
              </span>
              <span>
                <strong>{lesson.title}</strong>
                <small>{module?.title} · {lesson.minutes} menit</small>
              </span>
              <Icon name="arrowRight" size={15} />
            </button>
          );
        })}
      </div>
      <div className="search-dialog-foot">
        <span><kbd>Enter</kbd> buka hasil pertama</span>
        <span><kbd>/</kbd> buka pencarian</span>
        <span><kbd>Esc</kbd> tutup</span>
      </div>
    </dialog>
  );
}
