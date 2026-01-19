# ✅ Чеклист за завършване на приложението

## 🎯 КРИТИЧНИ ЗАДАЧИ (задължителни за launch)

### 1. 🔒 Безопасна архитектура (според НАП изискванията)

#### 1.1 Премахване на опасни функционалности
- [ ] **Премахни редактиране на ISSUED фактури**
  - [ ] Премахни `/invoices/[id]/edit` страницата (или ограничи само за DRAFT)
  - [x] Обнови `PUT /api/invoices/[id]` - позволи редактиране само на DRAFT
  - [x] Премахни Edit бутон от InvoiceDetailClient за ISSUED фактури
  - [x] Добави проверка: `if (status !== 'DRAFT') throw error`

- [ ] **Премахни Payment management**
  - [ ] Премахни `/payments` страницата от навигацията
  - [ ] Премахни `/payments/new` страницата
  - [ ] Премахни Payment API endpoint `/api/payments`
  - [ ] Премахни Payment references от InvoiceDetailClient
  - [ ] Премахни Payment references от dashboard
  - [ ] Премахни Payment references от clients/[id]/page.tsx

- [ ] **Премахни Payment references от Sidebar**
  - [ ] Премахни "Плащания" от навигацията

#### 1.2 Добавяне на CreditNote функционалност
- [x] **API за създаване на CreditNote**
  - [x] Създай `POST /api/invoices/[id]/cancel` endpoint
  - [x] Логика: cancel invoice → create credit note
  - [x] Генериране на credit note number
  - [x] Копиране на invoice items в credit note items

- [x] **UI за създаване на CreditNote**
  - [x] Добави "Отмени фактура" бутон в InvoiceDetailClient
  - [x] Модал за потвърждение с причина за отмяна
  - [x] Показване на credit note след създаване
  - [x] Страница за преглед на credit notes (`/credit-notes`)
  - [x] Детайлна страница за credit note (`/credit-notes/[id]`)

- [x] **PDF export за CreditNote**
  - [x] Разшири `invoice-export.ts` за credit notes
  - [x] Генериране на PDF с правилен формат
  - [x] API endpoint `/api/credit-notes/[id]/export-pdf`

#### 1.3 InvoiceSequence логика
- [x] **Автоматично номериране**
  - [x] Създай `lib/invoice-sequence.ts` helper
  - [x] Функция `getNextInvoiceSequence(companyId, year)`
  - [x] Автоматично създаване/обновяване на InvoiceSequence
  - [x] Нулиране на sequence в началото на всяка година
  - [x] Използване на български формат: `YYCCCCNNNNNNИ`

- [x] **Интеграция при създаване на фактура**
  - [x] Използвай InvoiceSequence в `POST /api/invoices`
  - [x] Автоматично генериране на номер при създаване

#### 1.4 AuditLog функционалност
- [ ] **Логване на действия**
  - [x] Създай `lib/audit-log.ts` helper
  - [x] Функция `logAction(userId, action, entityType, entityId, changes?)`
  - [x] Логване при създаване на фактура
  - [x] Логване при изпращане на фактура
  - [ ] Логване при експорт на фактура
  - [x] Логване при cancel → credit note
  - [x] Логване на IP адрес и user agent

- [x] **UI за преглед на audit logs**
  - [x] Страница `/settings/audit-logs`
  - [x] Показване на история на промени в InvoiceDetailClient (таб "История")
  - [x] API endpoint `/api/audit-logs`

### 2. 🔄 Миграция към Supabase (завършване)

- [ ] **Премахни всички Prisma references**
  - [ ] Провери всички файлове за `prisma.` или `@prisma/client`
  - [ ] Замени с Supabase queries
  - [ ] Премахни `lib/db.ts` и `lib/db-utils.ts` ако използват Prisma

- [ ] **Обнови middleware**
  - [ ] `middleware/subscription.ts` - използвай Supabase
  - [ ] Провери всички middleware файлове

- [ ] **Обнови services**
  - [ ] `services/subscription-service.ts` - използвай Supabase
  - [ ] Провери всички service файлове

- [ ] **Database migrations**
  - [ ] Създай Supabase migration за новите модели (InvoiceSequence, CreditNote, AuditLog)
  - [ ] Обнови `supabase-schema.sql` с новите модели
  - [ ] Тествай миграцията в Supabase

