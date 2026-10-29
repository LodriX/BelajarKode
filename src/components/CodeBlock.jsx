import { useState } from 'react';
import { LANGUAGE_LABELS } from '../lib/constants.js';
import Icon from './Icon.jsx';

export default function CodeBlock({ code, language = 'javascript', actions, numbered = false }) {
  const [copied, setCopied] = useState(false);
  const lines = String(code).split('\n');
  const languageLabel = LANGUAGE_LABELS[language] ?? language;

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const area = document.createElement('textarea');
        area.value = code;
        document.body.append(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <span className="code-lang">{languageLabel}</span>
        <div className="code-actions">
          {actions}
          <button type="button" className="code-copy" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>
      <pre
        tabIndex={0}
        aria-label={`Contoh kode ${languageLabel}`}
        className={numbered ? 'numbered' : undefined}
      >
        {numbered && (
          <span className="code-gutter" aria-hidden="true">
            {lines.map((_, lineIndex) => (
              <span key={lineIndex}>{lineIndex + 1}</span>
            ))}
          </span>
        )}
        <code>{code}</code>
      </pre>
    </div>
  );
}
