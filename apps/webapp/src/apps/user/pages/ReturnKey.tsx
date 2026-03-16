import UserLayout from "../layout/UserLayout";
import Heading from "@/components/Heading";

const ReturnKey = () => {

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Heading
            title="Return Key Instructions"
            description="Instructions on how to return your locker key."
          />
        </div>
      </main>
      </div>
    </UserLayout>
  );
};

export default ReturnKey;
