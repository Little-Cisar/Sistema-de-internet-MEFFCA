import { Eye, XCircle } from 'lucide-react';
import { currency, formatDate } from '../utils/apiHelpers';

export default function SalesTable({ sales = [], onView, onCancel, showBuyer = false, showSeller = false }) {
  if (!sales.length) return null;
  return <div className="dashboard-panel table-panel">
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr>
          <th>Operación</th><th>Fecha</th>{showSeller && <th>Emprendimiento</th>}{showBuyer && <th>Comprador vinculado</th>}
          <th>Unidades</th><th>Total</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody>{sales.map((sale) => <tr key={sale.id_venta}>
          <td>#{sale.id_venta}</td>
          <td>{formatDate(sale.fecha_venta)}</td>
          {showSeller && <td>{sale.nombre_negocio || 'Emprendimiento'}</td>}
          {showBuyer && <td>{sale.correo_comprador || 'Sin vincular'}</td>}
          <td>{Number(sale.unidades ?? 0)}</td>
          <td>{currency(sale.total)}</td>
          <td><span className={`status-pill ${sale.estado === 'Registrada' ? 'status-active' : 'status-inactive'}`}>{sale.estado}</span></td>
          <td><div className="sale-actions"><button type="button" className="button button-outline button-small" onClick={() => onView(sale)}><Eye size={14} /> Detalle</button>{onCancel && sale.estado === 'Registrada' && <button type="button" className="button button-danger button-small" onClick={() => onCancel(sale)}><XCircle size={14} /> Anular</button>}</div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
