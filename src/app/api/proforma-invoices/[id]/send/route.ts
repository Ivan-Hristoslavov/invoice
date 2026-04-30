import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { sendProformaEmail } from "@/lib/email";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });

    const { id } = await params;
    const supabase = createAdminClient();
    const { data: proforma, error } = await supabase
      .from("ProformaInvoice")
      .select("*, client:Client(*)")
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (error || !proforma) return NextResponse.json({ error: "Проформата не е намерена" }, { status: 404 });
    if (!proforma.client?.email) return NextResponse.json({ error: "Липсва имейл на клиента" }, { status: 400 });

    await sendProformaEmail({
      to: proforma.client.email,
      proformaId: proforma.id,
      proformaNumber: proforma.proformaNumber,
      userId: sessionUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending proforma:", error);
    return NextResponse.json({ error: "Неуспешно изпращане на проформа" }, { status: 500 });
  }
}
