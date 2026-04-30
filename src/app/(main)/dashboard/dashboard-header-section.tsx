import { Plus, LayoutDashboard, FileBadge2, TableProperties } from "lucide-react";
import { LinkButton } from "@/components/dashboard/LinkButton";
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
        <LinkButton
          href={shell.hasInvoiceWorkspaceSetup ? "/invoices/new" : "/invoices"}
          linkClassName="flex items-center whitespace-nowrap"
          size="2"
          variant="solid"
          color="green"
          className="shadow-lg hover:shadow-xl transition-shadow btn-responsive"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">
            {shell.hasInvoiceWorkspaceSetup ? "Нова фактура" : "Настрой фактуриране"}
          </span>
          <span className="sm:hidden">{shell.hasInvoiceWorkspaceSetup ? "Нова" : "Старт"}</span>
        </LinkButton>
      </div>

      {!shell.hasInvoiceWorkspaceSetup && (
        <InvoiceWorkspaceSetup
          hasCompanies={shell.hasCompanies}
          hasClients={shell.hasClients}
          title="Стъпки за първа фактура"
          description="Добавете фирма и клиент веднъж — след това всяка нова фактура е с няколко клика."
        />
      )}

      <div className="flex flex-wrap gap-2">
        <LinkButton href="/reports/invoices" variant="outline" size="sm" linkClassName="flex items-center">
          <TableProperties className="mr-1.5 h-4 w-4" />
          Справки
        </LinkButton>
        <LinkButton href="/proforma-invoices" variant="outline" size="sm" linkClassName="flex items-center">
          <FileBadge2 className="mr-1.5 h-4 w-4" />
          Проформи
        </LinkButton>
      </div>
    </>
  );
}
