"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAcceptInvite() {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/team/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Неуспешно приемане на поканата");
      }

      if (payload.requiresProfileSetup) {
        toast.success("Поканата е приета. Моля, попълнете име и телефон в профила си.");
        router.push("/settings/profile?setup=1");
      } else {
        toast.success("Поканата е приета");
        router.push("/settings/team");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Неуспешно приемане на поканата");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button onClick={handleAcceptInvite} disabled={isSubmitting} className="btn-responsive">
      {isSubmitting ? "Приемане..." : "Приеми поканата"}
    </Button>
  );
}
