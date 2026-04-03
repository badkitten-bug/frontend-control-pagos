import { NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  FileText,
  CreditCard,
  BarChart3,
  Home,
  LogOut,
  Menu,
  X,
  CircleDot,
  Wallet,
  Settings,
  Users,
  Landmark,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/vehicles', label: 'Vehículos', icon: Car },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/contracts', label: 'Contratos', icon: FileText },
  { path: '/payments', label: 'Caja', icon: CreditCard },
  { path: '/cuentas', label: 'Cuentas', icon: Landmark },
  { path: '/reports', label: 'Atrasos', icon: BarChart3 },
  { path: '/reports/traffic-light', label: 'Semáforo', icon: CircleDot },
  { path: '/reports/cartera-viva', label: 'Cartera Viva', icon: Wallet },
  { path: '/settings', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Cerrar drawer al cambiar de ruta en móvil
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const navContent = (
    <>
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {/* En desktop colapsado solo muestra el icono */}
                  <span className={isCollapsed ? 'hidden' : ''}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-slate-400 hover:text-red-400 hover:bg-red-900/20
            transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── MÓVIL: overlay + drawer deslizante ── */}
      {/* Fondo oscuro al abrir */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Drawer lateral móvil */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-slate-900 border-r border-slate-700
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del drawer */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 shrink-0">
          <span className="text-lg font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Control Pagos
          </span>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* ── DESKTOP: sidebar fijo a la izquierda ── */}
      <aside
        className={`
          hidden lg:flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
          bg-slate-900 border-r border-slate-700
          transition-all duration-300 ease-in-out
          shrink-0
        `}
      >
        {/* Header desktop */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 shrink-0">
          {!isCollapsed && (
            <span className="text-lg font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Control Pagos
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
