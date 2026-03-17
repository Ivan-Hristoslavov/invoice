-- Add isActive flag to Product for safe archiving
alter table "public"."Product"
  add column if not exists "isActive" boolean not null default true;

