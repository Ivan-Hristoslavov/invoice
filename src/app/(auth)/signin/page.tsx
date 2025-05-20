import { SignInFormWrapper } from "@/components/auth/SignInFormWrapper";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Вход | ${APP_NAME}`,
  description: `Влезте във вашия ${APP_NAME} акаунт`,
};

export default function SignInPage() {
  return (
    <SignInFormWrapper />
  );
}