import { Outlet, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const titleFromPath = (pathname) => {
  if (pathname.includes('/administracion/ventas')) return 'Operaciones comerciales';
  if (pathname.includes('/productos')) return 'Mis productos';
  if (pathname.includes('/mi-negocio/ventas')) return 'Mis ventas';
  if (pathname.includes('/compras')) return 'Mis compras';
  if (pathname.includes('/perfil')) return 'Perfil del negocio';
  if (pathname.includes('/categorias')) return 'Categorías';
  if (pathname.includes('/usuarios')) return 'Gestión de usuarios';
  if (pathname.includes('/reportes')) return 'Reportes';
  if (pathname.includes('/verificaciones')) return 'Verificación de protagonistas';
  return 'Resumen general';
};

export default function DashboardLayout({ mode = 'protagonist' }) {
  const { user } = useAuth();
  const location = useLocation();
  const admin = mode === 'admin';
  const customer = mode === 'customer';

  return <div className="dashboard-shell">
    <Sidebar mode={mode} />
    <div className="dashboard-main">
      <header className="dashboard-topbar"><div className="breadcrumbs"><span>{admin ? 'Administración' : customer ? 'Mi cuenta' : 'Mi emprendimiento'}</span><ChevronRight size={14} /><strong>{titleFromPath(location.pathname)}</strong></div><div className="topbar-user"><span className="online-dot" /> <span>{user?.email}</span><span className="topbar-avatar">{String(user?.email || 'U').slice(0, 1).toUpperCase()}</span></div></header>
      <main className="dashboard-content"><Outlet /></main>
      <footer className="dashboard-footer"><span>Manos de Nicaragua · Plataforma de emprendimientos</span><span>Espacio privado · {admin ? 'Administración' : customer ? 'Comprador' : 'Protagonista'}</span></footer>
    </div>
  </div>;
}
