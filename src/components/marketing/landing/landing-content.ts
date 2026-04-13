import type { ElementType } from "react";
import {
  BarChart3,
  Building,
  Crown,
  FileText,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS";

export interface PricingPlan {
  key: PlanKey;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  icon: ElementType;
  gradient: string;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
}

export const features = [
  {
    icon: FileText,
    title: "Фактури и PDF",
    description:
      "Автоматична номерация: основната част е пореден номер; по желание буквен префикс (напр. Ф- или ФАК-) — от Настройки → Фактури след вход.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Бърз старт",
    description: "Данните веднъж — после само избор от списъци.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Реквизити за България",
    description: "ЕИК, ДДС и текстове за счетоводство и НАП.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Преглед в цифри",
    description: "Приходи и фактури в изчакване.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Клиенти на едно място",
    description: "Списък, история и търсене.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Building,
    title: "Няколко фирми",
    description: "Един акаунт, отделни настройки за всяка фирма.",
    color: "from-indigo-500 to-blue-500",
  },
] as const;

export const pricingPlans: PricingPlan[] = [
  {
    key: "FREE",
    name: "Безплатен",
    price: {
      monthly: SUBSCRIPTION_PLANS.FREE.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.FREE.yearlyPrice,
    },
    description: "За стартиращи бизнеси",
    icon: FileText,
    gradient: "from-slate-500 to-slate-600",
    features: [
      { text: "3 фактури/месец", included: true },
      { text: "1 фирма", included: true },
      { text: "5 клиенти", included: true },
      { text: "10 продукти", included: true },
      { text: "Собствено лого", included: false },
      { text: "Имейл изпращане", included: false },
    ],
    cta: "Започни безплатно",
    ctaHref: "/signup?plan=FREE",
  },
  {
    key: "STARTER",
    name: "Стартер",
    price: {
      monthly: SUBSCRIPTION_PLANS.STARTER.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.STARTER.yearlyPrice,
    },
    description: "За фрийлансъри",
    icon: Zap,
    gradient: "from-blue-500 to-indigo-600",
    features: [
      { text: "15 фактури/месец", included: true },
      { text: "1 фирма", included: true },
      { text: "25 клиенти", included: true },
      { text: "50 продукти", included: true },
      { text: "CSV експорт", included: true },
      { text: "Имейл изпращане", included: false },
    ],
    cta: "Опитай безплатно",
    ctaHref: "/signup?plan=STARTER",
  },
  {
    key: "PRO",
    name: "Про",
    price: {
      monthly: SUBSCRIPTION_PLANS.PRO.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.PRO.yearlyPrice,
    },
    description: "За малки бизнеси",
    icon: Star,
    gradient: "from-emerald-500 to-teal-600",
    popular: true,
    features: [
      { text: "Неограничени фактури", included: true },
      { text: "3 фирми", included: true },
      { text: "100 клиенти", included: true },
      { text: "200 продукти", included: true },
      { text: "Лого + PDF/CSV", included: true },
      { text: "Имейл изпращане", included: true },
    ],
    cta: "14-дневен пробен период",
    ctaHref: "/signup?plan=PRO",
  },
  {
    key: "BUSINESS",
    name: "Бизнес",
    price: {
      monthly: SUBSCRIPTION_PLANS.BUSINESS.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.BUSINESS.yearlyPrice,
    },
    description: "За предприятия",
    icon: Crown,
    gradient: "from-violet-500 to-purple-600",
    features: [
      { text: "Всичко неограничено", included: true },
      { text: "10 фирми", included: true },
      { text: "5 потребители", included: true },
      { text: "API достъп", included: true },
      { text: "Приоритетна поддръжка", included: true },
      { text: "Персонализация", included: true },
    ],
    cta: "Свържете се с нас",
    ctaHref: "/contact",
  },
];

/** Същите акценти като в настройки → абонамент (`SubscriptionPlans`) */
export const LANDING_PLAN_THEME: Record<
  PlanKey,
  {
    iconBg: string;
    iconText: string;
    checkBg: string;
    checkIcon: string;
    btnPrimary: string;
  }
> = {
  FREE: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconText: "text-slate-500",
    checkBg: "bg-slate-100 dark:bg-slate-800",
    checkIcon: "text-slate-500",
    btnPrimary:
      "border border-slate-300 bg-background font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800",
  },
  STARTER: {
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-500",
    checkBg: "bg-blue-500/10",
    checkIcon: "text-blue-500",
    btnPrimary: "border-0 bg-blue-500 font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600",
  },
  PRO: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconText: "text-emerald-500",
    checkBg: "bg-emerald-500/10",
    checkIcon: "text-emerald-500",
    btnPrimary:
      "border-0 bg-emerald-500 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600",
  },
  BUSINESS: {
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconText: "text-violet-500",
    checkBg: "bg-violet-500/10",
    checkIcon: "text-violet-500",
    btnPrimary:
      "border-0 bg-violet-500 font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-600",
  },
};

