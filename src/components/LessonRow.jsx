import Icon from './Icon.jsx';
import { moduleById } from '../data/curriculum.js';

export default function LessonRow({ lesson, index, completed = false, showModule = true }) {
  const module = moduleById.get(lesson.moduleId);
  return (
    <a className={`lesson-row ${completed ? 'is-done' : ''}`.trim()} href={`#/lesson/${lesson.id}`}>
      <span className="lesson-index">
        {completed ? <Icon name="check" size={15} /> : String(index).padStart(2, '0')}
      </span>
      <span className="lesson-main">
        <strong>{lesson.title}</strong>
        <small>
          {showModule && module ? `${module.id.toUpperCase()} · ` : ''}
          {lesson.minutes} menit · {lesson.level}
        </small>
      </span>
      <span className="lesson-open">
        {completed ? 'Ulangi' : 'Buka'}
        <Icon name="chevronRight" size={14} />
      </span>
    </a>
  );
}
