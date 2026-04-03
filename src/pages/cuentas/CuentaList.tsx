import { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Landmark } from 'lucide-react';
import { cuentaService } from '../../services';
import { Button, Input, Modal } from '../../components/ui';
import type { Cuenta } from '../../types';
import toast from 'react-hot-toast';

export function CuentaList() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  const [nombreInput, setNombreInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCuentas();
  }, []);

  const loadCuentas = async () => {
    setIsLoading(true);
    try {
      const data = await cuentaService.getAll();
      setCuentas(data);
    } catch {
      toast.error('Error al cargar cuentas');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCuenta(null);
    setNombreInput('');
    setIsModalOpen(true);
  };

  const openEdit = (cuenta: Cuenta) => {
    setEditingCuenta(cuenta);
    setNombreInput(cuenta.nombre);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombreInput.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      if (editingCuenta) {
        await cuentaService.update(editingCuenta.id, { nombre: nombreInput.trim() });
        toast.success('Cuenta actualizada');
      } else {
        await cuentaService.create(nombreInput.trim());
        toast.success('Cuenta creada');
      }
      setIsModalOpen(false);
      loadCuentas();
    } catch {
      toast.error('Error al guardar cuenta');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActiva = async (cuenta: Cuenta) => {
    try {
      await cuentaService.update(cuenta.id, { activa: !cuenta.activa });
      toast.success(cuenta.activa ? 'Cuenta desactivada' : 'Cuenta activada');
      loadCuentas();
    } catch {
      toast.error('Error al actualizar cuenta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6" />
            Cuentas
          </h1>
          <p className="text-slate-400">Administra las cuentas de depósito de pagos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Lista */}
      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-slate-400">Cargando...</div>
        ) : cuentas.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay cuentas registradas.</p>
            <p className="text-sm mt-1">Crea una cuenta para empezar a asociar pagos.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-white font-medium">{cuenta.nombre}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cuenta.activa
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-600/40 text-slate-400'
                    }`}>
                      {cuenta.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(cuenta)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Editar nombre"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActiva(cuenta)}
                        className={`p-2 rounded-lg transition-colors ${
                          cuenta.activa
                            ? 'text-green-400 hover:text-red-400 hover:bg-red-900/20'
                            : 'text-slate-400 hover:text-green-400 hover:bg-green-900/20'
                        }`}
                        title={cuenta.activa ? 'Desactivar' : 'Activar'}
                      >
                        {cuenta.activa
                          ? <ToggleRight className="w-5 h-5" />
                          : <ToggleLeft className="w-5 h-5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la cuenta"
            placeholder="Ej: Amanda Yape, Iván BCP 070..."
            value={nombreInput}
            onChange={(e) => setNombreInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
