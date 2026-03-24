/**
 * Shared types for the backend.
 * Extend these as your data server API evolves.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
