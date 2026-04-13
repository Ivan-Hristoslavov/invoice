import { grossToNetAmount, netToGrossAmount } from "@/lib/money-vat";

export type InvoiceItemEditorFallback = {
  taxRate: number;
  unitPrice: number;
  unitPriceGross?: number;
};

export type InvoiceItemEditorDraftEval = {
  descriptionOk: boolean;
  quantityInvalid: boolean;
  taxInvalid: boolean;
  grossInvalid: boolean;
  canSave: boolean;
  previewRate: number;
  previewNet: number;
  previewQty: number;
  itemTotal: number;
  itemTax: number;
  itemTotalWithTax: number;
  quantityParsed: number;
  taxParsed: number;
  grossParsed: number;
};

/**
 * Shared draft evaluation for invoice line editor (new invoice wizard).
 * Keeps validation/preview logic testable without mounting the full page.
 */
export function evaluateInvoiceItemEditorDraft(
  description: string,
  qtyDraft: string,
  taxDraft: string,
  grossDraft: string,
  fallback: InvoiceItemEditorFallback
): InvoiceItemEditorDraftEval {
  const descriptionOk = description.trim().length > 0;

  const quantityParsed = qtyDraft === "" ? NaN : parseInt(qtyDraft, 10);
  const quantityInvalid =
    qtyDraft === "" || !Number.isFinite(quantityParsed) || quantityParsed <= 0;

  const taxParsed = taxDraft.trim() === "" ? NaN : parseFloat(taxDraft.replace(",", "."));
  const taxInvalid =
    taxDraft.trim() === "" || !Number.isFinite(taxParsed) || taxParsed < 0 || taxParsed > 100;

  const grossParsed = grossDraft.trim() === "" ? NaN : parseFloat(grossDraft.replace(",", "."));
  const grossInvalid =
    grossDraft.trim() === "" || !Number.isFinite(grossParsed) || grossParsed <= 0;

  const canSave = descriptionOk && !quantityInvalid && !taxInvalid && !grossInvalid;

  const previewRate = !taxInvalid ? taxParsed : Number(fallback.taxRate) || 0;
  const previewGross = !grossInvalid
    ? grossParsed
    : fallback.unitPriceGross ??
      netToGrossAmount(Number(fallback.unitPrice), Number(fallback.taxRate) || 0);
  const previewNet = grossToNetAmount(previewGross, previewRate);
  const previewQty =
    !quantityInvalid && Number.isFinite(quantityParsed) && quantityParsed > 0 ? quantityParsed : 0;
  const itemTotal = previewQty * previewNet;
  const itemTax = itemTotal * (previewRate / 100);
  const itemTotalWithTax = itemTotal + itemTax;

  return {
    descriptionOk,
    quantityInvalid,
    taxInvalid,
    grossInvalid,
    canSave,
    previewRate,
    previewNet,
    previewQty,
    itemTotal,
    itemTax,
    itemTotalWithTax,
    quantityParsed,
    taxParsed,
    grossParsed,
  };
}
