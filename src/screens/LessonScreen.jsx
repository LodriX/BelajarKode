import { useEffect, useRef, useState } from 'react';
import CodeBlock from '../components/CodeBlock.jsx';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import Quiz from '../components/Quiz.jsx';
import { lessonById, moduleById, moduleProgress, modules } from '../data/curriculum.js';
import { LANGUAGE_LABELS, PRACTICE_LEVEL_LABELS, XP } from '../lib/constants.js';
import { navigate } from '../router.js';
import { useApp } from '../state/AppStore.jsx';
import NotFound from './NotFound.jsx';

function labPayload(code, language) {
  if (language === 'html') return { mode: 'html', code };
  if (language === 'json') return { mode: 'json', code };
  if (language === 'css') {
    return {
      mode: 'html',
      code: `<style>\n${code}\n</style>\n<div class="grid">\n  <div class="kartu">Kartu 1</div>\n  <div class="kartu">Kartu 2</div>\n</div>`,
    };
  }
  return { mode: 'js', code };
}

function supportsLab(language) {
  return ['javascript', 'html', 'css', 'json'].includes(language);
}

function calloutClass(tone) {
  if (tone === 'bad') return 'notice notice-bad';
  if (tone === 'warn') return 'notice notice-warn';
  return 'notice notice-good';
}

const VERIFICATION_MODE = {
  lab: 'Lab kode',
  browser: 'Browser',
  terminal: 'Terminal',
  manual: 'Manual',
};

