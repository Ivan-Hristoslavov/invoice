import React from "react";
import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePageClient from "@/app/(main)/HomePageClient";

vi.mock("@/components/theme/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme</button>,
}));

vi.mock("@/components/ui/background-shapes", () => ({
  BackgroundShapes: () => <div data-testid="background-shapes" />,
}));

vi.mock("@/components/ui/pagination", () => ({
  Pagination: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div>
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return (
          <button
            key={page}
            type="button"
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        );
      })}
    </div>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="landing-dropdown">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children?: React.ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    asChild,
  }: {
    children?: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div role="menuitem">{children}</div>),
  DropdownMenuItemIcon: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  DropdownMenuItemText: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@heroui/react", () => ({
  Switch: ({
    isSelected,
    onSelectionChange,
    "aria-label": ariaLabel,
    className,
  }: {
    isSelected?: boolean;
    onSelectionChange?: (v: boolean) => void;
    "aria-label"?: string;
    className?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={isSelected ?? false}
      aria-label={ariaLabel}
      className={className}
      onClick={() => onSelectionChange?.(!isSelected)}
    />
  ),
  Button: ({
    children,
    onPress,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onPress?: () => void;
  }) => (
    <button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        onPress?.();
      }}
    >
      {children}
    </button>
  ),
  Card: Object.assign(
    ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    {
      Header: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
      Title: ({ children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...p}>{children}</h3>,
      Description: ({ children, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p {...p}>{children}</p>
      ),
      Content: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
      Footer: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    }
  ),
  Chip: Object.assign(
    ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-testid="heroui-chip" {...props}>
        {children}
      </div>
    ),
    {
      Label: ({ children, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
        <span {...p}>{children}</span>
      ),
    }
  ),
  Separator: (props: React.HTMLAttributes<HTMLHRElement>) => <hr {...props} />,
  Spinner: () => <span>loading</span>,
  buttonVariants: () => "",
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({
          children,
          animate: _animate,
          initial: _initial,
          transition: _transition,
          variants: _variants,
          viewport: _viewport,
          whileInView: _whileInView,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...props
        }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(tag, props, children),
    }
  ),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("HomePage", () => {
  it("toggles yearly pricing", async () => {
    const user = userEvent.setup();

    render(<HomePageClient />);

    // Price and currency are split in markup: "8.99" + "€/мес" (see HomePageClient pricing grid)
    expect(screen.getByText("8.99")).toBeInTheDocument();

    const yearlyToggle = screen.getByRole("switch", {
      name: "Превключване към годишно ценообразуване",
    });
    await user.click(yearlyToggle);

    // PRO yearly89.99 € → per month 7.5 (formatPrice collapses trailing zero)
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("shows product feature grid without pagination", () => {
    render(<HomePageClient />);

    expect(screen.getAllByText("Фактури и PDF").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Няколко фирми").length).toBeGreaterThan(0);
  });
});
