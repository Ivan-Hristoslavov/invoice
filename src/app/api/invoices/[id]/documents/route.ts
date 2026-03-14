import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";

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

    const { name, size, type, url } = await request.json();

    const { data: document, error: insertError } = await supabase
      .from("Document")
      .insert({
        name,
        size,
        type,
        url,
        invoiceId,
        userId: sessionUser.id,
      })
      .select()
      .single();

    if (insertError) {
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

    // Check if document belongs to user and invoice
    const { data: document } = await supabase
      .from("Document")
      .select("id")
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

    // Delete document
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