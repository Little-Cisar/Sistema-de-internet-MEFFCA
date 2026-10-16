import { X } from 'lucide-react';
import { currency, formatDate } from '../utils/apiHelpers';

export default function SaleDetailsPanel({ data, onClose }) {
  if (!data) return null;
  const sale = data.venta || {};
  const details = Array.isArray(data.detalles) ? data.detalles : [];
  return <section className="dashboard-panel sale-detail-panel" aria-label={`Detalle de operación ${sale.id_venta}`}>
    <div className="dashboard-panel-heading"><div><h2>Detalle de la operación #{sale.id_venta}</h2><p>{sale.nombre_negocio || 'Emprendimiento'} · {formatDate(sale.fecha_venta)}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle"><X size={18} /></button></div>
    <div className="sale-detail-meta"><span><strong>Estado:</strong> {sale.estado}</span><span><strong>Pago:</strong> {sale.metodo_pago || 'No especificado'}</span><span><strong>Entrega:</strong> {sale.metodo_entrega || 'No especificada'}</span>{sale.correo_comprador && <span><strong>Comprador:</strong> {sale.correo_comprador}</span>}</div>
    {sale.observaciones && <p className="sale-observations"><strong>Observaciones:</strong> {sale.observaciones}</p>}
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{details.map((item) => <tr key={item.id_detalle_venta}><td>{item.nombre_producto}</td><td>{item.cantidad}</td><td>{currency(item.precio_unitario)}</td><td>{currency(item.subtotal)}</td></tr>)}</tbody></table></div>
    <div className="sale-total-row"><span>Total de la operación</span><strong>{currency(sale.total)}</strong></div>
  </section>;
}
