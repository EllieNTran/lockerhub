import UserLayout from "../layout/UserLayout";
import Heading from "@/components/Heading";

const SpecialRequest = () => {

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Heading
            title="Special Request"
            description="Submit a special request for bookings longer than 3 days or permanent allocation."
          />
        </div>
      </main>
      </div>
    </UserLayout>
  );
};

export default SpecialRequest;
