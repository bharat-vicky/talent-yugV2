export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors: unknown | null;
}

export function successResponse<T>(data: T, message: string = "Success"): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    errors: null,
  };
}

export function errorResponse(message: string, errors: unknown = null): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    errors,
  };
}
