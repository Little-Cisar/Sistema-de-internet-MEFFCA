import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList, valueOf } from '../utils/apiHelpers';

const PER_PAGE = 9;

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('categoria') || '');
  const [sort, setSort] = useState('recent');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    setCategory(searchParams.get('categoria') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([catalogService.getProducts(), catalogService.getCategories()]).then(([productResult, categoryResult]) => {
      if (!active) return;
      if (productResult.status === 'fulfilled') setProducts(extractList(productResult.value.data, ['productos', 'products', 'resultados']));
      else setProductError(errorMessage(productResult.reason));
      if (categoryResult.status === 'fulfilled') setCategories(extractList(categoryResult.value.data, ['categorias', 'categories']));
      else setCategoryError(errorMessage(categoryResult.reason));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    const filtered = products.filter((product) => {
      const name = valueOf(product, ['nombre_producto', 'nombre', 'name']).toLocaleLowerCase('es');
      const description = valueOf(product, ['descripcion', 'description']).toLocaleLowerCase('es');
      const categoryName = valueOf(product, ['nombre_categoria', 'categoria', 'category']).toLocaleLowerCase('es');
      const productCategoryId = String(valueOf(product, ['id_categoria', 'categoria_id'], ''));
      const searchMatches = !term || `${name} ${description} ${categoryName}`.includes(term);
      const categoryMatches = !category || productCategoryId === category || categoryName === category.toLocaleLowerCase('es');
      return searchMatches && categoryMatches;
    });
    if (sort === 'price-asc') filtered.sort((a, b) => Number(a.precio ?? a.price ?? 0) - Number(b.precio ?? b.price ?? 0));
    if (sort === 'price-desc') filtered.sort((a, b) => Number(b.precio ?? b.price ?? 0) - Number(a.precio ?? a.price ?? 0));
    if (sort === 'name') filtered.sort((a, b) => valueOf(a, ['nombre_producto', 'nombre', 'name']).localeCompare(valueOf(b, ['nombre_producto', 'nombre', 'name']), 'es'));
    if (sort === 'recent') filtered.sort((a, b) => new Date(b.fecha_creacion || b.createdAt || 0) - new Date(a.fecha_creacion || a.createdAt || 0));
    return filtered;
  }, [products, search, category, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const visibleProducts = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const updateSearch = () => { setPage(1); setSearchParams({ ...(search.trim() ? { q: search.trim() } : {}), ...(category ? { categoria: category } : {}) }); };

  return <div className="page-wrap"><div className="site-container">
    <div className="page-intro page-intro-catalog"><div><div className="eyebrow">MERCADO DE EMPRENDIMIENTOS</div><h1>Encuentra algo <span>hecho con propósito.</span></h1><p>Explora productos y conoce a las personas que están detrás de cada creación.</p></div><span className="catalog-decor"><SlidersHorizontal size={37} /></span></div>
    <div className="catalog-tools"><SearchBar value={search} onChange={setSearch} onSubmit={updateSearch} placeholder="Busca por producto, categoría o descripción…" /><FilterPanel categories={categories} category={category} onCategoryChange={(value) => { setCategory(value); setPage(1); setSearchParams({ ...(search.trim() ? { q: search.trim() } : {}), ...(value ? { categoria: value } : {}) }); }} sort={sort} onSortChange={setSort} /></div>
    {categoryError && <Alert type="info">{categoryError}</Alert>}
    <div className="catalog-results-heading"><div><span className="result-kicker">VITRINA LOCAL</span><h2>{category ? 'Productos por categoría' : 'Productos del mercado'}</h2></div><span className="result-count">{!loading && !productError ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'resultado' : 'resultados'}` : 'Catálogo conectado a la API'}</span></div>
    {loading ? <Loader label="Cargando catálogo…" /> : productError ? <Alert type="info">{productError}</Alert> : visibleProducts.length ? <><div className="product-grid catalog-product-grid">{visibleProducts.map((product, index) => <ProductCard key={product.id_producto ?? product.id ?? index} product={product} />)}</div><Pagination page={page} pageCount={pageCount} onChange={setPage} /></> : <EmptyState title={products.length ? 'No encontramos coincidencias' : 'Aún no hay productos publicados'} description={products.length ? 'Prueba otra búsqueda o cambia el filtro de categoría.' : 'El catálogo consulta la API real. Las publicaciones aparecerán cuando los protagonistas verificados registren productos activos; no mostramos productos ficticios.'} icon="compass" action={products.length ? <button className="button button-outline" onClick={() => { setSearch(''); setCategory(''); setPage(1); setSearchParams({}); }}>Limpiar filtros <ArrowLeft size={16} /></button> : <Link to="/registro" className="button button-outline">Conocer cómo participar <ArrowRight size={16} /></Link>} />}
  </div></div>;
}
