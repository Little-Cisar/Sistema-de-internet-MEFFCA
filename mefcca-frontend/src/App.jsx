import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';
import Buscar from './Buscar'; // Importamos la nueva pantalla

function Catalogo() {
  const productos = [
    { id: 1, nombre: "Café Orgánico de Altura", precio: "150.00", categoria: "Agroindustria", imagen: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=300&q=80" },
    { id: 2, nombre: "Miel de Abeja Pura", precio: "120.00", categoria: "Alimentos", imagen: "https://images.unsplash.com/photo-1587049352847-4d4554b7c631?auto=format&fit=crop&w=300&q=80" },
    { id: 3, nombre: "Jarrones de Barro Artesanal", precio: "350.00", categoria: "Artesanías", imagen: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80" },
    { id: 4, nombre: "Cacao Tostado", precio: "80.00", categoria: "Agroindustria", imagen: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=300&q=80" }
  ];

  // Función para abrir WhatsApp real
  const contactarWhatsApp = (nombreProducto) => {
    // Número simulado de Nicaragua (puedes poner el tuyo para probar)
    const telefono = "50588888888"; 
    const mensaje = `Hola, estoy interesado en el producto: ${nombreProducto} que vi en el catálogo digital del MEFCCA.`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank'); // Abre una nueva pestaña
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <h1>MEFCCA <span>Digital</span></h1>
        </div>
        <div className="nav-links">
          <Link to="/" className="active">Catálogo</Link>
          <Link to="/buscar">Buscar</Link> {/* Arreglamos este enlace */}
          <Link to="/login" className="btn-login">Iniciar Sesión</Link>
        </div>
      </nav>

      <main className="catalogo-container">
        <header className="catalogo-header">
          <h2>Catálogo General de Productos</h2>
          <p>Apoya a nuestros protagonistas de la economía familiar.</p>
        </header>

        <div className="grid-productos">
          {productos.map(producto => (
            <div key={producto.id} className="tarjeta-producto">
              <img src={producto.imagen} alt={producto.nombre} className="producto-img" />
              <div className="producto-info">
                <span className="categoria-badge">{producto.categoria}</span>
                <h3>{producto.nombre}</h3>
                <p className="precio">C$ {producto.precio}</p>
                {/* Le agregamos el evento onClick al botón */}
                <button 
                  className="btn-whatsapp" 
                  onClick={() => contactarWhatsApp(producto.nombre)}
                >
                  Contactar por WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/buscar" element={<Buscar />} /> {/* Añadimos la ruta */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;