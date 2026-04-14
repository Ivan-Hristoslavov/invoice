/**
 * Supported чл. 117 ЗДДС scenarios for the app (expand after accountant review).
 */
export const VAT_PROTOCOL_117_SCENARIOS = [
  {
    value: "INTRA_COMMUNITY_GOODS",
    label: "Вътреобщностно придобиване на стоки (ВОП)",
    hint: "Данъкът е изискуем от получателя по чл. 82, ал. 2 ЗДДС.",
  },
  {
    value: "INTRA_COMMUNITY_SERVICES",
    label: "Вътреобщностни услуги от регистриран доставчик в ЕС",
    hint: "Услуги с място на изпълнение в България; самоначисляване от получателя.",
  },
  {
    value: "REVERSE_CHARGE_DOMESTIC",
    label: "Обратно начисляване (вътрешни доставки по чл. 82)",
    hint: "Когато данъкът е изискуем от получателя по вътрешен режим.",
  },
  {
    value: "OTHER",
    label: "Друго (опишете в полето за правно основание)",
    hint: "Попълнете допълнително основание според вашия случай и ППЗДДС.",
  },
] as const;

export type VatProtocol117ScenarioValue = (typeof VAT_PROTOCOL_117_SCENARIOS)[number]["value"];

export function getVatProtocol117ScenarioLabel(value: string): string {
  const row = VAT_PROTOCOL_117_SCENARIOS.find((s) => s.value === value);
  return row?.label ?? value;
}
