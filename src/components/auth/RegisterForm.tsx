"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  EyeIcon, 
  EyeOffIcon, 
  LockIcon, 
  MailIcon, 
  UserIcon,
  Loader2,
  ArrowRight,
  Check
} from "lucide-react";
import { APP_NAME } from "@/config/constants";
import {
  getEmailValidationError,
  getPasswordStrength,
  getPasswordValidationError,
} from "@/lib/validation";

const planContent = {
  FREE: {
    name: "Безплатен",
    description: "3 фактури на месец и 1 фирма за старт.",
  },
  STARTER: {
    name: "Стартер",
    description: "Подходящ за фрийлансъри и самостоятелни практики.",
  },
  PRO: {
    name: "Про",
    description: "Най-добрият баланс за малък бизнес с растеж.",
  },
  BUSINESS: {
    name: "Бизнес",
    description: "За екипи, повече компании и приоритетна поддръжка.",
  },
} as const;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmFieldError, setConfirmFieldError] = useState<string | null>(null);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const inviteEmail = searchParams.get("email");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      if (emailTouched) setEmailFieldError(getEmailValidationError(value) ?? null);
    }
    if (name === "confirmPassword") {
      if (confirmTouched) setConfirmFieldError(value !== formData.password ? "Паролите не съвпадат" : null);
    }
    if (name === "password" && confirmTouched) {
      setConfirmFieldError(formData.confirmPassword !== value ? "Паролите не съвпадат" : null);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailFieldError(getEmailValidationError(formData.email) ?? null);
  };

  const handleConfirmBlur = () => {
    setConfirmTouched(true);
    setConfirmFieldError(formData.confirmPassword !== formData.password ? "Паролите не съвпадат" : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const emailError = getEmailValidationError(formData.email);
    if (emailError) {
      setError(emailError);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Паролите не съвпадат");
      setIsLoading(false);
      return;
    }

    const passwordError = getPasswordValidationError(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Нещо се обърка");
      }

      setIsLoading(false);
      toast.success(
        "Акаунтът е създаден. Проверете имейла си за линк за потвърждение преди първи вход."
      );
      router.push(
        `/signin?email=${encodeURIComponent(formData.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}&verified=pending`
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Възникна неочаквана грешка");
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  const passwordStrengthResult = getPasswordStrength(formData.password);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
  const selectedPlanKey = searchParams.get("plan") as keyof typeof planContent | null;
  const selectedPlan = selectedPlanKey ? planContent[selectedPlanKey] : null;

  useEffect(() => {
    if (inviteEmail) {
      setFormData((prev) => ({ ...prev, email: inviteEmail }));
    }
  }, [inviteEmail]);

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="mb-3 text-center">
        <div className="mb-2 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
          Нов акаунт
        </div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">Създайте акаунт</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Започнете безплатно с {APP_NAME}</p>
      </div>

      {selectedPlan && (
        <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-cyan-500/8 p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Избран план
              </p>
              <p className="mt-1 text-sm font-semibold">{selectedPlan.name}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {selectedPlan.description}
              </p>
            </div>
            <Link
              href="/#pricing"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Смени
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-sm font-medium">Име</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <UserIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Иван Иванов"
              value={formData.name}
              onChange={handleChange}
              className="h-10 rounded-xl border-border/60 bg-background/70 pl-10 text-sm shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium">Имейл</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <MailIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ime@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className={`h-10 rounded-xl border-border/60 bg-background/70 pl-10 text-sm shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10 ${emailFieldError ? "border-red-500 focus-visible:border-red-500" : ""}`}
              required
              autoComplete="email"
              aria-invalid={!!emailFieldError}
              aria-describedby={emailFieldError ? "email-error" : undefined}
            />
          </div>
          {emailFieldError && (
            <p id="email-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
              {emailFieldError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="password" className="text-sm font-medium">Парола</Label>
            <span className="text-[10px] text-muted-foreground">мин. 8 символа</span>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="h-10 rounded-xl border-border/60 bg-background/70 pl-10 pr-10 text-sm shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10"
              required
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground z-10">
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {formData.password && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full ${i <= passwordStrengthResult.level + 1 ? strengthColors[passwordStrengthResult.level] : "bg-muted"}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{passwordStrengthResult.label}</span>
            </div>
          )}
          {passwordStrengthResult.hints.length > 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">{passwordStrengthResult.hints[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Потвърди парола</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleConfirmBlur}
              className={`h-10 rounded-xl border-border/60 bg-background/70 pl-10 pr-10 text-sm shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10 ${confirmFieldError ? "border-red-500 focus-visible:border-red-500" : ""}`}
              required
              autoComplete="new-password"
              aria-invalid={!!confirmFieldError}
              aria-describedby={confirmFieldError ? "confirm-error" : undefined}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground z-10">
              {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          {confirmFieldError && (
            <p id="confirm-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
              {confirmFieldError}
            </p>
          )}
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          С регистрацията приемате{" "}
          <Link href="/terms" className="text-primary hover:underline">Условия</Link> и{" "}
          <Link href="/privacy" className="text-primary hover:underline">Поверителност</Link>.
        </p>

        <Button
          type="submit"
          className="h-10 w-full rounded-xl border-0 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 gradient-primary hover:opacity-90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
          Създайте акаунт
        </Button>

        {selectedPlan && (
          <p className="text-center text-[11px] text-muted-foreground">
            Ще започнете с план <span className="font-medium text-foreground">{selectedPlan.name}</span>.
            Планът може да бъде променен по-късно от настройките.
          </p>
        )}

        <div className="relative py-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[10px] text-muted-foreground shadow-sm">или</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl border-border/60 bg-background/55 shadow-sm hover:bg-muted/50"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Продължи с Google
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Вече имате акаунт?{" "}
        <Link href="/signin" className="text-primary font-semibold hover:underline">
          Влезте тук
        </Link>
      </p>
    </div>
  );
}
