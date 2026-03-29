-- Security and performance hardening for the Supabase public schema.
-- This migration is intentionally conservative:
-- 1. Enable RLS on tables exposed through PostgREST.
-- 2. Add explicit service-role policies so application routes keep working.
-- 3. Add covering indexes for common user-scoped and FK-backed lookups.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Permission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubscriptionPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubscriptionHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebhookEventLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InvoiceSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditNoteItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DebitNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DebitNoteItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_User" ON public."User";
CREATE POLICY "service_role_all_User" ON public."User"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Account" ON public."Account";
CREATE POLICY "service_role_all_Account" ON public."Account"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Session" ON public."Session";
CREATE POLICY "service_role_all_Session" ON public."Session"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_VerificationToken" ON public."VerificationToken";
CREATE POLICY "service_role_all_VerificationToken" ON public."VerificationToken"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Company" ON public."Company";
CREATE POLICY "service_role_all_Company" ON public."Company"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Client" ON public."Client";
CREATE POLICY "service_role_all_Client" ON public."Client"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Product" ON public."Product";
CREATE POLICY "service_role_all_Product" ON public."Product"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_ProductTranslation" ON public."ProductTranslation";
CREATE POLICY "service_role_all_ProductTranslation" ON public."ProductTranslation"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Invoice" ON public."Invoice";
CREATE POLICY "service_role_all_Invoice" ON public."Invoice"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_InvoiceItem" ON public."InvoiceItem";
CREATE POLICY "service_role_all_InvoiceItem" ON public."InvoiceItem"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Payment" ON public."Payment";
CREATE POLICY "service_role_all_Payment" ON public."Payment"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Document" ON public."Document";
CREATE POLICY "service_role_all_Document" ON public."Document"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Permission" ON public."Permission";
CREATE POLICY "service_role_all_Permission" ON public."Permission"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_UserRole" ON public."UserRole";
CREATE POLICY "service_role_all_UserRole" ON public."UserRole"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_RolePermission" ON public."RolePermission";
CREATE POLICY "service_role_all_RolePermission" ON public."RolePermission"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_Subscription" ON public."Subscription";
CREATE POLICY "service_role_all_Subscription" ON public."Subscription"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_SubscriptionPayment" ON public."SubscriptionPayment";
CREATE POLICY "service_role_all_SubscriptionPayment" ON public."SubscriptionPayment"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_SubscriptionHistory" ON public."SubscriptionHistory";
CREATE POLICY "service_role_all_SubscriptionHistory" ON public."SubscriptionHistory"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_WebhookEventLog" ON public."WebhookEventLog";
CREATE POLICY "service_role_all_WebhookEventLog" ON public."WebhookEventLog"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_InvoiceSequence" ON public."InvoiceSequence";
CREATE POLICY "service_role_all_InvoiceSequence" ON public."InvoiceSequence"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_CreditNote" ON public."CreditNote";
CREATE POLICY "service_role_all_CreditNote" ON public."CreditNote"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_CreditNoteItem" ON public."CreditNoteItem";
CREATE POLICY "service_role_all_CreditNoteItem" ON public."CreditNoteItem"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_AuditLog" ON public."AuditLog";
CREATE POLICY "service_role_all_AuditLog" ON public."AuditLog"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_DebitNote" ON public."DebitNote";
CREATE POLICY "service_role_all_DebitNote" ON public."DebitNote"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_DebitNoteItem" ON public."DebitNoteItem";
CREATE POLICY "service_role_all_DebitNoteItem" ON public."DebitNoteItem"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON public."Account" ("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON public."Session" ("userId");
CREATE INDEX IF NOT EXISTS "Client_userId_name_idx" ON public."Client" ("userId", "name");
CREATE INDEX IF NOT EXISTS "Company_userId_name_idx" ON public."Company" ("userId", "name");
CREATE INDEX IF NOT EXISTS "Product_userId_name_idx" ON public."Product" ("userId", "name");
CREATE INDEX IF NOT EXISTS "Invoice_userId_issueDate_idx" ON public."Invoice" ("userId", "issueDate" DESC);
CREATE INDEX IF NOT EXISTS "Invoice_userId_status_idx" ON public."Invoice" ("userId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx" ON public."Invoice" ("clientId");
CREATE INDEX IF NOT EXISTS "Invoice_companyId_idx" ON public."Invoice" ("companyId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" ("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON public."InvoiceItem" ("productId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON public."Payment" ("invoiceId");
CREATE INDEX IF NOT EXISTS "Document_userId_createdAt_idx" ON public."Document" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Document_invoiceId_idx" ON public."Document" ("invoiceId");
CREATE INDEX IF NOT EXISTS "UserRole_userId_idx" ON public."UserRole" ("userId");
CREATE INDEX IF NOT EXISTS "UserRole_companyId_idx" ON public."UserRole" ("companyId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx" ON public."Subscription" ("userId", "status");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_subscriptionId_idx" ON public."SubscriptionPayment" ("subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionHistory_subscriptionId_idx" ON public."SubscriptionHistory" ("subscriptionId");
CREATE INDEX IF NOT EXISTS "InvoiceSequence_userId_companyId_year_idx" ON public."InvoiceSequence" ("userId", "companyId", "year");
CREATE INDEX IF NOT EXISTS "CreditNote_userId_issueDate_idx" ON public."CreditNote" ("userId", "issueDate" DESC);
CREATE INDEX IF NOT EXISTS "CreditNote_invoiceId_idx" ON public."CreditNote" ("invoiceId");
CREATE INDEX IF NOT EXISTS "CreditNoteItem_creditNoteId_idx" ON public."CreditNoteItem" ("creditNoteId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON public."AuditLog" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_invoiceId_idx" ON public."AuditLog" ("invoiceId");
CREATE INDEX IF NOT EXISTS "DebitNote_userId_issueDate_idx" ON public."DebitNote" ("userId", "issueDate" DESC);
CREATE INDEX IF NOT EXISTS "DebitNote_invoiceId_idx" ON public."DebitNote" ("invoiceId");
CREATE INDEX IF NOT EXISTS "DebitNoteItem_debitNoteId_idx" ON public."DebitNoteItem" ("debitNoteId");
