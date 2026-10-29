import { QUIZ_TYPE_LABELS } from '../lib/constants.js';
import { useApp } from '../state/AppStore.jsx';
import Icon from './Icon.jsx';

function orderedOptions(question) {
  const options = (question.options ?? []).map((text, index) => ({ text, original: index }));
  if (!options.length) return [];
  const seed = String(question.id ?? 'q')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const shift = seed % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

export default function Quiz({ lesson }) {
  const { state, answerQuiz } = useApp();
  const record = state.quizzes[lesson.id];
  const questions = lesson.quiz?.questions ?? [];
  const allCorrect = Boolean(record?.correct);

  return (
    <div className="quiz-set">
      {questions.map((question, questionIndex) => {
        const answer = record?.answers?.[question.id];
        const options = orderedOptions(question);
        return (
          <div className="quiz-item" key={question.id}>
            <p className="quiz-item-label">
              Pertanyaan {questionIndex + 1} dari {questions.length}
              {question.type ? ` · ${QUIZ_TYPE_LABELS[question.type] ?? question.type}` : ''}
            </p>
            <p className="quiz-question" id={`quiz-${lesson.id}-${question.id}`}>
              {question.question}
            </p>
            <div
              className="quiz-options"
              role="group"
              aria-labelledby={`quiz-${lesson.id}-${question.id}`}
            >
              {options.map((option, index) => {
                const chosen = answer?.choice === option.original;
                const stateClass = chosen ? (answer.correct ? 'is-correct' : 'is-wrong') : '';
                return (
                  <button
                    key={option.original}
                    type="button"
                    className={`quiz-option ${stateClass}`.trim()}
                    onClick={() => answerQuiz(lesson.id, question.id, option.original)}
                    disabled={Boolean(answer?.correct)}
                  >
                    <span className="quiz-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option.text}</span>
                    {chosen && <Icon name={answer.correct ? 'check' : 'close'} size={16} />}
                  </button>
                );
              })}
            </div>
            {answer ? (
              <div className={`quiz-feedback ${answer.correct ? 'is-correct' : 'is-wrong'}`} role="status">
                <strong>{answer.correct ? 'Tepat' : 'Belum tepat'}</strong>
                <p>
                  {answer.correct
                    ? question.explanation
                    : 'Pelajari kembali bagian terkait, lalu pilih jawaban lain.'}
                </p>
              </div>
            ) : (
              <p className="quiz-hint">
                Pilih satu jawaban. Jawaban benar pada percobaan pertama memberi poin lebih besar.
              </p>
            )}
          </div>
        );
      })}

      {allCorrect && (
        <div className="quiz-feedback is-correct quiz-complete" role="status">
          <strong>Kuis selesai</strong>
          <p>Semua pertanyaan sudah benar. Lanjutkan ke bagian berikutnya atau ulangi dengan catatan.</p>
        </div>
      )}
    </div>
  );
}
