"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/config/constants";
import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div>
      {/* Header for unauthenticated users */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
            <div className="font-bold text-xl">
              <Link href="/">{APP_NAME}</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simplify your invoicing with {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Professional invoicing solution for businesses of all sizes.
            Create, manage and track your invoices with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Invoices</h3>
              <p className="text-muted-foreground">
                Create beautiful, customized invoices that reflect your brand and impress your clients.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Time Saving</h3>
              <p className="text-muted-foreground">
                Save time with automated invoice generation, recurring invoices, and payment reminders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Financial Insights</h3>
              <p className="text-muted-foreground">
                Gain valuable insights into your business finances with detailed reporting and analytics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Choose the plan that's right for your business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Basic</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Perfect for freelancers and small businesses just getting started.
                </p>
                <ul className="space-y-3 mb-6">
                  {["Access to basic invoicing features", "Up to 10 clients", "Up to 50 invoices per month"].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="BASIC" className="w-full" variant="outline">
                  Subscribe
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Ideal for growing businesses with regular invoicing needs.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "All Basic features",
                    "Up to 50 clients",
                    "Unlimited invoices",
                    "Custom branding"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="PRO" className="w-full">
                  Subscribe
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* VIP Plan */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">VIP</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$30</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  For larger businesses with advanced invoicing requirements.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "All Pro features",
                    "Unlimited clients",
                    "Priority support",
                    "Advanced analytics"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="VIP" className="w-full" variant="outline">
                  Subscribe
                </CheckoutButton>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-muted p-12 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your invoicing?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of businesses that trust {APP_NAME} for their invoicing needs.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started for Free
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 