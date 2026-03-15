# UX Copy & Conversion Audit — Invoicing App

Expert review of user-facing text for **user mindset**, **value communication**, **conversion psychology**, and **microcopy**. Prioritized by impact on paid conversion and professional tone.

**Implementation status:** The improvements below have been applied in the codebase for: InvoicesClient & invoice new page (limit/CTA), ProFeatureLock & SubscriptionRequired, Companies/Clients/Products/Team/Users limit messages & CTAs, Export & email locks, middleware subscription messages, dashboard (welcome, empty state), InvoiceWorkspaceSetup, subscription page (success/cancel, card copy), InvoiceDetailClient (send tooltip), EIK lock messages (clients/companies new & edit).

---

## 1. USER MINDSET

**Current state:** Some copy is neutral or feature-led; it doesn’t consistently reinforce “you’re in control,” “this saves time,” or “you look professional.”

**Gaps:**
- Empty states and onboarding focus on “what to do” more than “why this helps you.”
- Success messages are functional, not reinforcing (“Фактурата е дублирана” vs. “Готово — можете да я редактирате и изпратите”).
- Dashboard welcome is generic (“Добре дошли, {name}!”) and doesn’t set a productive frame.

---

## 2. VALUE COMMUNICATION

**Current state:** Landing (HomePageClient) has solid benefit bullets; inside the app, benefits are underused. Upgrade prompts stress “надградете” (upgrade) and limits more than outcomes (save time, look pro, get paid faster).

**Gaps:**
- EIK/Starter lock: “Надградете за да зареждате данни с един клик” is good; other locks rarely tie to a clear outcome.
- Export/email locks don’t say “Изпращайте фактури по имейл и получавайте по-бързи плащания.”
- No “get paid faster” or “look professional” in limit/upgrade copy.

---

## 3. CONVERSION PSYCHOLOGY

**Current state:** Upgrade prompts are clear but often negative (“Достигнахте лимита”) and feature-led (“Надградете до PRO за неограничени фактури”). Missing: positive framing, outcome, light urgency, and “best moment” (e.g. right after first invoice).

**Gaps:**
- No soft urgency (e.g. “Остава ви 1 фактура този месец” could add “— надградете, за да не спирате”).
- CTAs are repetitive: “Надградете”, “Надградете до PRO” — little variation or benefit in the button.
- SubscriptionRequired is generic (“Тази функция изисква по-висок абонаментен план”) and doesn’t sell the benefit.

---

## 4. MICROCOPY — SPECIFIC IMPROVEMENTS

### 4.1 Upgrade prompts & limit messages (high impact)

| Location | Original | Problem | Better version |
|----------|----------|--------|----------------|
| InvoicesClient (limit reached) | Достигнахте лимита от **3 фактури** за този месец. Надградете до PRO за неограничени фактури. | Negative, feature-only. | Вие сте издали **3 фактури** този месец — лимитът на безплатния план. С PRO създавате неограничено и изпращате по имейл за по-бързи плащания. |
| InvoicesClient (1 left) | Остава ви само **1 фактура** за този месец. Надградете за неограничени фактури. | Anxious, no benefit. | Остава ви **1 фактура** този месец. Надградете до PRO, за да не спирате и да изпращате фактури по имейл. |
| InvoicesClient CTA button | Надградете до PRO | Feature-only. | Отключете неограничени фактури → |
| CompaniesClient (limit) | Достигнахте лимита от **1 компания** за FREE плана. Надградете до PRO за до 3 компании. | Same pattern. | Достигнахте лимита от **1 фирма** за безплатния план. С PRO управлявате до 3 фирми от един акаунт. |
| CompaniesClient CTA | Надградете | Vague. | Вижте плановете → |
| ClientsClient (limit) | Достигнахте лимита от **{n} клиента** за {plan} плана. Надградете до STARTER за до 25 клиента... | Long, repetitive. | Лимитът за клиенти за този план е достигнат. С по-висок план добавяте още клиенти и ползвате търсене по ЕИК. |
| ClientsClient CTA | Надградете | Same. | Отключете повече клиенти → |
| ProductsClient (limit) | Достигнахте лимита от **{n} продукта**... Надградете до STARTER... | Same. | Лимитът за продукти е достигнат. Надградете, за да добавяте още артикули без ограничения. |
| TeamSettingsClient | Достигнахте лимита за членове във вашия план. Надградете за да каните още хора. | Slightly better; “каните още хора” is good. | Достигнахте лимита за членове. С BUSINESS до 5 потребителя в екипа — каняйте съдружници и счетоводители. |
| Invoice new page (1 left) | Остава ви само **1 фактура**... Надградете за неограничени фактури. | Same as list above. | Use same “Better version” as InvoicesClient (1 left). |
| Invoice new page (limit) | Достигнахте лимита от **3 фактури**... Надградете до PRO... | Same. | Use same “Better version” as InvoicesClient (limit reached). |

