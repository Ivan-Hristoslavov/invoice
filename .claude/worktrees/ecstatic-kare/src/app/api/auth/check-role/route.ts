import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";

// Define Role type since we're not using Prisma anymore
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
const validRoles: Role[] = ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'VIEWER'];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ hasAccess: false }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const companyId = searchParams.get("companyId") || undefined;
  
  if (!roleParam) {
    return NextResponse.json(
      { error: "Параметърът role е задължителен" },
      { status: 400 }
    );
  }
  
  // Validate role
  if (!validRoles.includes(roleParam as Role)) {
    return NextResponse.json(
      { error: "Невалиден параметър role" },
      { status: 400 }
    );
  }
  
  try {
    const hasAccess = await hasRole(
      session.user.id,
      roleParam as Role,
      companyId
    );
    
    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Грешка при проверка на роля:", error);
    return NextResponse.json(
      { error: "Неуспешна проверка на роля" },
      { status: 500 }
    );
  }
}
