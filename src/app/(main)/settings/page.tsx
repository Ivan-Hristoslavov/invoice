import { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Настройки | ${APP_NAME}`,
  description: "Компания, фактури, данъци и абонамент",
};

export default function SettingsPage() {
  redirect("/settings/invoice-preferences");
} 