import { useEffect, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList } from '../utils/apiHelpers';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => { let active = true; catalogService.getUsersForAdmin().then((response) => { if (active) setUsers(extractList(response.data, ['usuarios', 'users'])); }).catch((requestError) => { if (active) setError(errorMessage(requestError)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const filtered = users.filter((user) => `${user.email || ''} ${user.rol || ''}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  return <div className="dashboard-page"><div className="dashboard-welcome"><div><div className="eyebrow">CUENTAS DEL SISTEMA</div><h1>Gestión de <span>usuarios.</span></h1><p>Consulta las cuentas registradas y los roles asignados por el sistema.</p></div></div>
    {error && <Alert type="warning">{error}</Alert>}
    <div className="dashboard-toolbar"><div className="toolbar-search"><Search size={18} /><input aria-label="Buscar usuarios" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por correo o rol…" /></div><span className="result-count">{users.length} cuentas de API</span></div>
    {loading ? <Loader label="Consultando usuarios…" /> : filtered.length ? <div className="dashboard-panel table-panel"><table className="data-table"><thead><tr><th>Correo electrónico</th><th>Rol</th><th>Fecha de creación</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id_usuario}><td><span className="table-user"><span className="table-user-avatar">{String(user.email || 'U').slice(0, 1).toUpperCase()}</span>{user.email}</span></td><td><span className="status-pill status-info">{user.rol}</span></td><td>{user.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString('es-NI') : '—'}</td></tr>)}</tbody></table></div> : !error ? <EmptyState title="No hay cuentas que mostrar" description="Las cuentas registradas aparecerán aquí cuando existan usuarios en la base de datos." icon="compass" /> : <EmptyState title="No se pudo cargar la lista" description="Comprueba que la API esté activa y que la sesión tenga permisos de administrador." icon="package" />}
    <div className="security-note"><ShieldAlert size={19} /><p><strong>Control de acceso:</strong> los roles y permisos se deben comprobar en el backend. Ocultar o mostrar botones en React no sustituye la autorización de la API.</p></div>
  </div>;
}
