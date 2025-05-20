import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import dynamic from 'next/dynamic';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoiceWithDetails } from '@/lib/services/invoice-service';

interface PageParams {
  params: {
    id: string;
  };
}

interface PageProps extends PageParams {}

// Динамично зареждане на компонентите
const InvoiceDetailClient = dynamic(
  () => import('./InvoiceDetailClient'),
  {
    loading: () => <InvoiceDetailSkeleton />,
    ssr: false // Изключваме SSR за клиентския компонент
  }
);

const DocumentsTab = dynamic(
  () => import('@/components/invoice/DocumentsTab'),
  {
    loading: () => <Skeleton className="h-[200px]" />,
    ssr: false
  }
);

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      title: "Достъпът е отказан",
      description: "Моля, влезте в системата, за да имате достъп до фактурата.",
    };
  }

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    select: {
      invoiceNumber: true,
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invoice) {
    return {
      title: "Фактурата не е намерена",
      description: "Фактурата, която търсите, не съществува.",
    };
  }

  return {
    title: `Фактура #${invoice.invoiceNumber} - ${invoice.client.name}`,
    description: `Детайли за фактура #${invoice.invoiceNumber} за ${invoice.client.name}`,
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Достъпът е отказан</h1>
            <p className="text-muted-foreground mb-4">
              Моля, влезте в системата, за да имате достъп до фактурата.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoice = await getInvoiceWithDetails(params.id, session.user.id);

  if (!invoice) {
    notFound();
  }

  return (
    <Suspense fallback={<InvoiceDetailSkeleton />}>
      <InvoiceDetailClient initialInvoice={invoice} />
    </Suspense>
  );
}
