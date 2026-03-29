import { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Settings | ${APP_NAME}`,
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  redirect("/settings/profile");
} 