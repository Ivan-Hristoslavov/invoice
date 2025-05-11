import { getTranslations } from "next-intl/server";
import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { getServerSession } from "next-auth";
import { redirect } from "@/i18n/server";
import { Link } from "@/i18n/server";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const commonT = await getTranslations({ locale, namespace: "common" });
  const dashboardT = await getTranslations({ locale, namespace: "dashboard" });
  
  return {
    title: `${dashboardT("title")} | ${commonT("appName")}`,
    description: "Dashboard for your invoicing application",
  };
}

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const dashboardT = await getTranslations({ locale, namespace: "dashboard" });
  const invoicesT = await getTranslations({ locale, namespace: "invoices" });
  
  const session = await getServerSession();
  
  if (!session || !session.user) {
    redirect({ href: "/signin", locale });
  }
  
  // Get user's invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      user: {
        email: session.user.email as string
      }
    },
    include: {
      client: true,
      company: true
    },
    orderBy: {
      issueDate: 'desc'
    },
    take: 5
  });
  
  // Get summary data
  const invoiceCounts = await prisma.invoice.groupBy({
    by: ['status'],
    where: {
      user: {
        email: session.user.email as string
      }
    },
    _count: {
      id: true
    }
  });
  
  const counts = {
    total: invoiceCounts.reduce((acc, curr) => acc + curr._count.id, 0),
    paid: invoiceCounts.find(i => i.status === 'PAID')?._count.id || 0,
    unpaid: invoiceCounts.find(i => i.status === 'UNPAID')?._count.id || 0,
    overdue: invoiceCounts.find(i => i.status === 'OVERDUE')?._count.id || 0
  };
  
  // Get total revenue
  const totalRevenue = await prisma.invoice.aggregate({
    where: {
      status: 'PAID',
      user: {
        email: session.user.email as string
      }
    },
    _sum: {
      total: true
    }
  });
  
  const revenue = totalRevenue._sum.total || 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{dashboardT("title")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">{dashboardT("totalInvoices")}</h3>
          <p className="text-3xl font-bold">{counts.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">{dashboardT("paidInvoices")}</h3>
          <p className="text-3xl font-bold text-green-600">{counts.paid}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">{dashboardT("unpaidInvoices")}</h3>
          <p className="text-3xl font-bold text-amber-600">{counts.unpaid}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">{dashboardT("totalRevenue")}</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(Number(revenue), locale)}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{dashboardT("recentInvoices")}</h2>
          <Link href="/invoices" className="text-blue-600 hover:text-blue-800">
            {invoicesT("title")} →
          </Link>
        </div>
        
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoicesT("invoiceNumber")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoicesT("client")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoicesT("issueDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoicesT("amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoicesT("status")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/invoices/${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issueDate, locale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(Number(invoice.total), locale, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {invoicesT(`status.${invoice.status.toLowerCase()}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{dashboardT("noInvoices")}</p>
            <Link 
              href="/invoices/new" 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {invoicesT("createInvoice")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 