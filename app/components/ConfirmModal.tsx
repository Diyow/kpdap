"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog.Root 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <Dialog.Content 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
            aria-describedby="confirm-dialog-description"
          >
            <Dialog.Close asChild>
              <button 
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </Dialog.Close>

            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-brand-lightbg text-brand-green'}`}>
                <AlertTriangle size={24} />
              </div>
              
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                {title}
              </Dialog.Title>
              
              <Dialog.Description 
                id="confirm-dialog-description"
                className="text-gray-500 text-sm mb-6 leading-relaxed"
              >
                {description}
              </Dialog.Description>

              <div className="flex flex-col sm:flex-row w-full gap-3">
                <Dialog.Close asChild>
                  <button
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                </Dialog.Close>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center ${
                    isDestructive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-brand-green hover:bg-brand-darkgreen'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : confirmText}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
