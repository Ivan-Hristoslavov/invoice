import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { resolveSessionUser } from "@/lib/session-user";
import { getCompanyRoleForUser, getPendingTeamInvitesForCompany, getSelectedCompanyForUser, getTeamMembersForCompany } from "@/lib/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import TeamSettingsClient from "./TeamSettingsClient";

export const metadata: Metadata = {
  title: `Екип | ${APP_NAME}`,
  description: "Управление на екипа, ролите и поканите",
};

export default async function TeamSettingsPage(props: {
  searchParams?: Promise<{ companyId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const searchParams = (await props.searchParams) || {};
  const { companies, selectedCompany } = await getSelectedCompanyForUser(
    sessionUser.id,
    searchParams.companyId
  );

  if (!selectedCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Няма налична компания</CardTitle>
          <CardDescription>
            Създайте компания, за да поканите екипа си и да управлявате ролите.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/settings/company">Към настройките на компанията</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const [members, invites, currentUserRole] = await Promise.all([
    getTeamMembersForCompany(selectedCompany.id),
    getPendingTeamInvitesForCompany(selectedCompany.id),
    getCompanyRoleForUser(sessionUser.id, selectedCompany.id),
  ]);

  return (
    <TeamSettingsClient
      companies={companies}
      company={selectedCompany}
      members={members}
      invites={invites}
      currentUserId={sessionUser.id}
      currentUserRole={currentUserRole || "VIEWER"}
    />
  );
} 