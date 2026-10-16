import { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/apiHelpers';

const departments = ['Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Río San Juan', 'Rivas', 'Región Autónoma de la Costa Caribe Norte', 'Región Autónoma de la Costa Caribe Sur'];

export default function RegisterPage() {
  const [role, setRole] = useState('Cliente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('La contraseña es demasiado larga. Utiliza un máximo de 72 bytes.'); return; }
    setSubmitting(true);
    const payload = { email: email.trim(), password, rol: role };
    if (role === 'Protagonista') Object.assign(payload, { nombre_negocio: businessName.trim(), telefono_whatsapp: phone.trim(), departamento: department, descripcion_negocio: description.trim() });
    try {
      const response = await register(payload);
      setSuccess(response.data?.mensaje || 'La cuenta se creó correctamente. Ya puedes iniciar sesión.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (requestError) { setError(errorMessage(requestError, 'No fue posible completar el registro.')); }
    finally { setSubmitting(false); }
  };

  return <div className="auth-page auth-page-register"><div className="site-container auth-grid">
    <div className="auth-story register-story"><Link to="/" className="back-link auth-back"><ArrowLeft size={17} /> Volver al mercado</Link><div className="auth-story-content"><span className="auth-story-symbol"><Leaf size={25} /></span><div className="eyebrow">UNA COMUNIDAD QUE CRECE</div><h1>Hay espacio<br />para <span>lo tuyo.</span></h1><p>Únete para explorar el mercado o darle visibilidad a los productos de tu emprendimiento.</p><div className="auth-benefits"><span><CheckCircle2 size={17} /> Un espacio para descubrir productos</span><span><CheckCircle2 size={17} /> Perfil según el tipo de cuenta</span><span><CheckCircle2 size={17} /> Acceso a las funciones que te corresponden</span></div></div><span className="auth-story-footer">MANOS DE NICARAGUA · HECHO AQUÍ</span></div>
    <div className="auth-form-wrap"><div className="auth-form-card register-card"><div className="auth-form-heading"><div className="eyebrow">CREAR UNA CUENTA</div><h2>Comencemos.</h2><p>Completa los datos para crear tu acceso al mercado.</p></div>{error && <Alert type="error">{error}</Alert>}{success && <Alert type="success">{success}</Alert>}
      <form onSubmit={onSubmit} className="form-stack">
        <fieldset className="role-choice"><legend>¿Cómo quieres participar?</legend><div className="role-choice-grid"><button type="button" className={`role-option ${role === 'Cliente' ? 'selected' : ''}`} onClick={() => setRole('Cliente')} aria-pressed={role === 'Cliente'}><span><UserRound size={21} /></span><strong>Quiero explorar</strong><small>Cuenta de cliente</small></button><button type="button" className={`role-option ${role === 'Protagonista' ? 'selected' : ''}`} onClick={() => setRole('Protagonista')} aria-pressed={role === 'Protagonista'}><span><BriefcaseBusiness size={21} /></span><strong>Tengo un negocio</strong><small>Cuenta protagonista</small></button></div></fieldset>
        <div className="form-field"><label htmlFor="register-email">Correo electrónico</label><div className="input-with-icon"><Mail size={18} /><input id="register-email" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div></div>
        {role === 'Protagonista' && <div className="form-business-fields"><div className="form-field"><label htmlFor="business-name">Nombre del emprendimiento</label><div className="input-with-icon"><BriefcaseBusiness size={18} /><input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ej. Taller de mi comunidad" required minLength={2} maxLength={100} /></div></div><div className="form-two-columns"><div className="form-field"><label htmlFor="business-phone">WhatsApp de contacto</label><div className="input-with-icon"><Phone size={18} /><input id="business-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+505…" required minLength={8} maxLength={20} /></div></div><div className="form-field"><label htmlFor="business-department">Departamento</label><div className="input-with-icon"><MapPin size={18} /><select id="business-department" value={department} onChange={(event) => setDepartment(event.target.value)} required><option value="">Selecciona</option>{departments.map((name) => <option key={name} value={name}>{name}</option>)}</select></div></div></div><div className="form-field"><label htmlFor="business-description">Descripción breve <span className="optional-label">Opcional</span></label><textarea id="business-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Cuéntanos qué hace especial a tu emprendimiento…" rows={3} maxLength={4000} /></div><Alert type="info">Los perfiles protagonistas nuevos quedan pendientes de verificación institucional antes de publicar productos.</Alert></div>}
        <div className="form-two-columns"><div className="form-field"><label htmlFor="register-password">Contraseña</label><div className="input-with-icon"><LockKeyhole size={18} /><input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} /><button type="button" className="input-action" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><div className="form-field"><label htmlFor="register-confirm">Confirmar contraseña</label><div className="input-with-icon"><LockKeyhole size={18} /><input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={72} /></div></div></div>
        <button type="submit" className="button button-primary button-full button-large" disabled={submitting}>{submitting ? 'Creando cuenta…' : 'Crear mi cuenta'} <ArrowRight size={18} /></button>
      </form><p className="auth-switch">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p><p className="auth-smallprint">El sistema no permite crear usuarios administradores desde el registro público.</p>
    </div></div>
  </div></div>;
}
