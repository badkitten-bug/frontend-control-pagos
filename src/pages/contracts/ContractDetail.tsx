import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, FileText } from 'lucide-react';
import { contractService, paymentService, subcontractService } from '../../services';
import { Button, Input, Select, StatusBadge, Modal } from '../../components/ui';
import { SubcontractModal } from '../../components/SubcontractModal';
import type { Contract, PaymentSchedule, Payment, Subcontract, CreateSubcontractDto, SubcontractSchedule } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const PAYMENT_METHODS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Yape', label: 'Yape' },
  { value: 'Plin', label: 'Plin' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Otro', label: 'Otro' },
];

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subcontracts, setSubcontracts] = useState<Subcontract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubcontractModalOpen, setIsSubcontractModalOpen] = useState(false);
  const [isSubcontractPaymentModalOpen, setIsSubcontractPaymentModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [selectedSubcontractSchedule, setSelectedSubcontractSchedule] = useState<{ subcontract: Subcontract; schedule: SubcontractSchedule } | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (id) loadContract(parseInt(id));
  }, [id]);

  const loadContract = async (contractId: number) => {
    setIsLoading(true);
    try {
      const [contractData, scheduleData, paymentsData, subcontractsData] = await Promise.all([
        contractService.getById(contractId),
        contractService.getSchedule(contractId),
        paymentService.getByContract(contractId),
        subcontractService.getByContract(contractId),
      ]);
      setContract(contractData);
      setSchedule(scheduleData);
      setPayments(paymentsData);
      setSubcontracts(subcontractsData);
    } catch (error) {
      toast.error('Error al cargar contrato');
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentModal = (scheduleItem?: PaymentSchedule) => {
    setSelectedSchedule(scheduleItem || null);
    
    // Determine payment type:
    // - If scheduleItem provided -> Cuota
    // - If initial payment not registered -> Pago Inicial
    // - Otherwise -> Cuota (for cascade payments)
    const defaultTipo = scheduleItem 
      ? 'Cuota' 
      : (!contract?.pagoInicialRegistrado && (contract?.pagoInicial ?? 0) > 0) 
        ? 'Pago Inicial' 
        : 'Cuota';
    
    reset({
      fechaPago: new Date().toISOString().split('T')[0],
      medioPago: 'Efectivo',
      importe: scheduleItem ? scheduleItem.saldo : (defaultTipo === 'Pago Inicial' ? (contract?.pagoInicial ?? '') : ''),
      tipo: defaultTipo,
    });
    setIsPaymentModalOpen(true);
  };

  const onSubmitPayment = async (data: any) => {
    try {
      await paymentService.create({
        contractId: contract!.id,
        scheduleId: selectedSchedule?.id,
        tipo: data.tipo,
        importe: parseFloat(data.importe),
        fechaPago: data.fechaPago,
        medioPago: data.medioPago,
        numeroOperacion: data.numeroOperacion,
        notas: data.notas,
      });
      toast.success('Pago registrado');
      setIsPaymentModalOpen(false);
      loadContract(contract!.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagada': return 'bg-green-500';
      case 'Vencida': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando...</div>;
  }

  if (!contract) {
    return <div className="text-center py-8 text-slate-400">Contrato no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/contracts" className="p-2 rounded-lg hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Contrato #{contract.id}</h1>
          <p className="text-slate-400">{contract.vehicle?.placa} - {contract.vehicle?.marca} {contract.vehicle?.modelo}</p>
        </div>
        <StatusBadge status={contract.estado} />
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-1">Precio Total</h3>
          <p className="text-2xl font-bold text-white">S/ {parseFloat(contract.precio.toString()).toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-1">Pago Inicial</h3>
          <p className="text-2xl font-bold text-white">
            S/ {parseFloat(contract.pagoInicial.toString()).toFixed(2)}
            {!contract.pagoInicialRegistrado && contract.pagoInicial > 0 && (
              <span className="text-yellow-400 text-sm ml-2">(Pendiente)</span>
            )}
          </p>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-1">Saldo Pendiente</h3>
          <p className="text-2xl font-bold text-red-400">
            S/ {schedule.reduce((sum, s) => sum + parseFloat(s.saldo?.toString() || '0'), 0).toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-1">Total Pagado</h3>
          <p className="text-2xl font-bold text-green-400">
            S/ {(payments.reduce((sum, p) => sum + parseFloat(p.importe?.toString() || '0'), 0)).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <p className="text-sm text-slate-400">
          <span className="font-medium text-white">Cuotas:</span> {contract.numeroCuotas} ({contract.frecuencia})
          {(contract.comisionPorcentaje ?? 0) > 0 && (
            <span className="ml-4"><span className="font-medium text-white">Comisión:</span> {contract.comisionPorcentaje}%</span>
          )}
          {(contract.moraPorcentaje ?? 0) > 0 && (
            <span className="ml-4"><span className="font-medium text-white">Mora diaria:</span> {contract.moraPorcentaje}%</span>
          )}
        </p>
      </div>

      {/* Quick Actions */}
      {contract.estado !== 'Cancelado' && contract.estado !== 'Anulado' && (
        <div className="flex gap-3">
          {!contract.pagoInicialRegistrado && contract.pagoInicial > 0 && (
            <Button onClick={() => openPaymentModal()}>
              <DollarSign className="w-4 h-4 mr-2" />
              Registrar Pago Inicial
            </Button>
          )}
          <Button variant="secondary" onClick={() => openPaymentModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
          {contract.estado === 'Vigente' && (
            <Button variant="secondary" onClick={() => setIsSubcontractModalOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Agregar Subcontrato
            </Button>
          )}
        </div>
      )}

      {/* Schedule Grid */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Cronograma de Pagos</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">#</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Vencimiento</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Capital</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Total</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Pagado</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Saldo</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Estado</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-slate-400"></th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                <td className="px-6 py-3 text-white">{item.numeroCuota}</td>
                <td className="px-6 py-3 text-slate-300">
                  {format(new Date(item.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.capital.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.total.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.montoPagado.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-white font-medium">S/ {parseFloat(item.saldo.toString()).toFixed(2)}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(item.estado)}`} />
                    <StatusBadge status={item.estado} />
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  {item.estado !== 'Pagada' && contract.estado === 'Vigente' && (
                    <Button size="sm" variant="ghost" onClick={() => openPaymentModal(item)}>
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Pagos Registrados</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Fecha</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Tipo</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Importe</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Medio</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-700/50">
                  <td className="px-6 py-3 text-slate-300">
                    {format(new Date(payment.fechaPago), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-3 text-slate-300">{payment.tipo}</td>
                  <td className="px-6 py-3 text-green-400 font-medium">
                    S/ {parseFloat(payment.importe.toString()).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-slate-300">{payment.medioPago}</td>
                  <td className="px-6 py-3 text-slate-400">{payment.usuarioNombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedSchedule ? `Pagar Cuota #${selectedSchedule.numeroCuota}` : 'Registrar Pago'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmitPayment)} className="space-y-4">
          <Input
            label="Tipo de Pago"
            disabled
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
              {...register('importe')}
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
            <Button variant="ghost" type="button" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Pago
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subcontracts Section */}
      {subcontracts.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Subcontratos</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {subcontracts.map((sub) => (
              <div key={sub.id} className="px-6 py-4 hover:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{sub.tipo}</span>
                      <StatusBadge status={sub.estado} />
                      <span className={`text-xs px-2 py-1 rounded ${sub.modalidad === 'Independiente' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {sub.modalidad === 'Independiente' ? 'Cuotas Propias' : 'Agregado a Cuotas'}
                      </span>
                    </div>
                    {sub.descripcion && (
                      <p className="text-sm text-slate-400 mt-1">{sub.descripcion}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">
                      Creado: {format(new Date(sub.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">S/ {parseFloat(sub.monto.toString()).toFixed(2)}</p>
                    {sub.modalidad === 'Independiente' && sub.numeroCuotas && (
                      <p className="text-sm text-slate-400">{sub.numeroCuotas} cuotas</p>
                    )}
                  </div>
                </div>
                {sub.modalidad === 'Independiente' && sub.cronograma && sub.cronograma.length > 0 && (
                  <div className="mt-4 bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Cronograma del Subcontrato</h4>
                    <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-1">
                      <span>#</span>
                      <span>Vencimiento</span>
                      <span>Monto</span>
                      <span>Pagado</span>
                      <span>Saldo</span>
                      <span>Estado</span>
                      <span></span>
                    </div>
                    {sub.cronograma.map((cuota) => {
                      const isPayable = cuota.estado !== 'Pagada' && 
                        (cuota.estado === 'Vencida' || isBefore(new Date(cuota.fechaVencimiento), startOfDay(new Date())) || 
                         cuota.fechaVencimiento <= new Date().toISOString().split('T')[0]);
                      return (
                        <div key={cuota.id} className="grid grid-cols-7 gap-2 text-sm py-1 border-t border-slate-700/30 items-center">
                          <span className="text-white">{cuota.numeroCuota}</span>
                          <span className="text-slate-300">{format(new Date(cuota.fechaVencimiento), 'dd/MM/yy')}</span>
                          <span className="text-slate-300">S/ {parseFloat(cuota.monto.toString()).toFixed(2)}</span>
                          <span className="text-slate-300">S/ {parseFloat(cuota.montoPagado.toString()).toFixed(2)}</span>
                          <span className="text-white font-medium">S/ {parseFloat(cuota.saldo.toString()).toFixed(2)}</span>
                          <span className={cuota.estado === 'Pagada' ? 'text-green-400' : cuota.estado === 'Vencida' ? 'text-red-400' : 'text-yellow-400'}>
                            {cuota.estado}
                          </span>
                          <span>
                            {isPayable && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setSelectedSubcontractSchedule({ subcontract: sub, schedule: cuota });
                                  setIsSubcontractPaymentModalOpen(true);
                                }}
                              >
                                <DollarSign className="w-3 h-3" />
                              </Button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcontract Modal */}
      <SubcontractModal
        isOpen={isSubcontractModalOpen}
        onClose={() => setIsSubcontractModalOpen(false)}
        contractId={contract.id}
        onSubmit={async (data: CreateSubcontractDto) => {
          try {
            await subcontractService.create(data);
            toast.success('Subcontrato creado exitosamente');
            setIsSubcontractModalOpen(false);
            loadContract(contract.id);
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear subcontrato');
            throw error;
          }
        }}
      />

      {/* Subcontract Payment Modal */}
      <Modal
        isOpen={isSubcontractPaymentModalOpen}
        onClose={() => {
          setIsSubcontractPaymentModalOpen(false);
          setSelectedSubcontractSchedule(null);
        }}
        title={selectedSubcontractSchedule 
          ? `Pagar ${selectedSubcontractSchedule.subcontract.tipo} - Cuota #${selectedSubcontractSchedule.schedule.numeroCuota}` 
          : 'Pagar Subcontrato'}
        size="md"
      >
        {selectedSubcontractSchedule && (
          <form 
            onSubmit={handleSubmit(async (data) => {
              try {
                // Usar el endpoint específico de pago de subcontratos
                await subcontractService.paySchedule(selectedSubcontractSchedule.schedule.id, {
                  monto: parseFloat(data.importe),
                  fechaPago: data.fechaPago,
                  medioPago: data.medioPago,
                  numeroOperacion: data.numeroOperacion,
                  notas: data.notas,
                });
                toast.success('Pago de subcontrato registrado');
                setIsSubcontractPaymentModalOpen(false);
                setSelectedSubcontractSchedule(null);
                loadContract(contract.id);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error al registrar pago');
              }
            })} 
            className="space-y-4"
          >
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-300">
                <strong>Subcontrato:</strong> {selectedSubcontractSchedule.subcontract.tipo}
              </p>
              <p className="text-sm text-slate-300">
                <strong>Saldo pendiente:</strong> S/ {parseFloat(selectedSubcontractSchedule.schedule.saldo.toString()).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Pago"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                {...register('fechaPago')}
              />
              <Input
                label="Importe"
                type="number"
                step="0.01"
                defaultValue={parseFloat(selectedSubcontractSchedule.schedule.saldo.toString()).toFixed(2)}
                {...register('importe')}
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
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => {
                  setIsSubcontractPaymentModalOpen(false);
                  setSelectedSubcontractSchedule(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Pago
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
