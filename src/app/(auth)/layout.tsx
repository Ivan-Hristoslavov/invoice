"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Sparkles, Shield, Zap, CheckCircle2, ArrowLeft } from "lucide-react";
import { APP_NAME, APP_DESCRIPTION, APP_COPYRIGHT } from "@/config/constants";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Професионални фактури",
    description: "Създавайте красиви фактури за секунди"
  },
  {
    icon: Shield,
    title: "НАП съвместимост",
    description: "Пълно съответствие с българското законодателство"
  },
  {
    icon: Zap,
    title: "Бърз и надежден",
    description: "Модерна технология за максимална производителност"
  }
];

export default function AuthLayout({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Animated illustration */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:w-[44%] xl:w-[46%]">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[48px_48px]" />
        
        {/* Subtle Glow Effects */}
        <motion.div 
          className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-emerald-500/8 blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-blue-500/8 blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-300">
              <motion.div 
                className="h-10 w-10 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <FileText className="h-5 w-5 text-emerald-400" />
              </motion.div>
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </Link>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="space-y-7"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm mb-6"
              >
                <Sparkles className="h-4 w-4" />
                Безплатен 14-дневен пробен период
              </motion.div>
              
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                Опростете вашето<br />
                <span className="text-slate-400">фактуриране</span>
              </h1>
              <p className="max-w-md text-base text-slate-400 xl:text-lg">
                {APP_DESCRIPTION}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.15, ease: "easeOut" }}
                  className="flex items-start gap-4"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <feature.icon className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
            className="flex gap-6"
          >
            {[
              { value: "1000+", label: "Потребители" },
              { value: "50K+", label: "Фактури" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Decorative Floating Elements */}
        <motion.div
          className="absolute top-1/4 right-16"
          animate={{ 
            y: [0, -20, 0], 
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-14 h-14 rounded-xl bg-slate-700/30 backdrop-blur-sm flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400/60" />
          </div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-1/3 right-32"
          animate={{ 
            y: [0, 25, 0], 
            rotate: [0, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="w-12 h-12 rounded-lg bg-slate-700/30 backdrop-blur-sm flex items-center justify-center">
            <Zap className="h-6 w-6 text-amber-400/60" />
          </div>
        </motion.div>
      </div>

      {/* Right side - Form surface */}
      <div className="relative w-full overflow-hidden bg-background lg:w-[56%] xl:w-[54%]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <div className="absolute -right-28 top-0 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/60 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center overflow-y-auto px-4 pb-5 pt-[calc(env(safe-area-inset-top)+5.5rem)] supports-[min-height:100dvh]:min-h-dvh sm:px-6 sm:pb-8 sm:pt-[calc(env(safe-area-inset-top)+6rem)] lg:p-8 lg:py-10">
          <div className="flex w-full max-w-md flex-col items-center justify-center py-2 sm:max-w-xl lg:max-w-xl">
            {/* Back + Mobile Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex h-14 items-center lg:hidden"
            >
              <div className="relative flex w-full items-center justify-between rounded-full border border-border/60 bg-background/50 px-2 py-2 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:text-sm"
                >
                  <Link href="/" className="flex items-center whitespace-nowrap">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Назад
                  </Link>
                </Button>
                <Link href="/" className="absolute left-1/2 inline-flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full px-2 py-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
                </Link>
                <div className="w-[84px] shrink-0" aria-hidden="true" />
              </div>
            </motion.div>

            {/* Form Card – compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative w-full overflow-hidden rounded-[28px] border border-border/60 bg-card/85 p-5 shadow-2xl shadow-slate-950/15 backdrop-blur-xl sm:p-6 lg:p-7"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/60 to-transparent" />
              <div className="absolute inset-x-6 top-0 h-24 rounded-b-full bg-linear-to-b from-emerald-500/8 to-transparent blur-2xl" />
              <div className="absolute -bottom-10 right-0 h-24 w-24 rounded-full bg-cyan-500/8 blur-3xl" />
              <div className="relative z-10">
                {children}
              </div>
            </motion.div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground sm:text-xs">
              {APP_COPYRIGHT}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
