import { useState, useEffect, useCallback } from 'react';
import { format, addHours } from 'date-fns';
import { Building2, Settings, CalendarDays, FileText, Lock, KeyRound, ListEnd, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import PaginationControls from '@/components/PaginationControls'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import SearchBar from '@/components/SearchBar';
import CustomDropdown from '@/components/CustomDropdown';
import ColorBadge from '@/components/ColorBadge';
import type { AuditLog, AuditAction, EntityType } from '@/types/audit';
import type { UserRole } from '@/types/auth';
import { useAuditLogs } from '@/services/admin';
import PageTour from '@/components/tutorial/PageTour';
import { ADMIN_AUDIT_LOGS_STEPS } from '@/components/tutorial/steps';

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'handover', label: 'Handover' },
  { value: 'return', label: 'Return' },
];

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'booking', label: 'Booking' },
  { value: 'locker', label: 'Locker' },
  { value: 'key', label: 'Key' },
  { value: 'request', label: 'Request' },
  { value: 'floor', label: 'Floor' },
  { value: 'booking_rule', label: 'Booking Rule' },
  { value: 'waiting_list', label: 'Waiting List' },
];

const ROLE_OPTIONS: { value: UserRole | 'system'; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'system', label: 'System' },
];

const ENTITY_TYPE_CONFIG = {
  booking: { color: 'purple' as const, icon: CalendarDays },
  locker: { color: 'blue' as const, icon: Lock },
  key: { color: 'brightBlue' as const, icon: KeyRound },
  request: { color: 'pink' as const, icon: FileText },
  floor: { color: 'red' as const, icon: Building2 },
  booking_rule: { color: 'grey' as const, icon: Settings },
  waiting_list: { color: 'babyBlue' as const, icon: ListEnd },
};

const isObject = (val: unknown): val is Record<string, unknown> => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return String(val);
};

const shouldSkipKey = (key: string): boolean => {
  return key.endsWith('_at') || key.endsWith('_by') || key.endsWith('_id');
};

const formatTimestamp = (date: Date): { date: string; time: string } => {
  const adjustedDate = addHours(date, 1);
  return {
    date: format(adjustedDate, 'd MMM yyyy'),
    time: format(adjustedDate, 'HH:mm:ss'),
  };
};

