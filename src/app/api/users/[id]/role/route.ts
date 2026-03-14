import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { canManageCompanyTeam, getCompanyRoleForUser } from "@/lib/team";
import { resolveSessionUser } from "@/lib/session-user";

// Define Role enum since we're not using Prisma anymore
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
const validRoles: Role[] = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const userId = (await params).id;
    const { role, companyId } = await request.json();
    
    // Validate role
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Невалидна роля" },
        { status: 400 }
      );
    }
    
    const currentUserRole = await getCompanyRoleForUser(sessionUser.id, companyId);
    if (!canManageCompanyTeam(currentUserRole)) {
      return NextResponse.json(
        { error: "Нямате права да управлявате потребители за тази компания" },
        { status: 403 }
      );
    }
    
    // Check if user role exists
    const { data: existingRole } = await supabaseAdmin
      .from('UserRole')
      .select('id')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .single();
    
    let userRole;
    
    if (existingRole) {
      // Update existing role
      const { data, error } = await supabaseAdmin
        .from('UserRole')
        .update({ role, updatedAt: new Date().toISOString() })
        .eq('id', existingRole.id)
        .select()
        .single();
      
      if (error) throw error;
      userRole = data;
    } else {
      // Create new role
      const cuid = require('cuid');
      const { data, error } = await supabaseAdmin
        .from('UserRole')
        .insert({
          id: cuid(),
          userId,
          companyId,
          role,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      userRole = data;
    }
    
    return NextResponse.json({ userRole });
  } catch (error) {
    console.error("Грешка при обновяване на роля на потребител:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на ролята на потребителя" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const userId = (await params).id;
    const { companyId } = await request.json();

    const currentUserRole = await getCompanyRoleForUser(sessionUser.id, companyId);
    if (!canManageCompanyTeam(currentUserRole)) {
      return NextResponse.json(
        { error: "Нямате права да управлявате потребители за тази компания" },
        { status: 403 }
      );
    }
    
    // Prevent removing yourself as owner
    const { data: isOwner } = await supabaseAdmin
      .from('UserRole')
      .select('id')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .eq('role', 'OWNER')
      .single();
    
    if (isOwner && userId === sessionUser.id) {
      return NextResponse.json(
        { error: "Не можете да премахнете себе си като собственик" },
        { status: 400 }
      );
    }
    
    // Delete user role
    await supabaseAdmin
      .from('UserRole')
      .delete()
      .eq('userId', userId)
      .eq('companyId', companyId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при премахване на роля на потребител:", error);
    return NextResponse.json(
      { error: "Неуспешно премахване на ролята на потребителя" },
      { status: 500 }
    );
  }
}
