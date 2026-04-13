"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewCreditNoteButton() {
  return (
    <Button asChild className="btn-responsive">
      <Link href="/credit-notes/new" className="flex items-center whitespace-nowrap">
        <Plus className="mr-2 h-4 w-4" />
        Ново кредитно известие
      </Link>
    </Button>
  );
}
