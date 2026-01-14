import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="container max-w-lg mx-auto py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl">
            Плащането е успешно!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Благодарим ви за плащането. Фактурата е маркирана като платена и ще получите
            потвърждение на имейла си.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href={`/invoices/${id}`}>
                Виж фактурата
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/invoices">
                Всички фактури
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 