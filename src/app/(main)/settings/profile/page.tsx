import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: `Настройки на профила | ${APP_NAME}`,
  description: "Обновете информацията за вашия профил",
};

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Профил</CardTitle>
          <CardDescription>
            Управление на вашата лична информация
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm 
            defaultValues={{
              name: session.user.name || "",
              email: session.user.email || "",
            }}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Профилна снимка</CardTitle>
          <CardDescription>
            Качете профилна снимка, за да персонализирате акаунта си
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border bg-muted">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Профилна снимка"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold uppercase text-muted-foreground">
                  {session.user.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <label htmlFor="picture" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Качете нова снимка
                  </label>
                  <input
                    id="picture"
                    type="file"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG или GIF. Максимален размер на файла 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 