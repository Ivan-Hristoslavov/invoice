const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Чернова",
  ISSUED: "Издадена",
  UNPAID: "Неплатена",
  PAID: "Платена",
  OVERDUE: "Просрочена",
  CANCELLED: "Анулирана",
  VOIDED: "Обезсилена",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Банков превод",
  CASH: "В брой",
  CREDIT_CARD: "Карта",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
  WIRE_TRANSFER: "Банков трансфер",
  OTHER: "Друго",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BUSINESS: "Бизнес",
  PERSONAL: "Лична",
};

export function formatInvoiceStatusLabel(status?: string | null): string {
  if (!status) return "-";
  return STATUS_LABELS[status] ?? status;
}

export function formatPaymentMethodLabel(paymentMethod?: string | null): string {
  if (!paymentMethod) return "-";
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
}

export function formatAccountTypeLabel(accountType?: string | null): string {
  if (!accountType) return "-";
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType;
}
