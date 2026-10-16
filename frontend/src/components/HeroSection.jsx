import { ArrowRight, ArrowUpRight, HandHeart, Leaf, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

export default function HeroSection({ search, onSearchChange, onSearch }) {
  return <>
    <section className="hero-section">
      <div className="hero-background-shape shape-one" /><div className="hero-background-shape shape-two" />
      <div className="site-container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> EL TALENTO DE NUESTRA TIERRA</div>
          <h1>Lo nuestro tiene<br /><span>mucho que ofrecer.</span></h1>
          <p className="hero-description">Descubre productos hechos con dedicación y conoce a las personas que, con sus manos e ideas, impulsan los emprendimientos de Nicaragua.</p>
          <div className="hero-search"><SearchBar value={search} onChange={onSearchChange} onSubmit={onSearch} placeholder="Busca artesanías, alimentos, textiles…" /></div>
          <div className="hero-cta-row"><Link to="/catalogo" className="button button-primary button-large">Explorar el mercado <ArrowRight size={18} /></Link><Link to="/registro" className="button button-text">Tengo un emprendimiento <ArrowUpRight size={17} /></Link></div>
          <div className="hero-trust-row"><span><ShieldCheck size={16} /> Perfiles con verificación institucional</span><span><HandHeart size={16} /> Apoyo al talento local</span></div>
        </div>
        <div className="hero-art" aria-label="Ilustración decorativa inspirada en el paisaje y la artesanía nicaragüense" role="img">
          <div className="art-sun" /><div className="art-ring ring-a" /><div className="art-ring ring-b" />
          <div className="art-mountain mountain-back" /><div className="art-mountain mountain-front" />
          <div className="art-palm palm-one"><span /><i /><b /></div><div className="art-palm palm-two"><span /><i /><b /></div>
          <div className="art-ribbon ribbon-magenta">Hecho con orgullo</div><div className="art-note"><span className="art-note-icon"><Leaf size={19} /></span><span><strong>Hecho aquí.</strong><small>Con historia y corazón.</small></span></div>
          <div className="art-caption"><span className="caption-dot" /> MANOS QUE CREAN · HISTORIAS QUE INSPIRAN</div>
        </div>
      </div>
      <div className="hero-bottom-line"><span /><span /><span /></div>
    </section>
    <div className="promise-strip"><div className="site-container promise-grid"><div className="promise-item"><span className="promise-icon promise-magenta"><HandHeart size={22} /></span><div><strong>Comprar con propósito</strong><small>Conoce a quien crea lo que te gusta.</small></div></div><div className="promise-item"><span className="promise-icon promise-green"><Leaf size={22} /></span><div><strong>Talento local</strong><small>Productos creados en Nicaragua.</small></div></div><div className="promise-item"><span className="promise-icon promise-blue"><ShieldCheck size={22} /></span><div><strong>Comunidad emprendedora</strong><small>Una vitrina para crecer y compartir.</small></div></div></div></div>
  </>;
}
