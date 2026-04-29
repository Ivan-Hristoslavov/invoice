import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

/**
 * Constrains content width and horizontal padding for app pages.
 */
export function PageContainer({ children, className, as: Comp = "div" }: PageContainerProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full max-w-screen-2xl px-3 pb-4 pt-0 sm:px-4 sm:pb-6 lg:px-5",
        className
      )}
    >
      {children}
    </Comp>
  );
}
