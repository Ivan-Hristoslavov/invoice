import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Building, Plus, Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: `Клиенти | ${APP_NAME}`,
  description: "Управлявайте вашите клиенти",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">
            Моля, влезте в системата, за да имате достъп до клиентите
          </p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch clients from database
  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Клиенти</h1>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" /> Добавяне на клиент
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Търсене на клиенти..." className="pl-10" />
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Все още нямате клиенти</h3>
          <p className="mt-2 text-muted-foreground">
            Добавете първия си клиент, за да започнете да създавате фактури
          </p>
          <Button className="mt-4" asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" /> Добавяне на клиент
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{client.name}</h3>
                      {client.email && (
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="text-sm text-muted-foreground">
                          {client.phone}
                        </p>
                      )}
                      {(client.city || client.country) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {[client.city, client.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