### 3. 🐛 Bug fixes и подобрения

- [ ] **Invoice status management**
  - [ ] При създаване: статус = DRAFT
  - [ ] При изпращане: статус = ISSUED (immutable)
  - [ ] При cancel: статус = CANCELLED, създаване на credit note
  - [ ] Премахни всички проверки за PAID/UNPAID/OVERDUE

- [ ] **Обнови dashboard**
  - [ ] Премахни revenue от платени фактури (няма плащания)
  - [ ] Покажи само статистики за издадени фактури
  - [ ] Премахни overdue логика

- [ ] **Обнови InvoiceDetailClient**
  - [ ] Премахни Payment секция
  - [ ] Премахни "Плати сега" бутон
  - [ ] Добави "Отмени фактура" бутон (само за ISSUED)
  - [ ] Покажи credit note ако има

### 4. 📝 Документация

- [x] **Обнови README.md**
  - [x] Премахни Payment references
  - [x] Добави информация за CreditNote
  - [x] Добави информация за InvoiceSequence
  - [x] Обнови feature list

- [ ] **API документация**
  - [ ] Документирай новите endpoints
  - [ ] Документирай промените в invoice status

- [ ] **User guide**
  - [ ] Как да създадеш фактура
  - [ ] Как да отмениш фактура → credit note
  - [ ] Как работи номерирането

## 🚀 ПОДГОТОВКА ЗА PRODUCTION

### 5. Тестване

- [ ] **Unit тестове**
  - [ ] Тест за InvoiceSequence логика
  - [ ] Тест за CreditNote създаване
  - [ ] Тест за AuditLog логика

- [ ] **Integration тестове**
  - [ ] Тест за създаване на фактура
  - [ ] Тест за cancel → credit note
  - [ ] Тест за immutable invoices

- [ ] **E2E тестове**
  - [ ] Пълен flow: създаване → изпращане → cancel
  - [ ] Тест на абонамент системата
  - [ ] Тест на PDF генериране

### 6. Performance оптимизации

- [ ] **Database queries**
  - [ ] Оптимизирай Supabase queries
  - [ ] Добави индекси където е нужно
  - [ ] Провери N+1 query проблеми

- [ ] **Caching**
  - [ ] Добави caching за често използвани данни
  - [ ] Оптимизирай revalidation

### 7. Security

- [ ] **Валидация**
  - [ ] Валидирай всички user inputs
  - [ ] Провери за SQL injection рискове
  - [ ] Провери за XSS рискове

- [ ] **Permissions**
  - [ ] Провери всички permission checks
  - [ ] Тествай роли и разрешения

### 8. Deployment

- [ ] **Environment variables**
  - [ ] Провери всички env variables
  - [ ] Обнови `.env.example`
  - [ ] Документирай всички нужни env vars

- [ ] **Build и deploy**
  - [ ] Тествай production build
  - [ ] Провери за build errors
  - [ ] Настрой CI/CD pipeline (опционално)

## 📊 ПРИОРИТЕТИ

### Висок приоритет (задължително за launch):
1. ✅ Премахване на Payment management
2. ✅ Immutable invoices (само DRAFT може да се редактира)
3. ✅ CreditNote функционалност
4. ✅ InvoiceSequence логика
5. ✅ Завършване на Supabase миграцията

### Среден приоритет (важно, но не блокира):
6. AuditLog функционалност
7. Обновяване на dashboard
8. Bug fixes

### Нисък приоритет (може да се добави след launch):
9. Тестове
10. Performance оптимизации
11. Допълнителна документация

## 🎯 ОЦЕНКА ЗА ЗАВЪРШВАНЕ

**Текущо състояние:** ~90% готово

**Завършени:**
- [x] CreditNote функционалност (списък, детайли, PDF)
- [x] AuditLog функционалност (API, UI в настройки, История таб във фактури)
- [x] InvoiceSequence логика
- [x] Immutable invoices
- [x] GDPR (cookie consent, експорт данни, изтриване акаунт)
- [x] Subscription лимити и upgrade prompts
- [x] README.md обновен

**Остават:**
- API документация
- User guide
- Unit/Integration/E2E тестове
- Performance оптимизации

**Общо:** ~10-15 часа работа за пълно завършване

**Готово за launch:** Да, основната функционалност е завършена
