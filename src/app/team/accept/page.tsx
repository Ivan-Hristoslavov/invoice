import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import AcceptInviteClient from "./AcceptInviteClient";

export default async function AcceptTeamInvitePage(props: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const searchParams = (await props.searchParams) || {};
  const token = searchParams.token;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Липсва покана</CardTitle>
          <CardDescription>Линкът за поканата е невалиден или непълен.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!session?.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/team/accept?token=${token}`)}`);
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const { data: invite } = await supabaseAdmin
    .from("TeamInvite")
    .select("email, role, status, expiresAt, company:Company(name)")
    .eq("token", token)
    .maybeSingle();

  const company = Array.isArray(invite?.company) ? invite.company[0] : invite?.company;
  const isExpired = invite ? new Date(invite.expiresAt).getTime() < Date.now() : true;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Покана за екипа</CardTitle>
          <CardDescription>
            {invite
              ? `Поканени сте в ${company?.name || "компанията"} с роля ${invite.role}.`
              : "Поканата не беше намерена."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invite ? (
            <Button asChild variant="outline">
              <Link href="/settings/team">Към екипа</Link>
            </Button>
          ) : invite.status !== "PENDING" ? (
            <p className="text-sm text-muted-foreground">Тази покана вече не е активна.</p>
          ) : isExpired ? (
            <p className="text-sm text-muted-foreground">Срокът на поканата е изтекъл. Помолете изпращача да я поднови.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Влезли сте като <strong>{sessionUser.email}</strong>. Този имейл трябва да съвпада с поканата.
              </p>
              <AcceptInviteClient token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
