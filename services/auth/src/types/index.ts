export * from './auth'
export * from './password-reset'
export * from './token'
export * from './user'
export * from './notifications'

// Common types
export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
  command: string;
  fields: unknown[];
}
