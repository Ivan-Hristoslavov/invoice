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
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileForm } from "./ProfileForm";
import { GdprSection } from "./GdprSection";
import { User, Camera, Info } from "lucide-react";
import { PageHeader } from "@/components/page";

export const metadata: Metadata = {
  title: `Настройки на профила | ${APP_NAME}`,
  description: "Обновете информацията за вашия профил",
};

export default async function ProfileSettingsPage(props: {
  searchParams?: Promise<{ setup?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const searchParams = (await props.searchParams) ?? {};
  const isSetup = searchParams.setup === "1";

  if (!session?.user) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const { data: dbUser } = await supabase
    .from("User")
    .select("name, email, phone")
    .eq("id", session.user.id)
    .single();

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Профил"
        description="Лични данни, снимка и защита на личните данни (GDPR)"
      />

      {/* Rich profile header */}
      <Card className="overflow-hidden">
        <div className="h-18 bg-linear-to-r from-primary/20 via-primary/10 to-primary/5 sm:h-24" />
        <CardContent className="pt-0 pb-5 sm:pb-6">
          <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:gap-4">
            {/* Avatar */}
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg shrink-0 sm:h-24 sm:w-24">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Профилна снимка"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary sm:text-2xl">
                  {initials}
                </div>
              )}
              <label
                htmlFor="picture"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                title="Смени снимката"
              >
                <Camera className="h-5 w-5 text-white" />
              </label>
            </div>

            {/* Name + email */}
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-lg font-semibold sm:text-xl">
                {session.user.name || "Потребител"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>

            {/* Hidden file input */}
            <input
              id="picture"
              type="file"
              accept="image/*"
              className="sr-only"
            />
          </div>
        </CardContent>
      </Card>

      {isSetup && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            Попълнете име и по избор телефон, след което запазете промените. Това помага на екипа да ви познае.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile form card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Лична информация</CardTitle>
              <CardDescription>Обновете вашето име и контактни данни</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              name: dbUser?.name ?? session.user.name ?? "",
              email: dbUser?.email ?? session.user.email ?? "",
              phone: dbUser?.phone ?? "",
            }}
          />
        </CardContent>
      </Card>

      {/* GDPR Section */}
      <GdprSection userEmail={session.user.email || ""} />
    </div>
  );
}
