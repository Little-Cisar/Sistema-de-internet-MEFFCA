import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = '¿Qué estás buscando?', compact = false }) {
  return <form className={`search-bar ${compact ? 'search-bar-compact' : ''}`} onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }} role="search">
    <Search size={20} aria-hidden="true" />
    <label className="sr-only" htmlFor="market-search">Buscar productos</label>
    <input id="market-search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Limpiar búsqueda"><X size={17} /></button>}
    <button type="submit" className="search-submit">Buscar</button>
  </form>;
}
