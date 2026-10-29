import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHead } from '../components/Page.jsx';
import { curriculum } from '../data/curriculum.js';

export default function LexiconScreen() {
  const [query, setQuery] = useState('');
  const terms = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return curriculum.glossary;
    return curriculum.glossary.filter((entry) =>
      `${entry.term} ${entry.definition}`.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <div className="screen">
      <PageHead
        eyebrow="KAMUS"
        title="Kamus istilah"
        description={`${curriculum.glossary.length} istilah inti yang muncul di dokumentasi, diskusi arsitektur, dan pemecahan masalah.`}
      />

      <label className="input-search lexicon-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari istilah…"
          aria-label="Cari istilah"
        />
      </label>

      <p className="result-count">{terms.length} istilah</p>

      <dl className="lexicon">
        {terms.map((entry) => (
          <div className="lexicon-entry" key={entry.term}>
            <dt>{entry.term}</dt>
            <dd>{entry.definition}</dd>
          </div>
        ))}
      </dl>

      {terms.length === 0 && (
        <div className="empty-state">
          <h3>Istilah tidak ditemukan</h3>
          <p>Coba kata kunci yang lebih pendek.</p>
        </div>
      )}
    </div>
  );
}
