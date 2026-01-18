import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { hasPermission } from "@/lib/permissions";

// Define Role enum since we're not using Prisma anymore
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
const validRoles: Role[] = ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'VIEWER'];

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    
    // Check permission
    const canManageUsers = await hasPermission(session.user.id, "user:manage");
    if (!canManageUsers) {
      return NextResponse.json(
        { error: "Нямате права да управлявате потребители" },
        { status: 403 }
      );
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
    
    // Check if company exists and user has access
    const { data: company, error: companyError } = await supabaseAdmin
      .from('Company')
      .select('id')
      .eq('id', companyId)
      .eq('userId', session.user.id)
      .single();
    
    if (companyError || !company) {
      return NextResponse.json(
        { error: "Компанията не е намерена или достъпът е отказан" },
        { status: 404 }
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    
    // Check permission
    const canManageUsers = await hasPermission(session.user.id, "user:manage");
    if (!canManageUsers) {
      return NextResponse.json(
        { error: "Нямате права да управлявате потребители" },
        { status: 403 }
      );
    }
    
    const userId = (await params).id;
    const { companyId } = await request.json();
    
    // Check if company exists and user has access
    const { data: company, error: companyError } = await supabaseAdmin
      .from('Company')
      .select('id')
      .eq('id', companyId)
      .eq('userId', session.user.id)
      .single();
    
    if (companyError || !company) {
      return NextResponse.json(
        { error: "Компанията не е намерена или достъпът е отказан" },
        { status: 404 }
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
    
    if (isOwner && userId === session.user.id) {
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
