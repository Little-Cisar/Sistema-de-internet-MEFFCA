import { Route, Routes } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import EntrepreneursPage from './pages/EntrepreneursPage';
import EntrepreneurDetailPage from './pages/EntrepreneurDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminVerificationsPage from './pages/AdminVerificationsPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import AdminSalesPage from './pages/AdminSalesPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return <Routes>
    <Route path="/" element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="catalogo" element={<CatalogPage />} />
      <Route path="productos/:id" element={<ProductDetailPage />} />
      <Route path="emprendedores" element={<EntrepreneursPage />} />
      <Route path="emprendedores/:id" element={<EntrepreneurDetailPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="registro" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['Protagonista']} />}>
      <Route element={<DashboardLayout mode="protagonist" />}>
        <Route path="/mi-negocio" element={<DashboardPage />} />
        <Route path="/mi-negocio/productos" element={<ProductsPage />} />
        <Route path="/mi-negocio/perfil" element={<BusinessProfilePage />} />
        <Route path="/mi-negocio/ventas" element={<SalesPage />} />
        <Route path="/mi-negocio/compras" element={<PurchasesPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Administrador']} />}>
      <Route element={<DashboardLayout mode="admin" />}>
        <Route path="/administracion" element={<AdminDashboardPage />} />
        <Route path="/administracion/categorias" element={<AdminCategoriesPage />} />
        <Route path="/administracion/usuarios" element={<AdminUsersPage />} />
        <Route path="/administracion/reportes" element={<AdminReportsPage />} />
        <Route path="/administracion/verificaciones" element={<AdminVerificationsPage />} />
        <Route path="/administracion/ventas" element={<AdminSalesPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['Cliente']} />}><Route element={<DashboardLayout mode="customer" />}><Route path="/mis-compras" element={<PurchasesPage />} /></Route></Route>

  </Routes>;
}
