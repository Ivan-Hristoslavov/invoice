import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAsyncAction } from "@/hooks/use-async-action";

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/lib/toast", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe("useAsyncAction", () => {
  it("ignores duplicate execution while loading", async () => {
    let resolveFirst: (() => void) | null = null;
    const firstPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    const worker = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(async () => {
        await firstPromise;
        return "first";
      })
      .mockResolvedValueOnce("second");

    const { result } = renderHook(() => useAsyncAction<string>());

    let firstResult: string | undefined;
    let secondResult: string | undefined;

    await act(async () => {
      const firstCall = result.current.execute(worker);
      const secondCall = result.current.execute(worker);
      secondResult = await secondCall;
      resolveFirst?.();
      firstResult = await firstCall;
    });

    expect(worker).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe("first");
    expect(secondResult).toBeUndefined();
  });

  it("stores error message and shows toast on failure", async () => {
    const { result } = renderHook(() => useAsyncAction<string>());

    await act(async () => {
      await result.current.execute(async () => {
        throw new Error("boom");
      });
    });

    expect(result.current.error).toBe("boom");
    expect(toastError).toHaveBeenCalledWith("boom");
  });
});
