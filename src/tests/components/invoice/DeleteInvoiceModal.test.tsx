import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteInvoiceModal } from "@/components/invoice/DeleteInvoiceModal";

describe("DeleteInvoiceModal", () => {
  it("shows loading state and blocks close while deleting", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <DeleteInvoiceModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={true}
        invoiceNumber="INV-001"
      />
    );

    const loadingButton = screen.getByRole("button", { name: /изтриване/i });
    expect(loadingButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /отказ/i }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
