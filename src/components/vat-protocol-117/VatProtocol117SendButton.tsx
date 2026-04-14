"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useAsyncLock } from "@/hooks/use-async-lock";

interface VatProtocol117SendButtonProps {
  protocolId: string;
  clientEmail?: string | null;
  canSendEmail: boolean;
}

export function VatProtocol117SendButton({
  protocolId,
  clientEmail,
  canSendEmail,
}: VatProtocol117SendButtonProps) {
  const sendLock = useAsyncLock();

  if (!canSendEmail) {
    return null;
  }

  const hasEmail = Boolean(clientEmail?.trim());

  function handleSend() {
    void sendLock.run(async () => {
      try {
        const res = await fetch(`/api/vat-protocols-117/${protocolId}/send`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(data.error || "Неуспешно изпращане по имейл");
          return;
        }
        toast.success("Протоколът е изпратен на имейла на доставчика");
      } catch {
        toast.error("Неуспешно изпращане по имейл");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!hasEmail || sendLock.isPending}
      loading={sendLock.isPending}
      onClick={handleSend}
      className="flex items-center whitespace-nowrap"
      title={!hasEmail ? "Добавете имейл на контрагента (доставчик)" : undefined}
    >
      <Mail className="mr-1.5 h-4 w-4" />
      {sendLock.isPending ? "Изпращане…" : "Имейл"}
    </Button>
  );
}
