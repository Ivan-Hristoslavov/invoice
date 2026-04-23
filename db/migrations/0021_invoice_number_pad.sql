-- Unify invoice numbering format from legacy 12-digit (YYCCCCNNNNNN)
-- to canonical 16-digit (YYCCCCNNNNNNNNNN). This keeps chronological
-- ordering stable regardless of the user's starting sequence.
--
-- Only rows whose digit-only core length is exactly 12 are migrated.
-- Any non-digit prefix (e.g. "Ф-") is preserved as-is.

-- Pad Invoice.invoiceNumber
UPDATE "Invoice"
SET "invoiceNumber" = regexp_replace(
  "invoiceNumber",
  '(\d{2})(\d{4})(\d{6})$',
  '\1\20000\3'
)
WHERE length(regexp_replace("invoiceNumber", '\D', '', 'g')) = 12;

-- Pad CreditNote.creditNoteNumber
UPDATE "CreditNote"
SET "creditNoteNumber" = regexp_replace(
  "creditNoteNumber",
  '(\d{2})(\d{4})(\d{6})$',
  '\1\20000\3'
)
WHERE length(regexp_replace("creditNoteNumber", '\D', '', 'g')) = 12;

-- Pad DebitNote.debitNoteNumber
UPDATE "DebitNote"
SET "debitNoteNumber" = regexp_replace(
  "debitNoteNumber",
  '(\d{2})(\d{4})(\d{6})$',
  '\1\20000\3'
)
WHERE length(regexp_replace("debitNoteNumber", '\D', '', 'g')) = 12;

-- Pad VatProtocol117.protocolNumber
UPDATE "VatProtocol117"
SET "protocolNumber" = regexp_replace(
  "protocolNumber",
  '(\d{2})(\d{4})(\d{6})$',
  '\1\20000\3'
)
WHERE length(regexp_replace("protocolNumber", '\D', '', 'g')) = 12;
