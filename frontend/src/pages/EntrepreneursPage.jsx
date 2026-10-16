import { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, MapPin, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList, valueOf } from '../utils/apiHelpers';

export default function EntrepreneursPage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    catalogService.getEntrepreneurs().then((response) => {
      if (active) setPeople(extractList(response.data, ['protagonistas', 'emprendedores', 'entrepreneurs']));
    }).catch((requestError) => { if (active) setError(errorMessage(requestError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="page-wrap"><div className="site-container">
    <section className="page-intro entrepreneur-intro"><div><div className="eyebrow">PERSONAS DETRÁS DE LOS PRODUCTOS</div><h1>Conoce a quienes <span>hacen crecer</span> sus ideas.</h1><p>Conoce los negocios que ya cuentan con verificación institucional y descubre sus productos.</p></div><span className="entrepreneur-intro-icon"><Store size={42} /></span></section>
    {loading ? <Loader label="Cargando emprendedores…" /> : error ? <Alert type="info">{error}</Alert> : people.length ? <div className="entrepreneur-directory">{people.map((person, index) => <Link to={`/emprendedores/${valueOf(person, ['id_protagonista', 'id'])}`} className="directory-card" key={person.id_protagonista ?? person.id ?? index}><span className={`directory-avatar avatar-${index % 3}`}>{String(valueOf(person, ['nombre_negocio', 'nombre'], 'E')).slice(0, 1).toLocaleUpperCase('es')}</span><span className="directory-info"><strong>{valueOf(person, ['nombre_negocio', 'nombre', 'negocio'], 'Emprendimiento')}</strong><span><MapPin size={14} /> {valueOf(person, ['departamento'], 'Nicaragua')}</span><p>{valueOf(person, ['descripcion_negocio', 'descripcion'], 'Perfil del emprendimiento')}</p><span className="directory-status">{person.estado_verificacion ? <><BadgeCheck size={14} /> Perfil verificado</> : <><Store size={14} /> Emprendimiento local</>}</span></span><span className="directory-open">Ver perfil <ArrowUpRight size={17} /></span></Link>)}</div> : <EmptyState title="Todavía no hay perfiles disponibles" description="Los perfiles verificados se mostrarán aquí cuando existan emprendedores aprobados en la base de datos." icon="compass" />}
  </div></div>;
}
