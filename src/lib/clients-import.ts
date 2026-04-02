import Papa from "papaparse";
import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

export const CLIENT_CSV_HEADERS = [
  "name",
  "email",
  "phone",
  "bulstatNumber",
  "vatRegistered",
  "vatRegistrationNumber",
  "mol",
  "address",
  "city",
  "zipCode",
  "country",
];

export const CLIENT_SAMPLE_ROW = [
  "Примерен клиент ЕООД",
  "client@example.com",
  "+359888123456",
  "204676177",
  "true",
  "BG204676177",
  "Иван Иванов",
  "ул. Витоша 1",
  "София",
  "1000",
  "България",
];

const clientRowSchema = z.object({
  name: z
    .string()
    .min(2, "Името е задължително (мин. 2 символа)")
    .max(FIELD_LIMITS.name),
  email: z
    .string()
    .email("Невалиден имейл")
    .max(FIELD_LIMITS.email)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(FIELD_LIMITS.phone)
    .optional()
    .or(z.literal("")),
  bulstatNumber: z
    .string()
    .optional()
    .or(z.literal("")),
  vatRegistered: z
    .preprocess(
      (v) =>
        v === "true" || v === "1" || v === true
          ? true
          : v === "false" || v === "0" || v === false || !v
            ? false
            : false,
      z.boolean()
    )
    .optional()
    .default(false),
  vatRegistrationNumber: z
    .string()
    .max(FIELD_LIMITS.phone)
    .optional()
    .or(z.literal("")),
  mol: z
    .string()
    .max(FIELD_LIMITS.mol)
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(FIELD_LIMITS.address)
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(FIELD_LIMITS.city)
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .max(FIELD_LIMITS.postalCode)
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(FIELD_LIMITS.country)
    .optional()
    .or(z.literal("")),
});

export type ClientCsvRow = z.infer<typeof clientRowSchema>;

export interface ParsedClientRow {
  rowIndex: number;
  data: ClientCsvRow | null;
  errors: string[];
}

export async function parseClientsCsv(
  file: File
): Promise<ParsedClientRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          const parsed: ParsedClientRow[] = rows.map((row, idx) => {
            const result = clientRowSchema.safeParse(row);
            if (result.success) {
              return { rowIndex: idx + 1, data: result.data, errors: [] };
            }
            return {
              rowIndex: idx + 1,
              data: null,
              errors: result.error.errors.map(
                (e) => `${e.path.join(".")}: ${e.message}`
              ),
            };
          });
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(new Error(`CSV грешка: ${err.message}`)),
    });
  });
}

export function generateClientsCsvTemplate(): string {
  return Papa.unparse({
    fields: CLIENT_CSV_HEADERS,
    data: [CLIENT_SAMPLE_ROW],
  });
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
