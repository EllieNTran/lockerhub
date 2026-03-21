import AdminLayout from "../layout/AdminLayout";
import Heading from "@/components/Heading";

const SpecialRequests = () => {
  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Special Requests"
          description="Review extended or permanent locker allocation requests."
        />
      </main>
    </AdminLayout>
  );
};

export default SpecialRequests;
