import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import InvoiceImportClient from "./InvoiceImportClient";
import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Import Invoices - InvoiceNinja",
  description: "Import multiple invoices from a CSV file",
};

export default async function InvoiceImportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin?callbackUrl=/invoices/import");
  }

  // Check if user has permission to create invoices
  const canCreateInvoices = await checkPermission("invoice:create");
  if (!canCreateInvoices) {
    redirect("/dashboard");
  }

  // Get clients for this user to populate the dropdown
  const clients = await prisma.client.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get companies for this user to populate the dropdown
  const companies = await prisma.company.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get products for this user to populate the dropdown
  const products = await prisma.product.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      price: true,
      taxRate: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file to bulk import multiple invoices
        </p>
      </div>
      
      <InvoiceImportClient 
        clients={clients}
        companies={companies}
        products={products}
      />
    </div>
  );
} 