# Database Migrations

These are the raw SQL migrations for Supabase. Run them in order against your Supabase project.

## Naming Convention

Files follow the pattern `NNNN_description.sql` where `NNNN` is a zero-padded 4-digit sequential number.

New migrations should be named accordingly — e.g. if the last file is `0014_...sql`, the next should be `0015_description.sql`.

## Files

| File | Description |
|------|-------------|
| `0000_schema.sql` | Base schema — full initial Supabase schema |
| `0001_subscription_query.sql` | Subscription query helpers |
| `0002_invoice_sequence.sql` | Invoice sequence numbering |
| `0003_rename_mol_to_english.sql` | Rename MOL field to English equivalent |
| `0004_starting_invoice_number.sql` | Starting invoice number configuration |
| `0005_debit_notes.sql` | Debit notes table and logic |
| `0006_debit_notes_safe.sql` | Safe/idempotent debit notes migration |
| `0007_credit_note_optional_invoice.sql` | Make invoice optional on credit notes |
| `0008_password_reset_token.sql` | Password reset token table |
| `0009_company_bulstat_unique.sql` | Unique constraint on company Bulstat |
| `0010_document_snapshots_and_sequences.sql` | Document snapshots and sequence tracking |
| `0011_security_and_indexes.sql` | RLS policies, security rules, and indexes |
| `0012_created_by.sql` | Add created_by field |
| `0013_product_is_active.sql` | Add is_active flag to products |
| `0014_add_reverse_charge_and_vat_exempt_reason.sql` | Reverse charge and VAT exempt reason fields |

## How to Apply

Run each file in order via the Supabase SQL editor or `psql`:

```bash
psql "$DATABASE_URL" -f 0001_subscription_query.sql
# ... and so on
```

> Note: `0000_schema.sql` is the base schema snapshot. If you are starting from scratch, apply it first. If Supabase already has the base schema, skip it and start from `0001`.
