import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