const toDropdownItems = <T extends { value: string; label: string }>(options: T[]) =>
  options.map(opt => ({ id: opt.value, label: opt.label }));

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const { data: paginatedAuditLogs, isLoading } = useAuditLogs({
    page: currentPage,
    limit: 12,
    action: actionFilter !== 'all' ? (actionFilter as AuditAction) : undefined,
    entity_type: entityFilter !== 'all' ? (entityFilter as EntityType) : undefined,
    user_role: roleFilter !== 'all' ? (roleFilter as UserRole | 'system') : undefined,
    search: searchQuery || undefined,
  })
  const auditLogs = paginatedAuditLogs?.logs || []

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [actionFilter, entityFilter, roleFilter, searchQuery]);

  const toggleRowExpanded = useCallback((auditLogId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(auditLogId)) {
        newSet.delete(auditLogId);
      } else {
        newSet.add(auditLogId);
      }
      return newSet;
    });
  }, []);

  const formatEntityType = (entityType: string) => {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderEntityBadge = (entityType: string) => {
    const config = ENTITY_TYPE_CONFIG[entityType as keyof typeof ENTITY_TYPE_CONFIG];
    const Icon = config?.icon;

    return (
      <ColorBadge
        color={config?.color || 'grey'}
        status={formatEntityType(entityType)}
        icon={Icon ? <Icon className="w-3 h-3" /> : undefined}
      />
    );
  };

  const formatDetails = (log: AuditLog) => {
    const isExpanded = expandedRows.has(log.audit_log_id);
    const emptyState = <span className="text-xs text-grey">-</span>;

    if (!!log.old_value !== !!log.new_value || !log.old_value || !log.new_value) {
      return emptyState;
    }

    try {
      const oldData: unknown = typeof log.old_value === 'string' ? JSON.parse(log.old_value) : log.old_value;
      const newData: unknown = typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value;

      if (!isObject(oldData) || !isObject(newData)) {
        return emptyState;
      }

      const changes: string[] = [];

      const compareNestedObjects = (parentKey: string, oldVal: Record<string, unknown>, newVal: Record<string, unknown>) => {
        const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

        allKeys.forEach(key => {
          if (shouldSkipKey(key)) return;

          if (oldVal[key] !== newVal[key]) {
            const formattedKey = `${parentKey} ${key}`.replace(/_/g, ' ');
            changes.push(`${formattedKey}: ${formatValue(oldVal[key])} → ${formatValue(newVal[key])}`);
          }
        });
      };

      Object.keys(newData).forEach(key => {
        if (shouldSkipKey(key)) return;

        const oldVal = oldData[key];
        const newVal = newData[key];

        if (isObject(oldVal) && isObject(newVal)) {
          compareNestedObjects(key, oldVal, newVal);
        } else if (oldVal !== newVal) {
          const formattedKey = key.replace(/_/g, ' ');
          changes.push(`${formattedKey}: ${formatValue(oldVal)} → ${formatValue(newVal)}`);
        }
      });

      if (changes.length === 0) {
        return emptyState;
      }

      const displayedChanges = isExpanded ? changes : changes.slice(0, 2);
      const hasMore = changes.length > 2;

      return (
        <div className="text-xs text-grey">
          <div className="space-y-1">
            {displayedChanges.map((change, index) => (
              <div key={index} className="truncate max-w-xs" title={change}>
                {change}
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpanded(log.audit_log_id);
              }}
              className="mt-2 flex items-center gap-1 text-bright-blue hover:text-blue transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Show {changes.length - 2} more</span>
                </>
              )}
            </button>
          )}
        </div>
      );
    } catch {
      return <span className="text-xs text-grey">Modified</span>;
    }
  };

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Audit Logs"
          description="Complete history of all actions across the system."
        />
        <div className='flex items-center justify-between gap-4'>
          <div data-tour="admin-audit-logs-search" className='flex-1'>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search employee name or entity reference..."
              className='flex-1'
            />
          </div>
          <div className='flex items-center gap-3' data-tour="admin-audit-logs-filters">
            <CustomDropdown
              value={actionFilter}
              onChange={setActionFilter}
              items={toDropdownItems(ACTION_OPTIONS)}
              placeholder='Select action'
              allOptionLabel='All Actions'
            />
            <CustomDropdown
              value={entityFilter}
              onChange={setEntityFilter}
              items={toDropdownItems(ENTITY_OPTIONS)}
              placeholder='Select entity'
              allOptionLabel='All Entities'
            />
            <CustomDropdown
              value={roleFilter}
              onChange={setRoleFilter}
              items={toDropdownItems(ROLE_OPTIONS)}
              placeholder='Select role'
              allOptionLabel='All Roles'
            />
          </div>
        </div>
        <div className="rounded-xl border border-grey-outline bg-white shadow-sm" data-tour="admin-audit-logs-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-8">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="pr-8">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-grey py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log, index) => {
                  const timestamp = formatTimestamp(new Date(log.audit_date));
                  return (
                    <TableRow key={log.audit_log_id} data-tour={index === 0 ? 'admin-audit-log-row' : undefined}>
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-medium text-dark-blue">{timestamp.date}</span>
                          <span className="text-sm text-grey">{timestamp.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user_id !== null ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-dark-blue">{log.user_name}</span>
                            <span className="text-sm text-grey capitalize">{log.user_role || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-dark-blue">System</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-dark-blue">{log.action}</TableCell>
                      <TableCell>
                        {renderEntityBadge(log.entity_type)}
                      </TableCell>
                      <TableCell className="capitalize">{log.reference || 'N/A'}</TableCell>
                      <TableCell className="pr-8">{formatDetails(log)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-grey py-8">
                    {searchQuery ? 'No audit logs found matching your search' : 'No audit logs found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={paginatedAuditLogs?.page || 1}
          totalPages={paginatedAuditLogs?.pages || 1}
          onPageChange={setCurrentPage}
          className="mt-4 mb-4"
        />
      </main>
      <PageTour steps={ADMIN_AUDIT_LOGS_STEPS} pageName="Admin Audit Logs" />
    </AdminLayout>
  );
};

export default AuditLogs;
