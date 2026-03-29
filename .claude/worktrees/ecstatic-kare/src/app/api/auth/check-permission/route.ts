import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ hasAccess: false }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const permission = searchParams.get("permission");
  const companyId = searchParams.get("companyId") || undefined;
  
  if (!permission) {
    return NextResponse.json(
      { error: "Параметърът permission е задължителен" },
      { status: 400 }
    );
  }
  
  try {
    const hasAccess = await hasPermission(
      session.user.id,
      permission,
      companyId
    );
    
    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Грешка при проверка на права:", error);
    return NextResponse.json(
      { error: "Неуспешна проверка на права" },
      { status: 500 }
    );
  }
} 