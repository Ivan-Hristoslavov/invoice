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
        delayChildren: 0.2,
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        duration: 0.5
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
      <motion.div 
        variants={itemVariants} 
        className="text-center mb-10"
      >
        <motion.h1 
          className="text-3xl font-bold tracking-tight mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Добре дошли обратно
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Въведете данните си за достъп до акаунта
        </motion.p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <motion.div 
          variants={itemVariants} 
          className="space-y-2"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="email" className="text-sm font-medium">
            Имейл адрес
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <MailIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors duration-300" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="ime@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-12 text-base bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              required
              autoComplete="email"
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div 
          variants={itemVariants} 
          className="space-y-2"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Парола
            </Label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
            >
              Забравена парола?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors duration-300" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-12 text-base bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors duration-200 z-10"
            >
              {showPassword ? 
                <EyeOffIcon className="h-5 w-5" /> : 
                <EyeIcon className="h-5 w-5" />
              }
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div 
          variants={itemVariants} 
          className="pt-4"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            <Button 
              type="submit" 
              className="w-full max-w-sm h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Влизане...
                </>
              ) : (
                <>
                  Влез в акаунта
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div 
          variants={itemVariants} 
          className="relative py-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-white dark:bg-slate-900 px-4 text-muted-foreground font-medium">
              или продължете с
            </span>
          </div>
        </motion.div>

        {/* Social Login */}
        <motion.div 
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            <Button 
              type="button"
              variant="outline" 
              className="w-full max-w-sm h-12 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
        </motion.div>
      </form>

      {/* Sign Up Link */}
      <motion.div 
        variants={itemVariants} 
        className="mt-10 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Нямате акаунт?{" "}
          <Link 
            href="/signup" 
            className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Създайте безплатен акаунт
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
