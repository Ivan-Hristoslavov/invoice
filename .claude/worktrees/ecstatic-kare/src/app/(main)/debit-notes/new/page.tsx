"use client";

import { NoteForm } from "@/components/notes/NoteForm";

export default function NewDebitNotePage() {
  return (
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
  );
}
