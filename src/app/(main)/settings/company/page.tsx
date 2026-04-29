import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";
import { CompanyInfoPageContent } from "./CompanyInfoPageContent";

export const metadata: Metadata = {
  title: `Настройки на компанията | ${APP_NAME}`,
  description: "Актуализирайте информацията за вашата компания",
};

export default function CompanySettingsPage() {
  return <CompanyInfoPageContent />;
}
