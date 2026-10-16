import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, Shapes } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { catalogService } from '../services/catalogService';
import { errorMessage, extractList } from '../utils/apiHelpers';

const emptyForm = { nombre_categoria: '', descripcion: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await catalogService.getCategories(); setCategories(extractList(response.data, ['categorias', 'categories'])); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const startCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); setNotice(''); };
  const startEdit = (item) => { setEditing(item); setForm({ nombre_categoria: item.nombre_categoria || item.nombre || '', descripcion: item.descripcion || '' }); setOpen(true); setNotice(''); };
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { if (editing) await catalogService.updateCategory(editing.id_categoria ?? editing.id, form); else await catalogService.createCategory(form); setOpen(false); setNotice('Categoría guardada correctamente.'); await reload(); } catch (requestError) { setError(errorMessage(requestError)); } finally { setSaving(false); } };

  return <div className="dashboard-page"><div className="dashboard-welcome"><div><div className="eyebrow">ORGANIZACIÓN DEL CATÁLOGO</div><h1>Las <span>categorías.</span></h1><p>Mantén una clasificación clara para que los usuarios descubran mejor los productos.</p></div><button className="button button-primary" onClick={startCreate}><Plus size={17} /> Nueva categoría</button></div>
    {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}{error && <Alert type="warning">{error}</Alert>}
    {loading ? <Loader label="Cargando categorías…" /> : categories.length ? <div className="admin-category-grid">{categories.map((category, index) => <article className="admin-category-card" key={category.id_categoria ?? category.id ?? index}><span className={`admin-category-symbol category-symbol-${index % 5}`}><Shapes size={24} /></span><div className="admin-category-card-text"><strong>{category.nombre_categoria ?? category.nombre}</strong><p>{category.descripcion || 'Sin descripción adicional.'}</p><small>ID: {category.id_categoria ?? category.id}</small></div><button className="icon-button" onClick={() => startEdit(category)} aria-label={`Editar categoría ${category.nombre_categoria ?? category.nombre}`}><Edit3 size={17} /></button></article>)}</div> : <EmptyState title="No hay categorías disponibles" description="Las categorías se consultan desde SQL Server. Verifica que MEFCCA_DB tenga categorías iniciales y vuelve a cargar la consulta." icon="compass" action={<button className="button button-outline" onClick={reload}>Volver a consultar</button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'}><form className="form-stack" onSubmit={submit}><div className="form-field"><label htmlFor="category-name">Nombre de la categoría</label><input className="plain-input" id="category-name" value={form.nombre_categoria} onChange={(event) => setForm({ ...form, nombre_categoria: event.target.value })} required minLength={2} maxLength={50} /></div><div className="form-field"><label htmlFor="category-description">Descripción <span className="optional-label">Opcional</span></label><textarea id="category-description" className="plain-input" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} rows={3} /></div><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar categoría'}</button></div></form></Modal>
  </div>;
}
