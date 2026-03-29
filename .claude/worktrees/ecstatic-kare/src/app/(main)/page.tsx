import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const sessionUser = await resolveSessionUser(session.user);
    if (sessionUser) {
      redirect("/dashboard");
    }
  }

  return <HomePageClient />;
}
