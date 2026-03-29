import { ReactNode } from "react";

// Separate layout for help page that doesn't show settings navigation
export default function HelpLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
