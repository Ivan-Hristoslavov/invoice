import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CompanyForm } from "./CompanyForm";

export const metadata: Metadata = {
  title: `Настройки на компанията | ${APP_NAME}`,
  description: "Актуализирайте информацията за вашата компания",
};

export default async function CompanySettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }
  
  // Вземи компанията по подразбиране на потребителя
  const company = await prisma.company.findFirst({
    where: { 
      userId: session.user.id 
    }
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Информация за компанията</CardTitle>
          <CardDescription>
            Актуализирайте информацията за вашата компания за фактури
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm 
            defaultValues={{
              id: company?.id || "",
              name: company?.name || "",
              email: company?.email || "",
              phone: company?.phone || "",
              address: company?.address || "",
              city: company?.city || "",
              state: company?.state || "",
              zipCode: company?.zipCode || "",
              country: company?.country || "",
              vatNumber: company?.vatNumber || "",
              taxIdNumber: company?.taxIdNumber || "",
              registrationNumber: company?.registrationNumber || "",
            }}
            isNewCompany={!company}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Банкова информация</CardTitle>
          <CardDescription>
            Добавете банковите си детайли, които ще се показват на фактурите
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm 
            defaultValues={{
              id: company?.id || "",
              bankName: company?.bankName || "",
              bankAccount: company?.bankAccount || "",
              bankSwift: company?.bankSwift || "",
              bankIban: company?.bankIban || "",
            }}
            isBankInfo={true}
            isNewCompany={!company}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Лого на компанията</CardTitle>
          <CardDescription>
            Качете лого на вашата компания, което ще се показва на фактурите
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded overflow-hidden border bg-muted">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold uppercase text-muted-foreground">
                  {company?.name?.charAt(0) || "К"}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <label htmlFor="logo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Качване на лого
                  </label>
                  <input
                    id="logo"
                    type="file"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG или SVG. Максимален размер на файла 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 