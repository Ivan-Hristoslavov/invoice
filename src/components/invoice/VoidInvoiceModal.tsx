"use client";

import { useState, useEffect } from "react";
import { Ban, AlertTriangle, X } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VoidInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  invoiceNumber: string;
}

export function VoidInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
}: VoidInvoiceModalProps) {
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
      setError("Причината за анулиране е задължителна");
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
          <div className="rounded-full bg-orange-100 dark:bg-orange-950/30 p-3 mb-4">
            <Ban className="h-8 w-8 text-orange-600 dark:text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Анулиране на чернова
          </h2>
          <p className="text-base text-muted-foreground">
            Анулиране на фактура{" "}
            <strong className="font-semibold text-foreground">
              #{invoiceNumber}
            </strong>
          </p>
        </div>

        {/* Info box */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Какво е анулиране?
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Фактурата ще бъде маркирана като анулирана, но ще остане видима
                в списъка. Можете да я изтриете по-късно, ако желаете.
              </p>
            </div>
          </div>
        </div>

        {/* Reason input */}
        <div className="mb-6">
          <Label htmlFor="void-reason" className="text-sm font-medium mb-2 block">
            Причина за анулиране <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="void-reason"
            placeholder="Въведете причина за анулиране на черновата..."
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
            color="orange"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            size="3"
            loading={isLoading}
            className="flex-1"
          >
            {!isLoading && (
              <>
                <Ban className="h-4 w-4" />
                Анулирай
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
