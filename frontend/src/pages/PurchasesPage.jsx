import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import SalesTable from '../components/SalesTable';
import SaleDetailsPanel from '../components/SaleDetailsPanel';
import { salesService } from '../services/salesService';
import { errorMessage, extractList } from '../utils/apiHelpers';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await salesService.getMyPurchases(); setPurchases(extractList(response.data, ['compras'])); }
    catch (requestError) { setError(errorMessage(requestError)); setPurchases([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const viewPurchase = async (purchase) => {
    setDetail(null); setDetailError(''); setDetailLoading(true);
    try { const response = await salesService.getSale(purchase.id_venta); setDetail(response.data); }
    catch (requestError) { setDetailError(errorMessage(requestError)); }
    finally { setDetailLoading(false); }
  };

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">HISTORIAL PERSONAL</div><h1>Mis <span>compras.</span></h1><p>Consulta las operaciones vinculadas al correo de tu cuenta que un emprendimiento registró después de concretar una venta.</p></div><button type="button" className="button button-outline" onClick={reload} disabled={loading}><RefreshCw size={16} /> Actualizar</button></div>
    {error && <Alert type="warning">{error}</Alert>}
    {detailError && <Alert type="warning">No se pudo abrir el detalle: {detailError}</Alert>}
    {detailLoading && <Loader label="Consultando detalle de la operación…" />}
    {detail && <SaleDetailsPanel data={detail} onClose={() => setDetail(null)} />}
    {loading ? <Loader label="Consultando tus compras…" /> : error ? <EmptyState title="No se pudo consultar tu historial" description="Comprueba la conexión con la API y vuelve a intentarlo." action={<button type="button" className="button button-outline" onClick={reload}>Reintentar</button>} /> : purchases.length ? <SalesTable sales={purchases} onView={viewPurchase} showSeller /> : <EmptyState title="Todavía no hay compras vinculadas" description="Las ventas que un protagonista asocie a tu cuenta aparecerán aquí. Si realizaste una compra, confirma que el emprendedor registró tu correo al guardar la operación." icon="shopping-bag" />}
    <div className="security-note"><ShoppingBag size={19} /><p><strong>Alcance del historial:</strong> esta plataforma registra operaciones comerciales acordadas fuera del sitio. No procesa pagos en línea y las compras solo aparecen si se vinculan a tu cuenta al registrar la venta.</p></div>
  </div>;
}
