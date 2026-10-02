export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: string[]
  ) {
    super(message);
  }
}

export const Errors = {
  notFound: (message = "Resource not found") => new AppError("NOT_FOUND", message, 404),
  unauthorized: (message = "Unauthorized") => new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "Forbidden") => new AppError("FORBIDDEN", message, 403),
  badRequest: (message = "Bad request") => new AppError("BAD_REQUEST", message, 400),
  conflict: (message = "Conflict") => new AppError("CONFLICT", message, 409),
  verificationFailed: (issues: string[]) =>
    new AppError("VERIFICATION_FAILED", "The problem didn't pass verification", 422, issues),
};
