import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatApiError } from '@/lib/api-utils';
import { ApiStatusCode } from '@/types/api';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Middleware за проверка на аутентикация и авторизация
 */
export async function withAuthorization(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: {
    requiredPermissions?: string[];
    requiredRoles?: string[];
    resourceType?: string;
    resourceIdParam?: string;
    allowSameUser?: boolean;
  } = {}
): Promise<NextResponse> {
  // Проверка за аутентикация
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      formatApiError(
        'UNAUTHORIZED',
        'Необходима е аутентикация',
        undefined,
        ApiStatusCode.UNAUTHORIZED
      ),
      { status: ApiStatusCode.UNAUTHORIZED }
    );
  }

  // Проверка на роли (ако има такива)
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    const { data: userRoles, error } = await supabaseAdmin
      .from('UserRole')
      .select('role')
      .eq('userId', session.user.id);
    
    if (error || !userRoles) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
    
    const roles = userRoles.map(ur => ur.role);
    const hasRequiredRole = options.requiredRoles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
  }
  
  // Проверка на права (ако има такива)
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('UserRole')
      .select('role')
      .eq('userId', session.user.id);
    
    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
    
    const roles = userRoles.map(ur => ur.role);
    
    // Get permissions for these roles
    const { data: rolePermissions, error: permError } = await supabaseAdmin
      .from('RolePermission')
      .select('permissionId')
      .in('role', roles);
    
    if (permError || !rolePermissions || rolePermissions.length === 0) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
    
    const permissionIds = rolePermissions.map(rp => rp.permissionId);
    
    // Get permission names
    const { data: permissions, error: nameError } = await supabaseAdmin
      .from('Permission')
      .select('name')
      .in('id', permissionIds);
    
    if (nameError || !permissions) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
    
    const permissionNames = permissions.map(p => p.name);
    const hasRequiredPermission = options.requiredPermissions.some(
      permission => permissionNames.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      return NextResponse.json(
        formatApiError(
          'FORBIDDEN',
          'Нямате достатъчни права за тази операция',
          undefined,
          ApiStatusCode.FORBIDDEN
        ),
        { status: ApiStatusCode.FORBIDDEN }
      );
    }
  }
  
  // Проверка за собственост на ресурс (ако е приложимо)
  if (options.resourceType && options.resourceIdParam) {
    const resourceId = request.nextUrl.pathname.split('/').pop();
    
    // Проверяваме дали потребителят е собственик на ресурса
    if (resourceId) {
      const { data: resource, error } = await supabaseAdmin
        .from(options.resourceType)
        .select('userId')
        .eq('id', resourceId)
        .single();
      
      // Ако ресурсът съществува и потребителят не е собственик
      if (!error && resource && resource.userId !== session.user.id) {
        // Проверяваме дали е разрешен достъп на същия потребител
        if (!options.allowSameUser || resource.userId !== session.user.id) {
          return NextResponse.json(
            formatApiError(
              'FORBIDDEN',
              'Нямате достъп до този ресурс',
              undefined,
              ApiStatusCode.FORBIDDEN
            ),
            { status: ApiStatusCode.FORBIDDEN }
          );
        }
      }
    }
  }
  
  // Разрешаване на достъп
  return handler();
}

/**
 * Проверка дали потребителят е собственик на ресурс
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    const { data: resource, error } = await supabaseAdmin
      .from(resourceType)
      .select('userId')
      .eq('id', resourceId)
      .single();
    
    return !error && resource?.userId === userId;
  } catch (error) {
    console.error(`Error checking resource ownership: ${error}`);
    return false;
  }
}
