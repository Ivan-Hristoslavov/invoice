"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printVatProtocol117Pdf } from "@/lib/vat-protocol-117-print-client";
import { toast } from "@/lib/toast";

export function VatProtocol117PrintButton({
  protocolId,
  className,
}: {
  protocolId: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => {
        if (!printVatProtocol117Pdf(protocolId)) {
          toast.error(
            "Позволете изскачащи прозорци за този сайт или отворете „PDF“ и печат от прегледа."
          );
        }
      }}
    >
      <Printer className="mr-1.5 h-4 w-4" />
      Принт
    </Button>
  );
}
