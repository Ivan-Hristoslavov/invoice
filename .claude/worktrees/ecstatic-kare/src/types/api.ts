/**
 * Стандартни API отговори и типове
 */

// Базов тип за всички API отговори
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

// Тип за грешки в API
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Метаданни за пагинация и други информации
export interface ApiMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  timestamp?: string;
}

// Статус кодове на API
export enum ApiStatusCode {
  SUCCESS = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Формат на отговор при създаване
export interface CreateResponse<T> extends ApiResponse<T> {
  data: T;
}

// Формат на отговор при четене
export interface ReadResponse<T> extends ApiResponse<T> {
  data: T;
}

// Формат на отговор при обновяване
export interface UpdateResponse<T> extends ApiResponse<T> {
  data: T;
}

// Формат на отговор при изтриване
export interface DeleteResponse extends ApiResponse<null> {
  success: true;
}

// Формат на отговор при грешка
export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  error: ApiError;
}

// Формат на отговор при пагинация
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  meta: Required<Pick<ApiMeta, 'page' | 'pageSize' | 'totalPages' | 'totalItems'>>;
}

// Параметри за пагинация
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Параметри за филтриране
export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

// Комбинирани параметри за заявки
export interface QueryParams extends PaginationParams, FilterParams {} 