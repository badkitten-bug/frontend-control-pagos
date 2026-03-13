import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, FileText, Ban, Edit2, XCircle, RefreshCw } from 'lucide-react';
import { contractService, paymentService, subcontractService } from '../../services';
import { Button, Input, Select, StatusBadge, Modal, ConfirmModal, Tooltip } from '../../components/ui';
import { SubcontractModal } from '../../components/SubcontractModal';
import type { Contract, PaymentSchedule, Payment, Subcontract, CreateSubcontractDto, SubcontractSchedule } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { parseDate } from '../../utils/date';
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
  const [isEditPagoInicialOpen, setIsEditPagoInicialOpen] = useState(false);
  const [editPagoInicialValue, setEditPagoInicialValue] = useState('');
  const [isEditFechaOpen, setIsEditFechaOpen] = useState(false);
  const [editFechaValue, setEditFechaValue] = useState('');
  const [isEditMesesFrecuenciaOpen, setIsEditMesesFrecuenciaOpen] = useState(false);
  const [editMesesValue, setEditMesesValue] = useState('');
  const [editFrecuenciaValue, setEditFrecuenciaValue] = useState('');
  const [isEditPrecioOpen, setIsEditPrecioOpen] = useState(false);
  const [editPrecioValue, setEditPrecioValue] = useState('');
  const [editComisionValue, setEditComisionValue] = useState('');
  const [editMoraValue, setEditMoraValue] = useState('');
  const [isEditClienteOpen, setIsEditClienteOpen] = useState(false);
  const [editClienteNombre, setEditClienteNombre] = useState('');
  const [editClienteDni, setEditClienteDni] = useState('');
  const [editClienteTelefono, setEditClienteTelefono] = useState('');
  const [editClienteDireccion, setEditClienteDireccion] = useState('');
  const [schedulePage, setSchedulePage] = useState(1);
  const PAGE_SIZE = 100;

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'warning', confirmLabel: 'Confirmar', onConfirm: () => {} });

  const askConfirm = (opts: Omit<typeof confirm, 'open'>) =>
    setConfirm({ open: true, ...opts });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

  const { register, handleSubmit, reset, formState: { isSubmitting, errors: paymentErrors } } = useForm();

  useEffect(() => {
    if (id) {
      setSchedulePage(1);
      loadContract(parseInt(id));
    }
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
    } catch {
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

  const handleCancelContract = () => {
    if (!contract) return;
    askConfirm({
      title: 'Cancelar contrato',
      message: 'El contrato pasará a estado Cancelado y el vehículo quedará disponible. Esta acción no se puede deshacer.',
      variant: 'warning',
      confirmLabel: 'Sí, cancelar',
      onConfirm: async () => {
        try {
          await contractService.cancel(contract.id);
          toast.success('Contrato cancelado');
          closeConfirm();
          loadContract(contract.id);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Error al cancelar contrato');
        }
      },
    });
  };

  const handleAnnulContract = () => {
    if (!contract) return;
    askConfirm({
      title: 'Anular contrato',
      message: 'El contrato quedará ANULADO (nulo, como si no hubiera existido). El vehículo será liberado y sus pagos no aparecerán en Caja.',
      variant: 'danger',
      confirmLabel: 'Sí, anular',
      onConfirm: async () => {
        try {
          await contractService.annul(contract.id);
          toast.success('Contrato anulado');
          closeConfirm();
          loadContract(contract.id);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Error al anular contrato');
        }
      },
    });
  };

  const handleRebuildSchedule = () => {
    if (!contract) return;
    askConfirm({
      title: 'Recalcular cronograma',
      message: 'Se recalcularán las fechas de todas las cuotas pendientes. Las cuotas ya pagadas no se modifican.',
      variant: 'info',
      confirmLabel: 'Recalcular',
      onConfirm: async () => {
        try {
          await contractService.rebuildSchedule(contract.id);
          toast.success('Cronograma recalculado correctamente');
          closeConfirm();
          loadContract(contract.id);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Error al recalcular cronograma');
        }
      },
    });
  };

  const openEditMesesFrecuencia = () => {
    if (!contract) return;
    setEditMesesValue(String(contract.meses || ''));
    setEditFrecuenciaValue(contract.frecuencia || 'Mensual');
    setIsEditMesesFrecuenciaOpen(true);
  };

  const handleSaveMesesFrecuencia = async () => {
    if (!contract) return;
    const meses = parseInt(editMesesValue);
    if (!meses || meses <= 0) {
      toast.error('El número de meses debe ser mayor a 0');
      return;
    }
    try {
      await contractService.update(contract.id, { meses, frecuencia: editFrecuenciaValue } as any);
      toast.success('Plazo actualizado y cronograma regenerado');
      setIsEditMesesFrecuenciaOpen(false);
      loadContract(contract.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar plazo');
    }
  };

  const openEditCliente = () => {
    if (!contract) return;
    setEditClienteNombre(contract.clienteNombre || '');
    setEditClienteDni(contract.clienteDni || '');
    setEditClienteTelefono(contract.clienteTelefono || '');
    setEditClienteDireccion(contract.clienteDireccion || '');
    setIsEditClienteOpen(true);
  };

  const handleSaveCliente = async () => {
    if (!contract) return;
    try {
      await contractService.update(contract.id, {
        clienteNombre: editClienteNombre,
        clienteDni: editClienteDni,
        clienteTelefono: editClienteTelefono,
        clienteDireccion: editClienteDireccion,
      } as any);
      toast.success('Datos del cliente actualizados');
      setIsEditClienteOpen(false);
      loadContract(contract.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente');
    }
  };

  const openEditPrecio = () => {
    if (!contract) return;
    setEditPrecioValue(parseFloat(contract.precio.toString()).toFixed(2));
    setEditComisionValue(String(contract.comisionPorcentaje ?? 0));
    setEditMoraValue(String(contract.moraPorcentaje ?? 0));
    setIsEditPrecioOpen(true);
  };

  const handleSavePrecio = async () => {
    if (!contract) return;
    const precio = parseFloat(editPrecioValue);
    if (!precio || precio <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    try {
      await contractService.update(contract.id, {
        precio,
        comisionPorcentaje: parseFloat(editComisionValue) || 0,
        moraPorcentaje: parseFloat(editMoraValue) || 0,
      } as any);
      toast.success('Precio actualizado y cronograma regenerado');
      setIsEditPrecioOpen(false);
      loadContract(contract.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar precio');
    }
  };

  const openEditFecha = () => {
    if (!contract) return;
    setEditFechaValue(contract.fechaInicio.split('T')[0] || contract.fechaInicio);
    setIsEditFechaOpen(true);
  };

  const handleSaveFecha = async () => {
    if (!contract) return;
    try {
      await contractService.update(contract.id, { fechaInicio: editFechaValue } as any);
      toast.success('Fecha de inicio actualizada y cronograma regenerado');
      setIsEditFechaOpen(false);
      loadContract(contract.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar fecha');
    }
  };

  const openEditPagoInicial = () => {
    if (!contract) return;
    setEditPagoInicialValue(parseFloat(contract.pagoInicial.toString()).toFixed(2));
    setIsEditPagoInicialOpen(true);
  };

  const handleSavePagoInicial = async () => {
    if (!contract) return;
    try {
      await contractService.update(contract.id, { pagoInicial: parseFloat(editPagoInicialValue) } as any);
      toast.success('Pago inicial actualizado y cronograma regenerado');
      setIsEditPagoInicialOpen(false);
      loadContract(contract.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar pago inicial');
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
          <p className="text-slate-400">
            {contract.vehicle?.placa} - {contract.vehicle?.marca}{' '}
            {contract.vehicle?.modelo}
          </p>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>
              Inicio:{' '}
              {format(parseDate(contract.fechaInicio), 'dd/MM/yyyy', { locale: es })}
            </span>
            {contract.estado === 'Borrador' && (
              <button
                onClick={openEditFecha}
                className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
              >
                Editar fecha
              </button>
            )}
          </p>
        </div>
        <StatusBadge status={contract.estado} />
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm text-slate-400 mb-1">Precio Total</h3>
            {contract.estado === 'Borrador' && (
              <button onClick={openEditPrecio} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Editar precio y comisión">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">S/ {parseFloat(contract.precio.toString()).toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm text-slate-400 mb-1">Pago Inicial</h3>
            {contract.estado === 'Borrador' && (
              <button onClick={openEditPagoInicial} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Editar pago inicial">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            S/ {parseFloat(contract.pagoInicial.toString()).toFixed(2)}
            {!contract.pagoInicialRegistrado && contract.pagoInicial > 0 && (
              <span className="text-yellow-400 text-xs ml-1">(Pendiente)</span>
            )}
          </p>
        </div>
        <div className="glass rounded-xl p-4 md:p-6">
          <h3 className="text-xs md:text-sm text-slate-400 mb-1">Saldo Pendiente</h3>
          <p className="text-xl md:text-2xl font-bold text-red-400">
            S/ {schedule.reduce((sum, s) => sum + parseFloat(s.saldo?.toString() || '0'), 0).toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-xl p-4 md:p-6">
          <h3 className="text-xs md:text-sm text-slate-400 mb-1">Total Pagado</h3>
          <p className="text-xl md:text-2xl font-bold text-green-400">
            S/ {(payments.reduce((sum, p) => sum + parseFloat(p.importe?.toString() || '0'), 0)).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <span className="font-medium text-white">Meses:</span> {contract.meses || '-'} • <span className="font-medium text-white">Cuotas:</span> {contract.numeroCuotas} ({contract.frecuencia})
          {(contract.comisionPorcentaje ?? 0) > 0 && (
            <span className="ml-4"><span className="font-medium text-white">Comisión:</span> {contract.comisionPorcentaje}%</span>
          )}
          {(contract.moraPorcentaje ?? 0) > 0 && (
            <span className="ml-4"><span className="font-medium text-white">Mora diaria:</span> {contract.moraPorcentaje}%</span>
          )}
        </p>
        {contract.estado === 'Borrador' && (
          <button
            onClick={openEditMesesFrecuencia}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors ml-4 shrink-0"
          >
            <Edit2 className="w-3 h-3" />
            Editar plazo
          </button>
        )}
      </div>

      {/* Datos del Cliente */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Datos del Cliente</h3>
          {contract.estado !== 'Anulado' && (
            <button
              onClick={openEditCliente}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-slate-500 block text-xs">Nombre</span>
            <span className="text-white">{contract.clienteNombre || <span className="text-slate-500 italic">—</span>}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">DNI</span>
            <span className="text-white">{contract.clienteDni || <span className="text-slate-500 italic">—</span>}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Teléfono</span>
            <span className="text-white">{contract.clienteTelefono || <span className="text-slate-500 italic">—</span>}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Dirección</span>
            <span className="text-white">{contract.clienteDireccion || <span className="text-slate-500 italic">—</span>}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {contract.estado !== 'Cancelado' && contract.estado !== 'Anulado' && (
        <div className="flex flex-wrap gap-2 md:gap-3">
          {!contract.pagoInicialRegistrado && contract.pagoInicial > 0 && (
            <Tooltip text="Registra el pago de entrada del contrato">
              <Button onClick={() => openPaymentModal()}>
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Pago Inicial
              </Button>
            </Tooltip>
          )}
          <Tooltip text="Registra un abono o cuota del cronograma">
            <Button variant="secondary" onClick={() => openPaymentModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          </Tooltip>
          {contract.estado === 'Vigente' && (
            <Tooltip text="Agrega un seguro, GPS u otro cargo adicional al contrato">
              <Button variant="secondary" onClick={() => setIsSubcontractModalOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Agregar Subcontrato
              </Button>
            </Tooltip>
          )}
          {contract.estado === 'Vigente' && (
            <Tooltip text="Cancelar: el contrato termina antes de tiempo, los pagos quedan en Caja">
              <Button variant="ghost" onClick={handleCancelContract}
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Contrato
              </Button>
            </Tooltip>
          )}
          <Tooltip text="Anular: el contrato se invalida completamente, sus pagos NO aparecen en Caja">
            <Button variant="ghost" onClick={handleAnnulContract}
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
            >
              <Ban className="w-4 h-4 mr-2" />
              Anular Contrato
            </Button>
          </Tooltip>
          <Tooltip text="Corrige las fechas de cuotas pendientes sin modificar las ya pagadas">
            <Button variant="ghost" onClick={handleRebuildSchedule}
              className="text-sky-400 hover:text-sky-300 hover:bg-sky-900/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalcular Fechas
            </Button>
          </Tooltip>
        </div>
      )}

      {/* Schedule + Pagos en layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-4 items-start">
        {/* Schedule Grid */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold text-white">Cronograma de Pagos</h2>
            {schedule.length > PAGE_SIZE && (
              <span className="text-xs text-slate-400">
                {(schedulePage - 1) * PAGE_SIZE + 1}-{Math.min(schedulePage * PAGE_SIZE, schedule.length)} / {schedule.length}
              </span>
            )}
          </div>
          {/* En móvil el cronograma tiene scroll horizontal contenido */}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">#</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Vencimiento</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Capital</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Total</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Pagado</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Saldo</th>
                {(contract.moraPorcentaje ?? 0) > 0 && (
                  <th className="text-left px-6 py-3 text-sm font-medium text-orange-400">Mora</th>
                )}
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Estado</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {schedule
                .slice((schedulePage - 1) * PAGE_SIZE, schedulePage * PAGE_SIZE)
                .map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                <td className="px-6 py-3 text-white">{item.numeroCuota}</td>
                <td className="px-6 py-3 text-slate-300">
                  {format(parseDate(item.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.capital.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.total.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-slate-300">S/ {parseFloat(item.montoPagado.toString()).toFixed(2)}</td>
                <td className="px-6 py-3 text-white font-medium">S/ {parseFloat(item.saldo.toString()).toFixed(2)}</td>
                {(contract.moraPorcentaje ?? 0) > 0 && (() => {
                  const moraPct = contract.moraPorcentaje ?? 0;
                  const mora = item.estado === 'Vencida'
                    ? Math.round(
                        parseFloat(item.saldo.toString()) *
                        (moraPct / 100) *
                        differenceInDays(new Date(), parseDate(item.fechaVencimiento)) *
                        100
                      ) / 100
                    : 0;
                  return (
                    <td className="px-6 py-3">
                      {mora > 0
                        ? <span className="text-orange-400 font-medium">S/ {mora.toFixed(2)}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                  );
                })()}
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
          </div>{/* fin overflow-x-auto */}

          {schedule.length > PAGE_SIZE && (
            <div className="flex justify-between items-center px-4 md:px-6 py-3 text-sm text-slate-400">
              <span>
                Página {schedulePage} de {Math.ceil(schedule.length / PAGE_SIZE)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                  disabled={schedulePage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSchedulePage((p) => Math.min(Math.ceil(schedule.length / PAGE_SIZE), p + 1))
                  }
                  disabled={schedulePage === Math.ceil(schedule.length / PAGE_SIZE)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Payments, a la derecha */}
        {payments.length > 0 && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Pagos Registrados</h2>
              <span className="text-xs text-slate-400">
                {payments.length} pago{payments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Fecha</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Tipo</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Importe</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-700/50">
                    <td className="px-4 py-2 text-slate-300">
                      {format(parseDate(payment.fechaPago), 'dd/MM/yy', { locale: es })}
                    </td>
                    <td className="px-4 py-2 text-slate-300">{payment.tipo}</td>
                    <td className="px-4 py-2 text-green-400 font-medium">
                      S/ {parseFloat(payment.importe.toString()).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-slate-400 truncate max-w-[120px]">
                      {payment.usuarioNombre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              error={paymentErrors.fechaPago?.message as string}
              {...register('fechaPago', { required: 'Fecha requerida' })}
            />
            <Input
              label="Importe (S/)"
              type="number"
              step="0.01"
              min="0.01"
              error={paymentErrors.importe?.message as string}
              {...register('importe', {
                required: 'Ingrese el importe',
                min: { value: 0.01, message: 'Debe ser mayor a 0' },
              })}
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
            <Button variant="ghost" type="button" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
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
                      Creado: {format(parseDate(sub.createdAt), 'dd/MM/yyyy', { locale: es })}
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
                        (cuota.estado === 'Vencida' || isBefore(parseDate(cuota.fechaVencimiento), startOfDay(new Date())) || 
                         cuota.fechaVencimiento <= new Date().toISOString().split('T')[0]);
                      return (
                        <div key={cuota.id} className="grid grid-cols-7 gap-2 text-sm py-1 border-t border-slate-700/30 items-center">
                          <span className="text-white">{cuota.numeroCuota}</span>
                          <span className="text-slate-300">{format(parseDate(cuota.fechaVencimiento), 'dd/MM/yy')}</span>
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
                disabled={isSubmitting}
                onClick={() => {
                  setIsSubcontractPaymentModalOpen(false);
                  setSelectedSubcontractSchedule(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Pago Inicial Modal */}
      <Modal
        isOpen={isEditPagoInicialOpen}
        onClose={() => setIsEditPagoInicialOpen(false)}
        title="Editar Pago Inicial"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Al cambiar el pago inicial, el cronograma de pagos se regenerará automáticamente.
          </p>
          <Input
            label="Nuevo Pago Inicial"
            type="number"
            step="0.01"
            value={editPagoInicialValue}
            onChange={(e) => setEditPagoInicialValue(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditPagoInicialOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePagoInicial}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Fecha Inicio Modal */}
      <Modal
        isOpen={isEditFechaOpen}
        onClose={() => setIsEditFechaOpen(false)}
        title="Editar Fecha de Inicio"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Solo se puede modificar la fecha mientras el contrato está en estado
            Borrador. El cronograma se regenerará con la nueva fecha.
          </p>
          <Input
            label="Nueva Fecha de Inicio"
            type="date"
            value={editFechaValue}
            onChange={(e) => setEditFechaValue(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditFechaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFecha}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Cliente Modal */}
      <Modal
        isOpen={isEditClienteOpen}
        onClose={() => setIsEditClienteOpen(false)}
        title="Editar Datos del Cliente"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={editClienteNombre} onChange={(e) => setEditClienteNombre(e.target.value)} />
            <Input label="DNI" value={editClienteDni} onChange={(e) => setEditClienteDni(e.target.value)} />
            <Input label="Teléfono" value={editClienteTelefono} onChange={(e) => setEditClienteTelefono(e.target.value)} />
            <Input label="Dirección" value={editClienteDireccion} onChange={(e) => setEditClienteDireccion(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsEditClienteOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCliente}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Precio / Comisión / Mora Modal */}
      <Modal
        isOpen={isEditPrecioOpen}
        onClose={() => setIsEditPrecioOpen(false)}
        title="Editar Precio y Comisión"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Al cambiar el precio o la comisión el cronograma se regenerará automáticamente.
          </p>
          <Input
            label="Precio Total (S/)"
            type="number"
            step="0.01"
            min={0}
            value={editPrecioValue}
            onChange={(e) => setEditPrecioValue(e.target.value)}
          />
          <Input
            label="Comisión (%)"
            type="number"
            step="0.01"
            min={0}
            value={editComisionValue}
            onChange={(e) => setEditComisionValue(e.target.value)}
          />
          <Input
            label="Mora diaria (%)"
            type="number"
            step="0.01"
            min={0}
            value={editMoraValue}
            onChange={(e) => setEditMoraValue(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditPrecioOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrecio}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Meses / Frecuencia Modal */}
      <Modal
        isOpen={isEditMesesFrecuenciaOpen}
        onClose={() => setIsEditMesesFrecuenciaOpen(false)}
        title="Editar Plazo y Frecuencia"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Al cambiar los meses o la frecuencia el cronograma se regenerará automáticamente.
          </p>
          <Input
            label="Meses"
            type="number"
            min={1}
            value={editMesesValue}
            onChange={(e) => setEditMesesValue(e.target.value)}
          />
          <Select
            label="Frecuencia de Pago"
            value={editFrecuenciaValue}
            onChange={(e) => setEditFrecuenciaValue(e.target.value)}
            options={[
              { value: 'Diario', label: 'Diario' },
              { value: 'Semanal', label: 'Semanal' },
              { value: 'Quincenal', label: 'Quincenal' },
              { value: 'Mensual', label: 'Mensual' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditMesesFrecuenciaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMesesFrecuencia}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación reutilizable */}
      <ConfirmModal
        isOpen={confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
      />
    </div>
  );
}
