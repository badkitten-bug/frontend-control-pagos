import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Play, XCircle, Ban } from 'lucide-react';
import { contractService, vehicleService } from '../../services';
import { clientService, Client } from '../../services/client.service';
import { Button, Input, StatusBadge, Modal, Select, SearchableSelect } from '../../components/ui';
import type { Contract, Vehicle } from '../../types';
import toast from 'react-hot-toast';
import { useForm, useWatch } from 'react-hook-form';

const FREQUENCY_OPTIONS = [
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

type TabContract = 'borradores' | 'vigentes' | 'cancelados' | 'anulados';

type ContractFormValues = {
  fechaInicio: string;
  precio: string;
  pagoInicial: string;
  meses: string;
  frecuencia: string;
  comisionPorcentaje?: string;
  moraPorcentaje?: string;
  clienteNombre?: string;
  clienteDni?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
};

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabContract>('vigentes');
  const [clienteFilter, setClienteFilter] = useState('');
  const [fechaInicioDesde, setFechaInicioDesde] = useState('');
  const [fechaInicioHasta, setFechaInicioHasta] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const watchedMeses = useWatch({ control, name: 'meses' });
  const watchedFrecuencia = useWatch({
    control,
    name: 'frecuencia',
    defaultValue: 'Mensual',
  });
  const watchedFechaInicio = useWatch({ control, name: 'fechaInicio' });

  const parsedMeses = Number(watchedMeses || 0);
  let cuotasCalculadas = 0;
  if (parsedMeses > 0) {
    switch (watchedFrecuencia) {
      case 'Diario':
        if (watchedFechaInicio) {
          const start = new Date(watchedFechaInicio);
          const end = new Date(start);
          end.setMonth(end.getMonth() + parsedMeses);
          const diffMs = end.getTime() - start.getTime();
          cuotasCalculadas = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }
        break;
      case 'Semanal':
        if (watchedFechaInicio) {
          const start = new Date(watchedFechaInicio);
          const end = new Date(start);
          end.setMonth(end.getMonth() + parsedMeses);
          const diffMs = end.getTime() - start.getTime();
          cuotasCalculadas = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
        } else {
          // fallback sin fecha
          const approxDias = parsedMeses * 30.44;
          cuotasCalculadas = Math.round(approxDias / 7);
        }
        break;
      case 'Quincenal':
        cuotasCalculadas = parsedMeses * 2;
        break;
      case 'Mensual':
      default:
        cuotasCalculadas = parsedMeses;
        break;
    }
  }

  const MAX_CUOTAS = 2000;
  const excedeMaxCuotas = cuotasCalculadas > MAX_CUOTAS;

  useEffect(() => {
    loadContracts();
  }, [page, search, tab, clienteFilter, fechaInicioDesde, fechaInicioHasta]);

  const TAB_ESTADO: Record<TabContract, string> = {
    borradores: 'Borrador',
    vigentes: 'Vigente',
    cancelados: 'Cancelado',
    anulados: 'Anulado',
  };

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const response = await contractService.getAll({
        page,
        limit: 10,
        placa: search || undefined,
        estado: TAB_ESTADO[tab],
        clienteNombre: clienteFilter || undefined,
        fechaInicioDesde: fechaInicioDesde || undefined,
        fechaInicioHasta: fechaInicioHasta || undefined,
      });
      setContracts(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setContracts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const [vehicles, clientList] = await Promise.all([
        vehicleService.getAvailable(true),
        clientService.getActive(),
      ]);
      setAvailableVehicles(vehicles);
      setClients(clientList);
      setSelectedVehicleId('');
      setSelectedClientId('');
      reset({
        fechaInicio: new Date().toISOString().split('T')[0],
        frecuencia: 'Mensual',
        clienteNombre: '',
        clienteDni: '',
        clienteTelefono: '',
        clienteDireccion: '',
      });
      setIsModalOpen(true);
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setValue('clienteNombre', `${client.nombres} ${client.apellidos}`);
        setValue('clienteDni', client.dni);
        setValue('clienteTelefono', client.telefono || '');
      }
    } else {
      setValue('clienteNombre', '');
      setValue('clienteDni', '');
      setValue('clienteTelefono', '');
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedVehicleId) {
      toast.error('Seleccione un vehículo');
      return;
    }
    const precio = parseFloat(data.precio);
    const pagoInicial = parseFloat(data.pagoInicial);
    if (pagoInicial >= precio) {
      toast.error('El pago inicial no puede ser mayor o igual al precio total');
      return;
    }
    if (excedeMaxCuotas) {
      toast.error(`Demasiadas cuotas (${cuotasCalculadas}). Reduce los meses o cambia la frecuencia.`);
      return;
    }
    try {
      await contractService.create({
        vehicleId: parseInt(selectedVehicleId),
        fechaInicio: data.fechaInicio,
        precio,
        pagoInicial,
        meses: parseInt(data.meses),
        frecuencia: data.frecuencia,
        comisionPorcentaje: data.comisionPorcentaje ? parseFloat(data.comisionPorcentaje) : 0,
        moraPorcentaje: data.moraPorcentaje ? parseFloat(data.moraPorcentaje) : 0,
        clienteNombre: data.clienteNombre,
        clienteDni: data.clienteDni,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion,
      });
      toast.success('Contrato creado exitosamente');
      setIsModalOpen(false);
      loadContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear contrato');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await contractService.activate(id);
      toast.success('Contrato activado');
      loadContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al activar contrato');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Está seguro de cancelar este contrato?')) return;
    try {
      await contractService.cancel(id);
      toast.success('Contrato cancelado');
      loadContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const handleAnnul = async (id: number) => {
    if (!confirm('¿Está seguro de ANULAR este contrato? Esta acción liberará el vehículo.')) return;
    try {
      await contractService.annul(id);
      toast.success('Contrato anulado');
      loadContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contratos</h1>
          <p className="text-slate-400">Gestión de contratos de vehículos</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contrato
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-start gap-2 md:gap-3">
        <div className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700">
          {(
            [
              { key: 'borradores', label: 'Borradores' },
              { key: 'vigentes',   label: 'Vigentes' },
              { key: 'cancelados', label: 'Cancelados' },
              { key: 'anulados',   label: 'Anulados' },
            ] as { key: TabContract; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === key ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar por placa..."
          value={search}
          onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }}
          className="w-36 md:max-w-xs"
        />
        <Input
          placeholder="Buscar por cliente..."
          value={clienteFilter}
          onChange={(e) => { setClienteFilter(e.target.value); setPage(1); }}
          className="w-36 md:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fechaInicioDesde}
            onChange={(e) => { setFechaInicioDesde(e.target.value); setPage(1); }}
            className="w-36"
            title="Fecha inicio desde"
          />
          <span className="text-slate-500 text-sm">–</span>
          <Input
            type="date"
            value={fechaInicioHasta}
            onChange={(e) => { setFechaInicioHasta(e.target.value); setPage(1); }}
            className="w-36"
            title="Fecha inicio hasta"
          />
          {(clienteFilter || fechaInicioDesde || fechaInicioHasta) && (
            <button
              type="button"
              onClick={() => { setClienteFilter(''); setFechaInicioDesde(''); setFechaInicioHasta(''); setPage(1); }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── MÓVIL: cards ── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="glass rounded-xl px-4 py-8 text-center text-slate-400">Cargando...</div>
        ) : contracts.length === 0 ? (
          <div className="glass rounded-xl px-4 py-8 text-center text-slate-400">No hay contratos registrados</div>
        ) : contracts.map((contract) => (
          <div key={contract.id} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500">#{contract.id}</span>
                <p className="text-white font-semibold text-lg leading-tight">
                  {contract.vehicle?.placa}
                </p>
                <p className="text-slate-400 text-sm">{contract.vehicle?.marca} {contract.vehicle?.modelo}</p>
              </div>
              <StatusBadge status={contract.estado} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Cliente</span>
                <p className="text-slate-300">{contract.clienteNombre || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Precio</span>
                <p className="text-slate-300">S/ {parseFloat(contract.precio.toString()).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Plazo</span>
                <p className="text-slate-300">{contract.meses || '-'} meses · {contract.numeroCuotas} cuotas</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Frecuencia</span>
                <p className="text-slate-300">{contract.frecuencia}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
              <Link
                to={`/contracts/${contract.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors"
              >
                <Eye className="w-4 h-4" /> Ver detalle
              </Link>
              {contract.estado === 'Borrador' && (
                <button
                  onClick={() => handleActivate(contract.id)}
                  className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Activar"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {contract.estado === 'Vigente' && (
                <button
                  onClick={() => handleCancel(contract.id)}
                  className="p-2 text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {contract.estado !== 'Anulado' && (
                <button
                  onClick={() => handleAnnul(contract.id)}
                  className="p-2 text-orange-400 hover:bg-orange-900/20 rounded-lg transition-colors"
                  title="Anular"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: tabla ── */}
      <div className="hidden md:block glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">ID</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Placa</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cliente</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Precio</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Meses</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Frecuencia</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">No hay contratos registrados</td></tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-white font-medium">#{contract.id}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.vehicle?.placa}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.clienteNombre || '-'}</td>
                  <td className="px-6 py-4 text-slate-300">S/ {parseFloat(contract.precio.toString()).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.meses || '-'} <span className="text-xs text-slate-500">({contract.numeroCuotas} cuotas)</span></td>
                  <td className="px-6 py-4 text-slate-300">{contract.frecuencia}</td>
                  <td className="px-6 py-4"><StatusBadge status={contract.estado} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/contracts/${contract.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {contract.estado === 'Borrador' && (
                        <button onClick={() => handleActivate(contract.id)} className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors" title="Activar contrato">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {contract.estado === 'Vigente' && (
                        <button onClick={() => handleCancel(contract.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors" title="Cancelar contrato">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {contract.estado !== 'Anulado' && (
                        <button onClick={() => handleAnnul(contract.id)} className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 rounded-lg transition-colors" title="Anular contrato">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
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
      )}

      {/* Create Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Contrato"
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SearchableSelect
            label="Vehículo"
            placeholder="Buscar por placa, marca o modelo..."
            options={availableVehicles.map(v => ({
              value: v.id.toString(),
              label: `${v.placa} - ${v.marca} ${v.modelo}`,
              searchText: `${v.placa} ${v.marca} ${v.modelo} ${v.anio}`,
            }))}
            value={selectedVehicleId}
            onChange={setSelectedVehicleId}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              error={errors.fechaInicio?.message as string}
              {...register('fechaInicio', { required: 'Requerido' })}
            />
            <Input
              label="Precio Total"
              type="number"
              step="0.01"
              placeholder="10000.00"
              error={errors.precio?.message as string}
              {...register('precio', {
                required: 'El precio es requerido',
                min: { value: 0.01, message: 'Debe ser mayor a 0' },
              })}
            />
            <Input
              label="Pago Inicial"
              type="number"
              step="0.01"
              placeholder="2000.00"
              error={errors.pagoInicial?.message as string}
              {...register('pagoInicial', {
                required: 'El pago inicial es requerido',
                min: { value: 0, message: 'No puede ser negativo' },
              })}
            />
            <Input
              label="Meses"
              type="number"
              placeholder="20"
              error={errors.meses?.message as string}
              {...register('meses', {
                required: 'Los meses son requeridos',
                min: { value: 1, message: 'Mínimo 1 mes' },
                max: { value: 240, message: 'Máximo 240 meses (20 años)' },
              })}
            />
            <Select
              label="Frecuencia"
              options={FREQUENCY_OPTIONS}
              {...register('frecuencia')}
            />
            <Input
              label="Comisión %"
              type="number"
              step="0.01"
              placeholder="0"
              error={errors.comisionPorcentaje?.message as string}
              {...register('comisionPorcentaje')}
            />
            <Input
              label="Mora % diaria"
              type="number"
              step="0.01"
              placeholder="0"
              error={errors.moraPorcentaje?.message as string}
              {...register('moraPorcentaje')}
            />
          </div>

          {cuotasCalculadas > 0 && (
            <p
              className={`text-sm mt-1 ${
                excedeMaxCuotas ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              Se generarán aproximadamente{' '}
              <span className="font-semibold">{cuotasCalculadas}</span>{' '}
              cuotas{' '}
              {watchedFrecuencia === 'Diario' && '(pagos diarios)'}.
              {excedeMaxCuotas &&
                ` Máximo permitido: ${MAX_CUOTAS}. Reduce los meses o cambia la frecuencia.`}
            </p>
          )}

          <h4 className="font-medium text-white pt-2">Datos del Cliente</h4>
          <SearchableSelect
            label="Seleccionar Cliente Existente"
            placeholder="Buscar cliente por DNI o nombre..."
            options={[
              { value: '', label: '-- Ingresar manualmente --', searchText: '' },
              ...clients.map(c => ({
                value: c.id.toString(),
                label: `${c.dni} - ${c.nombres} ${c.apellidos}`,
                searchText: `${c.dni} ${c.nombres} ${c.apellidos} ${c.telefono || ''}`,
              }))
            ]}
            value={selectedClientId}
            onChange={handleClientSelect}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Juan Pérez"
              {...register('clienteNombre')}
            />
            <Input
              label="DNI"
              placeholder="12345678"
              {...register('clienteDni')}
            />
            <Input
              label="Teléfono"
              placeholder="999888777"
              {...register('clienteTelefono')}
            />
            <Input
              label="Dirección"
              placeholder="Av. Principal 123"
              {...register('clienteDireccion')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Contrato'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
