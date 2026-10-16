import { ArrowUpRight, Shapes } from 'lucide-react';
import { Link } from 'react-router-dom';

const accents = ['rose', 'blue', 'green', 'violet', 'amber'];

export default function CategoryCard({ category, index = 0 }) {
  const id = category?.id_categoria ?? category?.id ?? '';
  const name = category?.nombre_categoria ?? category?.nombre ?? category?.name ?? 'Categoría';
  return <Link className={`category-card category-${accents[index % accents.length]}`} to={`/catalogo?categoria=${encodeURIComponent(id)}`}>
    <span className="category-mark"><Shapes size={25} strokeWidth={1.8} /></span>
    <span className="category-card-name">{name}</span>
    <ArrowUpRight className="category-arrow" size={18} aria-hidden="true" />
  </Link>;
}
