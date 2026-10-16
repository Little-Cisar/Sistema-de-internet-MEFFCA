import { ArrowUpRight, ImageOff, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { currency, valueOf } from '../utils/apiHelpers';

export default function ProductCard({ product }) {
  const id = valueOf(product, ['id_producto', 'id', 'productId']);
  const name = valueOf(product, ['nombre_producto', 'nombre', 'name'], 'Producto sin nombre');
  const category = valueOf(product, ['nombre_categoria', 'categoria', 'category'], 'Producto local');
  const entrepreneur = valueOf(product, ['nombre_negocio', 'nombre_protagonista', 'negocio', 'emprendimiento'], 'Emprendimiento local');
  const department = valueOf(product, ['departamento'], 'Nicaragua');
  const image = valueOf(product, ['imagen', 'image', 'image_url']);
  const price = valueOf(product, ['precio', 'price'], null);

  return <article className="product-card">
    <Link to={id ? `/productos/${id}` : '/catalogo'} className={`product-image ${image ? 'has-image' : ''}`} aria-label={`Ver ${name}`}>
      {image ? <img src={image} alt={name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="image-placeholder"><span className="placeholder-sun" /><span className="placeholder-hill hill-a" /><span className="placeholder-hill hill-b" /><span className="placeholder-caption"><ImageOff size={15} /> Imagen pendiente</span></div>}
      <span className="product-category-tag">{category}</span>
    </Link>
    <div className="product-card-body">
      <div className="product-merchant"><span className="merchant-dot" /> {entrepreneur}</div>
      <Link to={id ? `/productos/${id}` : '/catalogo'} className="product-name">{name}</Link>
      <div className="product-card-bottom">
        <span className="product-price">{price === null ? 'Consultar precio' : currency(price)}</span>
        <span className="product-location"><MapPin size={13} />{department}</span>
      </div>
      <Link className="product-more" to={id ? `/productos/${id}` : '/catalogo'} aria-label={`Más detalles de ${name}`}><ArrowUpRight size={17} /></Link>
    </div>
  </article>;
}
