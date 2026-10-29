import LessonRow from '../components/LessonRow.jsx';
import { PageHead } from '../components/Page.jsx';
import { lessonById } from '../data/curriculum.js';
import { useApp } from '../state/AppStore.jsx';

export default function SavedScreen() {
  const { state } = useApp();
  const lessons = state.bookmarks.map((id) => lessonById.get(id)).filter(Boolean);

  return (
    <div className="screen">
      <PageHead
        eyebrow="TERSIMPAN"
        title="Materi tersimpan"
        description="Simpan pelajaran untuk dibuka lagi saat Anda membutuhkannya."
      />

      {lessons.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada materi tersimpan</h3>
          <p>Tekan tombol Simpan pada halaman pelajaran.</p>
          <a className="btn btn-accent" href="#/modules">
            Jelajahi materi
          </a>
        </div>
      ) : (
        <div className="lesson-list">
          {lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={index + 1}
              completed={state.completed.includes(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
