import { NextRequest, NextResponse } from 'next/server';
import { formatApiError } from '@/lib/api-utils';
import { ApiStatusCode } from '@/types/api';

// Съхранява данните за ограничение на заявките
// В реален проект, това трябва да използва Redis или друго external storage
const rateLimits = new Map<string, RateLimitData>();

interface RateLimitData {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  // Максимален брой заявки в интервала
  maxRequests: number;
  // Продължителност на интервала в секунди
  interval: number;
  // Дали да пропуска API ендпойнти (true) или да ги включва (false)
  excludeApiRoutes?: boolean;
  // Пропуска заявки за статични файлове
  ignoreStaticFiles?: boolean;
}

// Конфигурации за различни типове API
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Публични API ендпойнти
  public: {
    maxRequests: 60,    // 60 заявки
    interval: 60,       // за 1 минута
    excludeApiRoutes: false, // включва само API ендпойнти
  },
  // Webhook ендпойнти (по-рестриктивни)
  webhooks: {
    maxRequests: 30,
    interval: 60,
  },
  // Authenticate ендпойнти (най-рестриктивни)
  auth: {
    maxRequests: 10,
    interval: 60,
  }
};

/**
 * Middleware за ограничаване на честотата на API заявките
 */
export function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  configKey: keyof typeof rateLimitConfigs = 'public'
): Promise<NextResponse> {
  const config = rateLimitConfigs[configKey];
  
  // Проверка дали пътят трябва да се ограничава
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api/');
  
  // Пропускаме, ако не е API и конфигурацията е само за API
  if (config.excludeApiRoutes !== false && !isApiRoute) {
    return handler();
  }
  
  // Пропускаме статични файлове
  if (config.ignoreStaticFiles !== false && isStaticFile(path)) {
    return handler();
  }
  
  // Генерираме ключ за ограничението
  const ip = (request.headers.get('x-forwarded-for') || 'unknown-ip').split(',')[0].trim();
  const key = `${configKey}:${ip}:${path}`;
  
  // Проверка и прилагане на ограниченията
  const currentTime = Math.floor(Date.now() / 1000);
  const rateLimit = rateLimits.get(key) || { count: 0, resetAt: currentTime + config.interval };
  
  // Рестартираме брояча, ако интервалът е изтекъл
  if (rateLimit.resetAt <= currentTime) {
    rateLimit.count = 0;
    rateLimit.resetAt = currentTime + config.interval;
  }
  
  // Увеличаваме брояча
  rateLimit.count++;
  rateLimits.set(key, rateLimit);
  
  // Добавяме хедъри за ограничението
  const responseHeaders = new Headers();
  responseHeaders.set('X-RateLimit-Limit', config.maxRequests.toString());
  responseHeaders.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - rateLimit.count).toString());
  responseHeaders.set('X-RateLimit-Reset', rateLimit.resetAt.toString());
  
  // Проверка дали лимитът е надвишен
  if (rateLimit.count > config.maxRequests) {
    const retryAfter = rateLimit.resetAt - currentTime;
    responseHeaders.set('Retry-After', retryAfter.toString());
    
    return Promise.resolve(
      NextResponse.json(
        formatApiError(
          'RATE_LIMIT_EXCEEDED',
          'Твърде много заявки. Моля, опитайте отново по-късно.',
          { retryAfter },
          ApiStatusCode.SERVICE_UNAVAILABLE
        ),
        { 
          status: 429, // Too Many Requests
          headers: responseHeaders
        }
      )
    );
  }
  
  // Изпълняваме заявката и добавяме хедърите към отговора
  return handler().then(response => {
    const newResponse = NextResponse.json(
      response.json(),
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    );
    
    // Добавяме хедърите за ограничение
    responseHeaders.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  });
}

/**
 * Проверява дали пътят е за статичен файл
 */
function isStaticFile(path: string): boolean {
  // Проверка за разширения на статични файлове
  const staticExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
    '.css', '.js', '.json', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => path.endsWith(ext)) || 
         path.includes('/_next/') || 
         path.startsWith('/static/');
} 