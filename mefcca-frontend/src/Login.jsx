import React from 'react';
import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
      <div className="login-box" style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#004b87', marginBottom: '0.5rem' }}>MEFCCA <span style={{ color: '#e4007c' }}>Digital</span></h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>Ingresa con tu cuenta de protagonista</p>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Correo Electrónico" style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Contraseña" style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          
          {/* Este botón simula el login exitoso llevándote al panel */}
          <Link to="/dashboard" className="btn-login" style={{ marginTop: '1rem', textDecoration: 'none', display: 'block' }}>
            Ingresar al Sistema
          </Link>
        </form>
        
        <Link to="/" style={{ display: 'block', marginTop: '1.5rem', color: '#004b87', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver al Catálogo Público
        </Link>
      </div>
    </div>
  );
}

export default Login;