import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';

const BookingRules = () => {
  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Booking Rules"
          description="Set system-wide constraints that apply to all locker bookings."
        />
      </main>
    </AdminLayout>
  );
};

export default BookingRules;