### 4.2 ProFeatureLock & EIK (high impact)

| Location | Original | Problem | Better version |
|----------|----------|--------|----------------|
| ProFeatureLock button (with Stripe) | Подготвяме плащането... / Надградете до {requiredPlan} | “Подготвяме плащането” is good; CTA is feature-only. | Подготвяме плащането... / Отключете с {requiredPlan} → |
| ProFeatureLock link CTA | Надградете до Стартер / Надградете | Vague. | Попълване с един клик със Стартер → |
| ProFeatureLock overlay | Надградете сега → | No benefit. | Отключете тази функция → |
| ProFeatureLock inline | Надградете до {requiredPlan} за тази функция | Feature-only. | С план {requiredPlan}: {one-line benefit, e.g. “попълвате данни по ЕИК с един клик”}. |
| Clients/Companies new (EIK lock) | Търсенето по ЕИК/БУЛСТАТ и автоматичното попълване от Регистъра е налично от план Стартер. Надградете за да зареждате данни с един клик. | Good outcome; “Надградете” is weak. | Попълвате фирма/клиент с **един клик** от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер. |
| Clients [id] edit (EIK) | Търсенето по ЕИК/БУЛСТАТ... Надградете за да зареждате данни с един клик. | Same. | Same as above. |

### 4.3 SubscriptionRequired (high impact)

| Original | Problem | Better version |
|----------|--------|----------------|
| Изисква се абонамент | Blocking, negative. | Тази функция е част от платения план |
| Тази функция изисква по-висок абонаментен план. | Generic, no benefit. | С по-висок план отключвате още възможности: повече фактури, изпращане по имейл, лого и др. |
| Трябва да надстроите абонамента си, за да имате достъп до {feature}. | Repetitive. | За да ползвате {feature}, изберете подходящ план по-долу. |
| Надстройте, за да отключите: Повече клиенти и фактури... | List is good; headline is weak. | Какво получавате с надграждане: |
| Преглед на абонаментните планове | OK. | Вижте плановете и цените |
| Назад | OK. | Към началото |

### 4.4 Export & email locks (medium impact)

| Location | Original | Problem | Better version |
|----------|----------|--------|----------------|
| ExportDialogWrapper | Надградете сега → | No benefit. | Отключете експорт (CSV/PDF) → |
| Middleware (export) | Експортът е заключен за FREE плана. Надградете до STARTER за CSV експорт или до PRO/BUSINESS за JSON и PDF експорт. | Correct but dry. | Експортът е в платените планове: CSV от Стартер, PDF и пълна експорт от Про/Бизнес. |
| Middleware (email) | Изпращане на фактури по имейл е налично само в PRO и BUSINESS плановете. Надградете за да изпращате фактури по имейл. | Feature-only. | Изпращайте фактури по имейл и получавайте по-бързи плащания — в плановете Про и Бизнес. |
| InvoiceDetailClient (send) | Надградете сега → (link) | Same. | Изпращане по имейл с Про → |

### 4.5 Middleware limit messages (medium impact)

