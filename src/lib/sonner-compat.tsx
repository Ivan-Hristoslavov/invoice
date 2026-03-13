"use client";

import * as React from "react";
import { Toast, toast as heroToast } from "@heroui/react";

type ToastAction = {
  label?: React.ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger";
  children?: React.ReactNode;
};

type SonnerLikeOptions = {
  description?: React.ReactNode;
  action?: ToastAction;
  cancel?: ToastAction;
  duration?: number;
  icon?: React.ReactNode;
  className?: string;
  closeButton?: boolean;
};

type ToasterProps = {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  gap?: number;
  expand?: boolean;
  visibleToasts?: number;
  theme?: "light" | "dark" | "system";
  className?: string;
  toastOptions?: Record<string, unknown>;
  closeButton?: boolean;
};

function mapPlacement(position: ToasterProps["position"]) {
  switch (position) {
    case "top-left":
      return "top start" as const;
    case "top-center":
      return "top" as const;
    case "bottom-left":
      return "bottom start" as const;
    case "bottom-center":
      return "bottom" as const;
    case "bottom-right":
      return "bottom end" as const;
    case "top-right":
    default:
      return "top end" as const;
  }
}

function mapAction(action?: ToastAction, cancel?: ToastAction) {
  const source = action ?? cancel;

  if (!source) return undefined;

  return {
    children: source.children ?? source.label,
    className: source.className,
    variant: source.variant,
    onPress: source.onPress ?? source.onClick,
  };
}

function mapOptions(options?: SonnerLikeOptions, variant?: "default" | "accent" | "success" | "warning" | "danger") {
  if (!options) {
    return variant ? { variant } : undefined;
  }

  return {
    description: options.description,
    indicator: options.icon,
    variant,
    timeout: options.duration,
    actionProps: mapAction(options.action, options.cancel),
  };
}

type PromiseOptions<T> = {
  loading: React.ReactNode;
  success: React.ReactNode | ((data: T) => React.ReactNode);
  error: React.ReactNode | ((error: unknown) => React.ReactNode);
};

type LoadingOptions = Omit<SonnerLikeOptions, "duration"> & {
  duration?: number;
};

type ToastFn = ((message: React.ReactNode, options?: SonnerLikeOptions) => string) & {
  success: (message: React.ReactNode, options?: SonnerLikeOptions) => string;
  error: (message: React.ReactNode, options?: SonnerLikeOptions) => string;
  danger: (message: React.ReactNode, options?: SonnerLikeOptions) => string;
  info: (message: React.ReactNode, options?: SonnerLikeOptions) => string;
  warning: (message: React.ReactNode, options?: SonnerLikeOptions) => string;
  loading: (message: React.ReactNode, options?: LoadingOptions) => string;
  promise: <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseOptions<T>) => string;
  dismiss: (toastId?: string | number) => void;
  clear: () => void;
  close: (toastId: string | number) => void;
  pauseAll: () => void;
  resumeAll: () => void;
};

const toast = ((message: React.ReactNode, options?: SonnerLikeOptions) =>
  heroToast(message, mapOptions(options, "default"))) as ToastFn;

toast.success = (message, options) => heroToast.success(message, mapOptions(options, "success"));
toast.error = (message, options) => heroToast.danger(message, mapOptions(options, "danger"));
toast.danger = (message, options) => heroToast.danger(message, mapOptions(options, "danger"));
toast.info = (message, options) => heroToast.info(message, mapOptions(options, "accent"));
toast.warning = (message, options) => heroToast.warning(message, mapOptions(options, "warning"));
toast.loading = (message, options) =>
  heroToast(message, {
    ...mapOptions(options, "default"),
    isLoading: true,
    timeout: options?.duration ?? 0,
  });
toast.promise = (promise, options) =>
  heroToast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: (error) =>
      typeof options.error === "function" ? options.error(error) : options.error,
  });
toast.dismiss = (toastId) => {
  if (toastId === undefined) {
    heroToast.clear();
    return;
  }

  heroToast.close(String(toastId));
};
toast.clear = () => heroToast.clear();
toast.close = (toastId) => heroToast.close(String(toastId));
toast.pauseAll = () => heroToast.pauseAll();
toast.resumeAll = () => heroToast.resumeAll();

function Toaster({
  position = "top-right",
  gap = 8,
  visibleToasts = 3,
  expand,
  className,
}: ToasterProps) {
  return (
    <Toast.Provider
      placement={mapPlacement(position)}
      gap={gap}
      maxVisibleToasts={expand ? Math.max(visibleToasts, 5) : visibleToasts}
      className={className}
      width={460}
    />
  );
}

export { Toaster, toast };
