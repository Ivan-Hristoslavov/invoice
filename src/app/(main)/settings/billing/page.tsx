import { redirect } from "next/navigation";

/** Съдържанието за план и плащания е в „Абонамент“. */
export default function BillingSettingsPage() {
  redirect("/settings/subscription");
}
