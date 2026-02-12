interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-600 text-slate-200',
    success: 'bg-green-600/20 text-green-400 border border-green-600/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
    danger: 'bg-red-600/20 text-red-400 border border-red-600/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Traffic light badge for payment status
interface StatusBadgeProps {
  status: 'Pendiente' | 'Pagada' | 'Vencida' | 'Disponible' | 'Vendido' | 'Inactivo' | 'Borrador' | 'Vigente' | 'Cancelado' | 'Anulado';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'Pagada':
      case 'Disponible':
      case 'Vigente':
        return 'success';
      case 'Pendiente':
      case 'Borrador':
        return 'warning';
      case 'Vencida':
      case 'Vendido':
      case 'Cancelado':
      case 'Anulado':
      case 'Inactivo':
        return 'danger';
      default:
        return 'default';
    }
  };

  return <Badge variant={getVariant()}>{status}</Badge>;
}
