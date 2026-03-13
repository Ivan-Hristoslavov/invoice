"use client";

import { NoteForm } from "@/components/notes/NoteForm";

export default function NewCreditNotePage() {
  return (
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
  );
}
