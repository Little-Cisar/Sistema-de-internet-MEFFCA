import { useCallback, useEffect, useState } from 'react';
import { Archive, ArrowUpRight, Boxes, Edit3, Eye, ImagePlus, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { catalogService } from '../services/catalogService';
import { currency, errorMessage, extractList, valueOf } from '../utils/apiHelpers';

const blankForm = { nombre_producto: '', id_categoria: '', descripcion: '', precio: '', imagen: '', stock_actual: '0' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [businessVerified, setBusinessVerified] = useState(null);
  const [businessError, setBusinessError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    const [productResult, categoryResult, businessResult] = await Promise.allSettled([catalogService.getMyProducts(), catalogService.getCategories(), catalogService.getMyBusiness()]);
    if (productResult.status === 'fulfilled') {
      setProducts(extractList(productResult.value.data, ['productos', 'products']));
      setError('');
    } else setError(errorMessage(productResult.reason));
    if (categoryResult.status === 'fulfilled') {
      setCategories(extractList(categoryResult.value.data, ['categorias', 'categories']));
      setCategoryError('');
    } else {
      setCategories([]);
      setCategoryError(errorMessage(categoryResult.reason));
    }
    if (businessResult.status === 'fulfilled') {
      const business = businessResult.value.data?.protagonista ?? businessResult.value.data?.negocio ?? businessResult.value.data;
      setBusinessVerified(Boolean(business?.estado_verificacion));
      setBusinessError('');
    } else {
      setBusinessVerified(null);
      setBusinessError(errorMessage(businessResult.reason));
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const openCreate = () => {
    setNotice('');
    if (businessVerified !== true) {
      setNotice(businessVerified === false ? 'Tu perfil todavía está pendiente de verificación institucional. El administrador debe aprobarlo antes de publicar.' : 'No pudimos confirmar el estado de verificación del emprendimiento. Actualiza la pantalla y vuelve a intentarlo.');
      return;
    }
    if (categories.length === 0 || categoryError) {
      setNotice('Para publicar un producto se necesita al menos una categoría disponible.');
      return;
    }
    setEditing(null); setForm(blankForm); setModalOpen(true);
  };
  const openEdit = (product) => { setEditing(product); setForm({ nombre_producto: valueOf(product, ['nombre_producto', 'nombre']), id_categoria: String(valueOf(product, ['id_categoria'], '')), descripcion: valueOf(product, ['descripcion']), precio: String(valueOf(product, ['precio'], '')), imagen: valueOf(product, ['imagen']), stock_actual: String(valueOf(product, ['stock_actual'], '0')) }); setNotice(''); setModalOpen(true); };
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProduct = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(''); setError('');
    const payload = { nombre_producto: form.nombre_producto.trim(), id_categoria: Number(form.id_categoria), descripcion: form.descripcion.trim() || null, precio: Number(form.precio), imagen: form.imagen.trim() || null, stock_actual: Number(form.stock_actual) };
    try {
      if (editing) await catalogService.updateProduct(editing.id_producto ?? editing.id, payload);
      else await catalogService.createProduct(payload);
      setModalOpen(false); setNotice(editing ? 'Producto actualizado.' : 'Producto registrado.'); await reload();
    } catch (requestError) { setNotice(errorMessage(requestError)); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (product) => {
    const id = product.id_producto ?? product.id;
    const nextStatus = String(product.estado).toLocaleLowerCase('es') === 'activo' ? 'Inactivo' : 'Activo';
    setNotice(''); setError('');
    try { await catalogService.setProductStatus(id, nextStatus); setNotice(`El estado del producto cambió a ${nextStatus.toLowerCase()}.`); await reload(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  };

  const filtered = products.filter((product) => `${valueOf(product, ['nombre_producto', 'nombre'])} ${valueOf(product, ['nombre_categoria', 'categoria'])}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const connectionIssue = /No se pudo conectar con la API|Comprueba que el backend/i.test(error);

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">CATÁLOGO PRIVADO</div><h1>Mis <span>productos.</span></h1><p>Gestiona las publicaciones de tu emprendimiento y mantén la información al día.</p></div><button type="button" className="button button-primary" onClick={openCreate} disabled={loading || businessVerified !== true || categories.length === 0 || Boolean(categoryError)} title={businessVerified !== true ? 'El emprendimiento debe estar verificado.' : categories.length === 0 ? 'Primero debe existir una categoría disponible.' : 'Registrar un nuevo producto'}><Plus size={17} /> Nuevo producto</button></div>
    {notice && <Alert type="info" onClose={() => setNotice('')}>{notice}</Alert>}{error && <Alert type="warning">{error}</Alert>}
    {connectionIssue && <div className="integration-hint"><strong>No se pudieron cargar tus publicaciones.</strong><p>Comprueba que el backend actualizado esté ejecutándose, que SQL Server responda y que hayas iniciado sesión con una cuenta Protagonista.</p></div>}
    {businessVerified === false && <Alert type="info">Tu emprendimiento aún no está verificado. Puedes completar tu perfil, pero el administrador debe aprobarlo antes de habilitar la publicación de productos.</Alert>}
    {businessError && <Alert type="warning">No se pudo consultar el estado de verificación: {businessError}</Alert>}
    {categoryError && <Alert type="warning">No se pudieron cargar las categorías: {categoryError}</Alert>}
    {!loading && !categoryError && categories.length === 0 && <Alert type="info">Todavía no hay categorías registradas. Pide al administrador que cree al menos una antes de publicar productos.</Alert>}
    <div className="dashboard-toolbar"><div className="toolbar-search"><Search size={18} /><input aria-label="Buscar mis productos" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o categoría…" /></div><span className="result-count">{products.length} publicaciones</span></div>
    {loading ? <Loader label="Cargando tus productos…" />
      : error ? <EmptyState title="No pudimos consultar tus productos" description="La solicitud al backend falló. Comprueba la conexión con SQL Server y vuelve a intentarlo antes de interpretar que el catálogo está vacío." action={<button type="button" className="button button-outline" onClick={reload}>Reintentar consulta</button>} icon="package" />
      : filtered.length ? <div className="management-product-grid">{filtered.map((product, index) => <article className="management-product-card" key={product.id_producto ?? product.id ?? index}><div className="management-product-image">{product.imagen ? <img src={product.imagen} alt="" /> : <div className="management-image-placeholder"><ImagePlus size={24} /><span>Sin imagen</span></div>}<span className={`status-pill ${String(product.estado).toLocaleLowerCase('es') === 'activo' ? 'status-active' : 'status-inactive'}`}>{product.estado || 'Sin estado'}</span></div><div className="management-product-body"><small>{valueOf(product, ['nombre_categoria', 'categoria'], 'Sin categoría')}</small><h3>{valueOf(product, ['nombre_producto', 'nombre'], 'Producto')}</h3><div className="management-product-price">{currency(product.precio)}</div><div className="management-product-meta"><span><Archive size={14} /> Existencia: {valueOf(product, ['stock_actual'], '—')}</span><span>ID: {product.id_producto ?? product.id ?? '—'}</span></div><div className="management-product-actions"><button type="button" className="button button-outline button-small" onClick={() => openEdit(product)}><Edit3 size={15} /> Editar</button><button type="button" className="icon-button" onClick={() => toggleStatus(product)} title={String(product.estado).toLocaleLowerCase('es') === 'activo' ? 'Desactivar publicación' : 'Activar publicación'} aria-label={String(product.estado).toLocaleLowerCase('es') === 'activo' ? 'Desactivar publicación' : 'Activar publicación'}>{String(product.estado).toLocaleLowerCase('es') === 'activo' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button><button type="button" className="icon-button" onClick={() => window.open(`/productos/${product.id_producto ?? product.id}`, '_blank', 'noopener,noreferrer')} title="Ver producto público" aria-label="Ver producto público"><Eye size={18} /></button></div></div></article>)}</div>
      : <EmptyState title={products.length ? 'No hay coincidencias' : 'Aún no tienes productos'} description={products.length ? 'Prueba otro término de búsqueda.' : 'Los productos que registres aquí se guardarán en SQL Server. Para publicar, tu perfil debe estar verificado y el producto debe estar activo.'} action={<button type="button" className="button button-primary" onClick={openCreate}><Plus size={16} /> Crear primer producto</button>} />}
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Registrar producto'} size="large">
      <form className="form-stack product-form" onSubmit={saveProduct}>
        <div className="form-field"><label htmlFor="product-name">Nombre del producto</label><input className="plain-input" id="product-name" name="nombre_producto" value={form.nombre_producto} onChange={updateField} required minLength={2} maxLength={150} placeholder="Nombre claro y descriptivo" /></div>
        <div className="form-two-columns"><div className="form-field"><label htmlFor="product-category">Categoría</label><select className="plain-input" id="product-category" name="id_categoria" value={form.id_categoria} onChange={updateField} required><option value="">Selecciona una categoría</option>{categories.map((item) => <option key={item.id_categoria ?? item.id} value={item.id_categoria ?? item.id}>{item.nombre_categoria ?? item.nombre}</option>)}</select></div><div className="form-field"><label htmlFor="product-price">Precio en córdobas (C$)</label><input className="plain-input" id="product-price" name="precio" type="number" value={form.precio} onChange={updateField} required min="0" step="0.01" /></div></div>
        <div className="form-two-columns"><div className="form-field"><label htmlFor="product-stock">Existencia reportada</label><input className="plain-input" id="product-stock" name="stock_actual" type="number" value={form.stock_actual} onChange={updateField} required min="0" step="1" /></div><div className="form-field"><label htmlFor="product-image">URL de imagen <span className="optional-label">Opcional</span></label><input className="plain-input" id="product-image" name="imagen" type="url" value={form.imagen} onChange={updateField} placeholder="https://…" /></div></div>
        <div className="form-field"><label htmlFor="product-description">Descripción</label><textarea id="product-description" className="plain-input" name="descripcion" value={form.descripcion} onChange={updateField} rows={4} placeholder="Materiales, elaboración, características…" /></div>
        {notice && <Alert type="error">{notice}</Alert>}
        <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModalOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar producto'} <ArrowUpRight size={16} /></button></div>
        {!categories.length && <p className="muted-note">Para guardar el producto se necesita una categoría existente. Si no aparecen opciones, revisa el aviso de categorías o solicita al administrador crear una.</p>}
      </form>
    </Modal>
  </div>;
}