export const testimonials = [
  {
    name: "Счетоводна къща",
    role: "Екип с множество фирми",
    content:
      "По-бърза обработка на месечните документи и по-малко ръчна работа при издаване и проследяване.",
    initials: "СК",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Фрийланс бизнес",
    role: "1 човек, услужна дейност",
    content:
      "По-бързо издаване на фактури и по-ясен контрол кои документи са платени и кои са в изчакване.",
    initials: "ФБ",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Търговска фирма",
    role: "Екип с активни клиенти",
    content:
      "По-добра проследимост на документи, клиенти и суми с подредена история на действията.",
    initials: "ТФ",
    gradient: "from-violet-500 to-purple-500",
  },
] as const;

export const workflowSteps = [
  {
    title: "Фирма и клиенти",
    description: "Въвеждате данните веднъж — после само избирате от списъка.",
    icon: Building,
    color: "from-slate-500 to-slate-600",
  },
  {
    title: "Нова фактура",
    description: "Клиент, редове, ДДС — готово за изпращане, PDF или имейл.",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Статус и история",
    description: "Платени, чакащи и корекции с известия.",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
  },
] as const;

export const heroHighlights = [
  { value: "EUR", label: "Цени в евро" },
  { value: "BG", label: "За българския пазар" },
  { value: "Stripe", label: "Абонамент през Stripe" },
] as const;

export const pricingTrustNotes = [
  "Без дългосрочен договор",
  "Смяна на план според нуждите",
  "Отказ по всяко време от настройките",
  "Поддръжка по имейл в работни дни",
] as const;

export const faqItems = [
  {
    q: "Какво е InvoicyPro и за какво служи?",
    a: "Уеб приложение за фактури: издавате документи, изпращате ги и следите кой още не е платил. Не е банка и не приема плащания вместо вас.",
  },
  {
    q: "Клиентът плаща през InvoicyPro ли?",
    a: "Не. Плащанията са между вас и клиента (банка, наложен платеж и т.н.). InvoicyPro е за документите и проследяването им.",
  },
  {
    q: "Какво е кредитно известие?",
    a: "Документ за намаляване или отмяна на сума от вече издадена фактура — например при връщане на стока или грешка в сумата.",
  },
  {
    q: "Подходящо ли е за НАП?",
    a: "Фактурите са с нужните реквизити по българското законодателство. За конкретен случай винаги може да се консултирате със счетоводител.",
  },
  {
    q: "Няколко фирми в един акаунт?",
    a: "Да — според плана може да имате от една до повече фирми под един вход.",
  },
  {
    q: "Къде задавам префикс на фактурите (напр. Ф-)?",
    a: "След вход: Настройки → Фактури. Там са по желание префикс преди номера (напр. Ф-, ФАК-), дали номерацията се нулира всяка година и начален номер при преход от друга система. Самият номер на фактурата е последователен; префиксът е за удобство, не е задължителен.",
  },
] as const;
