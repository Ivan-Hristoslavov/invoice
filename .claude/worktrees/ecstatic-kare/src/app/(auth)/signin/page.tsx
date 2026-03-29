import { SignInFormWrapper } from "@/components/auth/SignInFormWrapper";
import { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";

export const metadata: Metadata = {
  title: `Вход | ${APP_NAME}`,
  description: `Влезте във вашия ${APP_NAME} акаунт. ${APP_DESCRIPTION}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return (
    <SignInFormWrapper />
  );
}
