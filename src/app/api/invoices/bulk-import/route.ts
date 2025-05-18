import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

// Define validation schema for CSV invoice data
const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").default(0),
  productId: z.string().optional(),
});

const importInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  companyId: z.string().min(1, "Company is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  currency: z.string().min(1, "Currency is required").default("USD"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

const bulkImportSchema = z.array(importInvoiceSchema);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const userId = session.user.id;

    // Parse the request
    const body = await request.json();
    
    // Validate the input data
    const validationResult = bulkImportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const invoicesData = validationResult.data;
    const results = [];
    const errors = [];

    // Process each invoice
    for (const invoiceData of invoicesData) {
      try {
        // Check if client exists and belongs to user
        const client = await prisma.client.findFirst({
          where: {
            id: invoiceData.clientId,
            userId,
          },
        });

        if (!client) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Client with ID ${invoiceData.clientId} not found or does not belong to user`,
          });
          continue;
        }

        // Check if company exists and belongs to user
        const company = await prisma.company.findFirst({
          where: {
            id: invoiceData.companyId,
            userId,
          },
        });

        if (!company) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Company with ID ${invoiceData.companyId} not found or does not belong to user`,
          });
          continue;
        }

        // Check if invoice number already exists for this company
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            invoiceNumber: invoiceData.invoiceNumber,
            companyId: invoiceData.companyId,
          },
        });

        if (existingInvoice) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Invoice number ${invoiceData.invoiceNumber} already exists for this company`,
          });
          continue;
        }

        // Calculate subtotal, tax amount, and total
        let subtotal = 0;
        let taxAmount = 0;

        const items = invoiceData.items.map((item) => {
          const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
          const itemTaxAmount = itemSubtotal * (Number(item.taxRate) / 100);
          
          subtotal += itemSubtotal;
          taxAmount += itemTaxAmount;
          
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal: itemSubtotal,
            taxAmount: itemTaxAmount,
            total: itemSubtotal + itemTaxAmount,
            productId: item.productId,
          };
        });

        const total = subtotal + taxAmount;

        // Create the invoice with its items
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: invoiceData.invoiceNumber,
            clientId: invoiceData.clientId,
            companyId: invoiceData.companyId,
            userId,
            issueDate: new Date(invoiceData.issueDate),
            dueDate: new Date(invoiceData.dueDate),
            status: invoiceData.status as InvoiceStatus,
            subtotal,
            taxAmount,
            total,
            currency: invoiceData.currency,
            notes: invoiceData.notes,
            termsAndConditions: invoiceData.termsAndConditions,
            items: {
              create: items,
            },
          },
          include: {
            items: true,
            client: true,
            company: true,
          },
        });

        results.push({
          invoiceNumber: invoice.invoiceNumber,
          id: invoice.id,
          total: invoice.total,
          status: invoice.status,
        });
      } catch (error) {
        errors.push({
          invoiceNumber: invoiceData.invoiceNumber,
          error: error.message || "An error occurred while processing this invoice",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      { error: "Failed to process import", details: error.message },
      { status: 500 }
    );
  }
} 