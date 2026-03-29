# Безопасни архитектурни промени според НАП изискванията

## ✅ Завършени промени

### 1. Schema обновления
- ✅ Добавен `InvoiceSequence` model за номериране на фактури
- ✅ Добавен `CreditNote` model за кредитни известия
- ✅ Добавен `AuditLog` model за проследяване на промени
- ✅ Invoice status променен: `DRAFT`, `ISSUED`, `CANCELLED` (премахнати `PAID`, `UNPAID`, `OVERDUE`)
- ✅ Invoice става immutable - добавен `cancelledAt`, `cancelledBy`, `creditNoteId`
- ✅ Премахнат `Payment` model (плащанията не се управляват)
- ✅ Премахнат `PaymentMethod` enum (payment method е само текстово поле)

### 2. Премахнати опасни функционалности
- ✅ Премахната публична страница `/pay/[id]` за плащане на фактури
- ✅ Премахнат API endpoint `/api/invoices/[id]/payment-link`
- ✅ Премахнат webhook handler `/api/webhooks/stripe/invoice-payment`
- ✅ Премахната функция `createInvoicePaymentLink` от `stripe.ts`
- ✅ Премахнат `payment-service.ts` файл
- ✅ Премахната обработка на `payment_intent.succeeded` за фактури в webhook handler

### 3. Останали задачи
- ⏳ Направене на Invoice immutable (премахване на редактиране, само cancel → credit note)
- ⏳ Премахване на Payment references от UI компоненти
- ⏳ Добавяне на функционалност за създаване на CreditNote
- ⏳ Добавяне на InvoiceSequence логика за номериране
- ⏳ Добавяне на AuditLog логика

## 📋 Следващи стъпки

1. **Премахване на редактиране на фактури:**
   - Премахни `/invoices/[id]/edit` страницата
   - Премахни `PUT /api/invoices/[id]` endpoint
   - Позволи редактиране само на DRAFT фактури
   - След ISSUED - само cancel → credit note

2. **Премахване на Payment references:**
   - Премахни `/payments` страницата
   - Премахни `/payments/new` страницата
   - Премахни Payment references от InvoiceDetailClient
   - Премахни Payment API endpoint

3. **Добавяне на CreditNote функционалност:**
   - Създай API endpoint за cancel invoice → create credit note
   - Създай UI за създаване на credit note
   - Създай PDF export за credit note

4. **Добавяне на InvoiceSequence:**
   - Автоматично генериране на номера при създаване на фактура
   - Нулиране на sequence в началото на всяка година
   - Използване на български формат за номериране

5. **Добавяне на AuditLog:**
   - Логване на всички действия с фактури
   - Логване на създаване, изпращане, експорт, cancel

## 🎯 Финален резултат

Приложението ще бъде:
- ✅ SaaS за издаване на фактури + абонамент
- ✅ Без payment processing за клиенти
- ✅ Без каса/оборот/отчети
- ✅ Immutable фактури (само cancel → credit note)
- ✅ Съответствие с НАП изискванията
- ✅ Безопасно и легално
