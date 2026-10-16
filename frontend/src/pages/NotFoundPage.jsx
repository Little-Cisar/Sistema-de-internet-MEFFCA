import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <div className="page-wrap not-found-page"><div className="site-container"><span className="not-found-icon"><Compass size={38} /></span><div className="eyebrow">PÁGINA NO ENCONTRADA</div><h1>Esta ruta todavía no existe.</h1><p>Vuelve al inicio o continúa explorando el mercado de emprendimientos.</p><Link className="button button-primary" to="/"><ArrowLeft size={17} /> Volver al inicio</Link></div></div>;
}
