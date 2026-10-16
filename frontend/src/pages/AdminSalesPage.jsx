import { useCallback, useEffect, useState } from 'react';
import { Activity, Banknote, Ban, CalendarDays, ClipboardList, PackageSearch, RefreshCw } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import SalesTable from '../components/SalesTable';
import SaleDetailsPanel from '../components/SaleDetailsPanel';
import { salesService } from '../services/salesService';
import { currency, errorMessage, extractList } from '../utils/apiHelpers';

function Stat({ icon: Icon, tone, label, value, detail }) {
  return <div className="dashboard-stat"><span className={`stat-icon ${tone}`}><Icon size={21} /></span><span className="stat-caption">{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    const [salesResult, reportResult] = await Promise.allSettled([salesService.getAllSales(), salesService.getSalesReport()]);
    if (salesResult.status === 'fulfilled') setSales(extractList(salesResult.value.data, ['ventas']));
    else { setError(errorMessage(salesResult.reason)); setSales([]); }
    if (reportResult.status === 'fulfilled') { setReport(reportResult.value.data); setReportError(''); }
    else { setReport(null); setReportError(errorMessage(reportResult.reason)); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const viewSale = async (sale) => {
    setDetail(null); setDetailError(''); setDetailLoading(true);
    try { const response = await salesService.getSale(sale.id_venta); setDetail(response.data); }
    catch (requestError) { setDetailError(errorMessage(requestError)); }
    finally { setDetailLoading(false); }
  };

  const cancelSale = async (sale) => {
    if (!window.confirm(`¿Anular el registro de la venta #${sale.id_venta}? Úsalo solo para corregir una operación que no se concretó o que fue registrada por error. Se restaurará el inventario; esto no registra una devolución ni reembolsa dinero.`)) return;
    setError(''); setNotice('');
    try {
      const response = await salesService.cancelSale(sale.id_venta);
      setNotice(response.data?.mensaje || 'Registro de venta anulado y existencias restauradas.');
      if (detail?.venta?.id_venta === sale.id_venta) setDetail(null);
      await reload();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  const summary = report?.resumen || {};
  const topProducts = Array.isArray(report?.productos_mas_vendidos) ? report.productos_mas_vendidos : [];

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">CONTROL COMERCIAL</div><h1>Operaciones <span>registradas.</span></h1><p>Consulta las ventas registradas por los emprendimientos, su estado y el detalle de los productos.</p></div><button type="button" className="button button-outline" onClick={reload} disabled={loading}><RefreshCw size={16} /> Actualizar</button></div>
    {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
    {error && <Alert type="warning">{error}</Alert>}
    {detailError && <Alert type="warning">No se pudo abrir el detalle: {detailError}</Alert>}
    {detailLoading && <Loader label="Consultando detalle de la operación…" />}
    {detail && <SaleDetailsPanel data={detail} onClose={() => setDetail(null)} />}
    {reportError && <Alert type="warning">No se pudo cargar el resumen de ventas: {reportError}</Alert>}
    {!reportError && report && <div className="sale-stats-grid">
      <Stat icon={Activity} tone="stat-blue" label="OPERACIONES TOTALES" value={Number(summary.total_operaciones ?? 0)} detail="Incluye operaciones anuladas" />
      <Stat icon={ClipboardList} tone="stat-green" label="VENTAS REGISTRADAS" value={Number(summary.ventas_registradas ?? 0)} detail="Operaciones no anuladas" />
      <Stat icon={Ban} tone="stat-pink" label="VENTAS ANULADAS" value={Number(summary.ventas_anuladas ?? 0)} detail="Se conservan en el historial" />
      <Stat icon={Banknote} tone="stat-violet" label="IMPORTE REGISTRADO" value={currency(summary.importe_registrado)} detail="No equivale a utilidad neta" />
      <Stat icon={CalendarDays} tone="stat-blue" label="VENTAS DE HOY" value={Number(summary.ventas_hoy ?? 0)} detail="Según fecha del servidor" />
    </div>}
    {topProducts.length > 0 && <section className="dashboard-panel table-panel"><div className="dashboard-panel-heading"><div><h2>Productos más vendidos</h2><p>Las operaciones anuladas no se incluyen.</p></div><PackageSearch size={20} /></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Producto</th><th>Unidades</th><th>Operaciones</th><th>Importe</th></tr></thead><tbody>{topProducts.map((product) => <tr key={product.id_producto}><td>{product.nombre_producto}</td><td>{Number(product.unidades_vendidas)}</td><td>{Number(product.operaciones)}</td><td>{currency(product.importe_registrado)}</td></tr>)}</tbody></table></div></section>}
    <div className="dashboard-panel-heading sale-history-heading"><div><h2>Historial general</h2><p>Se muestran como máximo las últimas 200 operaciones.</p></div></div>
    {loading ? <Loader label="Consultando operaciones comerciales…" /> : error ? <EmptyState title="No se pudieron consultar las operaciones" description="Comprueba que el backend esté actualizado y que la sesión administrativa sea válida." action={<button type="button" className="button button-outline" onClick={reload}>Reintentar</button>} /> : sales.length ? <SalesTable sales={sales} onView={viewSale} onCancel={cancelSale} showSeller showBuyer /> : <EmptyState title="No hay operaciones registradas" description="Cuando los protagonistas registren ventas concretadas, aparecerán aquí para su consulta administrativa." icon="clipboard-list" />}
    <div className="security-note"><ClipboardList size={19} /><p><strong>Alcance del módulo:</strong> estas estadísticas resumen operaciones registradas; no prueban recepción de pago ni equivalen a utilidad neta. El administrador puede consultar las operaciones de la plataforma.</p></div>
  </div>;
}
