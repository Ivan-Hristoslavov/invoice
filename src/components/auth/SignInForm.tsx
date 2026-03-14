"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, Loader2, ArrowRight } from "lucide-react";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasAttemptedMagicLinkRef = useRef(false);

  const authError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const magicToken = searchParams.get("magicToken");
  const inviteEmail = searchParams.get("email");
  const oauthErrorMessage = useMemo(() => {
    if (!authError) return "";

    const errorMessages: Record<string, string> = {
      AccessDenied: "Достъпът беше отказан. Проверете Google акаунта и опитайте отново.",
      Configuration: "Google входът не е конфигуриран правилно. Проверете Vercel env настройките.",
      OAuthSignin: "Неуспешно стартиране на Google вход. Опитайте отново след малко.",
      OAuthCallback: "Google входът не можа да приключи успешно. Проверете callback URL и Google настройките.",
      OAuthCreateAccount: "Неуспешно създаване на акаунт чрез Google.",
      Callback: "Възникна проблем при входа. Опитайте отново.",
      Default: "Възникна грешка при вход чрез Google.",
    };

    return errorMessages[authError] || errorMessages.Default;
  }, [authError]);

  useEffect(() => {
    if (oauthErrorMessage) {
      setError(oauthErrorMessage);
      setIsGoogleLoading(false);
      return;
    }

    setError("");
  }, [oauthErrorMessage]);

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  useEffect(() => {
    if (!magicToken || !inviteEmail || hasAttemptedMagicLinkRef.current) return;

    hasAttemptedMagicLinkRef.current = true;

    const runMagicSignIn = async () => {
      setIsMagicLoading(true);
      setError("");

      const result = await signIn("credentials", {
        redirect: false,
        email: inviteEmail,
        magicToken,
      });

      if (result?.error) {
        setError("Magic линкът е невалиден или е изтекъл. Поискайте нова покана.");
        setIsMagicLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    };

    void runMagicSignIn();
  }, [callbackUrl, inviteEmail, magicToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Невалиден имейл или парола");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      setError("Нещо се обърка. Моля, опитайте отново.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          Сигурен достъп
        </div>
        <h1 className="mb-1.5 text-3xl font-bold tracking-tight">
          Добре дошли обратно
        </h1>
        <p className="text-sm text-muted-foreground">
          {isMagicLoading ? "Потвърждаваме сигурния линк за достъп" : "Въведете данните си за достъп"}
        </p>
      </div>

      {magicToken && inviteEmail && (
        <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Влизате с покана за <strong>{inviteEmail}</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Имейл
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <MailIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="ime@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-background/70 pl-10 text-base shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10 md:text-sm"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Парола
            </Label>
            <Link href="/forgot-password" className="text-xs text-primary font-medium hover:underline">
              Забравена?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-background/70 pl-10 pr-10 text-base shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10 md:text-sm"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground z-10"
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl border-0 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 gradient-primary hover:opacity-90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
          Влез в акаунта
        </Button>

        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-sm">или</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-border/60 bg-background/55 shadow-sm hover:bg-muted/50"
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
        Нямате акаунт?{" "}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Създайте безплатен акаунт
        </Link>
      </p>
    </div>
  );
}
