"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, Loader2, ArrowRight } from "lucide-react";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("Нещо се обърка. Моля, опитайте отново.");
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Добре дошли обратно
        </h1>
        <p className="text-muted-foreground text-sm">
          Въведете данните си за достъп до акаунта
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Имейл адрес
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <MailIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="ime@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="email"
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Парола
            </Label>
            <Link 
              href="#" 
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Забравена парола?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              {showPassword ? 
                <EyeOffIcon className="h-4 w-4" /> : 
                <EyeIcon className="h-4 w-4" />
              }
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
          >
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pt-2 flex justify-center">
          <Button 
            type="submit" 
            className="w-full max-w-xs h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Влизане...
              </>
            ) : (
              <>
                Влез в акаунта
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-4 text-muted-foreground">
              или продължете с
            </span>
          </div>
        </motion.div>

        {/* Social Login */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <Button 
            type="button"
            variant="outline" 
            className="w-full max-w-xs h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Продължи с Google
          </Button>
        </motion.div>
      </form>

      {/* Sign Up Link */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Нямате акаунт?{" "}
          <Link 
            href="/signup" 
            className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
          >
            Създайте безплатен акаунт
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
