// utils/responseGenerator.ts

export interface ApiResponse<T> {
  version: string;
  validationErrors: any;
  code: number;
  status: string;
  message: string;
  data: T | null;
}

// Mapping default messages for common status codes
const defaultMessages: { [code: number]: string } = {
  100: "Continue",
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export class ResponseGenerator {
  static generate<T>(
    code: number,
    data: T | null = null,
    customMessage?: string,
    validationErrors:any=[],
  ): [ApiResponse<T>, { status: number }] {
    const status = code >= 400 ? "error" : "success";
    const message = customMessage || defaultMessages[code] || "Unknown status";
    return [
      {
        version: "1.0.0",
        validationErrors,
        code,
        status,
        message,
        data,
      },
      { status: code },
    ];
  }
}
