import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">
          <h1>MEFCCA <span>Mi Panel</span></h1>
        </div>
        <div className="nav-links">
          <Link to="/">Ver Catálogo Público</Link>
          <Link to="/" className="btn-login" style={{ backgroundColor: '#dc3545' }}>Cerrar Sesión</Link>
        </div>
      </nav>

      <main style={{ padding: '2rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#004b87' }}>Mis Productos Registrados</h2>
          <p>Gestiona tu inventario para el catálogo en línea.</p>
        </header>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h3 style={{ color: '#e4007c', marginBottom: '1rem' }}>Registrar Nuevo Producto</h3>
          <form style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Nombre del producto..." style={{ flex: '1 1 250px', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="number" placeholder="Precio C$" style={{ flex: '1 1 100px', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            <select style={{ flex: '1 1 200px', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">Selecciona Categoría</option>
              <option value="Agroindustria">Agroindustria</option>
              <option value="Artesanías">Artesanías</option>
              <option value="Alimentos">Alimentos</option>
            </select>
            <button type="button" className="btn-login" style={{ flex: '1 1 150px', cursor: 'pointer', border: 'none' }}>
              Guardar Producto
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;