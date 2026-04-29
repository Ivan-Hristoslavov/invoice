/**
 * Central BG copy for tooltips, InfoCallout, and inline help across the app.
 * Keys are stable identifiers — use in forms and page primitives.
 */
export const helpCopy = {
  // Company / Bulgarian invoicing
  companyName: "Юридическо име на издателя на фактурата — както е в Търговския регистър.",
  companyEmail: "Контакт за фактури и кореспонденция; може да се показва на PDF.",
  companyPhone: "Телефон за връзка — по желание на PDF.",
  companyAddress: "Седалище и адрес по ЗДДС — задължителни за коректна фактура.",
  companyCity: "Населено място на седалището.",
  companyRegion: "Област (по желание).",
  companyPostal: "Пощенски код на седалището.",
  eik: "ЕИК (9 цифри) — идентификатор на фирмата в България. Ползва се за бързо зареждане от регистри и за съвпадение с контрагентите.",
  bulstat: "БУЛСТАТ при нужда от идентификация освен ЕИК.",
  vatId: "ДДС номер (BG + ЕИК) при регистрация по ЗДДС — задължителен за ДДС фактури.",
  mol: "МОЛ (материално отговорно лице) — лице, което подписва/отговаря за сделката; често се иска в документи.",
  bankIban: "IBAN за плащане — показва се на фактурата и в банковия блок.",
  bankSwift: "BIC/SWIFT на банката при международни плащания.",
  bankName: "Име на банката — за яснота на контрагента.",
  companyLogo: "Лого в PDF — изисква Pro план когато е включено в настройките.",

  // Invoice preferences
  invoiceNumbering: "Формат и поредност на номерата — важи за нови фактури.",
  defaultVat: "Стандартна ставка ДДС за нови редове, ако не е зададена друга.",
  defaultCurrency: "Валута по подразбиране за нови фактури.",

  // Security
  passwordChange: "Сменете паролата си с текуща парола за потвърждение.",

  // Subscription
  planFree: "За тест и малък обем — с ограничения по броя документи.",
  planStarter: "За малки фирми с редовни, но умерени обеми.",
  planPro: "Пълни възможности за растеж — лого на PDF, по-високи лимити.",
  planBusiness: "За екипи и по-високи лимити — съвместна работа и одит.",
} as const;

export type HelpCopyKey = keyof typeof helpCopy;

export function getHelpText(key: HelpCopyKey): string {
  return helpCopy[key];
}
