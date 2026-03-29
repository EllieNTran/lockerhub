import { apiClient } from '@/services/apiClient';
import type { AuditLog, AuditLogFilters } from '@/types/audit';

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface GetAuditLogsParams extends AuditLogFilters {
  page?: number;
  limit?: number;
}

/**
 * Get paginated audit logs with optional filters
 */
export async function getAuditLogs(params?: GetAuditLogsParams): Promise<PaginatedAuditLogs> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.action) searchParams.append('action', params.action);
    if (params.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params.user_role) searchParams.append('user_role', params.user_role);
    if (params.entity_id) searchParams.append('entity_id', params.entity_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.search) searchParams.append('search', params.search);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';

  const response = await apiClient.get<PaginatedAuditLogs>(url);
  return response;
}
