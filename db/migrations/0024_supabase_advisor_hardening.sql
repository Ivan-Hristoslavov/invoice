-- Supabase advisor hardening pass:
-- - Ensure RLS-enabled tables also have baseline service-role policies
-- - Restrict security definer helper execution
-- - Add missing FK indexes reported by advisor
-- - Rewrite service_role policies to use initplan-friendly auth access

ALTER TABLE public."TeamInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VatProtocol117" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VatProtocol117Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProformaInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProformaInvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProformaSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StripePrice" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_TeamInvite" ON public."TeamInvite";
CREATE POLICY "service_role_all_TeamInvite" ON public."TeamInvite"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_VatProtocol117" ON public."VatProtocol117";
CREATE POLICY "service_role_all_VatProtocol117" ON public."VatProtocol117"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_VatProtocol117Item" ON public."VatProtocol117Item";
CREATE POLICY "service_role_all_VatProtocol117Item" ON public."VatProtocol117Item"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_ProformaInvoice" ON public."ProformaInvoice";
CREATE POLICY "service_role_all_ProformaInvoice" ON public."ProformaInvoice"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_ProformaInvoiceItem" ON public."ProformaInvoiceItem";
CREATE POLICY "service_role_all_ProformaInvoiceItem" ON public."ProformaInvoiceItem"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_ProformaSequence" ON public."ProformaSequence";
CREATE POLICY "service_role_all_ProformaSequence" ON public."ProformaSequence"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_StripePrice" ON public."StripePrice";
CREATE POLICY "service_role_all_StripePrice" ON public."StripePrice"
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE INDEX IF NOT EXISTS "CreditNote_clientId_idx" ON public."CreditNote" ("clientId");
CREATE INDEX IF NOT EXISTS "CreditNote_companyId_idx" ON public."CreditNote" ("companyId");
CREATE INDEX IF NOT EXISTS "DebitNote_clientId_idx" ON public."DebitNote" ("clientId");
CREATE INDEX IF NOT EXISTS "DebitNote_companyId_idx" ON public."DebitNote" ("companyId");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON public."RolePermission" ("permissionId");
CREATE INDEX IF NOT EXISTS "TeamInvite_invitedByUserId_idx" ON public."TeamInvite" ("invitedByUserId");
CREATE INDEX IF NOT EXISTS "TeamInvite_invitedUserId_idx" ON public."TeamInvite" ("invitedUserId");
CREATE INDEX IF NOT EXISTS "VatProtocol117_clientId_idx" ON public."VatProtocol117" ("clientId");
CREATE INDEX IF NOT EXISTS "VatProtocol117_companyId_idx" ON public."VatProtocol117" ("companyId");

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'service_role_all_%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO public USING ((select auth.role()) = ''service_role'') WITH CHECK ((select auth.role()) = ''service_role'')',
      policy_row.policyname,
      policy_row.tablename
    );
  END LOOP;
END
$$;
