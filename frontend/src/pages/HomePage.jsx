import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BadgeCheck, HandHeart, Leaf, Sparkles, Store, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList, valueOf } from '../utils/apiHelpers';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [productError, setProductError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [entrepreneurError, setEntrepreneurError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [productsResult, categoriesResult, entrepreneursResult] = await Promise.allSettled([
        catalogService.getProducts({ destacados: true, limit: 4 }),
        catalogService.getCategories(),
        catalogService.getEntrepreneurs()
      ]);
      if (!active) return;
      if (productsResult.status === 'fulfilled') setProducts(extractList(productsResult.value.data, ['productos', 'products', 'resultados']).slice(0, 4));
      else setProductError(errorMessage(productsResult.reason));
      if (categoriesResult.status === 'fulfilled') setCategories(extractList(categoriesResult.value.data, ['categorias', 'categories']).slice(0, 5));
      else setCategoryError(errorMessage(categoriesResult.reason));
      if (entrepreneursResult.status === 'fulfilled') setEntrepreneurs(extractList(entrepreneursResult.value.data, ['protagonistas', 'emprendedores', 'entrepreneurs']).slice(0, 3));
      else setEntrepreneurError(errorMessage(entrepreneursResult.reason));
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  const doSearch = () => navigate(`/catalogo?q=${encodeURIComponent(search.trim())}`);

  return <>
    <HeroSection search={search} onSearchChange={setSearch} onSearch={doSearch} />

    <section className="section-block categories-section">
      <div className="site-container">
        <div className="section-heading"><div><div className="eyebrow">EXPLORA POR CATEGORÍA</div><h2>Encuentra algo <span>hecho para ti.</span></h2><p>De los sabores de nuestra tierra a las piezas hechas a mano.</p></div><Link to="/catalogo" className="text-link">Ver todas las categorías <ArrowUpRight size={17} /></Link></div>
        {loading ? <Loader label="Cargando categorías…" /> : categoryError ? <Alert type="info">{categoryError}</Alert> : categories.length ? <div className="category-grid">{categories.map((category, index) => <CategoryCard key={category.id_categoria ?? category.id ?? index} category={category} index={index} />)}</div> : <EmptyState title="No hay categorías configuradas" description="Las categorías se consultan desde SQL Server. Comprueba la carga inicial de MEFCCA_DB si esta sección permanece vacía." icon="compass" />}
      </div>
    </section>

    <section className="section-block products-section">
      <div className="site-container">
        <div className="section-heading"><div><div className="eyebrow">DEL TALLER A TU HOGAR</div><h2>Un mercado lleno de <span>ideas propias.</span></h2><p>Explora productos de emprendimientos vinculados a la comunidad local.</p></div><Link to="/catalogo" className="text-link">Explorar productos <ArrowUpRight size={17} /></Link></div>
        {loading ? <Loader label="Consultando productos…" /> : productError ? <Alert type="info">{productError}</Alert> : products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id_producto ?? product.id ?? index} product={product} />)}</div> : <EmptyState title="Estamos preparando la vitrina" description="Los productos se mostrarán aquí cuando el catálogo esté conectado a la API. No presentamos artículos ficticios como si fueran publicaciones reales." action={<Link className="button button-outline" to="/catalogo">Ir al catálogo <ArrowRight size={16} /></Link>} />}
      </div>
    </section>

    <section className="community-section">
      <div className="site-container community-grid"><div className="community-art"><div className="community-art-card"><span className="community-art-star"><Sparkles size={21} /></span><span className="community-art-word">CREAR</span><span className="community-art-word community-art-outline">CONECTAR</span><span className="community-art-word">CRECER</span><div className="community-art-stamp">NICARAGUA<br />EN CADA DETALLE</div></div><div className="community-circle circle-magenta" /><div className="community-circle circle-green" /></div><div className="community-copy"><div className="eyebrow">CADA EMPRENDIMIENTO CUENTA</div><h2>Detrás de cada producto,<br /><span>hay una historia.</span></h2><p>Este espacio busca acercar a compradores y protagonistas, dar visibilidad a sus productos y facilitar que más personas descubran el trabajo de los emprendimientos nicaragüenses.</p><div className="community-points"><span><UsersRound size={18} /> Conoce a quienes producen</span><span><Store size={18} /> Descubre negocios locales</span><span><HandHeart size={18} /> Apoya el trabajo hecho aquí</span></div><Link to="/emprendedores" className="button button-primary button-large">Conocer emprendedores <ArrowRight size={18} /></Link></div></div>
    </section>

    <section className="entrepreneurs-section section-block"><div className="site-container"><div className="section-heading"><div><div className="eyebrow">CONOCE A LA COMUNIDAD</div><h2>Personas que hacen <span>que suceda.</span></h2><p>Descubre los perfiles de emprendimientos del mercado.</p></div><Link to="/emprendedores" className="text-link">Ver emprendedores <ArrowUpRight size={17} /></Link></div>
      {entrepreneurError ? <Alert type="info">{entrepreneurError}</Alert> : entrepreneurs.length ? <div className="entrepreneur-grid">{entrepreneurs.map((person, index) => <Link to={`/emprendedores/${valueOf(person, ['id_protagonista', 'id'])}`} className="entrepreneur-card" key={person.id_protagonista ?? person.id ?? index}><span className={`entrepreneur-avatar avatar-${index % 3}`}>{String(valueOf(person, ['nombre_negocio', 'nombre', 'negocio'], 'M')).slice(0, 1).toLocaleUpperCase('es')}</span><span className="entrepreneur-card-content"><strong>{valueOf(person, ['nombre_negocio', 'nombre', 'negocio'], 'Emprendimiento')}</strong><small>{valueOf(person, ['departamento'], 'Nicaragua')}</small><span>{person.estado_verificacion ? <><BadgeCheck size={14} /> Perfil verificado</> : <><Store size={14} /> Emprendimiento local</>}</span></span><ArrowUpRight size={18} className="entrepreneur-arrow" /></Link>)}</div> : <EmptyState title="La comunidad aparecerá aquí" description="Se mostrará información de protagonistas cuando la API pública de emprendedores esté disponible." icon="compass" />}
    </div></section>

    <section className="join-banner"><div className="site-container join-banner-inner"><div><span className="join-kicker"><span /> TU HISTORIA TAMBIÉN MERECE UNA VITRINA</span><h2>¿Tienes un emprendimiento?</h2><p>Haz que más personas conozcan lo que haces.</p></div><Link to="/registro" className="button button-white button-large">Forma parte del mercado <ArrowRight size={18} /></Link><ArrowDownRight size={105} className="join-decoration" aria-hidden="true" /></div></section>
  </>;
}
