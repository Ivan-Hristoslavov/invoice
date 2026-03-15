# Логика на плащанията и отключване по план

## Поток след плащане

1. **Checkout** – потребителят избира план → `POST /api/subscription/checkout` или `direct-link` → получава Stripe Checkout URL → плаща в Stripe.
2. **Stripe изпраща webhook** към `POST /api/webhooks/stripe`:
   - `checkout.session.completed` – при успешен checkout: запис/обновяване на `Subscription` в БД (план, статус, период).
   - `customer.subscription.created/updated/deleted` – при промяна в абонамента: също обновява `Subscription`.
   - `invoice.paid` / `invoice.payment_failed` – запис в `SubscriptionPayment` за история.
3. **БД** – таблица `Subscription`: един ред на потребител (последен по `createdAt`), статуси `ACTIVE`, `TRIALING`, `PAST_DUE` = активен план.
4. **Четене в приложението**:
   - `GET /api/subscription` – връща текущия абонамент (за UI „Текущ план“, история).
   - `GET /api/subscription/usage` – връща план, лимити (фактури, фирми, клиенти, продукти, потребители) и функции (customBranding, export, creditNotes, emailSending, apiAccess, eikSearch) според `PLAN_LIMITS[plan]`.
5. **След успешен checkout** – при завръщане на `/settings/subscription?success=true`:
   - Страницата прави **refresh** на абонамента и usage (веднъж веднага и повторно след 2s и 5s), за да се обнови данните дори ако webhook-ът е с малко закъснение.
   - Така потребителят вижда новия план и отключените лимити/функции без ръчно презареждане.

## Отключване по план – един източник

- **Източник на истината:** `src/lib/subscription-plans.ts` – дефиниции за FREE, STARTER, PRO, BUSINESS (limits, features).
- **Сървър:** `src/middleware/subscription.ts` – `PLAN_LIMITS` се извлича от същите дефиниции; `checkSubscriptionLimits(userId, feature)` се вика от API routes преди създаване на фактури, фирми, клиенти, продукти, ЕИК търсене, експорт, лого, имейл, потребители.
- **Usage API** – използва същия `PLAN_LIMITS` и връща `plan`, counts и `features` за клиента.
- **Клиент** – `useSubscriptionLimit()` / `SubscriptionUsageProvider` четат `/api/subscription/usage` и предоставят `plan`, `canCreateInvoice`, `canCreateCompany`, `canUseFeature('eikSearch')` и т.н. за скриване/показване на бутони и лимити.

При успешно плащане webhook обновява `Subscription.plan`; всички проверки (сървър и клиент) вече използват новия план и потребителят получава достъп до всичко, което предлага пакета.

## Какво да е конфигурирано в Stripe

- Webhook endpoint: `{APP_URL}/api/webhooks/stripe`, събития: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- В `.env`: `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` (или `STRIPE_SECRET_KEY_FIXED`), Price IDs за всеки план/интервал (виж `env-stripe-example.txt`).
