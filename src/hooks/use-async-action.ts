"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "@/lib/toast";

type MessageInput<TResult> = string | ((result: TResult) => string | undefined) | undefined;
type ErrorMessageInput = string | ((error: unknown) => string | undefined) | undefined;

type ExecuteOptions<TResult> = {
  successMessage?: MessageInput<TResult>;
  errorMessage?: ErrorMessageInput;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

type UseAsyncActionOptions<TResult> = {
  defaultSuccessMessage?: MessageInput<TResult>;
  defaultErrorMessage?: ErrorMessageInput;
  showSuccessToastByDefault?: boolean;
  showErrorToastByDefault?: boolean;
  lockOnSuccess?: boolean;
};

function resolveSuccessMessage<TResult>(message: MessageInput<TResult>, result: TResult) {
  if (typeof message === "function") {
    return message(result);
  }
  return message;
}

function resolveErrorMessage(message: ErrorMessageInput, error: unknown) {
  if (typeof message === "function") {
    return message(error);
  }
  if (typeof message === "string") {
    return message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Възникна неочаквана грешка.";
}

/**
 * Global async action wrapper with single-flight protection and standard feedback hooks.
 */
export function useAsyncAction<TResult = unknown>(options?: UseAsyncActionOptions<TResult>) {
  const pendingRef = useRef(false);
  const successLockRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const execute = useCallback(
    async <TCurrentResult = TResult>(
      asyncFn: () => Promise<TCurrentResult>,
      executeOptions?: ExecuteOptions<TCurrentResult>
    ): Promise<TCurrentResult | undefined> => {
      if (pendingRef.current || successLockRef.current) return undefined;

      pendingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn();

        const showSuccessToast =
          executeOptions?.showSuccessToast ?? options?.showSuccessToastByDefault ?? false;
        const successMessage = resolveSuccessMessage(
          executeOptions?.successMessage ?? (options?.defaultSuccessMessage as MessageInput<TCurrentResult>),
          result
        );

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        await executeOptions?.onSuccess?.(result);
        if (options?.lockOnSuccess) {
          successLockRef.current = true;
          setIsLocked(true);
        }
        return result;
      } catch (caughtError) {
        const resolvedErrorMessage =
          resolveErrorMessage(
          executeOptions?.errorMessage ?? options?.defaultErrorMessage,
          caughtError
          ) ?? "Възникна неочаквана грешка.";

        setError(resolvedErrorMessage);

        const showErrorToast =
          executeOptions?.showErrorToast ?? options?.showErrorToastByDefault ?? true;
        if (showErrorToast) {
          toast.error(resolvedErrorMessage);
        }

        await executeOptions?.onError?.(caughtError);
        return undefined;
      } finally {
        pendingRef.current = false;
        setLoading(false);
      }
    },
    [
      options?.defaultErrorMessage,
      options?.defaultSuccessMessage,
      options?.lockOnSuccess,
      options?.showErrorToastByDefault,
      options?.showSuccessToastByDefault,
    ]
  );

  const reset = useCallback(() => {
    pendingRef.current = false;
    successLockRef.current = false;
    setLoading(false);
    setIsLocked(false);
    setError(null);
  }, []);

  return {
    execute,
    loading,
    isLocked,
    error,
    reset,
    // Backward-compat aliases for gradual migration.
    run: execute,
    isPending: loading,
  };
}
