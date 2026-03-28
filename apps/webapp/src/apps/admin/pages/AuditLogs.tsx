import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';

const AuditLogs = () => {
  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Audit Logs"
          description="Complete history of all actions across the system."
        />
      </main>
    </AdminLayout>
  );
};

export default AuditLogs;
