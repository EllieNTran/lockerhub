import { Mail, KeyRound, BrushCleaning, MapPin } from "lucide-react";
import UserLayout from "../layout/UserLayout";
import Heading from "@/components/Heading";

const steps = [
  {
    icon: Mail,
    title: "1. Check Your Reminder Email",
    description:
      "You should have received a reminder email on the day your booking ends. This includes your locker details and key number—please refer to it for reference.",
  },
  {
    icon: BrushCleaning,
    title: "2. Empty Your Locker",
    description:
      "Remove all personal belongings from your locker before your booking ends. Ensure the locker is left clean and empty.",
  },
  {
    icon: KeyRound,
    title: "3. Locate Your Key",
    description:
      "Make sure you have your assigned locker key ready for return. Double-check the key number matches the details in the email.",
  },
  {
    icon: MapPin,
    title: "4. Visit the Key Return Point",
    description:
      "Head to the drop-off box near the lifts on the 5th Floor. Key returns are accepted Monday-Friday, 8:00 AM - 6:00 PM.",
  },
];

const ReturnKey = () => {

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8 mx-auto">
        <div className="mb-8">
          <Heading
            title="Return Key Instructions"
            description="Follow these steps to return your locker key and complete your booking."
          />
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex gap-4 rounded-xl border border-grey-outline bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-foreground">
                <step.icon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-grey">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-secondary-outline bg-secondary-foreground/70 p-5">
          <h3 className="text-sm font-semibold text-secondary">Important Notes</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-dark-blue">
            <li>• Late key returns may result in restricted future bookings.</li>
            <li>• Lost keys must be reported immediately to Facilities Management.</li>
            <li>• A replacement fee may apply for lost or damaged keys.</li>
          </ul>
        </div>
      </main>
      </div>
    </UserLayout>
  );
};

export default ReturnKey;
