"use client";

import {
  BarChart3,
  Building2,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  Mail,
  Percent,
  Receipt,
  Scale,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconClass =
  "absolute text-emerald-600/[0.09] dark:text-emerald-400/[0.07] [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-[1.1]";

/** Декоративни иконки за лендинга — фактури, счетоводство, клиенти (не се четат от екранни четци като съдържание). */
export function LandingIconDecor({ reduceEffects = false }: { reduceEffects?: boolean }) {
  const sparse = reduceEffects;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", sparse && "opacity-60")}>
      {/* горен / hero */}
      <span className={cn(iconClass, "left-[4%] top-[8%] h-14 w-14 -rotate-6 sm:left-[6%] sm:top-[10%] sm:h-16 sm:w-16")}>
        <FileText aria-hidden />
      </span>
      <span className={cn(iconClass, "right-[6%] top-[14%] h-11 w-11 rotate-12 sm:right-[10%] sm:h-14 sm:w-14")}>
        <Receipt aria-hidden />
      </span>
      {!sparse ? (
        <span className={cn(iconClass, "left-[42%] top-[6%] hidden h-9 w-9 rotate-3 md:block")}>
          <Sparkles aria-hidden />
        </span>
      ) : null}

      {/* продукт */}
      <span className={cn(iconClass, "left-[8%] top-[32%] h-12 w-12 -rotate-3 sm:top-[30%]")}>
        <Building2 aria-hidden />
      </span>
      <span className={cn(iconClass, "right-[4%] top-[38%] h-16 w-16 rotate-6 sm:right-[8%]")}>
        <Users aria-hidden />
      </span>
      {!sparse ? (
        <span className={cn(iconClass, "left-[20%] top-[44%] h-10 w-10 -rotate-12")}>
          <FileSpreadsheet aria-hidden />
        </span>
      ) : null}

      {/* цени */}
      <span className={cn(iconClass, "left-[3%] top-[58%] h-10 w-10 rotate-6 sm:top-[55%]")}>
        <CreditCard aria-hidden />
      </span>
      <span className={cn(iconClass, "right-[12%] top-[62%] h-14 w-14 -rotate-6")}>
        <Wallet aria-hidden />
      </span>
      {!sparse ? (
        <span className={cn(iconClass, "right-[28%] top-[52%] h-9 w-9 rotate-18")}>
          <Percent aria-hidden />
        </span>
      ) : null}

      {/* контакт / долу */}
      <span className={cn(iconClass, "left-[14%] top-[78%] h-11 w-11 -rotate-6 sm:top-[80%]")}>
        <Mail aria-hidden />
      </span>
      <span className={cn(iconClass, "right-[6%] top-[84%] h-12 w-12 rotate-3")}>
        <Landmark aria-hidden />
      </span>
      {!sparse ? (
        <>
          <span className={cn(iconClass, "left-[48%] top-[72%] h-10 w-10 -rotate-10")}>
            <Scale aria-hidden />
          </span>
          <span className={cn(iconClass, "left-[35%] top-[18%] h-8 w-8 rotate-6 opacity-80")}>
            <BarChart3 aria-hidden />
          </span>
          <span className={cn(iconClass, "right-[22%] top-[28%] h-9 w-9 -rotate-6 opacity-80")}>
            <Shield aria-hidden />
          </span>
        </>
      ) : null}
    </div>
  );
}
