"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsyncLock } from "@/hooks/use-async-lock";
import { toast } from "@/lib/toast";

interface DebitNoteSendButtonProps {
  id: string;
  clientEmail: string | null;
}

export function DebitNoteSendButton({
  id,
  clientEmail,
}: DebitNoteSendButtonProps) {
  const sendLock = useAsyncLock();
  const hasEmail = Boolean(clientEmail?.trim());

  const handleSend = async () => {
    if (!hasEmail) return;

    await sendLock.run(async () => {
      try {
        const response = await fetch(`/api/debit-notes/${id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorPayload = (await response
            .json()
            .catch(() => null)) as { error?: string } | null;
          throw new Error(
            errorPayload?.error || "Грешка при изпращане на известието"
          );
        }

        toast.success("Дебитното известие е изпратено успешно", {
          description: clientEmail
            ? `Изпратено на ${clientEmail}`
            : undefined,
        });
      } catch (error) {
        console.error("Error sending debit note:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Грешка при изпращане на известието"
        );
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void handleSend()}
      disabled={!hasEmail || sendLock.isPending}
      loading={sendLock.isPending}
      title={!hasEmail ? "Клиентът няма имейл" : undefined}
      className="flex items-center whitespace-nowrap"
    >
      <Mail className="w-4 h-4 mr-1.5" />
      {sendLock.isPending ? "Изпращане..." : "Изпрати по имейл"}
    </Button>
  );
}
