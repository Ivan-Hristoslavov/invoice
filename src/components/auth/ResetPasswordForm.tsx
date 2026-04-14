"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { LockIcon, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { getPasswordValidationError } from "@/lib/validation";
import { useAsyncLock } from "@/hooks/use-async-lock";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { run, isPending } = useAsyncLock();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Невалиден линк за възстановяване");
      return;
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Паролите не съвпадат");
      return;
    }

    void run(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Нещо се обърка");
        }

        setIsSuccess(true);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Възникна неочаквана грешка");
        }
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.1, duration: 0.6 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20, duration: 0.5 },
    },
  };

  if (!token) {
    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Невалиден линк</h1>
          <p className="text-muted-foreground text-base">
            Линкът за възстановяване е невалиден или е изтекъл.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex justify-center">
          <Button asChild variant="outline" className="w-full max-w-sm h-12">
            <Link href="/forgot-password">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Заявете нов линк
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
          >
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Паролата е променена</h1>
          <p className="text-muted-foreground text-base">
            Вашата парола беше успешно обновена. Сега можете да влезете с новата си парола.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex justify-center">
          <Button asChild className="w-full max-w-sm h-12 gradient-primary text-white border-0 hover:shadow-md hover:ring-2 hover:ring-emerald-400/25">
            <Link href="/signin">
              Влезте в профила си
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full">
      <motion.div variants={itemVariants} className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Нова парола</h1>
        <p className="text-muted-foreground text-base">
          Въведете новата си парола по-долу
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Нова парола</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors duration-300" />
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 8 символа"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 h-12 text-base bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              required
              minLength={8}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Потвърдете паролата</Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors duration-300" />
            </div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Повторете паролата"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12 h-12 text-base bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              required
              minLength={8}
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold gradient-primary text-white border-0 shadow-lg hover:shadow-md hover:ring-2 hover:ring-emerald-400/25"
            disabled={isPending}
            loading={isPending}
          >
            {!isPending ? (
              <>
                Задай нова парола
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>Обновяване...</>
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div variants={itemVariants} className="mt-10 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/signin" className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors duration-200 underline-offset-4 hover:underline">
            Назад към входа
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
