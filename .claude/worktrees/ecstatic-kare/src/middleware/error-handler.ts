import { NextRequest, NextResponse } from 'next/server';
import { formatApiError } from '@/lib/api-utils';
import { ApiStatusCode } from '@/types/api';
import { ZodError } from 'zod';

/**
 * Обработва грешки в API заявките и връща стандартизиран отговор
 */
export async function withErrorHandling(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(`API error in ${request.method} ${request.nextUrl.pathname}:`, error);
    
    // Обработка на различни типове грешки
    if (error instanceof ZodError) {
      // Грешки при валидация на данни
      return NextResponse.json(
        formatApiError(
          'VALIDATION_ERROR',
          'Невалидни входни данни',
          { errors: error.errors },
          ApiStatusCode.VALIDATION_ERROR
        ),
        { status: ApiStatusCode.VALIDATION_ERROR }
      );
    }
    
    if (error instanceof Error) {
      // Обработка на стандартни JavaScript грешки
      const statusCode = getErrorStatusCode(error);
      const errorCode = getErrorCode(error);
      
      return NextResponse.json(
        formatApiError(
          errorCode,
          error.message,
          { stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
          statusCode
        ),
        { status: statusCode }
      );
    }
    
    // Общи неизвестни грешки
    return NextResponse.json(
      formatApiError(
        'INTERNAL_SERVER_ERROR',
        'Възникна неочаквана грешка',
        { originalError: process.env.NODE_ENV === 'development' ? error : undefined },
        ApiStatusCode.INTERNAL_SERVER_ERROR
      ),
      { status: ApiStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * Извлича подходящ HTTP статус код от грешка
 */
function getErrorStatusCode(error: Error): ApiStatusCode {
  // Проверка за специфични типове грешки
  if (error.name === 'NotFoundError') {
    return ApiStatusCode.NOT_FOUND;
  }
  
  if (error.name === 'UnauthorizedError') {
    return ApiStatusCode.UNAUTHORIZED;
  }
  
  if (error.name === 'ForbiddenError') {
    return ApiStatusCode.FORBIDDEN;
  }
  
  if (error.name === 'ValidationError') {
    return ApiStatusCode.VALIDATION_ERROR;
  }
  
  // Проверка за Prisma грешки
  if (error.name === 'PrismaClientKnownRequestError') {
    // Грешка при нарушаване на ограничения (напр. уникалност)
    if ((error as any).code === 'P2002') {
      return ApiStatusCode.VALIDATION_ERROR;
    }
    
    // Грешка при ненамиране на запис
    if ((error as any).code === 'P2025') {
      return ApiStatusCode.NOT_FOUND;
    }
  }
  
  return ApiStatusCode.INTERNAL_SERVER_ERROR;
}

/**
 * Извлича код на грешка от обект на грешка
 */
function getErrorCode(error: Error): string {
  if (error.name === 'NotFoundError') {
    return 'NOT_FOUND';
  }
  
  if (error.name === 'UnauthorizedError') {
    return 'UNAUTHORIZED';
  }
  
  if (error.name === 'ForbiddenError') {
    return 'FORBIDDEN';
  }
  
  if (error.name === 'ValidationError') {
    return 'VALIDATION_ERROR';
  }
  
  // Prisma грешки
  if (error.name === 'PrismaClientKnownRequestError') {
    return `PRISMA_ERROR_${(error as any).code || 'UNKNOWN'}`;
  }
  
  return error.name || 'INTERNAL_SERVER_ERROR';
} 