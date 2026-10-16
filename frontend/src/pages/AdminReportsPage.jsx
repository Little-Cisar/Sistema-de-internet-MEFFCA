import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, CalendarDays, MousePointerClick, PackageSearch, RefreshCw } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { catalogService } from '../services/catalogService';
import { errorMessage } from '../utils/apiHelpers';

function Stat({ icon: Icon, label, value, detail, tone }) {
  return <div className="dashboard-stat">
    <span className={`stat-icon ${tone}`}><Icon size={22} /></span>
    <span className="stat-caption">{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>;
}

export default function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await catalogService.getInteractionReport();
      setReport(response.data?.reporte ?? response.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  const summary = report?.resumen ?? {};
  const rows = Array.isArray(report?.interacciones) ? report.interacciones : (Array.isArray(report) ? report : report?.resultados ?? []);
  const topProducts = Array.isArray(report?.productos_mas_contactados) ? report.productos_mas_contactados : [];

  return <div className="dashboard-page">
    <div className="dashboard-welcome">
      <div><div className="eyebrow">ACTIVIDAD DEL MERCADO</div><h1>Reportes e <span>interacciones.</span></h1><p>Consulta los clics de contacto que registra la plataforma y los productos que despiertan mayor interés.</p></div>
      <button type="button" className="button button-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> {loading ? 'Actualizando…' : 'Actualizar reporte'}</button>
    </div>

    {error && <Alert type="warning">{error}</Alert>}
    {loading ? <Loader label="Consultando interacciones registradas…" /> : !error && <>
      <div className="dashboard-stat-grid">
        <Stat icon={Activity} tone="stat-blue" label="INTERACCIONES REGISTRADAS" value={summary.total_interacciones ?? 0} detail="Historial total almacenado" />
        <Stat icon={MousePointerClick} tone="stat-pink" label="CLICS EN WHATSAPP" value={summary.clics_whatsapp ?? 0} detail="Acciones de contacto registradas" />
        <Stat icon={CalendarDays} tone="stat-green" label="INTERACCIONES HOY" value={summary.interacciones_hoy ?? 0} detail="Según fecha y hora del servidor" />
        <Stat icon={PackageSearch} tone="stat-violet" label="PRODUCTOS CON ACTIVIDAD" value={summary.productos_con_interacciones ?? 0} detail="Publicaciones que recibieron clics" />
      </div>

      {topProducts.length > 0 && <section className="dashboard-panel table-panel">
        <div className="dashboard-panel-heading"><div><h2>Productos con más interacciones</h2><p>Clasificados por el número de eventos registrados.</p></div></div>
        <table className="data-table"><thead><tr><th>Producto</th><th>Interacciones</th><th>Clics en WhatsApp</th></tr></thead><tbody>
          {topProducts.map((product) => <tr key={product.id_producto}><td>{product.nombre_producto}</td><td>{product.total_interacciones}</td><td>{product.clics_whatsapp}</td></tr>)}
        </tbody></table>
      </section>}

      {rows.length > 0 ? <section className="dashboard-panel table-panel">
        <div className="dashboard-panel-heading"><div><h2>Actividad reciente</h2><p>Se muestran como máximo las 200 interacciones más recientes.</p></div><span className="result-count">{rows.length} registros</span></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Producto</th><th>Emprendimiento</th><th>Categoría</th><th>Acción</th><th>Fecha</th><th>Usuario</th></tr></thead><tbody>
          {rows.map((row, index) => <tr key={row.id_interaccion ?? index}><td>{row.nombre_producto ?? row.id_producto ?? '—'}</td><td>{row.nombre_negocio ?? '—'}</td><td>{row.nombre_categoria ?? '—'}</td><td>{row.tipo_accion ?? '—'}</td><td>{row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-NI') : '—'}</td><td>{row.email ?? (row.id_usuario ? `Usuario ${row.id_usuario}` : 'Visitante')}</td></tr>)}
        </tbody></table></div>
      </section> : <EmptyState title="Todavía no hay interacciones registradas" description="Cuando una persona abra un producto publicado y pulse Contactar por WhatsApp, la plataforma registrará el evento y este reporte se actualizará." icon="compass" />}
    </>}

    <div className="report-meaning-grid"><div><span className="report-icon pink"><MousePointerClick size={20} /></span><strong>Clics de contacto</strong><p>Los eventos se guardan con el producto, la fecha y el usuario si inició sesión; los visitantes anónimos también se contabilizan.</p></div><div><span className="report-icon blue"><PackageSearch size={20} /></span><strong>Productos consultados</strong><p>El reporte agrupa los clics por producto para reconocer cuáles publicaciones reciben mayor atención.</p></div><div><span className="report-icon green"><CalendarDays size={20} /></span><strong>Actividad temporal</strong><p>El resumen separa las interacciones del día de los eventos históricos.</p></div></div>
  </div>;
}
