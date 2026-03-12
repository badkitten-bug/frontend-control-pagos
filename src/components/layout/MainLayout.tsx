import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { Menu } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/vehicles': 'Vehículos',
  '/clients': 'Clientes',
  '/contracts': 'Contratos',
  '/payments': 'Caja',
  '/reports': 'Atrasos',
  '/reports/traffic-light': 'Semáforo',
  '/reports/cartera-viva': 'Cartera Viva',
  '/settings': 'Configuración',
};

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/contracts/') ? 'Detalle Contrato' : '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-slate-400 text-sm animate-pulse">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-900">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — solo visible en móvil */}
        <header className="lg:hidden h-14 flex items-center gap-3 px-4 bg-slate-900 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold truncate">{pageTitle}</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
          duration: 4000,
        }}
      />
    </div>
  );
}
