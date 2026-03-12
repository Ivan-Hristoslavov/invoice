import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { BackButton } from "@/components/ui/back-button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border border-border mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Страницата не е намерена</h1>
        <p className="text-muted-foreground mb-8">
          Страницата, която търсите, не съществува или е преместена.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Начало
            </Link>
          </Button>
          <BackButton variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </BackButton>
        </div>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        {APP_NAME}
      </p>
    </div>
  );
}
