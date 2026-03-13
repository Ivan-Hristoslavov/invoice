"use client";

import * as React from "react";
import { Table as HeroUITable } from "@heroui/react";
import { cn } from "@/lib/utils";

interface TableProps extends React.ComponentProps<typeof HeroUITable> {
  stickyHeader?: boolean;
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className, stickyHeader = false, children, variant = "secondary", ...props }, ref) => (
    <HeroUITable
      ref={ref}
      variant={variant}
      className={cn("rounded-2xl border border-border/50 bg-transparent", className)}
      {...props}
    >
      <HeroUITable.ScrollContainer className={cn(stickyHeader && "max-h-[600px]")}>
        <HeroUITable.Content aria-label="Таблица">
          {children}
        </HeroUITable.Content>
      </HeroUITable.ScrollContainer>
    </HeroUITable>
  ),
);
Table.displayName = "Table";

interface TableHeaderProps extends React.ComponentProps<typeof HeroUITable.Header> {
  sticky?: boolean;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky = false, ...props }, ref) => (
    <HeroUITable.Header
      ref={ref}
      className={cn(
        "bg-muted/35",
        sticky && "sticky top-0 z-10",
        className
      )}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof HeroUITable.Body>
>(({ className, ...props }, ref) => (
  <HeroUITable.Body
    ref={ref}
    className={className}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUITable.Footer>
>(({ className, ...props }, ref) => (
  <HeroUITable.Footer
    ref={ref}
    className={className}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.ComponentProps<typeof HeroUITable.Row> {
  selected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, ...props }, ref) => (
    <HeroUITable.Row
      ref={ref}
      className={cn(
        "transition-colors hover:bg-muted/50",
        selected && "bg-primary/5",
        className
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ComponentProps<typeof HeroUITable.Column> {
  sortable?: boolean;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, children, ...props }, ref) => (
    <HeroUITable.Column
      ref={ref}
      allowsSorting={sortable}
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </HeroUITable.Column>
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<typeof HeroUITable.Cell>
>(({ className, ...props }, ref) => (
  <HeroUITable.Cell
    ref={ref}
    className={cn("px-4 py-3 align-middle", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
type SortDirection = "asc" | "desc" | null;
function EnhancedTable<T extends Record<string, unknown>>() {
  return null;
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  EnhancedTable,
};

export type { SortDirection, TableProps, TableHeaderProps, TableRowProps, TableHeadProps };
