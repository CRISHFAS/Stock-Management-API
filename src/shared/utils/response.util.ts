export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export class ResponseUtil {
  static success<T>(
    data?: T,
    message: string = 'Operation successful',
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string = 'Operation failed'): ApiResponse {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
