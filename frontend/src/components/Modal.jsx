import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, children, onClose, size = 'normal' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section className={`modal-dialog modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <header className="modal-header"><h2 id="modal-heading">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><X size={19} /></button></header>
      <div className="modal-content">{children}</div>
    </section>
  </div>;
}
