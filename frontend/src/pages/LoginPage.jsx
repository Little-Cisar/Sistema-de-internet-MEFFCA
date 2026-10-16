import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { errorMessage, rolePath } from '../utils/apiHelpers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      const response = await login({ email: email.trim(), password });
      navigate(location.state?.from || rolePath(response.usuario?.rol), { replace: true });
    } catch (requestError) { setError(errorMessage(requestError, requestError.message || 'No fue posible iniciar sesión.')); }
    finally { setSubmitting(false); }
  };

  return <div className="auth-page"><div className="site-container auth-grid">
    <div className="auth-story"><Link to="/" className="back-link auth-back"><ArrowLeft size={17} /> Volver al mercado</Link><div className="auth-story-content"><span className="auth-story-symbol"><LockKeyhole size={24} /></span><div className="eyebrow">QUÉ BUENO TENERTE DE VUELTA</div><h1>Tu próximo paso<br /><span>empieza aquí.</span></h1><p>Entra a tu espacio para seguir descubriendo, publicando y conectando con la comunidad de emprendimientos.</p><div className="auth-story-note"><ShieldCheck size={19} /><span><strong>Tu cuenta, tu espacio.</strong><small>El acceso depende del rol asignado a tu usuario.</small></span></div></div><span className="auth-story-footer">MANOS DE NICARAGUA · MERCADO CON IDENTIDAD</span></div>
    <div className="auth-form-wrap"><div className="auth-form-card"><div className="auth-form-heading"><div className="eyebrow">INICIAR SESIÓN</div><h2>Qué gusto verte.</h2><p>Ingresa los datos de tu cuenta para continuar.</p></div>{error && <Alert type="error">{error}</Alert>}
      <form onSubmit={onSubmit} className="form-stack">
        <div className="form-field"><label htmlFor="login-email">Correo electrónico</label><div className="input-with-icon"><Mail size={18} /><input id="login-email" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div></div>
        <div className="form-field"><div className="label-row"><label htmlFor="login-password">Contraseña</label></div><div className="input-with-icon"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} /><button type="button" className="input-action" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
        <button type="submit" className="button button-primary button-full button-large" disabled={submitting}>{submitting ? 'Validando…' : 'Entrar a mi cuenta'} <ArrowRight size={18} /></button>
      </form>
      <div className="auth-form-divider"><span />o<span /></div><p className="auth-switch">¿Todavía no tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p><p className="auth-smallprint">La autenticación y los permisos se validan en el backend. El frontend no permite crear cuentas administrativas.</p>
    </div></div>
  </div></div>;
}