export default function LessonScreen({ lessonId }) {
  const {
    state,
    completeLesson,
    toggleBookmark,
    markSectionRead,
    setNote,
    visitLesson,
    openInLab,
  } = useApp();
  const lesson = lessonById.get(lessonId);
  const [noteValue, setNoteValue] = useState('');
  const timer = useRef(null);
  const latest = useRef('');

  useEffect(() => {
    if (lesson) visitLesson(lesson.id);
  }, [lesson, visitLesson]);

  useEffect(() => {
    const initial = state.notes[lessonId] ?? '';
    setNoteValue(initial);
    latest.current = initial;
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (latest.current !== undefined) setNote(lessonId, latest.current);
    },
    [lessonId, setNote],
  );

  useEffect(() => {
    if (!lesson?.sections?.length || typeof IntersectionObserver === 'undefined') return undefined;
    const nodes = lesson.sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = entry.target.getAttribute('data-section-id');
          if (sectionId) markSectionRead(lesson.id, sectionId);
        }
      },
      { rootMargin: '-22% 0px -58% 0px', threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [lesson, markSectionRead]);

  if (!lesson) return <NotFound />;

  const module = moduleById.get(lesson.moduleId);
  const index = module.lessons.findIndex((item) => item.id === lesson.id);
  const moduleIndex = modules.findIndex((item) => item.id === module.id);
  const previous =
    module.lessons[index - 1] ??
    (moduleIndex > 0 ? modules[moduleIndex - 1].lessons.at(-1) : null);
  const next =
    module.lessons[index + 1] ??
    (modules[moduleIndex + 1]?.lessons[0] ?? null);
  const progress = moduleProgress(module, state.completed);
  const done = state.completed.includes(lesson.id);
  const saved = state.bookmarks.includes(lesson.id);
  const quiz = state.quizzes[lesson.id];
  const sections = lesson.sections ?? [];
  const readSections = new Set(state.reading?.[lesson.id]?.sections ?? []);
  const readingPercent = sections.length
    ? Math.round((sections.filter((section) => readSections.has(section.id)).length / sections.length) * 100)
    : 0;

  const toc = [
    ...(lesson.outcome || lesson.objectives?.length || lesson.prerequisites?.length
      ? [{ id: 'tujuan', label: '00 · Tujuan' }]
      : []),
    ...(lesson.terms?.length ? [{ id: 'istilah', label: 'Istilah kunci' }] : []),
    ...(lesson.syntax?.length ? [{ id: 'sintaks', label: 'Kartu sintaks' }] : []),
    ...(lesson.conventions?.length ? [{ id: 'aturan', label: 'Aturan penulisan' }] : []),
    ...sections.map((section, sectionIndex) => ({
      id: section.id,
      label: `${String(sectionIndex + 1).padStart(2, '0')} · ${section.title}`,
      read: readSections.has(section.id),
    })),
    { id: 'praktik', label: 'Praktik' },
    ...(lesson.verification ? [{ id: 'verifikasi', label: 'Verifikasi' }] : []),
    ...(lesson.troubleshooting?.length ? [{ id: 'troubleshooting', label: 'Mengatasi masalah' }] : []),
    { id: 'kuis', label: 'Kuis' },
    ...(lesson.summary?.length ? [{ id: 'ringkasan', label: 'Ringkasan' }] : []),
    ...(lesson.resources?.length ? [{ id: 'referensi', label: 'Referensi' }] : []),
    { id: 'catatan', label: 'Catatan' },
  ];

  const handleNote = (value) => {
    setNoteValue(value);
    latest.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(lesson.id, value), 450);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openLab = (code, language) => {
    const payload = labPayload(code, language);
    openInLab(payload.mode, payload.code);
    navigate('lab');
  };

  return (
    <div className="screen lesson-screen">
      <a className="back-link" href={`#/modules/${module.id}`}>
        <Icon name="chevronLeft" size={14} /> {module.title}
      </a>

      <header className="lesson-header">
        <div>
          <p className="eyebrow">
            {module.id.toUpperCase()} · PELAJARAN {index + 1} DARI {module.lessons.length}
          </p>
          <h1>{lesson.title}</h1>
          {lesson.legacy && (
            <span className="legacy-badge">Materi versi sebelumnya</span>
          )}
          <p className="lesson-meta">
            <span><Icon name="clock" size={14} /> {lesson.minutes} menit</span>
            <span>{lesson.level}</span>
            <span>{LANGUAGE_LABELS[lesson.codeLanguage] ?? lesson.codeLanguage}</span>
            {quiz?.correct && <span className="meta-pass"><Icon name="check" size={13} /> kuis benar</span>}
          </p>
        </div>
        <div className="lesson-head-actions">
          <button
            type="button"
            className={`bookmark-btn ${saved ? 'is-saved' : ''}`.trim()}
            onClick={() => toggleBookmark(lesson.id)}
            aria-pressed={saved}
            aria-label={saved ? 'Hapus bookmark' : 'Simpan pelajaran'}
          >
            <Icon name="saved" size={18} />
            {saved ? 'Tersimpan' : 'Simpan'}
          </button>
          <button
            type="button"
            className={`btn mobile-complete ${done ? 'btn-ghost' : 'btn-accent'}`.trim()}
            onClick={() => completeLesson(lesson.id)}
          >
            <Icon name={done ? 'reset' : 'check'} size={15} />
            {done ? 'Batal' : 'Selesai'}
          </button>
        </div>
      </header>

      <details className="mobile-toc">
        <summary>Di halaman ini</summary>
        <nav className="mobile-toc-nav">
          {toc.map((section) => (
            <button key={section.id} type="button" onClick={() => scrollTo(section.id)}>
              {section.label}
            </button>
          ))}
        </nav>
      </details>

      <div className="lesson-layout">
        <article className="lesson-article">
          {(lesson.outcome || lesson.objectives?.length > 0 || lesson.prerequisites?.length > 0) && (
            <section className="lesson-block" id="tujuan">
              <p className="block-label">00 · TUJUAN</p>
              <h2>Setelah pelajaran ini</h2>
              {lesson.outcome && <p className="lesson-outcome">{lesson.outcome}</p>}
              {lesson.objectives?.length > 0 && (
                <ul className="lesson-objectives">
                  {lesson.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              )}
              {lesson.prerequisites?.length > 0 && (
                <div className="notice notice-warn">
                  <strong>Prasyarat</strong>
                  {lesson.prerequisites.map((prerequisite) => (
                    <p key={`${prerequisite.label}-${prerequisite.lessonId}`}>
                      {prerequisite.lessonId ? (
                        <a className="text-link" href={`#/lesson/${prerequisite.lessonId}`}>
                          {prerequisite.label || prerequisite.lessonId}
                        </a>
                      ) : (
                        prerequisite.label
                      )}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          {lesson.terms?.length > 0 && (
            <section className="lesson-block" id="istilah">
              <p className="block-label">ISTILAH KUNCI</p>
              <h2>Daftar istilah</h2>
              <dl className="lesson-terms">
                {lesson.terms.map((term) => (
                  <div className="lesson-term" key={term.term}>
                    <dt>{term.term}</dt>
                    <dd>{term.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {lesson.syntax?.length > 0 && (
            <section className="lesson-block" id="sintaks">
              <p className="block-label">KARTU SINTAKS</p>
              <h2>Token yang perlu Anda kenali</h2>
              <div className="syntax-grid">
                {lesson.syntax.map((item) => (
                  <article className="syntax-card" key={item.token}>
                    <code className="syntax-token">{item.token}</code>
                    {item.readAs && (
                      <p className="syntax-read"><b>Dibaca:</b> {item.readAs}</p>
                    )}
                    <p>{item.meaning}</p>
                    <pre className="syntax-example" tabIndex={0} aria-label={`Contoh ${item.token}`}>
                      <code>{item.example}</code>
                    </pre>
                    {item.output && <p className="syntax-output"><b>Output:</b> {item.output}</p>}
                    {item.pitfall && <p className="syntax-pitfall"><b>Hati-hati:</b> {item.pitfall}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {lesson.conventions?.length > 0 && (
            <section className="lesson-block" id="aturan">
              <p className="block-label">ATURAN PENULISAN</p>
              <h2>Cara menulis kode di pelajaran ini</h2>
              <ul className="lesson-conventions">
                {lesson.conventions.map((convention) => (
                  <li key={convention}>{convention}</li>
                ))}
              </ul>
            </section>
          )}

          {sections.map((section, sectionIndex) => {
            const read = readSections.has(section.id);
            return (
              <section
                className="lesson-block"
                id={section.id}
                data-section-id={section.id}
                key={section.id}
              >
                <p className="block-label">
                  BAGIAN {String(sectionIndex + 1).padStart(2, '0')}
                </p>
                <h2>{section.title}</h2>
                {section.body.map((paragraph, paragraphIndex) => (
                  <p key={`${section.id}-p${paragraphIndex}`}>{paragraph}</p>
                ))}

                {section.code && (
                  <>
                    <CodeBlock
                      code={section.code.code}
                      language={section.code.language}
                      numbered={section.code.annotations?.length > 0}
                      actions={
                        supportsLab(section.code.language) && section.code.lab !== false ? (
                          <button
                            type="button"
                            className="code-copy"
                            onClick={() => openLab(section.code.code, section.code.language)}
                          >
                            <Icon name="play" size={13} /> Lab
                          </button>
                        ) : null
                      }
                    />
                    {section.code.output && (
                      <div className="lesson-code-output">
                        <span>OUTPUT YANG DIHARAPKAN</span>
                        <p>{section.code.output}</p>
                      </div>
                    )}
                    {section.code.explain && <p>{section.code.explain}</p>}
                    {section.code.annotations?.length > 0 && (
                      <div className="code-annotations">
                        <p className="code-annotations-title">BEDAH BARIS</p>
                        <ol>
                          {section.code.annotations.map((annotation) => (
                            <li key={`${section.id}-${annotation.line}-${annotation.note}`}>
                              <div className="annotation-head">
                                <span className="annotation-line">Baris {annotation.line}</span>
                                {annotation.code && (
                                  <code className="annotation-code">{annotation.code}</code>
                                )}
                              </div>
                              <p>{annotation.note}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}

                {section.callouts.map((callout, calloutIndex) => (
                  <div className={calloutClass(callout.tone)} key={`${section.id}-c${calloutIndex}`}>
                    {callout.title && <strong>{callout.title}</strong>}
                    <p>{callout.body}</p>
                  </div>
                ))}

                {section.checkpoint?.prompt && (
                  <div className="lesson-checkpoint">
                    <span>CEK PEMAHAMAN</span>
                    <p>{section.checkpoint.prompt}</p>
                    {section.checkpoint.success && (
                      <p><em>Kriteria berhasil: {section.checkpoint.success}</em></p>
                    )}
                  </div>
                )}

                {read && (
                  <span className="section-read">
                    <Icon name="check" size={12} /> bagian terbaca
                  </span>
                )}
              </section>
            );
          })}

          <section className="lesson-block" id="praktik">
            <p className="block-label">PRAKTIK</p>
            <h2>Latihan bertingkat</h2>
            <ol className="practice-list">
              {lesson.practice.map((item) => (
                <li key={item.id ?? item.task}>
                  {item.title && item.title !== `Latihan ${lesson.practice.indexOf(item) + 1}` && (
                    <strong>{item.title}</strong>
                  )}
                  {item.level && (
                    <span className="practice-level">{PRACTICE_LEVEL_LABELS[item.level] ?? item.level}</span>
                  )}
                  <p>{item.task}</p>
                  {item.steps?.length > 0 && (
                    <ol className="practice-steps">
                      {item.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                  {item.starterCode && (
                    <pre className="practice-code" tabIndex={0} aria-label="Kode latihan">
                      <code>{item.starterCode}</code>
                    </pre>
                  )}
                  {item.expected && <p className="practice-note"><b>Hasil yang diharapkan:</b> {item.expected}</p>}
                  {item.hints?.length > 0 ? (
                    <details className="practice-hints">
                      <summary>Petunjuk bertahap</summary>
                      <ol>
                        {item.hints.map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ol>
                    </details>
                  ) : (
                    item.hint && <p className="practice-note"><b>Petunjuk:</b> {item.hint}</p>
                  )}
                  {item.stretch && <p className="practice-note"><b>Tantangan:</b> {item.stretch}</p>}
                </li>
              ))}
            </ol>
            <p className="hint">
              Prediksi hasil → ketik sendiri → jalankan → ubah input → uji kondisi salah → jelaskan
              ulang tanpa contekan.
            </p>
          </section>

          {lesson.verification && (
            <section className="lesson-block" id="verifikasi">
              <p className="block-label">VERIFIKASI</p>
              <h2>Bukti bahwa latihan berhasil</h2>
              <div className="lesson-verification">
                <p className="verification-mode">
                  Mode: {VERIFICATION_MODE[lesson.verification.mode] ?? lesson.verification.mode}
                </p>
                {lesson.verification.command && (
                  <pre className="practice-code" tabIndex={0} aria-label="Perintah verifikasi">
                    <code>{lesson.verification.command}</code>
                  </pre>
                )}
                {lesson.verification.expected && (
                  <p><b>Hasil yang diharapkan:</b> {lesson.verification.expected}</p>
                )}
                {lesson.verification.evidence && (
                  <p><b>Bukti yang disimpan:</b> {lesson.verification.evidence}</p>
                )}
              </div>
            </section>
          )}

          {lesson.troubleshooting?.length > 0 && (
            <section className="lesson-block" id="troubleshooting">
              <p className="block-label">MENGATASI MASALAH</p>
              <h2>Jika hasilnya tidak sesuai</h2>
              <ul className="lesson-troubleshooting">
                {lesson.troubleshooting.map((item) => (
                  <li key={`${item.symptom}-${item.fix}`}>
                    <strong>{item.symptom}</strong>
                    {item.cause && <p><b>Penyebab umum:</b> {item.cause}</p>}
                    {item.fix && <p><b>Perbaikan:</b> {item.fix}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="lesson-block" id="kuis">
            <p className="block-label">UJI PEMAHAMAN</p>
            <h2>Kuis</h2>
            <Quiz lesson={lesson} />
          </section>

          {lesson.summary?.length > 0 && (
            <section className="lesson-block" id="ringkasan">
              <p className="block-label">RINGKASAN</p>
              <h2>Yang perlu Anda ingat</h2>
              <ul className="lesson-summary">
                {lesson.summary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {lesson.next && (
                <div className="lesson-next">
                  <span>BERIKUTNYA</span>
                  <p>{lesson.next}</p>
                </div>
              )}
            </section>
          )}

          {lesson.resources?.length > 0 && (
            <section className="lesson-block" id="referensi">
              <p className="block-label">SUMBER</p>
              <h2>Sumber & bacaan resmi</h2>
              <ul className="lesson-resource-list">
                {lesson.resources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.title} <Icon name="external" size={11} />
                    </a>
                    {resource.note && <span className="hint"> {resource.note}</span>}
                    {resource.publisher && (
                      <span className="lesson-resource-meta">
                        {resource.publisher}
                        {resource.version ? ` · ${resource.version}` : ''}
                        {resource.accessedAt ? ` · diperiksa ${resource.accessedAt}` : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="lesson-block" id="catatan">
            <p className="block-label">CATATAN</p>
            <h2>Catatan pribadi</h2>
            <p>Catat istilah baru, error, atau penjelasan dengan bahasa Anda sendiri.</p>
            <textarea
              className="note-area"
              value={noteValue}
              onChange={(event) => handleNote(event.target.value)}
              placeholder="Hari ini saya mempelajari…"
              aria-label="Catatan pelajaran"
            />
            <p className="hint">Tersimpan otomatis di perangkat ini.</p>
          </section>

          <footer className="lesson-footer">
            {previous ? (
              <a className="btn btn-ghost" href={`#/lesson/${previous.id}`}>
                <Icon name="chevronLeft" size={15} /> Sebelumnya
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a className="btn btn-soft" href={`#/lesson/${next.id}`}>
                Berikutnya <Icon name="chevronRight" size={15} />
              </a>
            ) : (
              <a className="btn btn-soft" href="#/achievements">
                Lihat pencapaian <Icon name="arrowRight" size={15} />
              </a>
            )}
          </footer>
        </article>

        <aside className="lesson-aside">
          <div className="aside-panel">
            <span className="mono-label">DI HALAMAN INI</span>
            <nav className="aside-nav">
              {toc.map((section) => (
                <button key={section.id} type="button" onClick={() => scrollTo(section.id)}>
                  {section.read ? '✓ ' : ''}
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {sections.length > 0 && (
            <div className="aside-panel">
              <span className="mono-label">PROGRES BACA</span>
              <Meter value={readingPercent} label="Progres baca" />
              <p className="aside-meta">
                {readSections.size}/{sections.length} bagian terbaca
              </p>
            </div>
          )}

          <div className="aside-panel">
            <span className="mono-label">PROGRES MODUL</span>
            <Meter value={progress.percent} />
            <p className="aside-meta">
              {progress.finished}/{progress.total} pelajaran · {progress.percent}%
            </p>
          </div>

          <div className="aside-panel">
            <span className="mono-label">POIN</span>
            <p className="aside-reward">
              <Icon name="bolt" size={15} /> {XP.lesson} poin
            </p>
            <p className="aside-meta">+{XP.quizFirst} poin jika kuis benar pada percobaan pertama.</p>
          </div>

          <button
            type="button"
            className={`btn btn-block ${done ? 'btn-ghost' : 'btn-accent'}`}
            onClick={() => completeLesson(lesson.id)}
          >
            <Icon name={done ? 'reset' : 'check'} size={15} />
            {done ? 'Batalkan selesai' : 'Tandai selesai'}
          </button>
        </aside>
      </div>
    </div>
  );
}
