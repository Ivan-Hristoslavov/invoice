"use client";

import { RegisterForm } from "./RegisterForm";

export function RegisterFormWrapper() {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-border/60 to-transparent" />
      <div className="relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
} 