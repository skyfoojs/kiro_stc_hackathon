import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  urgent?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-page modal. Focus starts on Cancel so Enter never confirms by accident; Esc cancels; Tab stays inside. */
export default function ConfirmDialog({ title, description, children, confirmLabel, urgent, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== 'Tab' || !boxRef.current) return;
    const focusable = boxRef.current.querySelectorAll<HTMLElement>('button, [href], input, select');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div ref={boxRef} className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-h" aria-describedby="dlg-d">
        <h2 id="dlg-h">{title}</h2>
        <p id="dlg-d" style={{ fontSize: 16 }}>
          {description}
        </p>
        {children}
        <div className="dlg-actions">
          <button ref={cancelRef} type="button" className="btn b-sec" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn ${urgent ? 'b-urg' : 'b-pri'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
