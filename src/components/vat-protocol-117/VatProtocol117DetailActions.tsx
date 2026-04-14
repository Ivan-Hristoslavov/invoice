"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VatProtocol117PrintButton } from "@/components/vat-protocol-117/VatProtocol117PrintButton";
import { VatProtocol117SendButton } from "@/components/vat-protocol-117/VatProtocol117SendButton";

export function VatProtocol117DetailActions({
  protocolId,
  clientEmail,
  canSendEmail,
}: {
  protocolId: string;
  clientEmail?: string | null;
  canSendEmail: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <VatProtocol117PrintButton protocolId={protocolId} className="flex items-center whitespace-nowrap" />
      <Button variant="outline" size="sm" asChild>
        <Link
          href={`/api/vat-protocols-117/${protocolId}/export-pdf?disposition=attachment`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center whitespace-nowrap"
        >
          <Download className="mr-1.5 h-4 w-4" />
          PDF
        </Link>
      </Button>
      <VatProtocol117SendButton
        protocolId={protocolId}
        clientEmail={clientEmail}
        canSendEmail={canSendEmail}
      />
    </div>
  );
}
