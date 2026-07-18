'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  resolve?: (value: boolean) => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        type: 'alert',
        resolve: () => {
          setModal(null);
          resolve();
        },
      });
    });
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        type: 'confirm',
        resolve: (value: boolean) => {
          setModal(null);
          resolve(value);
        },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 select-none animate-fade-in">
          <div className="relative bg-white border border-gray-150 text-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-6 space-y-5 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                modal.title.toLowerCase().includes('error') || modal.title.toLowerCase().includes('delete') || modal.title.toLowerCase().includes('remove')
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                {modal.title.toLowerCase().includes('error') || modal.title.toLowerCase().includes('delete') || modal.title.toLowerCase().includes('remove') ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              
              <div className="space-y-1.5 flex-1 text-left">
                <h3 className="text-sm font-extrabold text-neutral-800 tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-semibold whitespace-pre-wrap">{modal.message}</p>
              </div>
            </div>
            
            <div className="flex gap-2.5 justify-end pt-3 border-t border-neutral-100">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => modal.resolve?.(false)}
                  className="px-4.5 py-2 text-xs font-bold border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-500 hover:text-neutral-700 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => modal.resolve?.(true)}
                className={`px-5.5 py-2.5 text-xs font-bold text-white rounded-xl transition-all duration-200 cursor-pointer shadow-sm ${
                  modal.title.toLowerCase().includes('error') || modal.title.toLowerCase().includes('delete') || modal.title.toLowerCase().includes('remove')
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                    : 'bg-[#c9a84c] hover:bg-[#bfa044] shadow-amber-100'
                }`}
              >
                {modal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
