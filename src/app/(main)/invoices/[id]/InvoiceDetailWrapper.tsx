"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import InvoiceDetailSkeleton from "./InvoiceDetailSkeleton";

const InvoiceDetailClient = dynamic(() => import("./InvoiceDetailClient"), {
  loading: () => <InvoiceDetailSkeleton />,
});

interface InvoiceDetailWrapperProps {
  initialInvoice: any; // Use your Invoice type here
}

export default function InvoiceDetailWrapper({
  initialInvoice,
}: InvoiceDetailWrapperProps) {
  return (
    <Suspense fallback={<InvoiceDetailSkeleton />}>
      <InvoiceDetailClient initialInvoice={initialInvoice} />
    </Suspense>
  );
}
