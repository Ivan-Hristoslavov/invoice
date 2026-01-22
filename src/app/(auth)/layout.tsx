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
    <div className="flex min-h-screen">
      {/* Left side - Animated illustration */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Subtle Glow Effects */}
        <motion.div 
          className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-300">
              <motion.div 
                className="h-10 w-10 rounded-xl bg-emerald-500/20 backdrop-blur flex items-center justify-center"
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
            className="space-y-8"
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
              <p className="text-lg text-slate-400 max-w-md">
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
                    className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0"
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
            className="flex gap-8"
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
          <div className="w-14 h-14 rounded-xl bg-slate-700/30 backdrop-blur flex items-center justify-center">
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
          <div className="w-12 h-12 rounded-lg bg-slate-700/30 backdrop-blur flex items-center justify-center">
            <Zap className="h-6 w-6 text-amber-400/60" />
          </div>
        </motion.div>
      </div>

      {/* Right side - Form with full section animation */}
      <div className="w-full lg:w-1/2 relative overflow-hidden bg-background">
        {/* Animated Background - Glassmorphism style */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          
          {/* Vibrant animated blobs */}
          <motion.div 
            className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(20, 184, 166, 0.2) 40%, transparent 70%)' }}
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 40, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(99, 102, 241, 0.2) 40%, transparent 70%)' }}
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -40, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 60%)' }}
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 60%)' }}
            animate={{ 
              scale: [1.1, 1, 1.1],
              y: [0, 20, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Form Container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Back Button - Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад към началната страница
                </Link>
              </Button>
            </motion.div>

            {/* Mobile Logo */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-10 lg:hidden"
            >
              <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity duration-300">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold">{APP_NAME}</span>
              </Link>
            </motion.div>
            
            {/* Form Card - Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl overflow-visible"
            >
              {children}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-10 text-center text-sm text-muted-foreground"
            >
              {APP_COPYRIGHT}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
