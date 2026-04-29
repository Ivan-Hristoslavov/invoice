import { createAdminClient } from "@/lib/supabase/server";
import cuid from "cuid";

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CANCEL'
  | 'SEND'
  | 'EXPORT'
  | 'VIEW'
  | 'ISSUE'
  | 'VOID';

export type EntityType = 
  | 'INVOICE' 
  | 'CREDIT_NOTE' 
  | 'DEBIT_NOTE'
  | 'CLIENT' 
  | 'COMPANY' 
  | 'PRODUCT' 
  | 'USER'
  | 'VAT_PROTOCOL_117';

interface LogActionParams {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  invoiceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an action to the audit log
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    await supabase
      .from("AuditLog")
      .insert({
        id: cuid(),
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        invoiceId: params.invoiceId || null,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        createdAt: new Date().toISOString(),
      });
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    console.error("Failed to log audit action:", error);
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("AuditLog")
    .select("*")
    .eq("entityType", entityType)
    .eq("entityId", entityId)
    .order("createdAt", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Failed to get audit logs:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("AuditLog")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Failed to get user audit logs:", error);
    return [];
  }
  
  return data || [];
}
