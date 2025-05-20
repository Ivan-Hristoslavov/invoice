import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CreditCard, Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

export const metadata: Metadata = {
  title: `Плащания | ${APP_NAME}`,
  description: "Проследявайте и управлявайте плащанията по фактурите",
};

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте в системата, за да имате достъп до плащанията</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch payments from database
  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        userId: session.user.id
      }
    },
    include: {
      invoice: {
        include: {
          client: true
        }
      }
    },
    orderBy: {
      paymentDate: 'desc'
    }
  });

  return (
    <div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Плащания</h1>
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="w-4 h-4 mr-2" />
              Запис на плащане
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Търсене на плащания..." 
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm">Филтриране</Button>
            <Button variant="outline" size="sm">Експорт</Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>История на плащанията</CardTitle>
            <CardDescription>Проследявайте всички плащания по фактури</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">Няма записани плащания</h3>
                <p className="mt-2 text-muted-foreground">
                  Когато получите плащания от клиенти, те ще се появят тук
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/payments/new">
                    <Plus className="mr-2 h-4 w-4" /> Запис на първо плащане
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-xs sm:text-sm">Дата</th>
                      <th className="px-4 py-3 text-left font-medium text-xs sm:text-sm">Фактура</th>
                      <th className="px-4 py-3 text-left font-medium text-xs sm:text-sm">Клиент</th>
                      <th className="px-4 py-3 text-left font-medium text-xs sm:text-sm">Метод</th>
                      <th className="px-4 py-3 text-left font-medium text-xs sm:text-sm">Сума</th>
                      <th className="px-4 py-3 text-right font-medium text-xs sm:text-sm">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          {format(payment.paymentDate, "d MMM yyyy", { locale: bg })}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <Link 
                              href={`/invoices/${payment.invoiceId}`}
                              className="hover:underline"
                            >
                              {payment.invoice.invoiceNumber}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          {payment.invoice.client.name}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodStyles(payment.paymentMethod)}`}>
                            {formatPaymentMethod(payment.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm font-medium">
                          {payment.invoice.currency === 'BGN' ? 'лв. ' : payment.invoice.currency === 'EUR' ? '€' : payment.invoice.currency === 'GBP' ? '£' : '$'}{Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/payments/${payment.id}`}>
                                Преглед
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatPaymentMethod(method: string) {
  const translations: Record<string, string> = {
    'BANK_TRANSFER': 'Банков превод',
    'CREDIT_CARD': 'Кредитна карта',
    'PAYPAL': 'PayPal',
    'CASH': 'В брой'
  };
  return translations[method] || method.replace('_', ' ').replace(/\w\S*/g, 
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

function getPaymentMethodStyles(method: string) {
  switch (method) {
    case "BANK_TRANSFER":
      return "bg-blue-100 text-blue-800";
    case "CREDIT_CARD":
      return "bg-purple-100 text-purple-800";
    case "PAYPAL":
      return "bg-indigo-100 text-indigo-800";
    case "CASH":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
} 