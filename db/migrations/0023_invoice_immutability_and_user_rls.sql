-- Add defense-in-depth RLS and immutable invoice guardrails.
-- This migration is additive and keeps existing service_role policies intact.

-- User-scoped policies for interactive JWT clients.
DROP POLICY IF EXISTS "user_select_Invoice" ON public."Invoice";
CREATE POLICY "user_select_Invoice" ON public."Invoice"
  FOR SELECT TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_insert_Invoice" ON public."Invoice";
CREATE POLICY "user_insert_Invoice" ON public."Invoice"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_update_Invoice" ON public."Invoice";
CREATE POLICY "user_update_Invoice" ON public."Invoice"
  FOR UPDATE TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'))
  WITH CHECK ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_delete_Invoice" ON public."Invoice";
CREATE POLICY "user_delete_Invoice" ON public."Invoice"
  FOR DELETE TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_select_Client" ON public."Client";
CREATE POLICY "user_select_Client" ON public."Client"
  FOR SELECT TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_write_Client" ON public."Client";
CREATE POLICY "user_write_Client" ON public."Client"
  FOR ALL TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'))
  WITH CHECK ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_select_Company" ON public."Company";
CREATE POLICY "user_select_Company" ON public."Company"
  FOR SELECT TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_write_Company" ON public."Company";
CREATE POLICY "user_write_Company" ON public."Company"
  FOR ALL TO authenticated
  USING ("userId" = (auth.jwt() ->> 'sub'))
  WITH CHECK ("userId" = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "user_access_InvoiceItem" ON public."InvoiceItem";
CREATE POLICY "user_access_InvoiceItem" ON public."InvoiceItem"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Invoice" i
      WHERE i.id = "InvoiceItem"."invoiceId"
        AND i."userId" = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."Invoice" i
      WHERE i.id = "InvoiceItem"."invoiceId"
        AND i."userId" = (auth.jwt() ->> 'sub')
    )
  );

CREATE OR REPLACE FUNCTION public.prevent_illegal_issued_invoice_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOIDED') THEN
    IF NEW."invoiceNumber" IS DISTINCT FROM OLD."invoiceNumber"
      OR NEW."clientId" IS DISTINCT FROM OLD."clientId"
      OR NEW."companyId" IS DISTINCT FROM OLD."companyId"
      OR NEW."issueDate" IS DISTINCT FROM OLD."issueDate"
      OR NEW."dueDate" IS DISTINCT FROM OLD."dueDate"
      OR NEW."subtotal" IS DISTINCT FROM OLD."subtotal"
      OR NEW."taxAmount" IS DISTINCT FROM OLD."taxAmount"
      OR NEW."total" IS DISTINCT FROM OLD."total"
      OR NEW."currency" IS DISTINCT FROM OLD."currency"
      OR NEW."supplyType" IS DISTINCT FROM OLD."supplyType"
      OR NEW."reverseCharge" IS DISTINCT FROM OLD."reverseCharge"
      OR NEW."sellerSnapshot" IS DISTINCT FROM OLD."sellerSnapshot"
      OR NEW."buyerSnapshot" IS DISTINCT FROM OLD."buyerSnapshot"
      OR NEW."itemsSnapshot" IS DISTINCT FROM OLD."itemsSnapshot"
      OR NEW."goodsRecipientSnapshot" IS DISTINCT FROM OLD."goodsRecipientSnapshot"
    THEN
      RAISE EXCEPTION 'Issued/cancelled invoice is immutable. Create a credit/debit note instead.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_illegal_issued_invoice_update ON public."Invoice";
CREATE TRIGGER trg_prevent_illegal_issued_invoice_update
BEFORE UPDATE ON public."Invoice"
FOR EACH ROW
EXECUTE FUNCTION public.prevent_illegal_issued_invoice_update();
