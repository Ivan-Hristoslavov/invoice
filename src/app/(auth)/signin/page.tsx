import { SignInFormWrapper } from "@/components/auth/SignInFormWrapper";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Sign In | ${APP_NAME}`,
  description: `Sign in to your ${APP_NAME} account`,
};

export default function SignInPage() {
  return (
    <SignInFormWrapper />
  );
}