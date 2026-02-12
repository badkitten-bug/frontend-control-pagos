import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Phone, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { reportService } from '../../services';
import { Button, Input, Select } from '../../components/ui';
import type { TrafficLightItem, SemaforoStatus } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

const SEMAFORO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'verde', label: '🟢 Verde' },
  { value: 'ambar', label: '🟡 Ámbar' },
  { value: 'rojo', label: '🔴 Rojo' },
];

const SemaforoIndicator = ({ status }: { status: SemaforoStatus }) => {
  const config = {
    verde: {
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-500/30',
      icon: CheckCircle,
      label: 'Al día',
    },
    ambar: {
      bg: 'bg-amber-500',
      ring: 'ring-amber-500/30',
      icon: Clock,
      label: 'Atraso leve',
    },
    rojo: {
      bg: 'bg-red-500',
      ring: 'ring-red-500/30',
      icon: AlertTriangle,
      label: 'Muy atrasado',
    },
  };

  const { bg, ring, icon: Icon, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${bg} ring-4 ${ring} animate-pulse`} />
      <div className="flex items-center gap-1 text-sm">
        <Icon className={`w-4 h-4 ${status === 'verde' ? 'text-emerald-400' : status === 'ambar' ? 'text-amber-400' : 'text-red-400'}`} />
        <span className="text-slate-300">{label}</span>
      </div>
    </div>
  );
};

export function TrafficLightReport() {
  const [data, setData] = useState<TrafficLightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    placa: '',
    frecuencia: '',
    semaforo: '' as SemaforoStatus | '',
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await reportService.getTrafficLightReport({
        placa: filters.placa || undefined,
        frecuencia: filters.frecuencia || undefined,
        semaforo: filters.semaforo || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const counts = {
    verde: data.filter(d => d.semaforo === 'verde').length,
    ambar: data.filter(d => d.semaforo === 'ambar').length,
    rojo: data.filter(d => d.semaforo === 'rojo').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reporte Semáforo</h1>
        <p className="text-slate-400">Estado de pagos por vehículo</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Input
            placeholder="Buscar por placa..."
            value={filters.placa}
            onChange={(e) => setFilters({ ...filters, placa: e.target.value.toUpperCase() })}
            className="max-w-xs"
          />
          <Select
            options={FREQUENCY_OPTIONS}
            value={filters.frecuencia}
            onChange={(e) => setFilters({ ...filters, frecuencia: e.target.value })}
            className="w-40"
          />
          <Select
            options={SEMAFORO_OPTIONS}
            value={filters.semaforo}
            onChange={(e) => setFilters({ ...filters, semaforo: e.target.value as SemaforoStatus | '' })}
            className="w-40"
          />
          <Button onClick={loadReport}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Al Día</p>
              <p className="text-3xl font-bold text-emerald-400">{counts.verde}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Atraso Leve</p>
              <p className="text-3xl font-bold text-amber-400">{counts.ambar}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Muy Atrasado</p>
              <p className="text-3xl font-bold text-red-400">{counts.rojo}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Vehículo</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cliente</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Frecuencia</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Atraso</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Deuda</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Último Pago</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No hay contratos vigentes
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.contractId} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <SemaforoIndicator status={item.semaforo} />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{item.placa}</p>
                      <p className="text-slate-400 text-sm">{item.marca} {item.modelo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-300">{item.clienteNombre}</p>
                      {item.clienteTelefono !== '-' && (
                        <a 
                          href={`tel:${item.clienteTelefono}`}
                          className="text-blue-400 text-sm flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {item.clienteTelefono}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{item.frecuencia}</td>
                  <td className="px-6 py-4">
                    <div>
                      {item.frecuencia === 'Diario' ? (
                        <span className={`text-sm ${item.diasAtraso > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          {item.diasAtraso} días
                        </span>
                      ) : (
                        <span className={`text-sm ${item.cuotasVencidas > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          {item.cuotasVencidas} cuotas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${item.montoVencido > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      S/ {item.montoVencido.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {item.ultimoPago
                      ? format(new Date(item.ultimoPago), 'dd/MM/yyyy', { locale: es })
                      : 'Sin pagos'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/contracts/${item.contractId}`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors inline-block"
                      title="Ver contrato"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
