import { ArrowUpRight, Heart, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer">
    <div className="site-container footer-main">
      <div className="footer-brand-block">
        <Link to="/" className="brand-lockup brand-lockup-footer"><span className="brand-symbol"><span /><span /><span /><span /></span><span className="brand-copy"><strong>manos<span>de</span> nicaragua</strong><small>UN MERCADO CON IDENTIDAD</small></span></Link>
        <p>Una vitrina digital para descubrir el talento, los productos y las historias de emprendimientos nicaragüenses.</p>
        <div className="footer-note"><Heart size={15} fill="currentColor" /> Hecho para acercar a las personas que crean y a quienes valoran lo local.</div>
      </div>
      <div className="footer-links"><h3>Explorar</h3><Link to="/catalogo">Catálogo de productos <ArrowUpRight size={14} /></Link><Link to="/emprendedores">Emprendimientos <ArrowUpRight size={14} /></Link><Link to="/registro">Participar en el mercado <ArrowUpRight size={14} /></Link></div>
      <div className="footer-links footer-project"><h3>Sobre el proyecto</h3><p>Sistema de Información Web para la Gestión de Compras y Ventas de los Miembros del MEFCCA.</p><span><MapPin size={15} /> Nicaragua</span><span><Mail size={15} /> Proyecto académico</span></div>
    </div>
    <div className="footer-bottom"><div className="site-container footer-bottom-inner"><span>© {new Date().getFullYear()} Manos de Nicaragua. Prototipo académico.</span><span>Desarrollado por César Antonio López Rizo y Ulysses Samuel Hernández López</span></div></div>
  </footer>;
}
