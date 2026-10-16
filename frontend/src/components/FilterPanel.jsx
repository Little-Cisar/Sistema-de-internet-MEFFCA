export default function FilterPanel({ categories = [], category, onCategoryChange, sort, onSortChange }) {
  return <div className="filter-panel">
    <div className="filter-field">
      <label htmlFor="category-filter">Categoría</label>
      <select id="category-filter" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="">Todas las categorías</option>
        {categories.map((item) => <option key={item.id_categoria ?? item.id ?? item.nombre_categoria} value={item.id_categoria ?? item.id ?? item.nombre_categoria}>{item.nombre_categoria ?? item.nombre ?? item.name}</option>)}
      </select>
    </div>
    <div className="filter-field">
      <label htmlFor="sort-filter">Ordenar por</label>
      <select id="sort-filter" value={sort} onChange={(event) => onSortChange(event.target.value)}>
        <option value="recent">Más recientes</option>
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="name">Nombre A–Z</option>
      </select>
    </div>
  </div>;
}
