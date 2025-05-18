import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

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
      { error: "Role parameter is required" },
      { status: 400 }
    );
  }
  
  // Validate role
  const validRoles = Object.values(Role);
  if (!validRoles.includes(roleParam as Role)) {
    return NextResponse.json(
      { error: "Invalid role parameter" },
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
    console.error("Error checking role:", error);
    return NextResponse.json(
      { error: "Failed to check role" },
      { status: 500 }
    );
  }
} 