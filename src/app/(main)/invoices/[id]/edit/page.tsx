import { Suspense } from "react";
import EditInvoiceForm from "./EditInvoiceForm";
import { EditInvoicePageSkeleton } from "@/components/invoice/EditInvoicePageSkeleton";

export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <Suspense fallback={<EditInvoicePageSkeleton />}>
      <EditInvoiceForm invoiceId={id} />
    </Suspense>
  );
} 