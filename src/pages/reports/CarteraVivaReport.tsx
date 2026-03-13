import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services';
import { Button, Input, Select } from '../../components/ui';
import type { CarteraVivaItem } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDate } from '../../utils/date';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

export function CarteraVivaReport() {
  const [data, setData] = useState<CarteraVivaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [placa, setPlaca] = useState('');
  const [frecuencia, setFrecuencia] = useState('');

  useEffect(() => {
    loadData();
  }, [placa, frecuencia]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportService.getCarteraViva({
        placa: placa || undefined,
        frecuencia: frecuencia || undefined,
      });
      setData(result);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSaldo = data.reduce((sum, r) => sum + r.saldoTotal, 0);
  const totalVencido = data.reduce((sum, r) => sum + r.montoVencido, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cartera Viva</h1>
        <p className="text-slate-400">Saldo pendiente por contrato vigente</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <p className="text-sm text-slate-400">Contratos activos</p>
          <p className="text-3xl font-bold text-white mt-1">{data.length}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-sm text-slate-400">Saldo total pendiente</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">
            S/ {totalSaldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-sm text-slate-400">Monto vencido</p>
          <p className="text-3xl font-bold text-red-400 mt-1">
            S/ {totalVencido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Buscar por placa..."
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          className="max-w-xs"
        />
        <Select
          label=""
          options={FREQUENCY_OPTIONS}
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
          className="w-40"
        />
        {(placa || frecuencia) && (
          <Button variant="ghost" size="sm" onClick={() => { setPlaca(''); setFrecuencia(''); }}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Contrato</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Placa / Vehículo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Frecuencia</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Cuotas pend.</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Vencidas</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Saldo total</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-red-400">Monto vencido</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Próx. vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400">Cargando...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400">Sin resultados</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.contractId} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/contracts/${row.contractId}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      #{row.contractId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {row.placa}
                    <span className="text-slate-400 text-xs ml-1">{row.marca} {row.modelo}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{row.clienteNombre || <span className="text-slate-500 italic">—</span>}</div>
                    {row.clienteTelefono && (
                      <div className="text-xs text-slate-500">{row.clienteTelefono}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.frecuencia}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{row.cuotasPendientes}</td>
                  <td className="px-4 py-3 text-right">
                    {row.cuotasVencidas > 0
                      ? <span className="text-red-400 font-medium">{row.cuotasVencidas}</span>
                      : <span className="text-slate-500">0</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    S/ {row.saldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.montoVencido > 0
                      ? <span className="text-red-400 font-medium">S/ {row.montoVencido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      : <span className="text-slate-500">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {row.proximaFecha
                      ? <>
                          <div>{format(parseDate(row.proximaFecha), 'dd/MM/yyyy', { locale: es })}</div>
                          {row.proximoMonto && (
                            <div className="text-xs text-slate-500">S/ {row.proximoMonto.toFixed(2)}</div>
                          )}
                        </>
                      : <span className="text-slate-500">—</span>
                    }
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
