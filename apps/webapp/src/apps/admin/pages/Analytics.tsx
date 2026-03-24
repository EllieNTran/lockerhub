import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';

const LockerAnalytics = () => {
  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Locker Analytics"
          description="Detailed locker usage insights by date, department and floor."
        />
      </main>
    </AdminLayout>
  );
};

export default LockerAnalytics;
