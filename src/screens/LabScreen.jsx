import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHead } from '../components/Page.jsx';
import { DEFAULT_LAB } from '../lib/storage.js';
import { useApp } from '../state/AppStore.jsx';

const TABS = [
  { id: 'js', label: 'JavaScript' },
  { id: 'html', label: 'HTML / CSS' },
  { id: 'json', label: 'JSON' },
];

const workerScript = `
self.onmessage = (event) => {
  const logs = [];
  const fmt = (value) => {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? String(value);
    } catch {
      return String(value);
    }
  };
  const logger = {
    log: (...args) => logs.push(args.map(fmt).join(' ')),
    info: (...args) => logs.push(args.map(fmt).join(' ')),
    warn: (...args) => logs.push('WARN: ' + args.map(fmt).join(' ')),
    error: (...args) => logs.push('ERROR: ' + args.map(fmt).join(' ')),
    assert: (condition, ...args) => { if (!condition) logs.push('Assertion failed: ' + args.map(fmt).join(' ')); },
    table: (value) => logs.push(fmt(value)),
  };
  try {
    const fn = new Function('console', '"use strict";\\n' + event.data.code);
    const result = fn(logger);
    if (result && typeof result.then === 'function') {
      result.then(() => self.postMessage({ logs })).catch((error) => self.postMessage({ logs, error: String(error) }));
    } else {
      self.postMessage({ logs });
    }
  } catch (error) {
    self.postMessage({ logs, error: String(error) });
  }
};
`;

