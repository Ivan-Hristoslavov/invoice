import { BackgroundShapes } from "@/components/ui/background-shapes";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      <BackgroundShapes variant="default" />
      {children}
    </div>
  );
} 