"use client";

import { useState, useEffect } from "react";
import { XCircle, AlertTriangle, X, FileText } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  invoiceNumber: string;
}

export function CancelInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
}: CancelInvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

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
    if (!reason.trim()) {
      setError("Причината за отмяна е задължителна");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleOverlayClick}
    >
      <div
        className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6 animate-in zoom-in-95 slide-in-from-bottom-2"
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
          <div className="rounded-full bg-red-100 dark:bg-red-950/30 p-3 mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Отмяна на фактура
          </h2>
          <p className="text-base text-muted-foreground">
            Отмяна на фактура{" "}
            <strong className="font-semibold text-foreground">
              #{invoiceNumber}
            </strong>
          </p>
        </div>

        {/* Info box */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Внимание: Това действие е необратимо!
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">
                При отмяна на издадена фактура автоматично ще бъде създаден
                <strong> сторно документ</strong> за сторниране на сумата.
              </p>
            </div>
          </div>
        </div>

        {/* Credit note info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Сторно документ
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Сторно документът ще съдържа всички артикули от оригиналната
                фактура и ще бъде достъпен в секция "Сторно".
              </p>
            </div>
          </div>
        </div>

        {/* Reason input */}
        <div className="mb-6">
          <Label htmlFor="cancel-reason" className="text-sm font-medium mb-2 block">
            Причина за отмяна <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Въведете причина за отмяна на фактурата..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            className={`min-h-[100px] ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            disabled={isLoading}
          />
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-between items-center gap-4 border-t pt-6">
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
            color="red"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            size="3"
            loading={isLoading}
            className="flex-1"
          >
            {!isLoading && (
              <>
                <XCircle className="h-4 w-4" />
                Отмени фактура
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
