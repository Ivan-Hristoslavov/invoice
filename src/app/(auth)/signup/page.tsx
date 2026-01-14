import { RegisterFormWrapper } from "@/components/auth/RegisterFormWrapper";
import { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";

export const metadata: Metadata = {
  title: `Създаване на акаунт | ${APP_NAME}`,
  description: `Създайте нов ${APP_NAME} акаунт безплатно. ${APP_DESCRIPTION}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <RegisterFormWrapper />
  );
}
