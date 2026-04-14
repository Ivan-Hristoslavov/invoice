import { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Външен вид | Настройки | ${APP_NAME}`,
  description: "Темата се управлява от горната лента или от менюто на мобилното устройство",
};

export default function AppearanceSettingsPage() {
  redirect("/settings/profile");
}
