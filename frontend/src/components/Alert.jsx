import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const icons = { error: AlertCircle, success: CheckCircle2, info: Info, warning: AlertCircle };

export default function Alert({ type = 'info', children, onClose }) {
  const Icon = icons[type] || Info;
  if (!children) return null;
  return <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
    <Icon size={19} aria-hidden="true" />
    <div className="alert-content">{children}</div>
    {onClose && <button type="button" className="alert-close" aria-label="Cerrar aviso" onClick={onClose}><X size={17} /></button>}
  </div>;
}
