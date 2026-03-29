"use client";

import * as React from "react";
import {
  Pagination as HeroUIPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationPreviousIcon,
  PaginationNextIcon,
  PaginationEllipsis,
} from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = "md",
}: PaginationProps) {
  const siblings = 1;
  const boundaries = 1;

  const pages = React.useMemo(() => {
    const total = totalPages;
    if (total <= 0) return [];
    const start = Math.max(1, currentPage - siblings);
    const end = Math.min(total, currentPage + siblings);
    const middle = range(start, end);
    const result: (number | "ellipsis")[] = [];
    if (start > 1) {
      result.push(1);
      if (start > 2) result.push("ellipsis");
    }
    result.push(...middle);
    if (end < total) {
      if (end < total - 1) result.push("ellipsis");
      result.push(total);
    }
    return result;
  }, [currentPage, totalPages, siblings]);

  if (totalPages <= 1) return null;

  return (
    <HeroUIPagination className={className} size={size}>
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationPrevious
            onPress={() => onPageChange(Math.max(1, currentPage - 1))}
            isDisabled={currentPage <= 1}
            aria-label="Предишна страница"
          >
            <PaginationPreviousIcon>
              <ChevronLeft className="h-4 w-4" />
            </PaginationPreviousIcon>
          </PaginationPrevious>
        </PaginationItem>
        {pages.map((page, i) => {
          if (page === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem key={page}>
              <PaginationLink
                onPress={() => onPageChange(page)}
                isActive={currentPage === page}
                aria-label={`Страница ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            isDisabled={currentPage >= totalPages}
            aria-label="Следваща страница"
          >
            <PaginationNextIcon>
              <ChevronRight className="h-4 w-4" />
            </PaginationNextIcon>
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </HeroUIPagination>
  );
}
