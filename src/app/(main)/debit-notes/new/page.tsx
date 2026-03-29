"use client";

import { Suspense } from "react";
import { NoteForm } from "@/components/notes/NoteForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function NewDebitNotePage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-24" size="large" />}>
      <NoteForm
        type="debit"
        title="Ново дебитно известие"
        apiEndpoint="/api/debit-notes"
        redirectPath="/debit-notes"
        backHref="/debit-notes"
        backLabel="Дебитни известия"
        accentColor="emerald"
        successMessage="Дебитното известие е създадено успешно"
      />
    </Suspense>
  );
}
