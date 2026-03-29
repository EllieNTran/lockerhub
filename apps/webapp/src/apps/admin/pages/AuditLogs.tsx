import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, Settings, CalendarDays, FileText, Lock, KeyRound, ListEnd } from 'lucide-react';
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

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const { data: paginatedAuditLogs, isLoading } = useAuditLogs({
    page: currentPage,
    limit: 12,
    action: actionFilter !== 'all' ? actionFilter as AuditAction : undefined,
    entity_type: entityFilter !== 'all' ? entityFilter as EntityType : undefined,
    user_role: roleFilter !== 'all' ? roleFilter as UserRole | 'system' : undefined,
    search: searchQuery || undefined,
  })
  const auditLogs = paginatedAuditLogs?.logs || []

  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, entityFilter, roleFilter, searchQuery]);

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
    if (!!log.old_value !== !!log.new_value) {
      return <span className="text-xs text-grey">-</span>;
    }

    if (log.old_value && log.new_value) {
      try {
        const oldData = typeof log.old_value === 'string' ? JSON.parse(log.old_value) : log.old_value;
        const newData = typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value;
        const changes: string[] = [];

        Object.keys(newData).forEach(key => {
          if (oldData[key] !== newData[key] && !key.includes('_at') && !key.includes('_by')) {
            changes.push(`${key}: ${oldData[key]} → ${newData[key]}`);
          }
        });

        if (changes.length > 0) {
          return (
            <div className="text-xs text-grey max-w-xs line-clamp-2" title={changes.join(', ')}>
              {changes.slice(0, 2).map((change, index) => (
                <div key={index}>{change}</div>
              ))}
            </div>
          );
        }
      } catch {
        return <span className="text-xs text-grey">Modified</span>;
      }
    }

    return <span className="text-xs text-grey">-</span>;
  };

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Audit Logs"
          description="Complete history of all actions across the system."
        />
        <div className='flex items-center justify-between gap-4'>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search employee name or entity reference..."
            className='flex-1'
          />
          <div className='flex items-center gap-3'>
            <CustomDropdown
              value={actionFilter}
              onChange={setActionFilter}
              items={ACTION_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))}
              placeholder='Select action'
              allOptionLabel='All Actions'
            />
            <CustomDropdown
              value={entityFilter}
              onChange={setEntityFilter}
              items={ENTITY_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))}
              placeholder='Select entity'
              allOptionLabel='All Entities'
            />
            <CustomDropdown
              value={roleFilter}
              onChange={setRoleFilter}
              items={ROLE_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))}
              placeholder='Select role'
              allOptionLabel='All Roles'
            />
          </div>
        </div>
        <div className="rounded-xl border border-grey-outline bg-white shadow-sm">
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
                auditLogs.map((log) => (
                  <TableRow key={log.audit_log_id}>
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-medium text-dark-blue">{format(new Date(log.audit_date), 'd MMM yyyy')}</span>
                        <span className="text-sm text-grey">{format(new Date(log.audit_date), 'HH:mm:ss')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user_name !== null ? (
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
                ))
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
    </AdminLayout>
  );
};

export default AuditLogs;