Keep structure; soften and add one benefit where it fits.

| Feature | Original (excerpt) | Better version (excerpt) |
|---------|--------------------|---------------------------|
| customBranding | Собствено лого е налично само в PRO и BUSINESS плановете. Надградете за да добавите вашето лого. | Вашето лого на фактурите е в плановете Про и Бизнес. Надградете, за да изглеждате още по-професионално. |
| creditNotes | Кредитни известия са налични само в PRO и BUSINESS плановете. Надградете за да създавате кредитни известия. | Кредитни известия — в плановете Про и Бизнес. Надградете, за да издавате сторнирания и корекции лесно. |
| eikSearch | Търсенето по ЕИК/БУЛСТАТ е платена функция. Надградете до план Стартер за да попълвате данни автоматично от Регистъра. | Попълвайте данни с един клик от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер. |

### 4.6 Empty states (medium impact)

| Location | Original | Problem | Better version |
|----------|----------|--------|----------------|
| Dashboard (no invoices) | Няма фактури. Създайте първата си фактура, за да започнете да управлявате финансите си | Good intent; “управлявате финансите” is broad. | Все още няма фактури. Създайте първата за минути и започнете да проследявате какво ви дължат. |
| Invoices list | Все още нямате фактури | Neutral. | Все още няма фактури. Създайте първата — бързо и с готови полета. |
| CompaniesClient | Няма намерени компании / Все още нямате компании | OK. | При първо ползване: „Добавете първата си фирма — данните ще се ползват при всяка фактура.“ |
| ClientsClient | (similar) | Same. | „Добавете първия си клиент — след това ще го избирате при създаване на фактури.“ |

### 4.7 Onboarding & dashboard (medium impact)

| Location | Original | Problem | Better version |
|----------|----------|--------|----------------|
| Dashboard welcome | Добре дошли, {name}! | Generic. | Добре дошли! Ето преглед на фактурите и дейностите ви. |
| InvoiceWorkspaceSetup title | Започнете с настройката на фактурирането | Slightly formal. | Стъпки за първа фактура |
| InvoiceWorkspaceSetup description | След първия вход е най-лесно първо да добавите фирма и клиент. Щом и двете са готови, ще можете да създавате фактури без блокиращи стъпки. | Long; “блокиращи стъпки” is negative. | Добавете фирма и клиент веднъж — след това всяка нова фактура е с няколко клика. |
| Doc onboarding (invoices) | Добре дошли във фактурите. Тук създавате и управлявате всички ваши фактури. Нека да ви покажем основните функции. | OK. | Тук са вашите фактури. Ще ви покажем как да създадете първата за минути. |
| Doc onboarding (clients) | Тук управлявате всички ваши клиенти и техните данни. Нека да ви покажем основните функции. | Same. | Тук са клиентите ви. Добавяте ги веднъж и ги използвате при всяка фактура. |

### 4.8 Subscription page (medium impact)

| Original | Problem | Better version |
|----------|--------|----------------|
| Управлявайте плана си, лимитите и историята на плащанията от едно място. | Administrative. | Изберете план и вижте какво ви предлага — лимити, функции и история на плащанията. |
| Сравнете наличните планове и надградете, когато имате нужда. | Passive. | Сравнете плановете и надградете, когато искате повече фактури, фирми или изпращане по имейл. |
| Абонаментът беше успешно обновен. | Functional. | Готово! Вашият план е активен. Можете да ползвате всички включени функции. |
| Плащането беше отказано. | OK. | Плащането беше отменено. Можете да опитате отново когато искате. |
| 14 дни безплатен trial | OK. | 14 дни безплатно — после решавате дали да продължите |
| При годишен план плащате за 10 месеца и получавате 12 — най-добра стойност. | Good. | Плащате за 10 месеца, ползвате 12 — най-добра стойност при годишен план. |

### 4.9 Buttons & CTAs (lower impact, consistency)

