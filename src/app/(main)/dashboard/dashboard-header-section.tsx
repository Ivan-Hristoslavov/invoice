import Link from "next/link";
import { Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";
import { InvoiceWorkspaceSetup } from "@/components/invoice/InvoiceWorkspaceSetup";
import { getDashboardShell } from "./load-dashboard-data";

export async function DashboardHeaderSection({ userId }: { userId: string }) {
  const shell = await getDashboardShell(userId);

  return (
    <>
      <div className="page-header">
        <div className="flex-1 min-w-0 space-y-2">
          <AppSectionKicker icon={LayoutDashboard}>Преглед</AppSectionKicker>
          <h1 className="page-title">Табло</h1>
          <p className="card-description">Фактури, суми и последни действия на един екран</p>
        </div>
        <Button
          asChild
          size="2"
          variant="solid"
          color="green"
          className="shadow-lg hover:shadow-xl transition-shadow btn-responsive"
        >
          <Link
            href={shell.hasInvoiceWorkspaceSetup ? "/invoices/new" : "/invoices"}
            className="flex items-center whitespace-nowrap"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">
              {shell.hasInvoiceWorkspaceSetup ? "Нова фактура" : "Настрой фактуриране"}
            </span>
            <span className="sm:hidden">{shell.hasInvoiceWorkspaceSetup ? "Нова" : "Старт"}</span>
          </Link>
        </Button>
      </div>

      {!shell.hasInvoiceWorkspaceSetup && (
        <InvoiceWorkspaceSetup
          hasCompanies={shell.hasCompanies}
          hasClients={shell.hasClients}
          title="Стъпки за първа фактура"
          description="Добавете фирма и клиент веднъж — след това всяка нова фактура е с няколко клика."
        />
      )}
    </>
  );
}
