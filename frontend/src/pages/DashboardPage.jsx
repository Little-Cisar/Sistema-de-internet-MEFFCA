import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Boxes, CalendarDays, Eye, MessageCircle, Plus, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList } from '../utils/apiHelpers';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interactionError, setInteractionError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [productsResult, interactionsResult, businessResult] = await Promise.allSettled([
        catalogService.getMyProducts(),
        catalogService.getMyInteractions(),
        catalogService.getMyBusiness()
      ]);

      if (!active) return;
      if (productsResult.status === 'fulfilled') {
        setProducts(extractList(productsResult.value.data, ['productos', 'products']));
      } else {
        setError(errorMessage(productsResult.reason));
      }

      if (interactionsResult.status === 'fulfilled') {
        const data = interactionsResult.value.data?.reporte ?? interactionsResult.value.data;
        setInteractionSummary(data?.resumen ?? {});
        setInteractions(extractList(data, ['interacciones']));
        setInteractionError('');
      } else {
        setInteractionSummary(null);
        setInteractions([]);
        setInteractionError(errorMessage(interactionsResult.reason));
      }

      if (businessResult.status === 'fulfilled') {
        setBusiness(businessResult.value.data?.protagonista ?? businessResult.value.data?.negocio ?? businessResult.value.data);
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  const activeCount = products.filter((product) => String(product.estado || '').toLocaleLowerCase('es') === 'activo').length;
  const interactionCount = interactionSummary?.total_interacciones ?? '—';
  const whatsappCount = interactionSummary?.clics_whatsapp ?? '—';
  const todayCount = interactionSummary?.interacciones_hoy ?? '—';

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">TU NEGOCIO, TU ESPACIO</div><h1>¡Hola! <span>Qué bueno tenerte aquí.</span></h1><p>Este es el punto de partida para organizar tu presencia en el mercado.</p></div><Link to="/mi-negocio/productos" className="button button-primary"><Plus size={17} /> Gestionar productos</Link></div>
    {error && <Alert type="warning">No se pudieron cargar tus productos: {error}</Alert>}
    {business && !business.estado_verificacion && <Alert type="info">Tu perfil está pendiente de verificación institucional. Puedes completar la información de tu negocio, pero el administrador debe aprobarlo antes de que puedas publicar productos.</Alert>}
    <div className="dashboard-stat-grid">
      <div className="dashboard-stat"><span className="stat-icon stat-blue"><Boxes size={22} /></span><span className="stat-caption">PRODUCTOS REGISTRADOS</span><strong>{loading ? '—' : products.length}</strong><small>Publicaciones propias</small></div>
      <div className="dashboard-stat"><span className="stat-icon stat-green"><Store size={22} /></span><span className="stat-caption">PRODUCTOS ACTIVOS</span><strong>{loading ? '—' : activeCount}</strong><small>Estado activo en el catálogo privado</small></div>
      <div className="dashboard-stat"><span className="stat-icon stat-pink"><MessageCircle size={22} /></span><span className="stat-caption">CLICS EN WHATSAPP</span><strong>{loading ? '—' : whatsappCount}</strong><small>Contactos registrados de tus productos</small></div>
      <div className="dashboard-stat"><span className="stat-icon stat-violet"><CalendarDays size={22} /></span><span className="stat-caption">INTERACCIONES HOY</span><strong>{loading ? '—' : todayCount}</strong><small>Según la fecha del servidor</small></div>
    </div>

    <div className="dashboard-panel"><div className="dashboard-panel-heading"><div><h2>Tu catálogo</h2><p>Acceso directo a las publicaciones de tu emprendimiento.</p></div><Link to="/mi-negocio/productos" className="text-link">Abrir gestión <ArrowRight size={16} /></Link></div>
      {loading ? <Loader label="Consultando productos propios…" /> : error ? <EmptyState title="No pudimos cargar tu catálogo" description="Comprueba la conexión con el backend y SQL Server. No podemos confirmar si hay productos mientras la consulta falla." icon="package" action={<Link to="/mi-negocio/productos" className="button button-outline">Abrir gestión de productos <ArrowRight size={16} /></Link>} /> : products.length ? <div className="dashboard-product-list">{products.slice(0, 5).map((product, index) => <div className="dashboard-product-row" key={product.id_producto ?? product.id ?? index}><span className="dashboard-product-thumb"><Boxes size={19} /></span><span className="dashboard-product-data"><strong>{product.nombre_producto ?? product.nombre ?? 'Producto'}</strong><small>{product.nombre_categoria ?? 'Sin categoría asignada'}</small></span><span className={`status-pill ${String(product.estado).toLocaleLowerCase('es') === 'activo' ? 'status-active' : 'status-inactive'}`}>{product.estado || 'Sin estado'}</span></div>)}</div> : <EmptyState title="Tu catálogo empieza aquí" description="Los productos que registres aquí se guardarán en SQL Server. Para publicar, tu perfil debe estar verificado y el producto debe estar activo." action={<Link to="/mi-negocio/productos" className="button button-outline">Ir a mis productos <ArrowRight size={16} /></Link>} />}
    </div>

    <div className="dashboard-panel" style={{ marginTop: 20 }}><div className="dashboard-panel-heading"><div><h2>Interacciones recientes</h2><p>Últimos clics de contacto en publicaciones de tu emprendimiento.</p></div><span className="dashboard-welcome-mark"><Activity size={23} /></span></div>
      {interactionError && <Alert type="warning">No se pudieron consultar tus interacciones: {interactionError}</Alert>}
      {loading ? <Loader label="Consultando actividad reciente…" /> : interactionError ? null : interactions.length ? <div className="dashboard-product-list">{interactions.slice(0, 5).map((item, index) => <div className="dashboard-product-row" key={item.id_interaccion ?? index}><span className="dashboard-product-thumb"><MessageCircle size={18} /></span><span className="dashboard-product-data"><strong>{item.nombre_producto ?? 'Producto'}</strong><small>{item.tipo_usuario ?? (item.id_usuario ? 'Usuario registrado' : 'Visitante')} · {item.tipo_accion ?? 'Interacción'}</small></span><span className="muted-note">{item.fecha_hora ? new Date(item.fecha_hora).toLocaleString('es-NI') : 'Fecha no disponible'}</span></div>)}</div> : <EmptyState title="Todavía no hay actividad registrada" description="Cuando una persona contacte por WhatsApp desde una de tus publicaciones activas, la interacción aparecerá aquí." icon="compass" />}
    </div>

    <div className="dashboard-help-note"><span className="help-note-icon"><Eye size={20} /></span><div><strong>¿Cómo mejorar la presencia de tu negocio?</strong><p>Mantén actualizado el perfil del emprendimiento, revisa la disponibilidad de los productos y usa las interacciones para conocer qué publicaciones generan interés.</p><Link className="text-link" to="/mi-negocio/perfil">Actualizar perfil <ArrowRight size={15} /></Link></div></div>
  </div>;
}
