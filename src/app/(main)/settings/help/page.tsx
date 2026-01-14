import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, FileText, Settings, Tag, Users, Upload } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Documentation - FacturaPro",
  description: "Get help and documentation for FacturaPro",
};

interface HelpTopic {
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
}

export default function HelpPage() {
  const helpTopics: HelpTopic[] = [
    {
      title: "User Roles & Permissions",
      description: "Learn about user roles and permissions system",
      icon: <Users className="h-6 w-6 text-primary" />,
      url: "/docs/user-roles-permissions.md",
    },
    {
      title: "Invoice Management",
      description: "Creating, editing, and managing invoices",
      icon: <FileText className="h-6 w-6 text-primary" />,
      url: "/docs/invoices.md",
    },
    {
      title: "Import & Export",
      description: "Import and export invoices, clients, and products",
      icon: <Upload className="h-6 w-6 text-primary" />,
      url: "/docs/features/import-export.md",
    },
    {
      title: "Reports & Analytics",
      description: "Understanding financial reports and analytics",
      icon: <BarChart className="h-6 w-6 text-primary" />,
      url: "/docs/reports.md",
    },
    {
      title: "Products & Services",
      description: "Managing your product and service catalog",
      icon: <Tag className="h-6 w-6 text-primary" />,
      url: "/docs/products.md",
    },
    {
      title: "System Settings",
      description: "Configure system settings and preferences",
      icon: <Settings className="h-6 w-6 text-primary" />,
      url: "/docs/settings.md",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & Documentation</h1>
        <p className="text-muted-foreground">
          Find help and learn how to use all the features of FacturaPro
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpTopics.map((topic, index) => (
          <Card key={index} className="transition-all hover:shadow-md">
            <Link href={topic.url} className="block h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                {topic.icon}
                <div>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
      
      <div className="mt-10 bg-muted/40 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Need Additional Help?</h2>
        <p className="text-muted-foreground mb-4">
          Can't find what you're looking for? Contact our support team for personalized assistance.
        </p>
        <div className="flex gap-3">
          <Link href="/settings/support" className="font-medium text-primary hover:underline">
            Contact Support
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="https://invoiceninja.com/faq" target="_blank" className="font-medium text-primary hover:underline">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
} 