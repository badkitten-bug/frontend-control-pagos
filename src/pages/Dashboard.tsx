import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, FileText, AlertTriangle, ArrowRight, Search, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { reportService } from '../services';
import { Button, Input, StatusBadge } from '../components/ui';
import type { QuickSearchResult, DashboardStats } from '../types';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const SEMAFORO_COLORS = {
  verde: '#10b981',
  ambar: '#f59e0b',
  rojo: '#ef4444',
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchPlaca, setSearchPlaca] = useState('');
  const [searchResults, setSearchResults] = useState<QuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = async () => {
    if (!searchPlaca.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await reportService.quickSearch(searchPlaca);
      setSearchResults(results);
      if (results.length === 0) {
        toast.error('No se encontraron vehículos con esa placa');
      }
    } catch (error) {
      toast.error('Error al buscar');
    } finally {
      setIsSearching(false);
    }
  };

  const semaforoData = stats ? [
    { name: 'Al día', value: stats.semaforo.verde, color: SEMAFORO_COLORS.verde },
    { name: 'Atrasado', value: stats.semaforo.ambar, color: SEMAFORO_COLORS.ambar },
    { name: 'Crítico', value: stats.semaforo.rojo, color: SEMAFORO_COLORS.rojo },
  ] : [];

  const statCards = [
    { 
      label: 'Vehículos', 
      value: stats?.totalVehiculos || 0, 
      subtitle: `${stats?.vehiculosDisponibles || 0} disponibles`,
      icon: Car, 
      color: 'blue', 
      link: '/vehicles' 
    },
    { 
      label: 'Contratos Activos', 
      value: stats?.contratosVigentes || 0,
      subtitle: 'En curso',
      icon: FileText, 
      color: 'green', 
      link: '/contracts' 
    },
    { 
      label: 'Cobrado este Mes', 
      value: `S/ ${(stats?.totalCobradoMes || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: 'Recaudación mensual',
      icon: DollarSign, 
      color: 'emerald', 
      link: '/payments' 
    },
    { 
      label: 'Pendiente Total', 
      value: `S/ ${(stats?.totalPendiente || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: 'Por cobrar',
      icon: Clock, 
      color: 'yellow', 
      link: '/reports' 
    },
    { 
      label: 'Mora Acumulada', 
      value: `S/ ${(stats?.totalMoraAcumulada || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: 'Intereses por atraso',
      icon: AlertTriangle, 
      color: 'red', 
      link: '/reports/traffic-light' 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Panel de control de pagos vehiculares</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="glass rounded-xl p-5 hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">{card.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{card.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${card.color}-600/20`}>
                  <Icon className={`w-5 h-5 text-${card.color}-400`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Cobranzas Mensuales */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Cobranzas Mensuales
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.cobranzasMensuales || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `S/${v}`} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? [`S/ ${value.toFixed(2)}`, ''] : ['', '']}
                />
                <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendiente" name="Pendiente" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Semáforo */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Estado de Contratos</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={semaforoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {semaforoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Consulta Rápida por Placa</h2>
        <p className="text-slate-400 text-sm mb-4">Busca vehículos por placa parcial o completa (ej: ABC o ABC-123)</p>
        <div className="flex gap-3">
          <Input
            placeholder="Ej: ABC-123"
            value={searchPlaca}
            onChange={(e) => setSearchPlaca(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
          />
          <Button onClick={handleQuickSearch} isLoading={isSearching}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-slate-400 text-sm">
              Se encontraron {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map((result) => (
              <div key={result.placa} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{result.placa}</h3>
                  <StatusBadge status={result.vehicleStatus as any} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.contratoActivo ? (
                    <>
                      <div>
                        <p className="text-slate-400 text-sm">Contrato</p>
                        <p className="text-white font-medium">#{result.contratoActivo.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Próxima Cuota</p>
                        <p className="text-white font-medium">
                          {result.proximaCuota
                            ? `S/ ${result.proximaCuota.importe.toFixed(2)}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Deuda Vencida</p>
                        <p className={`font-medium ${result.deudaVencida > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          S/ {result.deudaVencida.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Total Pagado</p>
                        <p className="text-white font-medium">S/ {result.totalPagado.toFixed(2)}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 col-span-4">Sin contrato activo</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
