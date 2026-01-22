"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@radix-ui/themes";

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  invoiceNumber: string;
}

export function DeleteInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
}: DeleteInvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading && countdown === 0) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, countdown, onClose]);

  const handleConfirm = async () => {
    if (countdown !== 0 || isLoading) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading && countdown === 0) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isDeleteEnabled = countdown === 0 && !isLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleOverlayClick}
    >
      <div
        className="glass-card relative rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading || countdown !== 0}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-950/30 p-3 mb-4">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Изтриване на фактура
          </h2>
          <p className="text-base text-muted-foreground">
            Сигурни ли сте, че искате да изтриете фактура{" "}
            <strong className="font-semibold text-foreground">
              #{invoiceNumber}
            </strong>
            ?
          </p>
        </div>

        {/* Warning box */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Внимание: Това действие е необратимо!
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">
                Всички данни, свързани с тази фактура, ще бъдат премахнати
                завинаги. Това включва артикулите, сумите и всички свързани
                записи.
              </p>
            </div>
          </div>
        </div>

        {/* Countdown display */}
        {countdown !== null && countdown > 0 && (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="text-6xl font-bold text-red-600 dark:text-red-500 mb-2 animate-pulse">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground">
              Бутонът за изтриване ще стане активен след {countdown} секунди
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-row justify-between items-center gap-4 border-t pt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading || countdown !== 0}
            size="3"
            className="flex-1"
          >
            Отказ
          </Button>
          <Button
            variant="solid"
            color="red"
            onClick={handleConfirm}
            disabled={!isDeleteEnabled}
            size="3"
            loading={isLoading}
            className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isLoading && (
              <>
                <Trash2 className="h-4 w-4" />
                Изтрий
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
