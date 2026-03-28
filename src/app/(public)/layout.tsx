import { BackgroundShapes } from "@/components/ui/background-shapes";
import { PublicPageFrame } from "@/components/marketing/PublicPageFrame";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      <BackgroundShapes variant="default" />
      <PublicPageFrame>{children}</PublicPageFrame>
    </div>
  );
} 