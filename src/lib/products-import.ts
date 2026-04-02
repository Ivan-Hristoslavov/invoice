import Papa from "papaparse";
import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

export const PRODUCT_CSV_HEADERS = [
  "name",
  "description",
  "price",
  "unit",
  "taxRate",
];

export const PRODUCT_SAMPLE_ROW = [
  "Уеб дизайн",
  "Изработка на уеб сайт",
  "1500.00",
  "бр.",
  "20",
];

const productRowSchema = z.object({
  name: z
    .string()
    .min(2, "Името е задължително (мин. 2 символа)")
    .max(FIELD_LIMITS.name),
  description: z
    .string()
    .max(FIELD_LIMITS.description)
    .optional()
    .or(z.literal("")),
  price: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v) : v),
    z.number().min(0, "Цената не може да бъде отрицателна")
  ),
  unit: z
    .string()
    .min(1, "Единицата е задължителна")
    .max(50)
    .default("бр."),
  taxRate: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v) : v),
    z
      .number()
      .min(0, "ДДС не може да е отрицателно")
      .max(100, "ДДС не може да надвишава 100%")
      .default(20)
  ),
});

export type ProductCsvRow = z.infer<typeof productRowSchema>;

export interface ParsedProductRow {
  rowIndex: number;
  data: ProductCsvRow | null;
  errors: string[];
}

export async function parseProductsCsv(
  file: File
): Promise<ParsedProductRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          const parsed: ParsedProductRow[] = rows.map((row, idx) => {
            const result = productRowSchema.safeParse(row);
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

export function generateProductsCsvTemplate(): string {
  return Papa.unparse({
    fields: PRODUCT_CSV_HEADERS,
    data: [PRODUCT_SAMPLE_ROW],
  });
}
