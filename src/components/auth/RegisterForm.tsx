"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
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

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Паролите не съвпадат");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Паролата трябва да бъде поне 8 символа");
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

      toast.success("Акаунтът е създаден успешно!");
      
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        toast.error("Акаунтът е създаден, но влизането не беше успешно. Моля, влезте ръчно.");
        router.push("/signin");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Възникна неочаквана грешка");
      }
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

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ["Слаба", "Средна", "Добра", "Силна"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Създайте акаунт
        </h1>
        <p className="text-muted-foreground text-sm">
          Започнете безплатно с {APP_NAME}
        </p>
      </motion.div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Име и фамилия
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <UserIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Иван Иванов"
              value={formData.name}
              onChange={handleChange}
              className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="name"
            />
          </div>
        </motion.div>

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
              name="email"
              type="email"
              placeholder="ime@example.com"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="email"
            />
          </div>
        </motion.div>
        
        {/* Password Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Парола
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Минимум 8 символа"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 pr-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="new-password"
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
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Сила на паролата: <span className={passwordStrength > 2 ? 'text-emerald-600' : 'text-muted-foreground'}>{strengthLabels[passwordStrength - 1] || 'Много слаба'}</span>
              </p>
            </motion.div>
          )}
        </motion.div>
        
        {/* Confirm Password Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Потвърдете паролата
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Повторете паролата"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-10 pr-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              {showConfirmPassword ? 
                <EyeOffIcon className="h-4 w-4" /> : 
                <EyeIcon className="h-4 w-4" />
              }
            </button>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="absolute inset-y-0 right-10 flex items-center z-10">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
            )}
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
        
        {/* Terms */}
        <motion.p variants={itemVariants} className="text-xs text-muted-foreground">
          С регистрацията се съгласявате с нашите{" "}
          <Link href="#" className="text-emerald-600 hover:underline">Условия за ползване</Link>
          {" "}и{" "}
          <Link href="#" className="text-emerald-600 hover:underline">Политика за поверителност</Link>.
        </motion.p>

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
                Създаване на акаунт...
              </>
            ) : (
              <>
                Създай безплатен акаунт
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
              или се регистрирайте с
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
      
      {/* Sign In Link */}
      <motion.div variants={itemVariants} className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Вече имате акаунт?{" "}
          <Link 
            href="/signin" 
            className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
          >
            Влезте тук
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
