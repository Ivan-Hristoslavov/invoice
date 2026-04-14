"use client";

import { Suspense } from "react";
import { VatProtocol117Form } from "@/components/vat-protocol-117/VatProtocol117Form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function NewVatProtocol117Page() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-24" size="large" />}>
      <VatProtocol117Form />
    </Suspense>
  );
}
