import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANT_STYLES: Record<Variant, { icon: string; btn: string }> = {
  danger:  { icon: 'text-red-400',    btn: 'bg-red-600 hover:bg-red-500 text-white' },
  warning: { icon: 'text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-500 text-white' },
  info:    { icon: 'text-sky-400',    btn: 'bg-sky-600 hover:bg-sky-500 text-white' },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`p-3 rounded-full bg-slate-700 ${styles.icon}`}>
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white mb-1">{title}</p>
          <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${styles.btn}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
