import { generateNotePdfServer } from "@/lib/note-pdf-common";

export async function generateDebitNotePdfServer(debitNote: any): Promise<Buffer> {
  return generateNotePdfServer(debitNote, {
    title: "ДЕБИТНО ИЗВЕСТИЕ",
    numberKey: "debitNoteNumber",
    accent: [79, 70, 229],
    totalSign: "+",
  });
}
