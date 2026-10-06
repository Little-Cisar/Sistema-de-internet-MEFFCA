import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Buscar() {
  const [busqueda, setBusqueda] = useState('');
  
  // La misma lista de productos simulada
  const productos = [
    { id: 1, nombre: "Café Orgánico de Altura", precio: "150.00", categoria: "Agroindustria", imagen: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=300&q=80" },
    { id: 2, nombre: "Miel de Abeja Pura", precio: "120.00", categoria: "Alimentos", imagen: "https://images.unsplash.com/photo-1587049352847-4d4554b7c631?auto=format&fit=crop&w=300&q=80" },
    { id: 3, nombre: "Jarrones de Barro Artesanal", precio: "350.00", categoria: "Artesanías", imagen: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80" },
    { id: 4, nombre: "Cacao Tostado", precio: "80.00", categoria: "Agroindustria", imagen: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=300&q=80" }
  ];

  // Filtramos los productos según lo que escriba el usuario
  const resultados = productos.filter(prod => 
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <h1>MEFCCA <span>Digital</span></h1>
        </div>
        <div className="nav-links">
          <Link to="/">Catálogo</Link>
          <Link to="/buscar" className="active">Buscar</Link>
          <Link to="/login" className="btn-login">Iniciar Sesión</Link>
        </div>
      </nav>

      <main style={{ padding: '2rem 5%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#004b87', marginBottom: '1rem' }}>Buscador de Productos</h2>
        <input 
          type="text" 
          placeholder="Ej. Café, Miel, Barro..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ padding: '1rem', width: '100%', maxWidth: '500px', borderRadius: '25px', border: '2px solid #004b87', fontSize: '1.1rem', marginBottom: '2rem' }}
        />

        <div className="grid-productos">
          {resultados.length > 0 ? (
            resultados.map(producto => (
              <div key={producto.id} className="tarjeta-producto">
                <img src={producto.imagen} alt={producto.nombre} className="producto-img" />
                <div className="producto-info">
                  <span className="categoria-badge">{producto.categoria}</span>
                  <h3>{producto.nombre}</h3>
                  <p className="precio">C$ {producto.precio}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ gridColumn: '1 / -1', color: '#666', fontSize: '1.2rem' }}>No se encontraron productos con ese nombre.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Buscar;