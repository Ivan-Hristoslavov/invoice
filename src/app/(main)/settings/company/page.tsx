import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CompanyForm } from "./CompanyForm";
import { CompanyLogoSection } from "./CompanyLogoSection";

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
  let company = null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("Company")
      .select("*")
      .eq("userId", session.user.id)
      .single();
    
    if (!error && data) {
      company = data;
    }
  } catch (error) {
    console.error("Грешка при връзка с базата данни:", error);
    // Continue with null company - the form will handle creating a new one
  }
  
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
      
      {company && (
        <Card>
          <CardHeader>
            <CardTitle>Лого на компанията</CardTitle>
            <CardDescription>
              Качете лого на вашата компания, което ще се показва на фактурите
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyLogoSection
              currentLogoUrl={company.logo}
              companyId={company.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
