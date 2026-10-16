import { LoaderCircle } from 'lucide-react';

export default function Loader({ label = 'Cargando información…' }) {
  return <div className="loader-block" role="status" aria-live="polite"><LoaderCircle className="spin" size={23} /><span>{label}</span></div>;
}
