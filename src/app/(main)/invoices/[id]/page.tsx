import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInvoiceWithDetails } from "@/lib/services/invoice-service";
import InvoiceDetailClient from "./InvoiceDetailClient";
import { Decimal } from "@prisma/client/runtime/library";

// Helper function to serialize Decimal objects
function serializeDecimal(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Decimal objects by extracting only the numeric value
  if (obj instanceof Decimal) {
    // Convert to a plain number, handling potential precision issues
    const num = obj.toNumber();
    // For very large numbers or when precision is crucial, you might want to use toString()
    return Number.isFinite(num) ? num : parseFloat(obj.toString());
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal);
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      // Only include own properties and skip constructor
      if (Object.prototype.hasOwnProperty.call(obj, key) && key !== 'constructor') {
        result[key] = serializeDecimal(obj[key]);
      }
    }
    return result;
  }

  // Return primitive values as is
  return obj;
}

export const metadata: Metadata = {
  title: "Invoice Details",
  description: "View and manage invoice details",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params; // Await params as required by Next.js

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return notFound();
  }

  try {
    const invoice = await getInvoiceWithDetails(id, session.user.id);

    if (!invoice) {
      return notFound();
    }

    // Serialize Decimal objects before passing to client component
    const serializedInvoice = serializeDecimal(invoice);

    return <InvoiceDetailClient initialInvoice={serializedInvoice} />;
  } catch (error) {
    console.error('Error loading invoice:', error);
    // Return 404 if database is unavailable or invoice not found
    return notFound();
  }
}