export default function LabScreen() {
  const { state, setLabMode, setLabCode, recordLabRun } = useApp();
  const mode = state.labMode;
  const [code, setCode] = useState(state.labCode);
  const [output, setOutput] = useState('Tekan Jalankan untuk melihat hasil.');
  const [preview, setPreview] = useState('');
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const saveTimer = useRef(null);
  const frameRef = useRef(null);
  const mountRef = useRef(null);

  useEffect(() => {
    setCode(state.labCode);
  }, [state.labCode]);

  useEffect(() => {
    const onMessage = (event) => {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== 'bk-lab') return;
      window.clearTimeout(timeoutRef.current);
      setRunning(false);
      setOutput(
        [...(data.logs ?? []), data.error ? `✗ ${data.error}` : ''].filter(Boolean).join('\n') ||
          '✓ Kode selesai tanpa output. Tambahkan console.log().',
      );
      frame.remove();
      frameRef.current = null;
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
      window.clearTimeout(saveTimer.current);
      workerRef.current?.terminate();
      frameRef.current?.remove();
      frameRef.current = null;
    },
    [],
  );

  const updateCode = (value) => {
    setCode(value);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setLabCode(value), 400);
  };

  const stopEverything = () => {
    window.clearTimeout(timeoutRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const fallbackRun = (source, message) => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = '';
    setRunning(true);
    setOutput('Menjalankan di iframe terisolasi…');
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.display = 'none';
    const userCode = JSON.stringify(source).split('</script').join('<\\/script');
    const srcdoc = `<!doctype html><meta charset="utf-8"><script>
      const logs = [];
      const fmt = (value) => {
        try { return typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? String(value); } catch { return String(value); }
      };
      const logger = {
        log: (...args) => logs.push(args.map(fmt).join(' ')),
        info: (...args) => logs.push(args.map(fmt).join(' ')),
        warn: (...args) => logs.push('WARN: ' + args.map(fmt).join(' ')),
        error: (...args) => logs.push('ERROR: ' + args.map(fmt).join(' ')),
        assert: (c, ...args) => { if (!c) logs.push('Assertion failed: ' + args.map(fmt).join(' ')); },
        table: (value) => logs.push(fmt(value)),
      };
      try {
        const fn = new Function('console', '"use strict";\\n' + ${userCode});
        const result = fn(logger);
        if (result && typeof result.then === 'function') {
          result.then(() => parent.postMessage({ source: 'bk-lab', logs }, '*')).catch((error) => parent.postMessage({ source: 'bk-lab', logs, error: String(error) }, '*'));
        } else {
          parent.postMessage({ source: 'bk-lab', logs }, '*');
        }
      } catch (error) {
        parent.postMessage({ source: 'bk-lab', logs, error: String(error) }, '*');
      }
    </script>`;
    frame.srcdoc = srcdoc;
    mount.append(frame);
    frameRef.current = frame;
    timeoutRef.current = window.setTimeout(() => {
      frame.remove();
      frameRef.current = null;
      setRunning(false);
      setOutput(`⏱ Eksekusi dihentikan setelah 2 detik.${message ? `\n${message}` : ''}`);
    }, 2000);
  };

  const run = () => {
    stopEverything();
    recordLabRun();
    setCopied(false);
    setHasRun(true);

    if (mode === 'json') {
      try {
        const parsed = JSON.parse(code);
        setOutput(
          `✓ JSON valid.\n\nTipe akar: ${
            Array.isArray(parsed) ? 'Array' : parsed === null ? 'null' : typeof parsed
          }\n\n${JSON.stringify(parsed, null, 2)}`,
        );
      } catch (error) {
        setOutput(`✗ JSON tidak valid:\n${error.message}`);
      }
      return;
    }

    if (mode === 'html') {
      setPreview(code);
      setOutput('Pratinjau diperbarui. Script tidak dieksekusi di panel ini.');
      return;
    }

    setRunning(true);
    setOutput('Menjalankan JavaScript…');
    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      URL.revokeObjectURL(url);
      workerRef.current = worker;
      worker.onmessage = (event) => {
        window.clearTimeout(timeoutRef.current);
        setRunning(false);
        const logs = [...(event.data.logs ?? []), event.data.error ? `✗ ${event.data.error}` : ''].filter(Boolean);
        setOutput(logs.join('\n') || '✓ Kode selesai tanpa output. Tambahkan console.log().');
        worker.terminate();
        workerRef.current = null;
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        worker.terminate();
        workerRef.current = null;
        fallbackRun(code, 'Worker diblokir; memakai iframe terisolasi.');
      };
      timeoutRef.current = window.setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        setRunning(false);
        setOutput('⏱ Eksekusi dihentikan setelah 2 detik. Periksa kemungkinan infinite loop.');
      }, 2000);
      worker.postMessage({ code });
    } catch {
      fallbackRun(code, 'Browser tidak mengizinkan Web Worker pada file lokal.');
    }
  };

  const reset = () => {
    const value = DEFAULT_LAB[mode];
    setCode(value);
    setLabCode(value);
    setOutput('Contoh dipulihkan.');
    setPreview('');
    setHasRun(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="screen">
      <PageHead
        eyebrow="LAB KODE"
        title="Laboratorium kode"
        description="JavaScript berjalan di Worker Web dengan batas 2 detik. HTML dan CSS dipratinjau di iframe terisolasi tanpa skrip."
      />

      <div className="lab-tabs" role="tablist" aria-label="Mode laboratorium">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            className={mode === tab.id ? 'is-active' : ''}
            onClick={() => {
              setLabMode(tab.id);
              setHasRun(false);
              setPreview('');
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lab-layout">
        <section className="lab-editor">
          <div className="lab-editor-head">
            <span className="mono-label">
              {mode === 'js' ? 'JAVASCRIPT' : mode === 'html' ? 'HTML + CSS' : 'JSON'}
            </span>
            <div className="lab-editor-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
                <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Tersalin' : 'Salin'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                <Icon name="reset" size={14} /> Pulihkan
              </button>
            </div>
          </div>
          <textarea
            className="lab-textarea"
            value={code}
            onChange={(event) => updateCode(event.target.value)}
            spellCheck="false"
            aria-label="Editor kode"
          />
          <div className="lab-foot">
            <span>{code.length.toLocaleString('id-ID')} karakter</span>
            <span>
              {mode === 'js'
                ? 'Tanpa DOM atau document. Perulangan berat dihentikan otomatis.'
                : mode === 'html'
                  ? 'Pratinjau terisolasi tanpa skrip.'
                  : 'Hanya memeriksa format JSON.'}
            </span>
          </div>
          <button type="button" className="btn btn-accent btn-block" onClick={run} disabled={running}>
            <Icon name="play" size={15} /> {running ? 'Menjalankan…' : mode === 'json' ? 'Validasi JSON' : mode === 'html' ? 'Perbarui pratinjau' : 'Jalankan kode'}
          </button>
        </section>

        <section className="lab-results">
          <div className="lab-results-head">
            <span className="mono-label">{mode === 'html' ? 'PRATINJAU' : 'OUTPUT'}</span>
            <span className="lab-status">{running ? 'BERJALAN' : hasRun ? 'SELESAI' : 'SIAP'}</span>
          </div>
          {mode === 'html' ? (
            <iframe
              className="lab-preview"
              title="Pratinjau HTML"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={preview}
            />
          ) : (
            <pre className="lab-output" aria-live="polite">
              {output}
            </pre>
          )}
          <div ref={mountRef} className="lab-frame-mount" aria-hidden="true" />
          <div className="notice">
            <strong>Eksperimen terarah</strong>
            <p>Prediksi output sebelum menekan Jalankan. Ubah satu input, lalu jelaskan penyebab perubahannya.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
