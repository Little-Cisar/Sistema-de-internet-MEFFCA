import { useEffect, useState } from 'react';
import { BadgeCheck, Check, X } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList } from '../utils/apiHelpers';

export default function AdminVerificationsPage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(null);
  const load = async () => { setLoading(true); setError(''); try { const response = await catalogService.getPendingEntrepreneurs(); setPeople(extractList(response.data, ['protagonistas', 'pendientes', 'emprendedores'])); } catch (requestError) { setError(errorMessage(requestError)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const verify = async (person, approved) => { const id = person.id_protagonista ?? person.id; setWorking(id); setError(''); setNotice(''); try { await catalogService.setEntrepreneurVerification(id, approved); setNotice(approved ? 'Perfil marcado como verificado.' : 'Verificación actualizada.'); await load(); } catch (requestError) { setError(errorMessage(requestError)); } finally { setWorking(null); } };
  return <div className="dashboard-page"><div className="dashboard-welcome"><div><div className="eyebrow">CONFIANZA EN EL MERCADO</div><h1>Verificación de <span>protagonistas.</span></h1><p>Revisa los perfiles de emprendimiento antes de habilitar la publicación de productos.</p></div></div>{notice && <Alert type="success">{notice}</Alert>}{error && <Alert type="warning">{error}</Alert>}
    {loading ? <Loader label="Consultando perfiles pendientes…" /> : people.length ? <div className="verification-list">{people.map((person) => <article className="verification-card" key={person.id_protagonista ?? person.id}><span className="verification-avatar">{String(person.nombre_negocio || 'E').slice(0, 1).toLocaleUpperCase('es')}</span><div className="verification-data"><strong>{person.nombre_negocio || 'Emprendimiento'}</strong><span>{person.email || 'Correo no incluido'} · {person.departamento || 'Departamento no indicado'}</span><p>{person.descripcion_negocio || 'Sin descripción.'}</p></div><div className="verification-actions"><button className="button button-primary button-small" disabled={working !== null} onClick={() => verify(person, true)}><Check size={15} /> Verificar</button><button className="button button-outline button-small" disabled={working !== null} onClick={() => verify(person, false)}><X size={15} /> Mantener pendiente</button></div></article>)}</div> : !error ? <EmptyState title="No hay perfiles pendientes" description="Si el endpoint está conectado y no existen pendientes, esta lista permanecerá vacía." icon="compass" /> : null}
  </div>;
}
