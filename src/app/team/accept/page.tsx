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

  const { data: invite } = await supabaseAdmin
    .from("TeamInvite")
    .select("email, role, status, expiresAt, company:Company(name)")
    .eq("token", token)
    .maybeSingle();

  const company = Array.isArray(invite?.company) ? invite.company[0] : invite?.company;
  const isExpired = invite ? new Date(invite.expiresAt).getTime() < Date.now() : true;
  const roleLabel =
    invite?.role === "ADMIN"
      ? "Администратор"
      : invite?.role === "MANAGER"
        ? "Мениджър"
        : invite?.role === "ACCOUNTANT"
          ? "Счетоводител"
          : invite?.role === "VIEWER"
            ? "Наблюдател"
            : invite?.role || "Член";

  const session = await getServerSession(authOptions);
  if (!session?.user && invite?.email) {
    redirect(
      `/signin?email=${encodeURIComponent(invite.email)}&callbackUrl=${encodeURIComponent(`/team/accept?token=${token}`)}`
    );
  }

  if (!session?.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/team/accept?token=${token}`)}`);
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center px-4 py-10">
      <Card className="w-full overflow-hidden border-border/60 bg-card/90 shadow-2xl">
        <CardHeader className="border-b border-border/50 bg-linear-to-br from-primary/10 via-transparent to-cyan-500/5 pb-6">
          <div className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Покана за екип
          </div>
          <CardTitle className="mt-4 text-3xl">Присъединяване към {company?.name || "екипа"}</CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            {invite
              ? `Поканени сте с роля ${roleLabel}. Потвърдете достъпа и ще добавим акаунта ви към компанията веднага.`
              : "Поканата не беше намерена."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
              <div className="grid gap-4 rounded-3xl border border-border/60 bg-background/50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Имейл</p>
                  <p className="mt-2 text-lg font-semibold">{invite.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Компания</p>
                  <p className="mt-2 text-lg font-semibold">{company?.name || "Компания"}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
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
