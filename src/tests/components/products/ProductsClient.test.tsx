import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsClient from "@/app/(main)/products/ProductsClient";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeProduct = (i: number) => ({
  id: `product-${i}`,
  name: `Продукт ${i}`,
  description: `Описание на продукт ${i}`,
  price: i * 10,
  unit: "piece",
  taxRate: 20,
});

const defaultProps = {
  products: [makeProduct(1), makeProduct(2), makeProduct(3)],
  plan: "FREE",
  productLimit: 10,
  canCreateProduct: true,
  productsRemaining: 7,
  isApproachingLimit: false,
  isAtLimit: false,
};

describe("ProductsClient", () => {
  it("renders product names", () => {
    render(<ProductsClient {...defaultProps} />);
    expect(screen.getByText("Продукт 1")).toBeInTheDocument();
    expect(screen.getByText("Продукт 2")).toBeInTheDocument();
    expect(screen.getByText("Продукт 3")).toBeInTheDocument();
  });

  it("shows 'Нов продукт' button when canCreateProduct is true", () => {
    render(<ProductsClient {...defaultProps} />);
    expect(screen.getByText("Нов продукт")).toBeInTheDocument();
  });

  it("shows upgrade button when canCreateProduct is false", () => {
    render(<ProductsClient {...defaultProps} canCreateProduct={false} />);
    expect(screen.getByText("Надграждане за повече продукти")).toBeInTheDocument();
  });

  it("shows approaching-limit warning", () => {
    render(<ProductsClient {...defaultProps} isApproachingLimit productsRemaining={2} />);
    expect(screen.getByText(/Остават ви само/)).toBeInTheDocument();
  });

  it("shows at-limit error", () => {
    render(
      <ProductsClient {...defaultProps} isAtLimit isApproachingLimit={false} productsRemaining={0} />
    );
    expect(screen.getByText(/Достигнахте лимита/)).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    render(<ProductsClient {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "Продукт 2");
    expect(screen.getByText("Продукт 2")).toBeInTheDocument();
    expect(screen.queryByText("Продукт 1")).not.toBeInTheDocument();
  });

  it("shows empty state for no search results", async () => {
    render(<ProductsClient {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "xyz-не-съществува");
    expect(screen.getByText("Няма намерени продукти")).toBeInTheDocument();
  });

  it("shows empty state when no products", () => {
    render(<ProductsClient {...defaultProps} products={[]} />);
    expect(screen.getByText("Все още нямате продукти")).toBeInTheDocument();
  });

  it("shows prices with € symbol", () => {
    render(<ProductsClient {...defaultProps} />);
    // Product 1 price is 10 * 1 = 10
    expect(screen.getByText(/10\.00 €/)).toBeInTheDocument();
  });

  it("shows stats: total products, average price, with tax count", () => {
    render(<ProductsClient {...defaultProps} />);
    expect(screen.getByText("Общо продукти")).toBeInTheDocument();
    expect(screen.getByText("Средна цена")).toBeInTheDocument();
    expect(screen.getByText("С ДДС")).toBeInTheDocument();
  });

  it("switches to table view", () => {
    render(<ProductsClient {...defaultProps} />);
    const toggleBtns = screen.getAllByRole("button").filter((b) =>
      b.className.includes("h-9 px-3")
    );
    if (toggleBtns[1]) {
      fireEvent.click(toggleBtns[1]);
      expect(screen.getByRole("table")).toBeInTheDocument();
    }
  });
});

describe("ProductsClient pagination", () => {
  const manyProducts = Array.from({ length: 20 }, (_, i) => makeProduct(i + 1));

  it("shows pagination when more than 12 products", () => {
    render(<ProductsClient {...defaultProps} products={manyProducts} />);
    expect(screen.getByText(/1–12 от 20 продукта/)).toBeInTheDocument();
  });

  it("shows only 12 products on first page", () => {
    render(<ProductsClient {...defaultProps} products={manyProducts} />);
    expect(screen.getByText("Продукт 1")).toBeInTheDocument();
    expect(screen.queryByText("Продукт 13")).not.toBeInTheDocument();
  });

  it("navigates to page 2", () => {
    render(<ProductsClient {...defaultProps} products={manyProducts} />);
    const page2Btn = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2Btn);
    expect(screen.getByText("Продукт 13")).toBeInTheDocument();
    expect(screen.queryByText("Продукт 1")).not.toBeInTheDocument();
  });

  it("resets to page 1 on search", async () => {
    render(<ProductsClient {...defaultProps} products={manyProducts} />);
    // Go to last page
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("Продукт 20")).toBeInTheDocument();

    // Search for exact name that only matches product 20
    const input = screen.getByPlaceholderText(/Търсене/);
    await userEvent.type(input, "Продукт 20");
    // Should reset to page 1 of filtered results (just 1 item)
    expect(screen.queryByText("Продукт 19")).not.toBeInTheDocument();
    expect(screen.getByText("Продукт 20")).toBeInTheDocument();
  });
});
