import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return <nav className="pagination" aria-label="Paginación del catálogo">
    <button type="button" className="pagination-button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Página anterior"><ChevronLeft size={18} /></button>
    {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={`pagination-button ${number === page ? 'is-current' : ''}`} onClick={() => onChange(number)} aria-current={number === page ? 'page' : undefined}>{number}</button>)}
    <button type="button" className="pagination-button" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} aria-label="Página siguiente"><ChevronRight size={18} /></button>
  </nav>;
}
