import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { clientService, Client, CreateClientDto } from '../../services/client.service';
import { Button, Input, Modal } from '../../components/ui';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClientDto>();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll(searchTerm || undefined);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadClients();
  };

  const openModal = (client?: Client) => {
    setEditingClient(client || null);
    if (client) {
      reset({
        dni: client.dni,
        nombres: client.nombres,
        apellidos: client.apellidos,
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
      });
    } else {
      reset({
        dni: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        email: '',
        direccion: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CreateClientDto) => {
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, data);
        toast.success('Cliente actualizado');
      } else {
        await clientService.create(data);
        toast.success('Cliente creado');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    try {
      await clientService.delete(id);
      toast.success('Cliente desactivado');
      loadClients();
    } catch (error) {
      toast.error('Error al desactivar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Clientes
          </h1>
          <p className="text-slate-400">Gestión de clientes del sistema</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por DNI, nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {client.nombres} {client.apellidos}
                </h3>
                <p className="text-sm text-slate-400">DNI: {client.dni}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openModal(client)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(client.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              {client.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {client.telefono}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {client.email}
                </div>
              )}
              {client.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{client.direccion}</span>
                </div>
              )}
            </div>

            {!client.activo && (
              <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                Inactivo
              </span>
            )}
          </div>
        ))}
      </div>

      {clients.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-400">
          No hay clientes registrados
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DNI"
              maxLength={8}
              error={errors.dni?.message}
              disabled={!!editingClient}
              {...register('dni', { 
                required: 'DNI requerido',
                pattern: { value: /^\d{8}$/, message: '8 dígitos' }
              })}
            />
            <Input
              label="Teléfono"
              {...register('telefono')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombres"
              uppercase
              error={errors.nombres?.message}
              {...register('nombres', { required: 'Requerido' })}
            />
            <Input
              label="Apellidos"
              uppercase
              error={errors.apellidos?.message}
              {...register('apellidos', { required: 'Requerido' })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
          />

          <Input
            label="Dirección"
            {...register('direccion')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingClient ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
