import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import cuid from "cuid";
import {
  STORAGE_BUCKET_IMAGES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_INVOICE,
} from "@/config/constants";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

function getStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const u = new URL(publicUrl);
    const match = u.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Check if invoice belongs to user
    const { data: invoice } = await supabase
      .from("Invoice")
      .select("id")
      .eq("id", invoiceId)
      .eq("userId", sessionUser.id)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    // Get documents for this invoice
    const { data: documents, error: documentsError } = await supabase
      .from("Document")
      .select("*")
      .eq("invoiceId", invoiceId)
      .eq("userId", sessionUser.id)
      .order("createdAt", { ascending: false });

    if (documentsError) {
      throw documentsError;
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Грешка при зареждане на документи:", error);
    return NextResponse.json(
      { error: "Неуспешно зареждане на документи" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();

    const { data: invoice } = await supabase
      .from("Invoice")
      .select("id")
      .eq("id", invoiceId)
      .eq("userId", sessionUser.id)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Липсва прикачен файл. Използвайте полето 'file'." },
        { status: 400 }
      );
    }

    const allowedTypes = [...ALLOWED_ATTACHMENT_MIME_TYPES];
    if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) {
      return NextResponse.json(
        {
          error:
            "Невалиден тип файл. Позволени: PDF, JPG, PNG, WebP, GIF.",
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Размерът надвишава ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB.`,
        },
        { status: 400 }
      );
    }

    const { count } = await supabase
      .from("Document")
      .select("id", { count: "exact", head: true })
      .eq("invoiceId", invoiceId);
    if ((count ?? 0) >= MAX_ATTACHMENTS_PER_INVOICE) {
      return NextResponse.json(
        { error: `Максимум ${MAX_ATTACHMENTS_PER_INVOICE} прикачени файла на фактура.` },
        { status: 400 }
      );
    }

    const docId = cuid();
    const safeName = sanitizeFileName(file.name);
    const ext = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : "";
    const storagePath = `attachments/${invoiceId}/${docId}${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_IMAGES)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Document upload error:", uploadError);
      return NextResponse.json(
        { error: "Неуспешно качване на файла в хранилището" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET_IMAGES)
      .getPublicUrl(storagePath);
    const url = urlData.publicUrl;

    const { data: document, error: insertError } = await supabase
      .from("Document")
      .insert({
        id: docId,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        invoiceId,
        userId: sessionUser.id,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(STORAGE_BUCKET_IMAGES).remove([storagePath]);
      throw insertError;
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Грешка при създаване на документ:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на документ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Get document ID from query parameter
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Липсва ID на документ" },
        { status: 400 }
      );
    }

    const { data: document } = await supabase
      .from("Document")
      .select("id, url")
      .eq("id", documentId)
      .eq("invoiceId", invoiceId)
      .eq("userId", sessionUser.id)
      .maybeSingle();

    if (!document) {
      return NextResponse.json(
        { error: "Документът не е намерен" },
        { status: 404 }
      );
    }

    const pathToRemove = document.url
      ? getStoragePathFromPublicUrl(document.url, STORAGE_BUCKET_IMAGES)
      : null;
    if (pathToRemove) {
      await supabase.storage.from(STORAGE_BUCKET_IMAGES).remove([pathToRemove]);
    }

    const { error: deleteError } = await supabase
      .from("Document")
      .delete()
      .eq("id", documentId)
      .eq("invoiceId", invoiceId)
      .eq("userId", sessionUser.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при изтриване на документ:", error);
    return NextResponse.json(
      { error: "Неуспешно изтриване на документ" },
      { status: 500 }
    );
  }
} 