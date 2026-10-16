import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Boxes, CheckCircle2, List, Users, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import { authService } from '../services/authService';
import { errorMessage } from '../utils/apiHelpers';

export default function AdminDashboardPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; authService.health().then((response) => { if (active) setHealth(response.data); }).catch((requestError) => { if (active) setError(errorMessage(requestError)); }); return () => { active = false; }; }, []);
  return <div className="dashboard-page"><div className="dashboard-welcome"><div><div className="eyebrow">GESTIÓN DE LA PLATAFORMA</div><h1>Administración <span>del mercado.</span></h1><p>Herramientas institucionales para mantener organizado y confiable el espacio.</p></div></div>
    {error && <Alert type="warning">{error}</Alert>}
    <div className="admin-status-banner"><span className="admin-status-icon"><CheckCircle2 size={22} /></span><div><strong>Estado del backend</strong><p>{health?.base_de_datos === 'conectada' ? 'La API respondió y confirmó la conexión con la base de datos.' : health ? 'La API responde, pero la conexión con la base de datos necesita revisión.' : 'Consultando el estado de la API…'}</p></div><span className={`status-pill ${health?.base_de_datos === 'conectada' ? 'status-active' : 'status-inactive'}`}>{health?.base_de_datos || 'Consultando'}</span></div>
    <div className="admin-quick-grid"><Link to="/administracion/categorias" className="admin-quick-card"><span className="quick-card-icon quick-blue"><List size={22} /></span><strong>Gestionar categorías</strong><p>Organiza la clasificación del catálogo.</p><span className="quick-card-link">Abrir módulo <ArrowRight size={16} /></span></Link><Link to="/administracion/usuarios" className="admin-quick-card"><span className="quick-card-icon quick-pink"><Users size={22} /></span><strong>Gestionar usuarios</strong><p>Consulta de cuentas y sus roles.</p><span className="quick-card-link">Abrir módulo <ArrowRight size={16} /></span></Link><Link to="/administracion/verificaciones" className="admin-quick-card"><span className="quick-card-icon quick-green"><BadgeCheck size={22} /></span><strong>Verificar protagonistas</strong><p>Revisa perfiles pendientes de verificación.</p><span className="quick-card-link">Abrir módulo <ArrowRight size={16} /></span></Link><Link to="/administracion/reportes" className="admin-quick-card"><span className="quick-card-icon quick-violet"><Boxes size={22} /></span><strong>Consultar reportes</strong><p>Revisa las interacciones registradas.</p><span className="quick-card-link">Abrir módulo <ArrowRight size={16} /></span></Link><Link to="/administracion/ventas" className="admin-quick-card"><span className="quick-card-icon quick-green"><ClipboardList size={22} /></span><strong>Operaciones comerciales</strong><p>Consulta las ventas registradas y sus estados.</p><span className="quick-card-link">Abrir módulo <ArrowRight size={16} /></span></Link></div>
    <div className="integration-hint"><strong>Estado de los módulos</strong><p>La gestión de categorías, usuarios y verificación, así como el registro y reporte de interacciones, ya dispone de endpoints REST. Las ventas y los historiales ahora se registran por API; falta completar las pruebas integrales contra SQL Server para validar el recorrido comercial.</p></div>
  </div>;
}
