"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react";

type Status = "idle" | "loading" | "success" | "signing-in" | "error";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [successData, setSuccessData] = useState<{
    email: string;
    oneTimeLoginToken: string | null;
  } | null>(null);

  const confirm = useCallback(async () => {
    if (!token?.trim()) {
      setStatus("error");
      setMessage("Липсва линк за потвърждение.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Неуспешно потвърждение.");
        return;
      }

      setMessage(data.message || "Имейлът е потвърден.");
      setSuccessData({
        email: data.email ?? "",
        oneTimeLoginToken: data.oneTimeLoginToken ?? null,
      });
      setStatus(data.oneTimeLoginToken ? "signing-in" : "success");
    } catch {
      setStatus("error");
      setMessage("Възникна грешка. Моля, опитайте отново.");
    }
  }, [token]);

  useEffect(() => {
    if (token && status === "idle") {
      confirm();
    } else if (!token && status === "idle") {
      setStatus("error");
      setMessage("Липсва линк за потвърждение.");
    }
  }, [token, status, confirm]);

  // After confirm success with one-time token, auto sign-in and redirect to app
  useEffect(() => {
    if (status !== "signing-in" || !successData?.email || !successData?.oneTimeLoginToken) return;

    let cancelled = false;

    signIn("credentials", {
      email: successData.email,
      oneTimeLoginToken: successData.oneTimeLoginToken,
      redirect: false,
    }).then((result) => {
      if (cancelled) return;
      if (result?.ok) {
        router.replace("/dashboard");
      } else {
        setStatus("success");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [status, successData, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] text-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Потвърждаваме имейла ви...</p>
      </div>
    );
  }

  if (status === "signing-in") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] text-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Влизате в акаунта си...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Имейлът е потвърден
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <Button asChild className="w-full h-12 gradient-primary text-white border-0">
          <Link href="/signin">
            Влезте в профила си
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Неуспешно потвърждение
        </h1>
        <p className="text-muted-foreground mb-2">{message}</p>
        <p className="text-sm text-muted-foreground">
          Влезте с имейл и парола и използвайте „Изпрати отново линк за потвърждение“, за да получите нов имейл.
        </p>
        <p className="text-xs text-muted-foreground/90 mt-2">
          При iCloud или Apple Mail имейлите често попадат в <strong>Спам</strong> — проверете папка „Спам“ или „Junk“ и маркирайте ни като „Не е спам“, след което поискайте нов линк от страницата Вход.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline" className="h-12">
          <Link href="/signin">Към входа</Link>
        </Button>
        <Button asChild className="h-12">
          <Link href="/signup">Нова регистрация</Link>
        </Button>
      </div>
    </div>
  );
}
