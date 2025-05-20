import { RegisterFormWrapper } from "@/components/auth/RegisterFormWrapper";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Създаване на акаунт | ${APP_NAME}`,
  description: `Създайте нов ${APP_NAME} акаунт, за да започнете да издавате фактури`,
};

export default function RegisterPage() {
  return (
    <RegisterFormWrapper />
  );
}