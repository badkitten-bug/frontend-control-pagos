import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Play, XCircle } from 'lucide-react';
import { contractService, vehicleService } from '../../services';
import { clientService, Client } from '../../services/client.service';
import { Button, Input, StatusBadge, Modal, Select, SearchableSelect } from '../../components/ui';
import type { Contract, Vehicle } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const FREQUENCY_OPTIONS = [
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    loadContracts();
  }, [page, search]);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const response = await contractService.getAll({
        page,
        limit: 10,
        placa: search || undefined,
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
        vehicleService.getAvailable(),
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
      });
      setIsModalOpen(true);
    } catch (error) {
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
    try {
      await contractService.create({
        vehicleId: parseInt(selectedVehicleId),
        fechaInicio: data.fechaInicio,
        precio: parseFloat(data.precio),
        pagoInicial: parseFloat(data.pagoInicial),
        numeroCuotas: parseInt(data.numeroCuotas),
        frecuencia: data.frecuencia,
        comisionPorcentaje: data.comisionPorcentaje ? parseFloat(data.comisionPorcentaje) : 0,
        moraPorcentaje: data.moraPorcentaje ? parseFloat(data.moraPorcentaje) : 0,
        clienteNombre: data.clienteNombre,
        clienteDni: data.clienteDni,
        clienteTelefono: data.clienteTelefono,
      });
      toast.success('Contrato creado');
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

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="Buscar por placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">ID</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Placa</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cliente</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Precio</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cuotas</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Frecuencia</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
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
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No hay contratos registrados
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-white font-medium">#{contract.id}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.vehicle?.placa}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.clienteNombre || '-'}</td>
                  <td className="px-6 py-4 text-slate-300">S/ {parseFloat(contract.precio.toString()).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.numeroCuotas}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.frecuencia}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={contract.estado} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {contract.estado === 'Borrador' && (
                        <button
                          onClick={() => handleActivate(contract.id)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Activar contrato"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {contract.estado === 'Vigente' && (
                        <button
                          onClick={() => handleCancel(contract.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Cancelar contrato"
                        >
                          <XCircle className="w-4 h-4" />
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
            error={!selectedVehicleId && errors.vehicleId ? 'Seleccione un vehículo' : undefined}
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
              {...register('precio', { required: 'Requerido' })}
            />
            <Input
              label="Pago Inicial"
              type="number"
              step="0.01"
              placeholder="2000.00"
              error={errors.pagoInicial?.message as string}
              {...register('pagoInicial', { required: 'Requerido' })}
            />
            <Input
              label="Número de Cuotas"
              type="number"
              placeholder="12"
              error={errors.numeroCuotas?.message as string}
              {...register('numeroCuotas', { required: 'Requerido' })}
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Contrato
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
