"use client";

import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export function SignInFormWrapper() {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-border/60 to-transparent" />
      <div className="relative z-10">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
} 