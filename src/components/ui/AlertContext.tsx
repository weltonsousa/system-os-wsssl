'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal, { AlertType } from './AlertModal';

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const showSuccess = (message: string, title: string = 'Sucesso!') => {
    showAlert('success', title, message);
  };

  const showError = (message: string, title: string = 'Erro!') => {
    showAlert('error', title, message);
  };

  const showWarning = (message: string, title: string = 'Atenção!') => {
    showAlert('warning', title, message);
  };

  const showInfo = (message: string, title: string = 'Informação') => {
    showAlert('info', title, message);
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}