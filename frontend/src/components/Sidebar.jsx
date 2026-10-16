import { BadgeCheck, BarChart3, Boxes, LayoutDashboard, List, LogOut, Store, Users, ShoppingBag, ClipboardList } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mode = 'protagonist' }) {
  const { user, logout } = useAuth();
  const admin = mode === 'admin';
  const customer = mode === 'customer';
  const links = customer ? [
    { to: '/mis-compras', label: 'Mis compras', icon: ShoppingBag, end: true }
  ] : admin ? [
    { to: '/administracion', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/administracion/categorias', label: 'Categorías', icon: List },
    { to: '/administracion/usuarios', label: 'Usuarios', icon: Users },
    { to: '/administracion/reportes', label: 'Reportes', icon: BarChart3 },
    { to: '/administracion/verificaciones', label: 'Verificaciones', icon: BadgeCheck },
    { to: '/administracion/ventas', label: 'Operaciones comerciales', icon: ClipboardList }
  ] : [
    { to: '/mi-negocio', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/mi-negocio/productos', label: 'Mis productos', icon: Boxes },
    { to: '/mi-negocio/ventas', label: 'Mis ventas', icon: ShoppingBag },
    { to: '/mi-negocio/compras', label: 'Mis compras', icon: ClipboardList },
    { to: '/mi-negocio/perfil', label: 'Perfil del negocio', icon: Store }
  ];

  return <aside className="dashboard-sidebar">
    <div className="sidebar-account"><span className="avatar-circle">{String(user?.email || 'M').slice(0, 1).toUpperCase()}</span><div><strong>{user?.email || 'Cuenta MEFCCA'}</strong><small>{admin ? 'Administración' : customer ? 'Cuenta compradora' : 'Emprendimiento'}</small></div></div>
    <div className="sidebar-label">ESPACIO DE TRABAJO</div>
    <nav className="sidebar-nav" aria-label="Navegación del panel">{links.map(({ to, label, icon: Icon, end }) => <NavLink to={to} key={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
    <div className="sidebar-bottom"><NavLink to="/catalogo" className="sidebar-link"><Store size={18} /><span>Ver mercado público</span></NavLink><button className="sidebar-link sidebar-logout" type="button" onClick={logout}><LogOut size={18} /><span>Cerrar sesión</span></button></div>
  </aside>;
}
