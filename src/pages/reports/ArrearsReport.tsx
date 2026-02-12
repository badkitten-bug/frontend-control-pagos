import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Search, Filter } from 'lucide-react';
import { reportService } from '../../services';
import { Button, Input, Select, StatusBadge } from '../../components/ui';
import type { ArrearsReportItem } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Vigente', label: 'Vigente' },
  { value: 'Borrador', label: 'Borrador' },
];

export function ArrearsReport() {
  const [data, setData] = useState<ArrearsReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    placa: '',
    frecuencia: '',
    estado: '',
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await reportService.getArrearsReport(filters);
      setData(result);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await reportService.exportArrearsExcel(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-atrasos-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel descargado');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await reportService.exportArrearsPdf(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-atrasos-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const totalVencido = data.reduce((sum, item) => sum + item.montoVencido, 0);
  const totalCuotas = data.reduce((sum, item) => sum + item.cuotasVencidas, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reporte de Atrasos</h1>
          <p className="text-slate-400">Contratos con cuotas vencidas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="secondary" onClick={handleExportPdf}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
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
            options={STATUS_OPTIONS}
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
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
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Contratos con Atraso</p>
          <p className="text-3xl font-bold text-white">{data.length}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Total Cuotas Vencidas</p>
          <p className="text-3xl font-bold text-yellow-400">{totalCuotas}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Monto Total Vencido</p>
          <p className="text-3xl font-bold text-red-400">S/ {totalVencido.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Placa</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Contrato</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cuotas Venc.</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Monto Vencido</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Días Atraso</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Último Pago</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Frecuencia</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay contratos con atrasos 🎉
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-white font-medium">{item.placa}</td>
                  <td className="px-6 py-4 text-slate-300">#{item.contractId}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm">
                      {item.cuotasVencidas}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-red-400 font-medium">
                    S/ {item.montoVencido.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.maxDiasAtraso > 30 
                        ? 'bg-red-600/20 text-red-400' 
                        : item.maxDiasAtraso > 7 
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : 'bg-slate-600/20 text-slate-300'
                    }`}>
                      {item.maxDiasAtraso} días
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {item.ultimoPago.fecha 
                      ? format(new Date(item.ultimoPago.fecha), 'dd/MM/yyyy', { locale: es })
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{item.frecuencia}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
