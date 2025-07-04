import React from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
}

const alertStyles = {
  success: {
    icon: '✓',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
  error: {
    icon: '✕',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: '⚠',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: 'ℹ',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
};

export default function AlertModal({ isOpen, onClose, type, title, message }: AlertModalProps) {
  if (!isOpen) return null;

  const styles = alertStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative transform overflow-hidden rounded-lg ${styles.bgColor} border ${styles.borderColor} shadow-xl transition-all duration-300 ease-out sm:my-8 sm:w-full sm:max-w-lg`}>
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
                <span className={`text-2xl font-bold ${styles.iconColor}`}>
                  {styles.icon}
                </span>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className={`text-lg font-medium leading-6 ${styles.titleColor}`}>
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${styles.messageColor}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${styles.buttonColor}`}
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}