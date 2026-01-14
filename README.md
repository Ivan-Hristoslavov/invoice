# FacturaPro

Професионална система за фактуриране за български бизнеси. Създавайте фактури, управлявайте клиенти и проследявайте плащания с пълна НАП съвместимост.

## 🚀 Основни функции

- 🧾 **Управление на фактури** - Създавайте професионални фактури с автоматично номериране
- 👥 **Управление на клиенти** - Централизирана база данни с клиенти
- 🏢 **Управление на компании** - Мулти-компании поддръжка
- 📊 **Dashboard** - Статистики и анализи в реално време
- 📝 **Каталог продукти** - Управление на продукти и услуги
- 🔒 **Сигурност** - Пълна аутентификация и управление на потребители
- 📱 **Responsive дизайн** - Работи перфектно на всички устройства
- 🇧🇬 **НАП съвместимост** - Пълна съвместимост с българското законодателство

## 🛠 Технологии

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Supabase** - Database и Backend
- **Tailwind CSS** - Styling
- **Framer Motion** - Анимации
- **NextAuth.js** - Аутентификация
- **Shadcn UI** - UI компоненти

## 📦 Инсталация

1. Клонирайте репозитория:
```bash
git clone <repository-url>
cd invoice
```

2. Инсталирайте зависимостите:
```bash
npm install
```

3. Настройте environment variables:
```bash
cp .env.example .env.local
```

4. Попълнете `.env.local` с вашите данни:
```env
NEXT_PUBLIC_APP_URL=https://facturapro.bg
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

5. Стартирайте development сървъра:
```bash
npm run dev
```

Отворете [http://localhost:3000](http://localhost:3000) в браузъра.

## 🗄 Database Setup

Приложението използва Supabase (PostgreSQL). Следвайте тези стъпки:

1. Създайте Supabase проект на [supabase.com](https://supabase.com)
2. Изпълнете SQL схемата от `supabase-schema.sql`
3. Добавете connection strings в `.env.local`

## 🚢 Production Build

```bash
npm run build
npm start
```

## 📝 SEO Оптимизация

Приложението е напълно оптимизирано за SEO:
- ✅ Пълни metadata и Open Graph tags
- ✅ Structured Data (JSON-LD)
- ✅ Sitemap.xml автоматично генериране
- ✅ Robots.txt конфигурация
- ✅ Оптимизирани за българския пазар

Вижте [SEO.md](./SEO.md) за повече детайли.

## 📄 Лиценз

Всички права запазени © 2026 FacturaPro

## 🤝 Поддръжка

За въпроси и поддръжка, моля свържете се с нас.
