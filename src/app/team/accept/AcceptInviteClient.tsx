"use client";

import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useAsyncLock } from "@/hooks/use-async-lock";

export default function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const acceptLock = useAsyncLock();

  function handleAcceptInvite() {
    void acceptLock.run(async () => {
      try {
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
      }
    });
  }

  return (
    <Button
      onClick={handleAcceptInvite}
      disabled={acceptLock.isPending}
      loading={acceptLock.isPending}
      className="btn-responsive"
    >
      {acceptLock.isPending ? "Приемане..." : "Приеми поканата"}
    </Button>
  );
}
