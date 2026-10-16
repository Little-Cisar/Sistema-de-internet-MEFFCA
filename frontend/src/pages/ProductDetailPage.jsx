import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BadgeCheck, ImageOff, MapPin, MessageCircle, Package, ShieldCheck, Store } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList, valueOf, currency, formatDate, phoneDigits } from '../utils/apiHelpers';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interactionWarning, setInteractionWarning] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await catalogService.getProduct(id);
        const item = response.data?.producto ?? response.data?.product ?? response.data;
        if (active) setProduct(item);
        try {
          const listResponse = await catalogService.getProducts({ id_categoria: item?.id_categoria, limit: 4 });
          if (active) setRelated(extractList(listResponse.data, ['productos', 'products']).filter((entry) => String(entry.id_producto ?? entry.id) !== String(id)).slice(0, 4));
        } catch {
          // Las recomendaciones son opcionales; un fallo no debe ocultar el detalle solicitado.
        }
      } catch (requestError) {
        if (active) setError(errorMessage(requestError));
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const contactSeller = () => {
    if (!product) return;
    setInteractionWarning('');
    const phone = phoneDigits(valueOf(product, ['telefono_whatsapp', 'whatsapp', 'telefono']));
    if (!phone) return;
    const name = valueOf(product, ['nombre_producto', 'nombre'], 'producto');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, vi ${name} en el mercado Manos de Nicaragua y quisiera más información.`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    catalogService.recordInteraction({ id_producto: Number(id), tipo_accion: 'Clic en WhatsApp' }).catch(() => { setInteractionWarning('Se abrió el contacto por WhatsApp, pero no pudimos registrar esta interacción. La persona aún puede continuar con el emprendimiento.'); });
  };

  if (loading) return <div className="page-wrap"><div className="site-container"><Loader label="Consultando producto…" /></div></div>;
  if (error || !product) return <div className="page-wrap"><div className="site-container"><Link to="/catalogo" className="back-link"><ArrowLeft size={17} /> Volver al catálogo</Link><Alert type="info">{error || 'No se encontró este producto.'}</Alert><EmptyState title="No pudimos abrir la publicación" description="Comprueba que el catálogo esté conectado a la API y que el identificador del producto sea válido." icon="compass" /></div></div>;

  const name = valueOf(product, ['nombre_producto', 'nombre', 'name'], 'Producto');
  const image = valueOf(product, ['imagen', 'image', 'image_url']);
  const businessName = valueOf(product, ['nombre_negocio', 'nombre_protagonista', 'negocio'], 'Emprendimiento local');
  const entrepreneurId = valueOf(product, ['id_protagonista'], '');
  const department = valueOf(product, ['departamento'], 'Nicaragua');
  const activeStock = Number(valueOf(product, ['stock_actual', 'stock'], 0));

  return <div className="page-wrap"><div className="site-container">
    <Link to="/catalogo" className="back-link"><ArrowLeft size={17} /> Volver al catálogo</Link>
    <div className="detail-layout"><div className="detail-image-shell">{image ? <img src={image} alt={name} /> : <div className="detail-image-placeholder"><span className="placeholder-sun" /><span className="placeholder-hill hill-a" /><span className="placeholder-hill hill-b" /><span className="placeholder-caption"><ImageOff size={16} /> Imagen no disponible</span></div>}</div>
      <div className="detail-copy"><div className="detail-category">{valueOf(product, ['nombre_categoria', 'categoria'], 'Producto local')}</div><h1>{name}</h1><div className="detail-price">{currency(valueOf(product, ['precio', 'price'], NaN))}</div><p className="detail-description">{valueOf(product, ['descripcion', 'description'], 'Este emprendimiento aún no ha agregado una descripción para el producto.')}</p>
        <div className="detail-facts"><span><MapPin size={17} /> {department}</span><span><Package size={17} /> {activeStock > 0 ? `Disponibilidad reportada: ${activeStock}` : 'Consulta disponibilidad con el emprendimiento'}</span><span><ShieldCheck size={17} /> Publicación del catálogo</span><span><Store size={17} /> Añadido {formatDate(valueOf(product, ['fecha_creacion', 'createdAt'], ''))}</span></div>
        <button type="button" className="button button-primary button-large contact-button" onClick={contactSeller} disabled={!valueOf(product, ['telefono_whatsapp', 'whatsapp', 'telefono'])}><MessageCircle size={19} /> Contactar por WhatsApp</button>
        {interactionWarning && <Alert type="warning">{interactionWarning}</Alert>}
        {!valueOf(product, ['telefono_whatsapp', 'whatsapp', 'telefono']) && <small className="muted-note">El teléfono del emprendimiento no está disponible en esta respuesta de la API.</small>}
        <div className="seller-mini-card"><span className="seller-mini-icon"><Store size={22} /></span><div><small>PUBLICADO POR</small><strong>{businessName}</strong><span className="seller-verification">{product.estado_verificacion ? <><BadgeCheck size={14} /> Perfil verificado</> : 'Emprendimiento local'}</span></div>{entrepreneurId && <Link to={`/emprendedores/${entrepreneurId}`} aria-label="Ver perfil del emprendimiento"><ArrowUpRight size={19} /></Link>}</div>
      </div>
    </div>
    {related.length > 0 && <section className="detail-related"><div className="section-heading"><div><div className="eyebrow">SIGUE EXPLORANDO</div><h2>También te puede interesar.</h2></div><Link className="text-link" to="/catalogo">Ver catálogo <ArrowUpRight size={16} /></Link></div><div className="product-grid">{related.map((item, index) => <ProductCard key={item.id_producto ?? item.id ?? index} product={item} />)}</div></section>}
  </div></div>;
}
