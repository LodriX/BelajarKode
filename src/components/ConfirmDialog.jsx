import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClose={() => {
        if (open && !busy) onCancel();
      }}
    >
      <p className="eyebrow">{danger ? 'TINDAKAN PERMANEN' : 'KONFIRMASI'}</p>
      <h2>{title}</h2>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Memproses…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
