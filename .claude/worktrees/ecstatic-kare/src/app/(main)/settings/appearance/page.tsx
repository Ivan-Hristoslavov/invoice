import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";
import { AppearanceForm } from "./AppearanceForm";

export const metadata: Metadata = {
  title: `Външен вид | Настройки | ${APP_NAME}`,
  description: "Настройки на темата и външния вид на приложението",
};

export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Външен вид</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Тема и визуални настройки.
        </p>
      </div>
      <AppearanceForm />
    </div>
  );
}
