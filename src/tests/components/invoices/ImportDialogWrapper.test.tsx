import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImportDialogWrapper from "@/app/(main)/invoices/ImportDialogWrapper";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("ImportDialogWrapper", () => {
  function getImportTriggerButton() {
    const matches = screen.getAllByRole("button", { name: /Импорт на статуси|Статуси/i });
    const inner = matches.find((el) => el.tagName === "BUTTON");
    if (!inner) throw new Error("Expected inner <button> for import status trigger");
    return inner;
  }

  it("renders import trigger", () => {
    render(
      <ImportDialogWrapper
        companies={[{ id: "c1", name: "Тест ООД" }]}
        onApplied={vi.fn()}
      />
    );
    expect(getImportTriggerButton()).toBeInTheDocument();
  });

  it("opens dialog with title when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ImportDialogWrapper
        companies={[{ id: "c1", name: "Тест ООД" }]}
        onApplied={vi.fn()}
      />
    );
    await user.click(getImportTriggerButton());
    expect(await screen.findByRole("heading", { name: /Импорт на статуси/i })).toBeInTheDocument();
  });
});
