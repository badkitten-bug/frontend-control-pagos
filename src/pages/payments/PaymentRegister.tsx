import { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Filter, RefreshCw } from 'lucide-react';
import { paymentService, contractService } from '../../services';
import { Button, Input, Select, SearchableSelect, Modal } from '../../components/ui';
import type { Payment, Contract } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const PAYMENT_TYPE_OPTIONS = [
  { value: 'Pago Inicial', label: 'Pago Inicial' },
  { value: 'Cuota', label: 'Cuota' },
  { value: 'Abono', label: 'Abono' },
];

const PAYMENT_METHODS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Yape', label: 'Yape' },
  { value: 'Plin', label: 'Plin' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Otro', label: 'Otro' },
];

export function PaymentRegister() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  
  // Date filters
  const today = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadPayments();
  }, [page, fechaDesde, fechaHasta]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getAll({ 
        page, 
        limit: 20,
        fechaDesde,
        fechaHasta, 
      });
      setPayments(response.items);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      
      // Calculate total for filtered period
      const total = response.items.reduce((sum: number, p: Payment) => 
        sum + parseFloat(p.importe.toString()), 0);
      setFilteredTotal(total);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setPayments([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick date filters
  const setToday = () => {
    const t = new Date().toISOString().split('T')[0];
    setFechaDesde(t);
    setFechaHasta(t);
    setPage(1);
  };

  const setYesterday = () => {
    const y = subDays(new Date(), 1).toISOString().split('T')[0];
    setFechaDesde(y);
    setFechaHasta(y);
    setPage(1);
  };

  const setLast7Days = () => {
    const from = subDays(new Date(), 7).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    setFechaDesde(from);
    setFechaHasta(to);
    setPage(1);
  };

  const setThisMonth = () => {
    const from = startOfMonth(new Date()).toISOString().split('T')[0];
    const to = endOfMonth(new Date()).toISOString().split('T')[0];
    setFechaDesde(from);
    setFechaHasta(to);
    setPage(1);
  };

  const handleOpenModal = async () => {
    try {
      const response = await contractService.getAll({ limit: 100, estado: 'Vigente' });
      setContracts(response.items);
      setSelectedContractId('');
      reset({
        fechaPago: new Date().toISOString().split('T')[0],
        medioPago: 'Efectivo',
        tipo: 'Cuota',
      });
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar contratos');
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedContractId) {
      toast.error('Seleccione un contrato');
      return;
    }
    try {
      await paymentService.create({
        contractId: parseInt(selectedContractId),
        tipo: data.tipo,
        importe: parseFloat(data.importe),
        fechaPago: data.fechaPago,
        medioPago: data.medioPago,
        numeroOperacion: data.numeroOperacion,
        notas: data.notas,
      });
      toast.success('Pago registrado');
      setIsModalOpen(false);
      loadPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja - Pagos</h1>
          <p className="text-slate-400">Registro de pagos del sistema</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pago
        </Button>
      </div>

      {/* Date Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex gap-2">
            <Button size="sm" variant={fechaDesde === today && fechaHasta === today ? 'primary' : 'ghost'} onClick={setToday}>
              Hoy
            </Button>
            <Button size="sm" variant="ghost" onClick={setYesterday}>
              Ayer
            </Button>
            <Button size="sm" variant="ghost" onClick={setLast7Days}>
              Últimos 7 días
            </Button>
            <Button size="sm" variant="ghost" onClick={setThisMonth}>
              Este mes
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="w-40"
            />
            <span className="text-slate-400">a</span>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="w-40"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={loadPayments}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Total del Período</p>
          <p className="text-3xl font-bold text-green-400">S/ {filteredTotal.toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Cantidad de Pagos</p>
          <p className="text-3xl font-bold text-blue-400">{totalItems}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-slate-400 text-sm">Promedio por Pago</p>
          <p className="text-3xl font-bold text-purple-400">
            S/ {totalItems > 0 ? (filteredTotal / totalItems).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Fecha</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Contrato / Placa</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cliente</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Tipo</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Importe</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Medio</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay pagos en este período
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-slate-300">
                    {format(new Date(payment.fechaPago), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">#{payment.contractId}</span>
                    {payment.contract?.vehicle && (
                      <span className="text-slate-400 ml-2">
                        ({payment.contract.vehicle.placa})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {payment.contract?.clienteNombre || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      payment.tipo === 'Cuota' ? 'bg-blue-500/20 text-blue-400' :
                      payment.tipo === 'Pago Inicial' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {payment.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-green-400 font-medium">
                    S/ {parseFloat(payment.importe.toString()).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{payment.medioPago}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{payment.usuarioNombre}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">
            Mostrando {payments.length} de {totalItems} pagos
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="px-4 py-2 text-slate-400">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Pago"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SearchableSelect
            label="Contrato"
            placeholder="Buscar por número o placa..."
            options={contracts.map(c => ({
              value: c.id.toString(),
              label: `#${c.id} - ${c.vehicle?.placa || 'N/A'} (${c.clienteNombre || 'Sin cliente'})`,
              searchText: `${c.id} ${c.vehicle?.placa} ${c.clienteNombre} ${c.clienteDni}`,
            }))}
            value={selectedContractId}
            onChange={setSelectedContractId}
            error={!selectedContractId && errors.contractId ? 'Seleccione un contrato' : undefined}
          />
          <Select
            label="Tipo de Pago"
            options={PAYMENT_TYPE_OPTIONS}
            {...register('tipo')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de Pago"
              type="date"
              {...register('fechaPago')}
            />
            <Input
              label="Importe"
              type="number"
              step="0.01"
              placeholder="100.00"
              error={errors.importe?.message as string}
              {...register('importe', { required: 'Requerido' })}
            />
          </div>
          <Select
            label="Medio de Pago"
            options={PAYMENT_METHODS}
            {...register('medioPago')}
          />
          <Input
            label="N° Operación (opcional)"
            placeholder="000123456"
            {...register('numeroOperacion')}
          />
          <Input
            label="Notas (opcional)"
            placeholder="Notas adicionales..."
            {...register('notas')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

