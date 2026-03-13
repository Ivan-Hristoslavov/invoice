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
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./ProfileForm";
import { GdprSection } from "./GdprSection";
import { User, Camera } from "lucide-react";

export const metadata: Metadata = {
  title: `Настройки на профила | ${APP_NAME}`,
  description: "Обновете информацията за вашия профил",
};

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="space-y-6">
      {/* Rich profile header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-background bg-muted shadow-lg shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Профилна снимка"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
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
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-semibold truncate">
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
              name: session.user.name || "",
              email: session.user.email || "",
            }}
          />
        </CardContent>
      </Card>

      {/* GDPR Section */}
      <GdprSection userEmail={session.user.email || ""} />
    </div>
  );
}
