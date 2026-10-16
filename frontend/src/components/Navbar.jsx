import { useState } from 'react';
import { ArrowUpRight, Menu, Search, ShoppingBag, Store, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rolePath } from '../utils/apiHelpers';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);

  return <>
    <div className="institutional-strip"><div className="site-container institutional-inner"><span>Un espacio para el talento y el trabajo nicaragüense</span><span className="strip-right"><span className="strip-dot" /> Mercado digital de emprendimientos</span></div></div>
    <header className="site-header">
      <div className="site-container navbar-inner">
        <Link to="/" className="brand-lockup" aria-label="Manos de Nicaragua, inicio" onClick={closeMenu}>
          <span className="brand-symbol"><span /><span /><span /><span /></span>
          <span className="brand-copy"><strong>manos<span>de</span> nicaragua</strong><small>UN MERCADO CON IDENTIDAD</small></span>
        </Link>
        <button type="button" className="mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={`main-navigation ${menuOpen ? 'navigation-open' : ''}`} aria-label="Navegación principal">
          <NavLink to="/catalogo" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><ShoppingBag size={17} /> Explorar</NavLink>
          <NavLink to="/emprendedores" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><Store size={17} /> Emprendedores</NavLink>
          {!isAuthenticated ? <>
            <Link to="/login" onClick={closeMenu} className="nav-login">Iniciar sesión</Link>
            <Link to="/registro" onClick={closeMenu} className="button button-primary nav-cta">Quiero participar <ArrowUpRight size={16} /></Link>
          </> : <>
            {String(user?.rol || '').toLocaleLowerCase('es') === 'cliente' && <NavLink to="/mis-compras" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><ShoppingBag size={17} /> Mis compras</NavLink>}
            <button type="button" className="nav-login" onClick={() => { navigate(rolePath(user?.rol)); closeMenu(); }}>Mi espacio</button>
            <button type="button" className="button button-outline nav-cta" onClick={() => { logout(); navigate('/'); closeMenu(); }}>Salir</button>
          </>}
        </nav>
      </div>
    </header>
  </>;
}
