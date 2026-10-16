import { Compass, PackageOpen } from 'lucide-react';

export default function EmptyState({ title = 'Todavía no hay resultados', description = 'Cuando la información esté disponible, aparecerá aquí.', icon = 'package', action }) {
  const Icon = icon === 'compass' ? Compass : PackageOpen;
  return <div className="empty-state"><span className="empty-icon"><Icon size={27} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
