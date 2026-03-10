import AdminLayout from "../layout";

const AdminHomePage = () => {
  return (
    <AdminLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-dark-blue mb-6">Admin Dashboard</h1>
        <p className="text-background">Welcome to the admin panel</p>
      </div>
    </AdminLayout>
  );
};

export default AdminHomePage;
