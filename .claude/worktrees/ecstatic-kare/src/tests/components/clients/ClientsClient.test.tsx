import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientsClient from "@/app/(main)/clients/ClientsClient";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeClient = (i: number) => ({
  id: `client-${i}`,
  name: `Клиент ${i}`,
  email: `client${i}@example.com`,
  phone: `+3598${String(i).padStart(8, "0")}`,
  city: "София",
  country: "BG",
  bulstatNumber: `BG${String(i).padStart(9, "0")}`,
});

const defaultProps = {
  clients: [makeClient(1), makeClient(2), makeClient(3)],
  invoiceCounts: { "client-1": 5, "client-2": 0 },
  plan: "FREE",
  clientLimit: 5,
  canCreateClient: true,
  clientsRemaining: 2,
  isApproachingLimit: false,
  isAtLimit: false,
};

function renderClients(overrides = {}) {
  return render(<ClientsClient {...defaultProps} {...overrides} />);
}

describe("ClientsClient", () => {
  it("renders client names", () => {
    renderClients();
    expect(screen.getByText("Клиент 1")).toBeInTheDocument();
    expect(screen.getByText("Клиент 2")).toBeInTheDocument();
    expect(screen.getByText("Клиент 3")).toBeInTheDocument();
  });

  it("shows the 'Нов клиент' button when canCreateClient is true", () => {
    renderClients();
    expect(screen.getByText("Нов клиент")).toBeInTheDocument();
  });

  it("shows upgrade button when canCreateClient is false", () => {
    renderClients({ canCreateClient: false });
    expect(screen.getByText("Надграждане за повече клиенти")).toBeInTheDocument();
  });

  it("shows approaching-limit warning", () => {
    renderClients({ isApproachingLimit: true, clientsRemaining: 2 });
    expect(screen.getByText(/Остават ви само/)).toBeInTheDocument();
  });

  it("shows at-limit error", () => {
    renderClients({ isAtLimit: true, isApproachingLimit: false, clientsRemaining: 0 });
    expect(screen.getByText(/Достигнахте лимита/)).toBeInTheDocument();
  });

  it("filters clients by search query", async () => {
    renderClients();
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "Клиент 1");
    expect(screen.getByText("Клиент 1")).toBeInTheDocument();
    expect(screen.queryByText("Клиент 2")).not.toBeInTheDocument();
  });

  it("shows empty state when search has no results", async () => {
    renderClients();
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "xyz-не-съществува");
    expect(screen.getByText("Няма намерени клиенти")).toBeInTheDocument();
  });

  it("switches to table view", async () => {
    renderClients();
    const listBtn = screen.getAllByRole("button").find((btn) =>
      btn.querySelector("svg")
    );
    // Click the second view toggle button (list/table)
    const toggleButtons = screen.getAllByRole("button").filter((b) =>
      b.className.includes("h-9")
    );
    if (toggleButtons[1]) {
      fireEvent.click(toggleButtons[1]);
      expect(screen.getByRole("table")).toBeInTheDocument();
    }
  });

  it("shows invoice count for each client (cards view)", () => {
    renderClients();
    expect(screen.getByText(/5 фактури/)).toBeInTheDocument();
    expect(screen.getAllByText(/0 фактури/).length).toBeGreaterThan(0);
  });

  it("shows empty state when no clients", () => {
    renderClients({ clients: [] });
    expect(screen.getByText("Все още нямате клиенти")).toBeInTheDocument();
  });
});

describe("ClientsClient pagination", () => {
  const manyClients = Array.from({ length: 25 }, (_, i) => makeClient(i + 1));

  it("shows pagination when more than 12 clients", () => {
    render(<ClientsClient {...defaultProps} clients={manyClients} />);
    expect(screen.getByText(/от 25 клиента/)).toBeInTheDocument();
  });

  it("shows only 12 clients per page", () => {
    render(<ClientsClient {...defaultProps} clients={manyClients} />);
    // Page 1 shows clients 1–12
    expect(screen.getByText("Клиент 1")).toBeInTheDocument();
    expect(screen.queryByText("Клиент 13")).not.toBeInTheDocument();
  });

  it("navigates to next page", () => {
    render(<ClientsClient {...defaultProps} clients={manyClients} />);
    // Page 1 shows 1-12
    expect(screen.getByText(/1–12 от 25 клиента/)).toBeInTheDocument();

    // Click page 2 button
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText(/13–24 от 25 клиента/)).toBeInTheDocument();
    expect(screen.getByText("Клиент 13")).toBeInTheDocument();
  });

  it("resets to page 1 when search changes", async () => {
    render(<ClientsClient {...defaultProps} clients={manyClients} />);
    // Go to page 3 (client 25)
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByText("Клиент 25")).toBeInTheDocument();

    // Search for "Клиент 25" specifically — only 1 match, pagination disappears, page resets
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "Клиент 25");

    // Client 25 should now be visible on page 1 of filtered results
    expect(screen.getByText("Клиент 25")).toBeInTheDocument();
    // Other clients not matching should be gone
    expect(screen.queryByText("Клиент 24")).not.toBeInTheDocument();
  });

  it("does not show pagination for <= 12 clients", () => {
    render(<ClientsClient {...defaultProps} clients={manyClients.slice(0, 5)} />);
    expect(screen.queryByText(/от 5 клиента/)).not.toBeInTheDocument();
  });
});
