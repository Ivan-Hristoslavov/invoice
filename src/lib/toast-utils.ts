"use client";

import { toast } from "@/lib/toast";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ActionToastOptions {
  title: string;
  description?: string;
  action?: ToastAction;
  cancel?: ToastAction;
  duration?: number;
}

// Success toast with optional action button
export function successToast(options: ActionToastOptions) {
  const { title, description, action, cancel, duration = 5000 } = options;

  return toast.success(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick,
    } : undefined,
  });
}

// Error toast with optional retry action
export function errorToast(options: ActionToastOptions) {
  const { title, description, action, cancel, duration = 7000 } = options;

  return toast.error(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick,
    } : undefined,
  });
}

// Info toast
export function infoToast(options: ActionToastOptions) {
  const { title, description, action, cancel, duration = 5000 } = options;

  return toast.info(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick,
    } : undefined,
  });
}

// Warning toast
export function warningToast(options: ActionToastOptions) {
  const { title, description, action, cancel, duration = 6000 } = options;

  return toast.warning(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick,
    } : undefined,
  });
}

// Loading/progress toast
export function loadingToast(title: string, description?: string) {
  return toast.loading(title, {
    description,
  });
}

// Dismiss a specific toast
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

// Promise toast - automatically handles loading, success, error states
export function promiseToast<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
    action?: {
      label: string;
      onClick: (data: T) => void;
    };
  }
) {
  return toast.promise(promise, {
    loading: options.loading,
    success: (data) => {
      return typeof options.success === "function"
        ? options.success(data)
        : options.success;
    },
    error: (error) =>
      typeof options.error === "function"
        ? options.error(error)
        : options.error,
  });
}

// Undo toast - shows a success message with undo action
export function undoToast(
  message: string,
  onUndo: () => void,
  options?: {
    description?: string;
    duration?: number;
  }
) {
  const { description, duration = 5000 } = options || {};

  return toast.success(message, {
    description,
    duration,
    action: {
      label: "Отмяна",
      onClick: onUndo,
    },
  });
}

// Delete confirmation toast
export function deleteToast(
  itemName: string,
  onUndo: () => void,
  options?: {
    duration?: number;
  }
) {
  const { duration = 5000 } = options || {};

  return toast.success(`${itemName} беше изтрит`, {
    duration,
    action: {
      label: "Отмяна",
      onClick: onUndo,
    },
  });
}

// Navigation toast - shows a success message with navigation action
export function navigationToast(
  message: string,
  buttonLabel: string,
  onNavigate: () => void,
  options?: {
    description?: string;
    duration?: number;
  }
) {
  const { description, duration = 5000 } = options || {};

  return toast.success(message, {
    description,
    duration,
    action: {
      label: buttonLabel,
      onClick: onNavigate,
    },
  });
}
