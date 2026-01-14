import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/permissions";
import InvoicesClient from "./InvoicesClient";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  status: string;
  userId: string;
  client: {
    id: string;
    name: string;
    userId: string;
  };
}

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте в системата, за да имате достъп до фактурите</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to create invoices
  const canCreateInvoices = await checkPermission("invoice:create");

  const supabase = createAdminClient();
  
  // Fetch invoices from the database
  // First get invoices created by the user
  const { data: userInvoices, error: invoicesError } = await supabase
    .from("Invoice")
    .select("*, client:Client(*)")
    .eq("userId", session.user.id)
    .order("issueDate", { ascending: false });
  
  // Get invoices where user is the client (need to get client IDs first)
  const { data: userClients } = await supabase
    .from("Client")
    .select("id")
    .eq("userId", session.user.id);
  
  const clientIds = (userClients || []).map(c => c.id);
  
  let clientInvoices: any[] = [];
  if (clientIds.length > 0) {
    const { data: ci } = await supabase
      .from("Invoice")
      .select("*, client:Client(*)")
      .in("clientId", clientIds)
      .order("issueDate", { ascending: false });
    clientInvoices = ci || [];
  }
  
  // Combine and deduplicate invoices
  const allInvoices = [...(userInvoices || []), ...clientInvoices];
  const uniqueInvoices = Array.from(
    new Map(allInvoices.map(inv => [inv.id, inv])).values()
  );
  
  const invoices = uniqueInvoices;

  // Fetch clients and companies for export dialog
  const { data: clients } = await supabase
    .from("Client")
    .select("id, name")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });

  const { data: companies } = await supabase
    .from("Company")
    .select("id, name")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });

  return (
    <InvoicesClient
      initialInvoices={invoices.map(inv => ({
        ...inv,
        issueDate: typeof inv.issueDate === 'string' ? inv.issueDate : inv.issueDate,
        dueDate: typeof inv.dueDate === 'string' ? inv.dueDate : inv.dueDate,
      }))}
      clients={clients || []}
      companies={companies || []}
      canCreateInvoices={canCreateInvoices}
      currentUserId={session.user.id}
    />
  );
} 