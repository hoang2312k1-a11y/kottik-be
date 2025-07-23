export interface ApiResponse<T = unknown> {
  code: number;
  success: boolean;
  data?: T;
  message: string;
  errors?: { [key: string]: string[] };
}

export function success<T>(
  data: T,
  message = "Thành công",
  code = 200,
): ApiResponse<T> {
  return {
    code,
    success: true,
    data,
    message,
  };
}

export function error(
  message = "Đã có lỗi xảy ra",
  code = 400,
  errors?: { [key: string]: string[] },
): ApiResponse<null> {
  return {
    code,
    success: false,
    data: null,
    message,
    errors,
  };
}
