import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    
    // Check if invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });
    
    if (!invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }
    
    // Get documents for this invoice
    const documents = await prisma.document.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
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
    const userId = (session.user as any).id;
    
    // Check if invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });
    
    if (!invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }
    
    // In a real application, you would process file uploads here
    // For this example, we'll assume the frontend sends document metadata
    const { name, size, type, url } = await request.json();
    
    const document = await prisma.document.create({
      data: {
        name,
        size,
        type,
        url,
        invoiceId,
        userId,
      },
    });
    
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
    const userId = (session.user as any).id;
    
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
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        invoiceId,
        userId,
      },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: "Документът не е намерен" },
        { status: 404 }
      );
    }
    
    // Delete document
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при изтриване на документ:", error);
    return NextResponse.json(
      { error: "Неуспешно изтриване на документ" },
      { status: 500 }
    );
  }
} 