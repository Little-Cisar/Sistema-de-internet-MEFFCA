import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BadgeCheck, MapPin, MessageCircle, Store } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList, valueOf, phoneDigits } from '../utils/apiHelpers';

export default function EntrepreneurDetailPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const personResponse = await catalogService.getEntrepreneur(id);
        if (!active) return;
        setPerson(personResponse.data?.protagonista ?? personResponse.data?.emprendedor ?? personResponse.data);
        try {
          const productResponse = await catalogService.getProducts({ id_protagonista: id });
          if (active) setProducts(extractList(productResponse.data, ['productos', 'products']));
        } catch {
          // Un error al cargar productos relacionados no debe ocultar el perfil solicitado.
        }
      } catch (requestError) {
        if (active) setError(errorMessage(requestError));
      } finally { if (active) setLoading(false); }
    };
    loadProfile();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="page-wrap"><div className="site-container"><Loader label="Cargando perfil del emprendimiento…" /></div></div>;
  if (error || !person) return <div className="page-wrap"><div className="site-container"><Link to="/emprendedores" className="back-link"><ArrowLeft size={17} /> Volver a emprendedores</Link><Alert type="info">{error || 'No se encontró el perfil solicitado.'}</Alert></div></div>;

  const name = valueOf(person, ['nombre_negocio', 'nombre', 'negocio'], 'Emprendimiento');
  const phone = phoneDigits(valueOf(person, ['telefono_whatsapp', 'telefono']));
  return <div className="page-wrap"><div className="site-container"><Link to="/emprendedores" className="back-link"><ArrowLeft size={17} /> Volver a emprendedores</Link>
    <section className="business-profile-hero"><span className="business-profile-avatar">{name.slice(0, 1).toLocaleUpperCase('es')}</span><div className="business-profile-info"><div className="eyebrow">PERFIL DEL EMPRENDIMIENTO</div><h1>{name}</h1><div className="business-location"><MapPin size={16} /> {valueOf(person, ['departamento'], 'Nicaragua')}</div><p>{valueOf(person, ['descripcion_negocio', 'descripcion'], 'Este emprendimiento todavía no ha agregado una descripción.')}</p><span className="directory-status">{person.estado_verificacion ? <><BadgeCheck size={15} /> Perfil verificado por la institución</> : <><Store size={15} /> Perfil de emprendimiento</>}</span></div>{phone && <a className="button button-primary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Contactar</a>}</section>
    <section className="section-block profile-products-section"><div className="section-heading"><div><div className="eyebrow">CATÁLOGO DEL EMPRENDIMIENTO</div><h2>Productos publicados.</h2><p>Publicaciones recuperadas de la API del sistema.</p></div><span className="result-count">{products.length} productos</span></div>{products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id_producto ?? product.id ?? index} product={product} />)}</div> : <EmptyState title="Aún no hay productos publicados" description="Cuando el emprendimiento publique productos activos, se mostrarán en esta sección." icon="compass" />}</section>
  </div></div>;
}
