'use client'

import React from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmToastProps {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}

const ConfirmToast: React.FC<ConfirmToastProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}) => {
  const handleConfirm = () => {
    onConfirm();
    toast.dismiss();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    toast.dismiss();
  };

  const typeStyles = {
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    },
    danger: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`${styles.bg} border rounded-lg p-4 max-w-sm shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium mb-4">
            {message}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${styles.cancelBtn}`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Función helper para mostrar confirmaciones
export const showConfirmToast = ({
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = 'warning'
}: ConfirmToastProps) => {
  return toast.custom(
    () => (
      <ConfirmToast
        message={message}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText={confirmText}
        cancelText={cancelText}
        type={type}
      />
    ),
    {
      duration: Infinity, // No auto-dismiss
      position: 'top-center',
    }
  );
};

export default ConfirmToast;