import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ClipboardList, Plus, RefreshCw, ShoppingBag, X } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import SalesTable from '../components/SalesTable';
import SaleDetailsPanel from '../components/SaleDetailsPanel';
import { catalogService } from '../services/catalogService';
import { salesService } from '../services/salesService';
import { currency, errorMessage, extractList } from '../utils/apiHelpers';

const newLine = () => ({ id_producto: '', cantidad: '1' });
const blankForm = () => ({ comprador_email: '', metodo_pago: 'Por acordar', metodo_entrega: 'Por coordinar', observaciones: '', detalles: [newLine()] });

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [businessVerified, setBusinessVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    const [salesResult, productsResult, businessResult] = await Promise.allSettled([salesService.getMySales(), catalogService.getMyProducts(), catalogService.getMyBusiness()]);
    if (salesResult.status === 'fulfilled') setSales(extractList(salesResult.value.data, ['ventas']));
    else { setSales([]); setError(errorMessage(salesResult.reason)); }
    if (productsResult.status === 'fulfilled') setProducts(extractList(productsResult.value.data, ['productos']));
    else if (salesResult.status === 'fulfilled') setError(`No se pudieron consultar los productos para registrar nuevas ventas: ${errorMessage(productsResult.reason)}`);
    if (businessResult.status === 'fulfilled') {
      const business = businessResult.value.data?.protagonista ?? businessResult.value.data?.negocio ?? businessResult.value.data;
      setBusinessVerified(Boolean(business?.estado_verificacion));
    } else setBusinessVerified(null);
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const availableProducts = useMemo(() => products.filter((product) => product.estado === 'Activo' && Number(product.stock_actual) > 0), [products]);
  const registeredTotal = useMemo(() => sales.filter((sale) => sale.estado === 'Registrada').reduce((sum, sale) => sum + Number(sale.total || 0), 0), [sales]);

  function updateForm(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function updateLine(index, field, value) {
    setForm((current) => ({ ...current, detalles: current.detalles.map((line, i) => i === index ? { ...line, [field]: value } : line) }));
  }
  function addLine() {
    if (form.detalles.length < 30) setForm((current) => ({ ...current, detalles: [...current.detalles, newLine()] }));
  }
  function removeLine(index) {
    setForm((current) => ({ ...current, detalles: current.detalles.filter((_, i) => i !== index) }));
  }

  const submitSale = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(''); setError('');
    const details = form.detalles.map((line) => ({ id_producto: Number(line.id_producto), cantidad: Number(line.cantidad) }));
    if (!details.length || details.some((line) => !Number.isInteger(line.id_producto) || line.id_producto <= 0 || !Number.isInteger(line.cantidad) || line.cantidad <= 0)) {
      setError('Selecciona un producto y una cantidad válida en cada línea.'); setSaving(false); return;
    }
    if (new Set(details.map((line) => line.id_producto)).size !== details.length) {
      setError('Cada producto debe aparecer una sola vez. Cambia la cantidad en la línea correspondiente.'); setSaving(false); return;
    }
    for (const line of details) {
      const product = availableProducts.find((item) => Number(item.id_producto) === line.id_producto);
      if (!product) { setError('Una de las publicaciones ya no está activa o no tiene existencias. Actualiza la lista.'); setSaving(false); return; }
      if (line.cantidad > Number(product.stock_actual)) { setError(`La cantidad solicitada para «${product.nombre_producto}» supera las existencias (${product.stock_actual}).`); setSaving(false); return; }
    }
    try {
      const response = await salesService.createSale({
        detalles: details,
        comprador_email: form.comprador_email.trim() || undefined,
        metodo_pago: form.metodo_pago,
        metodo_entrega: form.metodo_entrega,
        observaciones: form.observaciones.trim() || undefined
      });
      setNotice(response.data?.mensaje || 'Venta registrada correctamente.');
      setForm(blankForm()); setFormOpen(false); setDetail(null);
      await reload();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  };

  const viewSale = async (sale) => {
    setDetail(null); setDetailError(''); setDetailLoading(true);
    try { const response = await salesService.getSale(sale.id_venta); setDetail(response.data); }
    catch (requestError) { setDetailError(errorMessage(requestError)); }
    finally { setDetailLoading(false); }
  };
  const cancelSale = async (sale) => {
    if (!window.confirm(`¿Anular el registro de la venta #${sale.id_venta}? Úsalo solo para corregir una operación que no se concretó o que fue registrada por error. Se restaurará el inventario; esto no registra una devolución ni reembolsa dinero.`)) return;
    setError(''); setNotice('');
    try { const response = await salesService.cancelSale(sale.id_venta); setNotice(response.data?.mensaje || 'Venta anulada.'); if (detail?.venta?.id_venta === sale.id_venta) setDetail(null); await reload(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  };

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">OPERACIONES COMERCIALES</div><h1>Mis <span>ventas.</span></h1><p>Registra las ventas ya acordadas con tus compradores y consulta su historial. Este módulo no procesa pagos en línea.</p></div><button type="button" className="button button-primary" onClick={() => { setFormOpen((open) => !open); setError(''); setNotice(''); }} disabled={!availableProducts.length || businessVerified !== true}><Plus size={17} /> {formOpen ? 'Cerrar formulario' : 'Registrar venta'}</button></div>
    {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
    {error && <Alert type="warning">{error}</Alert>}
    {businessVerified === false && <Alert type="info">Tu perfil de protagonista debe estar verificado para registrar ventas. Contacta al administrador si todavía está pendiente.</Alert>}
    {businessVerified === null && !loading && <Alert type="warning">No pudimos confirmar la verificación del negocio. Actualiza los datos antes de registrar una venta.</Alert>}
    {businessVerified === true && !loading && products.length > 0 && availableProducts.length === 0 && <Alert type="info">No hay productos activos con existencias disponibles. Activa un producto y revisa su inventario antes de registrar una venta.</Alert>}
    <div className="sale-stats-grid"><div className="dashboard-stat"><span className="stat-icon stat-blue"><ClipboardList size={21} /></span><span className="stat-caption">OPERACIONES REGISTRADAS</span><strong>{loading ? '—' : sales.length}</strong><small>Últimas ventas del negocio</small></div><div className="dashboard-stat"><span className="stat-icon stat-green"><ShoppingBag size={21} /></span><span className="stat-caption">VENTAS ACTIVAS</span><strong>{loading ? '—' : sales.filter((sale) => sale.estado === 'Registrada').length}</strong><small>Operaciones no anuladas</small></div><div className="dashboard-stat"><span className="stat-icon stat-pink"><BadgeCheck size={21} /></span><span className="stat-caption">TOTAL REGISTRADO</span><strong>{loading ? '—' : currency(registeredTotal)}</strong><small>Suma de ventas no anuladas; no equivale a utilidad neta</small></div></div>

    {formOpen && <section className="dashboard-panel sale-form-panel"><div className="dashboard-panel-heading"><div><h2>Registrar una venta concretada</h2><p>Las existencias se descuentan al guardar. El vendedor registra una operación previamente acordada.</p></div><button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Cerrar formulario"><X size={18} /></button></div>
      {!availableProducts.length ? <Alert type="info">No hay productos activos con existencias disponibles para vender.</Alert> : <form className="sale-form" onSubmit={submitSale}>
        <div className="sale-form-section"><h3>Productos de la operación</h3><p>Agrega entre 1 y 30 productos. Cada producto aparece una sola vez por venta.</p></div>
        {form.detalles.map((line, index) => <div className="sale-line-row" key={`line-${index}`}>
          <label className="sale-field sale-product-field"><span>Producto</span><select required value={line.id_producto} onChange={(event) => updateLine(index, 'id_producto', event.target.value)}><option value="">Selecciona un producto</option>{availableProducts.map((product) => <option key={product.id_producto} value={product.id_producto} disabled={form.detalles.some((other, otherIndex) => otherIndex !== index && Number(other.id_producto) === Number(product.id_producto))}>{product.nombre_producto} · stock {product.stock_actual} · {currency(product.precio)}</option>)}</select></label>
          <label className="sale-field sale-quantity-field"><span>Cantidad</span><input required type="number" min="1" max={availableProducts.find((product) => Number(product.id_producto) === Number(line.id_producto))?.stock_actual || 1000000} value={line.cantidad} onChange={(event) => updateLine(index, 'cantidad', event.target.value)} /></label>
          <button className="icon-button sale-remove-line" type="button" onClick={() => removeLine(index)} disabled={form.detalles.length === 1} aria-label={`Eliminar línea ${index + 1}`} title="Eliminar línea"><X size={16} /></button>
        </div>)}
        <button type="button" className="button button-outline button-small" onClick={addLine} disabled={form.detalles.length >= 30}>+ Agregar producto</button>
        <div className="sale-form-grid">
          <label className="sale-field"><span>Correo del comprador (opcional)</span><input type="email" maxLength="254" value={form.comprador_email} onChange={(event) => updateForm('comprador_email', event.target.value)} placeholder="comprador@ejemplo.com"/><small>Debe pertenecer a una cuenta Cliente o Protagonista. Solo vincula la venta con su historial; no confirma ni procesa un pago.</small></label>
          <label className="sale-field"><span>Forma de pago</span><select value={form.metodo_pago} onChange={(event) => updateForm('metodo_pago', event.target.value)}><option>Por acordar</option><option>Efectivo</option><option>Transferencia</option><option>Otro acuerdo</option></select></label>
          <label className="sale-field"><span>Entrega</span><select value={form.metodo_entrega} onChange={(event) => updateForm('metodo_entrega', event.target.value)}><option>Por coordinar</option><option>Entrega presencial</option><option>Entrega coordinada</option><option>Otro acuerdo</option></select></label>
          <label className="sale-field"><span>Observaciones (opcional)</span><textarea rows="3" maxLength="500" value={form.observaciones} onChange={(event) => updateForm('observaciones', event.target.value)} placeholder="Referencia breve de la operación" /></label>
        </div>
        <div className="sale-form-actions"><span className="muted-note">El total se calcula con el precio actual de cada producto. Al anular se restaurará el stock una sola vez.</span><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Guardando venta…' : 'Guardar venta'}</button></div>
      </form>}
    </section>}

    {detailError && <Alert type="warning">No se pudo abrir el detalle: {detailError}</Alert>}
    {detailLoading && <Loader label="Consultando detalle de la venta…" />}
    {detail && <SaleDetailsPanel data={detail} onClose={() => setDetail(null)} />}
    <div className="dashboard-panel-heading sale-history-heading"><div><h2>Historial de ventas</h2><p>Las operaciones anuladas se conservan como historial y no se cuentan en el total activo.</p></div><button type="button" className="button button-outline button-small" onClick={reload} disabled={loading}><RefreshCw size={14} /> Actualizar</button></div>
    {loading ? <Loader label="Consultando historial de ventas…" /> : error && !sales.length ? <EmptyState title="No pudimos consultar el historial" description="Comprueba la conexión con el backend y SQL Server." action={<button type="button" className="button button-outline" onClick={reload}>Reintentar</button>} /> : sales.length ? <SalesTable sales={sales} onView={viewSale} onCancel={cancelSale} showBuyer /> : <EmptyState title="Todavía no has registrado ventas" description="Una vez acordada una operación con un comprador, regístrala aquí para actualizar existencias y mantener el historial comercial." icon="compass" />}
  </div>;
}
