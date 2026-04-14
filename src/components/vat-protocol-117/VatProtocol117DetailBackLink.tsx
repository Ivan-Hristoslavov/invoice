"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VatProtocol117DetailBackLink() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/vat-protocols-117" className="flex items-center whitespace-nowrap">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Link>
    </Button>
  );
}
