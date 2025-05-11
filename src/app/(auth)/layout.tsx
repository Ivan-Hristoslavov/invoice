import Image from "next/image";
import Link from "next/link";
import forest from "../../../public/forest.jpg";
import { APP_NAME, APP_DESCRIPTION, APP_COPYRIGHT } from "@/config/constants";

export default function AuthLayout({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - illustration */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/50 z-10" />
        <Image
          src={forest}
          alt="Forest landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-start justify-between z-20 p-12">
          <Link 
            href="/" 
            className="text-2xl font-bold text-white hover:opacity-90 transition-opacity"
          >
            {APP_NAME}
          </Link>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">
              Simplify your invoicing workflow
            </h1>
            <p className="text-white/90">
              {APP_DESCRIPTION}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link 
              href="/" 
              className="text-2xl font-bold hover:opacity-90 transition-opacity"
            >
              {APP_NAME}
            </Link>
          </div>
          
          {children}
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {APP_COPYRIGHT}
          </div>
        </div>
      </div>
    </div>
  );
}

