import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProformaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) redirect("/signin");

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: proforma } = await supabase
    .from("ProformaInvoice")
    .select("*, client:Client(id,name,email), company:Company(id,name), items:ProformaInvoiceItem(*)")
    .eq("id", id)
    .eq("userId", sessionUser.id)
    .single();

  if (!proforma) notFound();

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="page-title">Проформа фактура {proforma.proformaNumber}</h1>
          <p className="card-description">{proforma.client?.name || "-"} · {new Date(proforma.issueDate).toLocaleDateString("bg-BG")}</p>
        </div>
        <div className="page-header-actions w-full sm:w-auto gap-2">
          <Button asChild variant="outline">
            <a target="_blank" rel="noreferrer" href={`/api/proforma-invoices/export-pdf?proformaId=${proforma.id}&disposition=inline`}>Принт</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/proforma-invoices/export-pdf?proformaId=${proforma.id}`}>PDF</a>
          </Button>
          <Button asChild>
            <Link href="/proforma-invoices">Назад</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Артикули</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(proforma.items || []).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{Number(item.quantity).toFixed(2)} x {Number(item.unitPrice).toFixed(2)}</p>
              </div>
              <p className="font-semibold">{Number(item.total).toFixed(2)} {proforma.currency}</p>
            </div>
          ))}
          <div className="pt-2 text-right font-bold">Общо: {Number(proforma.total).toFixed(2)} {proforma.currency}</div>
        </CardContent>
      </Card>
    </div>
  );
}
