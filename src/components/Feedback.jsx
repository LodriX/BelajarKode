import { useEffect } from 'react';
import { useApp } from '../state/AppStore.jsx';
import Icon from './Icon.jsx';

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast-${toast.kind}`}
          onClick={() => dismissToast(toast.id)}
          title="Tutup"
        >
          <Icon
            name={
              toast.kind === 'xp'
                ? 'bolt'
                : toast.kind === 'badge'
                  ? 'trophy'
                  : toast.kind === 'error'
                    ? 'alert'
                    : 'spark'
            }
            size={16}
          />
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}

export function LevelUp() {
  const { levelUp, dismissLevelUp } = useApp();

  useEffect(() => {
    if (!levelUp) return undefined;
    const timer = window.setTimeout(dismissLevelUp, 6000);
    return () => window.clearTimeout(timer);
  }, [levelUp, dismissLevelUp]);

  if (!levelUp) return null;

  return (
    <div className="levelup-backdrop" role="presentation" onClick={dismissLevelUp}>
      <div
        className="levelup"
        role="dialog"
        aria-modal="true"
        aria-label={`Naik ke jenjang ${levelUp.level}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">JENJANG BARU</p>
        <div className="levelup-number">
          <span>{String(levelUp.level).padStart(2, '0')}</span>
          <small>{levelUp.name}</small>
        </div>
        <p className="levelup-copy">
          {levelUp.gain > 0 ? `+${levelUp.gain} poin` : 'Progres diperbarui'} · total{' '}
          {levelUp.xp.toLocaleString('id-ID')} poin
        </p>
        <button type="button" className="btn btn-accent" onClick={dismissLevelUp}>
          Lanjut
        </button>
      </div>
    </div>
  );
}
