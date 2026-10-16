import { useEffect, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, MapPin, Phone, Save } from 'lucide-react';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { catalogService } from '../services/catalogService';
import { errorMessage } from '../utils/apiHelpers';

const emptyForm = { nombre_negocio: '', telefono_whatsapp: '', departamento: '', descripcion_negocio: '' };

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    catalogService.getMyBusiness()
      .then((response) => {
        const business = response.data?.protagonista ?? response.data?.negocio ?? response.data;
        if (!business?.id_protagonista) {
          throw new Error('La API respondió, pero no devolvió el perfil del protagonista.');
        }
        if (!active) return;
        setProfile(business);
        setForm({
          nombre_negocio: business.nombre_negocio || '',
          telefono_whatsapp: business.telefono_whatsapp || '',
          departamento: business.departamento || '',
          descripcion_negocio: business.descripcion_negocio || ''
        });
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const onChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!profile?.id_protagonista) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await catalogService.updateBusiness(profile.id_protagonista, {
        ...form,
        nombre_negocio: form.nombre_negocio.trim(),
        telefono_whatsapp: form.telefono_whatsapp.trim(),
        departamento: form.departamento.trim(),
        descripcion_negocio: form.descripcion_negocio.trim() || null
      });
      const updated = response.data?.protagonista;
      if (updated) setProfile(updated);
      setNotice('Perfil del emprendimiento actualizado correctamente.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow">IDENTIDAD DE TU NEGOCIO</div><h1>Tu perfil, <span>tu historia.</span></h1><p>Comparte información clara para que las personas conozcan tu emprendimiento.</p></div></div>
    {loading ? <Loader label="Cargando perfil del emprendimiento…" /> : <>
      {error && <Alert type="warning">{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}
      {!profile ? <EmptyState title="No pudimos cargar tu perfil" description="Comprueba que iniciaste sesión con una cuenta Protagonista y que el backend actualizado está ejecutándose." icon="store" /> : <div className="dashboard-panel business-edit-panel">
        <div className="business-edit-banner"><span className="business-edit-icon"><BriefcaseBusiness size={23} /></span><div><h2>{profile.nombre_negocio}</h2><p>{profile.estado_verificacion ? <><BadgeCheck size={15} /> Perfil verificado institucionalmente</> : 'Perfil pendiente de verificación institucional. Puedes actualizar tus datos, pero no publicar hasta que se apruebe.'}</p></div></div>
        <form onSubmit={submit} className="form-stack">
          <div className="form-two-columns"><div className="form-field"><label htmlFor="profile-business-name">Nombre del emprendimiento</label><input className="plain-input" id="profile-business-name" name="nombre_negocio" value={form.nombre_negocio} onChange={onChange} required minLength={2} maxLength={100} /></div><div className="form-field"><label htmlFor="profile-phone">WhatsApp de contacto</label><div className="input-with-icon"><Phone size={17} /><input id="profile-phone" name="telefono_whatsapp" value={form.telefono_whatsapp} onChange={onChange} required minLength={8} maxLength={20} /></div></div></div>
          <div className="form-field"><label htmlFor="profile-department">Departamento</label><div className="input-with-icon"><MapPin size={17} /><input id="profile-department" name="departamento" value={form.departamento} onChange={onChange} required minLength={2} maxLength={50} /></div></div>
          <div className="form-field"><label htmlFor="profile-description">Descripción del emprendimiento</label><textarea id="profile-description" className="plain-input" name="descripcion_negocio" value={form.descripcion_negocio} onChange={onChange} rows={5} maxLength={4000} placeholder="Qué elaboras, cómo trabajas y qué te gustaría que conocieran…" /></div>
          <div className="form-actions"><button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'} <Save size={17} /></button></div>
        </form>
      </div>}
    </>}
  </div>;
}
