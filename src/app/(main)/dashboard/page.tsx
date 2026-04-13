import { Metadata } from "next";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { resolveSessionUser } from "@/lib/session-user";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { DashboardHeaderSection } from "./dashboard-header-section";
import { DashboardHeaderSkeleton } from "./dashboard-header-skeleton";
import { DashboardMainSection } from "./dashboard-main-section";

export const metadata: Metadata = {
  title: `Табло | ${APP_NAME}`,
  description: "Управлявайте вашия акаунт и прегледайте вашето табло",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const sessionUserDisplayName =
    (sessionUser as { name?: string }).name ??
    (sessionUser.email ? sessionUser.email.split("@")[0] : "—");

  return (
    <div className="space-y-4 sm:space-y-5">
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <DashboardHeaderSection userId={sessionUser.id} />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardMainSection userId={sessionUser.id} sessionUserDisplayName={sessionUserDisplayName} />
      </Suspense>
    </div>
  );
}
