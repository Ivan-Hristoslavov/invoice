"use client";

import { useState, useEffect } from "react";
import { Button } from "@radix-ui/themes";
import { FileCheck, AlertTriangle, X } from "lucide-react";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  invoiceNumber: string;
  currentStatus: string;
  newStatus: string;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  currentStatus,
  newStatus,
}: StatusChangeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
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
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getStatusInfo = () => {
    if (newStatus === "ISSUED") {
      return {
        title: "Издаване на фактура",
        description: `Сигурни ли сте, че искате да издадете фактура ${invoiceNumber}?`,
        warning: "След издаване, фактурата не може да бъде редактирана. Ще можете само да я отмените чрез кредитно известие.",
        icon: <FileCheck className="h-12 w-12 text-emerald-500" />,
        confirmText: "Издай фактура",
        buttonColor: "green" as const,
      };
    }
    if (newStatus === "CANCELLED") {
      return {
        title: "Отмяна на фактура",
        description: `Сигурни ли сте, че искате да отмените фактура ${invoiceNumber}?`,
        warning: "Това действие е необратимо. Ще бъде създадено кредитно известие.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        confirmText: "Отмени фактура",
        buttonColor: "red" as const,
      };
    }
    return {
      title: "Промяна на статус",
      description: `Промяна на статуса на фактура ${invoiceNumber}`,
      warning: "",
      icon: <FileCheck className="h-12 w-12 text-blue-500" />,
      confirmText: "Потвърди",
      buttonColor: "blue" as const,
    };
  };

  const statusInfo = getStatusInfo();

  if (!isOpen) return null;

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
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`rounded-full p-3 mb-4 ${
            newStatus === "ISSUED" 
              ? "bg-emerald-100 dark:bg-emerald-950/30" 
              : newStatus === "CANCELLED"
              ? "bg-red-100 dark:bg-red-950/30"
              : "bg-blue-100 dark:bg-blue-950/30"
          }`}>
            {statusInfo.icon}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {statusInfo.title}
          </h2>
          <p className="text-base text-muted-foreground">
            {statusInfo.description}
          </p>
        </div>
        
        {/* Warning box */}
        {statusInfo.warning && (
          <div className={`rounded-lg p-4 my-4 ${
            newStatus === "CANCELLED"
              ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
              : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                newStatus === "CANCELLED"
                  ? "text-red-600 dark:text-red-500"
                  : "text-amber-600 dark:text-amber-500"
              }`} />
              <div className="space-y-1">
                <p className={`text-sm font-medium ${
                  newStatus === "CANCELLED"
                    ? "text-red-900 dark:text-red-200"
                    : "text-amber-800 dark:text-amber-200"
                }`}>
                  {newStatus === "CANCELLED" ? "Внимание: Това действие е необратимо!" : "Важно:"}
                </p>
                <p className={`text-sm ${
                  newStatus === "CANCELLED"
                    ? "text-red-800 dark:text-red-300"
                    : "text-amber-800 dark:text-amber-300"
                }`}>
                  {statusInfo.warning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-row justify-between items-center gap-4 border-t pt-6 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            size="3"
            className="flex-1"
          >
            Отказ
          </Button>
          <Button
            variant="solid"
            color={statusInfo.buttonColor}
            onClick={handleConfirm}
            disabled={isLoading}
            size="3"
            loading={isLoading}
            className="flex-1"
          >
            {!isLoading && (
              <>
                {newStatus === "ISSUED" && <FileCheck className="h-4 w-4" />}
                {newStatus === "CANCELLED" && <AlertTriangle className="h-4 w-4" />}
                {statusInfo.confirmText}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
