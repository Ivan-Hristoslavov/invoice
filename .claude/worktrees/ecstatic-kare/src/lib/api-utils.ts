import { 
  ApiResponse, 
  ApiError, 
  ApiStatusCode, 
  ErrorResponse, 
  PaginationParams,
  FilterParams,
  QueryParams
} from '@/types/api';

/**
 * Форматира API отговор според стандартната структура
 */
export function formatApiResponse<T>(
  data: T, 
  success: boolean = true, 
  meta?: any
): ApiResponse<T> {
  return {
    success,
    data,
    meta: meta ? {
      ...meta,
      timestamp: new Date().toISOString()
    } : undefined
  };
}

/**
 * Форматира API грешка според стандартната структура
 */
export function formatApiError(
  code: string, 
  message: string, 
  details?: any,
  statusCode: ApiStatusCode = ApiStatusCode.INTERNAL_SERVER_ERROR
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}

/**
 * Форматира входящи заявки за пагинирани резултати
 */
export function formatPaginationParams(params: PaginationParams): Required<PaginationParams> {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 10)),
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'desc'
  };
}

/**
 * Създава параметри за заявка с пагинация и филтри
 */
export function buildQueryParams(
  pagination?: PaginationParams,
  filters?: FilterParams
): URLSearchParams {
  const params = new URLSearchParams();
  
  // Добавяне на параметри за пагинация
  if (pagination) {
    const { page, pageSize, sortBy, sortOrder } = formatPaginationParams(pagination);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
  }
  
  // Добавяне на филтри
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
  }
  
  return params;
}

/**
 * Обработва заявки с обработка на грешки и типизиране на отговорите
 */
export async function fetchApi<T>(
  url: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    // Проверка за 204 No Content
    if (response.status === ApiStatusCode.NO_CONTENT) {
      return { success: true };
    }
    
    // Опит за парсване на JSON отговор
    const data = await response.json();
    
    // Проверка за успешен API отговор
    if (!response.ok) {
      return formatApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'Възникна грешка при обработка на заявката',
        data.error?.details,
        response.status as ApiStatusCode
      ) as unknown as ApiResponse<T>;
    }
    
    // Ако API-то не връща success флаг, го добавяме
    if (data.success === undefined) {
      return {
        success: true,
        data: data as T,
      };
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API request error:', error);
    return formatApiError(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Възникна грешка при изпращане на заявката',
      { originalError: error }
    ) as unknown as ApiResponse<T>;
  }
}

/**
 * API методи за CRUD операции
 */
export const api = {
  async get<T>(url: string, queryParams?: QueryParams, options?: RequestInit): Promise<ApiResponse<T>> {
    const params = queryParams ? `?${buildQueryParams(queryParams, queryParams).toString()}` : '';
    return fetchApi<T>(`${url}${params}`, {
      method: 'GET',
      ...options,
    });
  },
  
  async post<T, U = any>(url: string, data: U, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },
  
  async put<T, U = any>(url: string, data: U, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },
  
  async patch<T, U = any>(url: string, data: U, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  },
  
  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, {
      method: 'DELETE',
      ...options,
    });
  },
}; 