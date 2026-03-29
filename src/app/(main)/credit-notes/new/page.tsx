"use client";

import { Suspense } from "react";
import { NoteForm } from "@/components/notes/NoteForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function NewCreditNotePage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-24" size="large" />}>
      <NoteForm
        type="credit"
        title="Ново кредитно известие"
        apiEndpoint="/api/credit-notes"
        redirectPath="/credit-notes"
        backHref="/credit-notes"
        backLabel="Кредитни известия"
        accentColor="red"
        successMessage="Кредитното известие е създадено успешно"
      />
    </Suspense>
  );
}
