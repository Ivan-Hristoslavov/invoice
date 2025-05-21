import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatApiError } from '@/lib/api-utils';
import { ApiStatusCode } from '@/types/api';
import { prisma } from '@/lib/db';

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
    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.user.id },
      select: { role: { select: { name: true } } },
    });
    
    const roles = userRoles.map(ur => ur.role.name);
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
    const userPermissions = await prisma.userRole.findMany({
      where: { userId: session.user.id },
      select: { 
        role: { 
          select: { 
            rolePermissions: { 
              select: { permission: { select: { name: true } } } 
            } 
          } 
        } 
      },
    });
    
    const permissions = userPermissions.flatMap(
      ur => ur.role.rolePermissions.map(rp => rp.permission.name)
    );
    
    const hasRequiredPermission = options.requiredPermissions.some(
      permission => permissions.includes(permission)
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
      const resource = await prisma[options.resourceType].findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      
      // Ако ресурсът съществува и потребителят не е собственик
      if (resource && resource.userId !== session.user.id) {
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
    const resource = await prisma[resourceType].findUnique({
      where: { id: resourceId },
      select: { userId: true }
    });
    
    return resource?.userId === userId;
  } catch (error) {
    console.error(`Error checking resource ownership: ${error}`);
    return false;
  }
} 