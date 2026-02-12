import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { vehicleService } from '../../services';
import { Button, Input, StatusBadge, Modal, Select } from '../../components/ui';
import type { Vehicle } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadVehicles();
  }, [page, search]);

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await vehicleService.getAll({
        page,
        limit: 10,
        placa: search || undefined,
      });
      setVehicles(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      // Solo log en consola, no mostrar error al usuario
      // Un listado vacío no es un error
      console.error('Error al cargar vehículos:', error);
      setVehicles([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    reset({});
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    reset(vehicle);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, data);
        toast.success('Vehículo actualizado');
      } else {
        await vehicleService.create(data);
        toast.success('Vehículo creado');
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos</h1>
          <p className="text-slate-400">Gestión de vehículos del sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Vehículo
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
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Placa</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Marca</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Modelo</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Año</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Km</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay vehículos registrados
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-white font-medium">{vehicle.placa}</td>
                  <td className="px-6 py-4 text-slate-300">{vehicle.marca}</td>
                  <td className="px-6 py-4 text-slate-300">{vehicle.modelo}</td>
                  <td className="px-6 py-4 text-slate-300">{vehicle.anio}</td>
                  <td className="px-6 py-4 text-slate-300">{vehicle.kilometraje.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={vehicle.estado} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Placa"
              placeholder="ABC-123"
              uppercase
              disabled={!!editingVehicle}
              error={errors.placa?.message as string}
              {...register('placa', { required: 'Requerido' })}
            />
            <Input
              label="Marca"
              placeholder="TOYOTA"
              uppercase
              error={errors.marca?.message as string}
              {...register('marca', { required: 'Requerido' })}
            />
            <Input
              label="Modelo"
              placeholder="COROLLA"
              uppercase
              error={errors.modelo?.message as string}
              {...register('modelo', { required: 'Requerido' })}
            />
            <Input
              label="Año"
              type="number"
              placeholder="2020"
              error={errors.anio?.message as string}
              {...register('anio', { required: 'Requerido', valueAsNumber: true })}
            />
            <Input
              label="Color"
              placeholder="Blanco"
              {...register('color')}
            />
            <Input
              label="Kilometraje"
              type="number"
              placeholder="0"
              {...register('kilometraje', { valueAsNumber: true })}
            />
          </div>
          <Input
            label="Observaciones"
            placeholder="Notas adicionales..."
            {...register('observaciones')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingVehicle ? 'Guardar cambios' : 'Crear vehículo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
