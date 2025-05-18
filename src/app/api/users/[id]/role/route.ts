import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check permission
    const canManageUsers = await hasPermission(session.user.id, "user:manage");
    if (!canManageUsers) {
      return NextResponse.json(
        { error: "You don't have permission to manage users" },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const { role, companyId } = await request.json();
    
    // Validate role
    const validRoles = Object.values(Role);
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    // Check if company exists and user has access
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }
    
    // Update user role
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      update: {
        role,
      },
      create: {
        userId,
        companyId,
        role,
      },
    });
    
    return NextResponse.json({ userRole });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check permission
    const canManageUsers = await hasPermission(session.user.id, "user:manage");
    if (!canManageUsers) {
      return NextResponse.json(
        { error: "You don't have permission to manage users" },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const { companyId } = await request.json();
    
    // Check if company exists and user has access
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }
    
    // Prevent removing yourself as owner
    const isOwner = await prisma.userRole.findFirst({
      where: {
        userId,
        companyId,
        role: "OWNER",
      },
    });
    
    if (isOwner && userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself as owner" },
        { status: 400 }
      );
    }
    
    // Delete user role
    await prisma.userRole.deleteMany({
      where: {
        userId,
        companyId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user role:", error);
    return NextResponse.json(
      { error: "Failed to remove user role" },
      { status: 500 }
    );
  }
} 