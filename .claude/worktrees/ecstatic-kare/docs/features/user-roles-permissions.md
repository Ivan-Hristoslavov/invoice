# Потребителски Роли и Разрешения

Системата за управление на роли и разрешения позволява прецизен контрол на достъпа до различни функционалности на приложението. Всеки потребител може да има различна роля в рамките на една компания, която определя какви действия може да извършва.

## Роли

Системата включва следните предефинирани роли:

| Роля | Описание |
|------|----------|
| **ADMIN** | Системен администратор с пълен достъп до всички функции |
| **OWNER** | Собственик на компания с пълен достъп до данните на компанията |
| **MANAGER** | Мениджър на компания, който може да управлява повечето ресурси |
| **ACCOUNTANT** | Счетоводител с достъп до финансови записи и фактури |
| **VIEWER** | Потребител с права само за четене |

## Разрешения

Разрешенията са атомични права за извършване на конкретни действия. Те са организирани по ресурси и действия:

- `invoice:create` - Създаване на фактури
- `invoice:read` - Преглед на фактури
- `invoice:update` - Редактиране на фактури
- `invoice:delete` - Изтриване на фактури
- `invoice:send` - Изпращане на фактури до клиенти
- и т.н.

## Архитектура на системата

### База данни

Системата използва следните модели:

- `UserRole` - Връзка между потребители и роли за конкретна компания
- `Permission` - Дефиниция на разрешения
- `RolePermission` - Връзка между роли и разрешения

### API Ендпойнти

- `GET /api/auth/check-permission` - Проверява дали потребителят има конкретно разрешение
- `GET /api/auth/check-role` - Проверява дали потребителят има конкретна роля
- `PUT /api/users/[id]/role` - Обновява ролята на потребител в компания
- `DELETE /api/users/[id]/role` - Премахва потребител от компания

## Използване в кода

### Защита на страници (сървърни компоненти)

```tsx
import { checkPermission } from "@/lib/permissions";

export default async function InvoicesPage() {
  const canViewInvoices = await checkPermission("invoice:read");
  
  if (!canViewInvoices) {
    return <AccessDeniedPage />;
  }
  
  // Код на страницата...
}
```

### Защита на клиентски компоненти

```tsx
import { PermissionGuard, RoleGuard } from "@/components/ui/permission-guard";

function ActionButtons() {
  return (
    <div>
      <PermissionGuard permission="invoice:create">
        <Button>Създай фактура</Button>
      </PermissionGuard>
      
      <RoleGuard role="OWNER">
        <Button>Изтрий компания</Button>
      </RoleGuard>
    </div>
  );
}
```

### Използване на хукове за проверка на разрешения

```tsx
import { usePermission, useRole } from "@/hooks/use-permissions";

function InvoiceActions({ invoiceId }) {
  const { hasPermission } = usePermission("invoice:delete");
  
  const handleDelete = () => {
    if (!hasPermission) {
      toast.error("Нямате разрешение за изтриване на фактури");
      return;
    }
    
    // Код за изтриване...
  };
  
  return (
    <Button onClick={handleDelete} disabled={!hasPermission}>
      Изтрий
    </Button>
  );
}
```

### Защита на страница с AuthGuard

```tsx
import AuthGuard from "@/components/ui/auth-guard";

function AdminPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <h1>Административен панел</h1>
      {/* Съдържание на страницата... */}
    </AuthGuard>
  );
}
```

## Как да добавяте нови разрешения

1. Добавете новото разрешение в `prisma/seed-permissions.js`
2. Присвоете го към подходящите роли
3. Изпълнете `node prisma/seed-permissions.js` за да актуализирате базата данни
4. Използвайте новото разрешение в кода с `checkPermission` или `usePermission`

## Какво следва

- Интерфейс за персонализирани роли
- Детайлно управление на разрешенията за специфични обекти
- Отчети за активността на потребителите 