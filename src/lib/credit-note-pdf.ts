import { generateNotePdfServer } from "@/lib/note-pdf-common";

export async function generateCreditNotePdfServer(creditNote: any): Promise<Buffer> {
  return generateNotePdfServer(creditNote, {
    title: "КРЕДИТНО ИЗВЕСТИЕ",
    numberKey: "creditNoteNumber",
    accent: [239, 68, 68],
    totalSign: "-",
  });
}