| Context | Original | Better (where it helps conversion) |
|---------|----------|-----------------------------------|
| Subscription plans | Започни сега | Започнете безплатно / Опитайте 14 дни |
| Subscription (current) | Текущ план | Вашият план |
| Subscription (cancel) | Отказ | Прекратяване в края на периода |
| Create invoice (limit) | Надградете до PRO | Отключете неограничени фактури → |
| General upgrade link | Надградете сега → | Вижте плановете → / Отключете функцията → |

### 4.10 Error & success messages (tone)

| Original | Problem | Better version |
|----------|--------|----------------|
| Грешка при изтриване на фактурата | OK. | Не удавихме да изтрием фактурата. Опитайте отново. |
| Възникна неочаквана грешка. Моля, опитайте отново или се върнете към началото. | Good. | Нещо се обърка. Опитайте отново или се върнете към началото. |
| Фактурата е дублирана | Functional. | Готово — създадена е копие. Можете да я редактирате и да я изпратите. |
| Компанията е обновена | OK. | Данните за компанията са записани. |
| Достигнат е лимитът за фактури за вашия план (API) | OK for API. | (Keep for API; for UI use the softer limit messages above.) |

---

## 5. BEST MOMENTS TO ENCOURAGE UPGRADE

**Current:** Upgrade is shown at limit (invoices, companies, clients, products), on locked feature (EIK, export, email, logo), and on subscription page.

**Recommended additions:**

1. **After first invoice created (or first 1–2 issued)**  
   Soft banner or short tooltip: „Създадохте първата си фактура. С Про можете да ги изпращате по имейл и да получавате плащания по-бързо.“

2. **After sending first invoice (when email is locked)**  
   „Фактурата е готова. С план Про можете да я изпращате по имейл директно от системата.“

3. **When opening Export (locked)**  
   Already present; use the improved copy from 4.4 (benefit-led).

4. **When adding 2nd company (locked on FREE)**  
   „Управлявайте няколко фирми от един акаунт — с план Про до 3 фирми.“

5. **Usage counter near limit (e.g. 2/3 invoices)**  
   Already have “1 left”; optionally add a small hint at 2/3: „Остават ви 2 фактури този месец“ with link “Вижте плановете”.

6. **Subscription page**  
   Keep “2 месеца безплатно” and savings; add one line under pricing: „Създавайте колкото фактури искате, изпращайте по имейл и следете всичко на едно място.“

---

## 6. IMPLEMENTATION PRIORITY

**Phase 1 (highest impact on conversion):**
- InvoicesClient + invoice new page: limit and “1 left” messages + CTA buttons (4.1).
- ProFeatureLock: default message and CTA text (4.2).
- SubscriptionRequired: title, description, list headline, primary button (4.3).
- EIK lock messages on clients/companies (4.2).

**Phase 2:**
- Export and email lock copy (4.4, middleware 4.5).
- Subscription page subtitle and success/cancel messages (4.8).
- Empty states: dashboard, invoices, companies, clients (4.6).

**Phase 3:**
- Onboarding and dashboard welcome (4.7).
- Error/success microcopy (4.10).
- Add one “after first invoice” / “after first send” upgrade moment (Section 5).

---

## 7. TONE GUIDELINES (for future copy)

- **Confident, simple, professional:** Short sentences; avoid “моля”, “трябва” where a clear instruction works.
- **Outcome over feature:** Prefer “Изпращайте по имейл и получавайте по-бързи плащания” over “Имейл изпращане е налично в PRO.”
- **Positive frame where possible:** “Остава ви 1 фактура” + benefit instead of only “Достигнахте лимита.”
- **One clear benefit per upgrade prompt:** Either “с един клик,” or “неограничени фактури,” or “изпращане по имейл,” not all in one line.
- **CTA variation:** Rotate “Вижте плановете”, “Отключете с [план]”, “Отключете неограничени фактури” instead of always “Надградете.”

This audit gives you a single reference to implement copy changes that improve mindset, value clarity, and conversion without being pushy.
