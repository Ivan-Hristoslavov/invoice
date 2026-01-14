"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { MailIcon, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Нещо се обърка");
      }

      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Възникна неочаквана грешка");
      }
    } finally {
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

  if (isSubmitted) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full"
      >
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
            Проверете имейла си
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Изпратихме линк за възстановяване на парола на {email}
          </motion.p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-6"
        >
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Ако този имейл съществува в нашата система, ще получите инструкции за възстановяване на паролата си.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex justify-center"
        >
          <Button 
            asChild
            variant="outline"
            className="w-full max-w-sm h-12"
          >
            <Link href="/signin">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Назад към входа
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

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
          Забравена парола
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Въведете имейла си и ще ви изпратим линк за възстановяване на паролата
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
                  Изпращане...
                </>
              ) : (
                <>
                  Изпрати линк за възстановяване
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      {/* Back to Sign In Link */}
      <motion.div 
        variants={itemVariants} 
        className="mt-10 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Спомняте си паролата?{" "}
          <Link 
            href="/signin" 
            className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Влезте тук
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
