import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Input, Select, Button } from './ui';
import type { CreateSubcontractDto, PaymentFrequency } from '../types';

interface SubcontractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  onSubmit: (data: CreateSubcontractDto) => Promise<void>;
}

const FREQUENCIES = [
  { value: 'Diario', label: 'Diario' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
];

const SUBCONTRACT_TYPES = [
  { value: 'Reparación', label: 'Reparación' },
  { value: 'Accesorios', label: 'Accesorios' },
  { value: 'Pintura', label: 'Pintura' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Garantía', label: 'Garantía Extendida' },
  { value: 'Otro', label: 'Otro' },
];

const MODALITIES = [
  { value: 'Independiente', label: 'Cuotas Independientes' },
  { value: 'AgregarACuotas', label: 'Agregar a Cuotas Existentes' },
];

export function SubcontractModal({ isOpen, onClose, contractId, onSubmit }: SubcontractModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CreateSubcontractDto>();
  
  const modalidad = watch('modalidad');
  const tipo = watch('tipo');

  useEffect(() => {
    if (isOpen) {
      reset({
        parentContractId: contractId,
        fechaInicio: new Date().toISOString().split('T')[0],
        modalidad: 'AgregarACuotas',
        tipo: 'Reparación',
        frecuencia: 'Mensual',
      });
    }
  }, [isOpen, contractId, reset]);

  const handleFormSubmit = async (data: CreateSubcontractDto) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        parentContractId: contractId,
        monto: parseFloat(data.monto.toString()),
        numeroCuotas: data.numeroCuotas ? parseInt(data.numeroCuotas.toString()) : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Subcontrato"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Subcontrato</strong> permite agregar servicios adicionales (reparación, accesorios, etc.) 
            sobre el contrato existente.
          </p>
        </div>

        {/* Tipo y Monto */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Servicio"
            options={SUBCONTRACT_TYPES}
            {...register('tipo', { required: 'Seleccione el tipo' })}
            error={errors.tipo?.message}
          />
          <Input
            label="Monto (S/)"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('monto', { 
              required: 'El monto es requerido',
              min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
            })}
            error={errors.monto?.message}
          />
        </div>

        {/* Custom Type Input */}
        {tipo === 'Otro' && (
          <Input
            label="Especifique el tipo"
            placeholder="Ej: Llantas nuevas"
            {...register('descripcion', { required: 'Especifique el tipo de servicio' })}
            error={errors.descripcion?.message}
          />
        )}

        {/* Modalidad */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Modalidad de Pago</label>
          <div className="grid grid-cols-1 gap-3">
            {MODALITIES.map((mod) => (
              <label
                key={mod.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  modalidad === mod.value
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  value={mod.value}
                  {...register('modalidad', { required: true })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-white">{mod.label}</span>
                  <p className="text-sm text-slate-400 mt-1">
                    {mod.value === 'Independiente' 
                      ? 'Se crea un cronograma separado con sus propias cuotas'
                      : 'El monto se distribuye entre las cuotas pendientes del contrato'
                    }
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Campos adicionales para modalidad Independiente */}
        {modalidad === 'Independiente' && (
          <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300">Configuración de Cuotas</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Número de Cuotas"
                type="number"
                min={1}
                placeholder="6"
                {...register('numeroCuotas', { 
                  required: modalidad === 'Independiente' ? 'Requerido' : false,
                  min: { value: 1, message: 'Mínimo 1 cuota' }
                })}
                error={errors.numeroCuotas?.message}
              />
              <Select
                label="Frecuencia"
                options={FREQUENCIES}
                {...register('frecuencia')}
              />
            </div>
            <Input
              label="Fecha de Inicio"
              type="date"
              {...register('fechaInicio', { required: 'Fecha requerida' })}
              error={errors.fechaInicio?.message}
            />
          </div>
        )}

        {/* Descripción */}
        {tipo !== 'Otro' && (
          <Input
            label="Descripción (opcional)"
            placeholder="Detalles adicionales del servicio..."
            {...register('descripcion')}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Subcontrato'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
