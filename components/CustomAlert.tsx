import React, { useState, useEffect } from 'react';

interface CustomAlertProps {
  message: string;
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="text-gray-800 whitespace-pre-line mb-6">{message}</div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded text-white font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1a3a6e' }}
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for using custom alert
export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  const showAlert = (message: string) => {
    return new Promise<void>((resolve) => {
      setAlertState({ show: true, message });
      
      // Store resolve function
      (window as any).__customAlertResolve = resolve;
    });
  };

  const closeAlert = () => {
    setAlertState({ show: false, message: '' });
    
    // Call resolve if exists
    if ((window as any).__customAlertResolve) {
      (window as any).__customAlertResolve();
      delete (window as any).__customAlertResolve;
    }
  };

  const AlertComponent = alertState.show ? (
    <CustomAlert message={alertState.message} onClose={closeAlert} />
  ) : null;

  return { showAlert, AlertComponent };
};

