import { RegisterFormWrapper } from "@/components/auth/RegisterFormWrapper";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Create Account | ${APP_NAME}`,
  description: `Create a new ${APP_NAME} account to start invoicing`,
};

export default function RegisterPage() {
  return (
    <RegisterFormWrapper />
  );
}