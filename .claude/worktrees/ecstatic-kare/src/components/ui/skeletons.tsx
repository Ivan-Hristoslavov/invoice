"use client";

import { Skeleton as HeroUISkeleton } from "@heroui/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Base skeleton element - uses HeroUI shimmer
function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <HeroUISkeleton
      className={`rounded ${className}`}
    />
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-72" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonPulse className="h-3 w-16" />
                  <SkeletonPulse className="h-7 w-12" />
                </div>
                <SkeletonPulse className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Invoices */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-32" />
              <SkeletonPulse className="h-3 w-24" />
            </div>
            <SkeletonPulse className="h-9 w-28 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <SkeletonPulse className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <SkeletonPulse className="h-4 w-24" />
                    <SkeletonPulse className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <SkeletonPulse className="h-4 w-16" />
                  <SkeletonPulse className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Invoices list skeleton
export function InvoicesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <SkeletonPulse className="h-8 w-32" />
        <SkeletonPulse className="h-4 w-64" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonPulse className="h-3 w-16" />
                  <SkeletonPulse className="h-7 w-12" />
                </div>
                <SkeletonPulse className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SkeletonPulse className="h-11 flex-1 rounded-md" />
            <SkeletonPulse className="h-11 w-full sm:w-44 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-36" />
              <SkeletonPulse className="h-3 w-24" />
            </div>
            <SkeletonPulse className="h-10 w-32 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="border-b bg-muted/50 px-6 py-4 flex gap-4">
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-4 w-16 hidden md:block" />
            <SkeletonPulse className="h-4 w-16 ml-auto" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
          {/* Table rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 border-b last:border-0">
              <div className="flex items-center gap-3 flex-1">
                <SkeletonPulse className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-3 w-16 md:hidden" />
                </div>
              </div>
              <SkeletonPulse className="h-4 w-28 hidden sm:block" />
              <SkeletonPulse className="h-4 w-20 hidden md:block" />
              <SkeletonPulse className="h-4 w-16" />
              <SkeletonPulse className="h-6 w-20 rounded-full" />
              <SkeletonPulse className="h-8 w-8 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Clients list skeleton
export function ClientsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonPulse className="h-8 w-28" />
          <SkeletonPulse className="h-4 w-48" />
        </div>
        <SkeletonPulse className="h-10 w-32 rounded-md" />
      </div>

      {/* Search */}
      <SkeletonPulse className="h-11 w-full rounded-md" />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <SkeletonPulse className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-3">
                  <SkeletonPulse className="h-5 w-32" />
                  <SkeletonPulse className="h-4 w-40" />
                  <SkeletonPulse className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Products list skeleton
export function ProductsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonPulse className="h-8 w-28" />
          <SkeletonPulse className="h-4 w-48" />
        </div>
        <SkeletonPulse className="h-10 w-32 rounded-md" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <SkeletonPulse className="h-5 w-32" />
                  <SkeletonPulse className="h-6 w-16 rounded" />
                </div>
                <SkeletonPulse className="h-4 w-full" />
                <div className="flex justify-between items-center pt-2">
                  <SkeletonPulse className="h-6 w-20" />
                  <SkeletonPulse className="h-8 w-8 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Invoice detail skeleton
export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-9 w-24 rounded-md" />
        <div className="flex-1" />
        <SkeletonPulse className="h-9 w-28 rounded-md" />
        <SkeletonPulse className="h-9 w-28 rounded-md" />
      </div>

      {/* Invoice header card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <SkeletonPulse className="h-7 w-48" />
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-6 w-24 rounded-full" />
            </div>
            <div className="text-right space-y-2">
              <SkeletonPulse className="h-8 w-32 ml-auto" />
              <SkeletonPulse className="h-4 w-24 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <SkeletonPulse className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between py-3 border-b last:border-0">
                    <SkeletonPulse className="h-4 w-32" />
                    <SkeletonPulse className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <SkeletonPulse className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Settings skeleton
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-32" />
        <SkeletonPulse className="h-4 w-64" />
      </div>

      {/* Form card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <SkeletonPulse className="h-6 w-40" />
          <SkeletonPulse className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonPulse className="h-4 w-24" />
              <SkeletonPulse className="h-10 w-full rounded-md" />
            </div>
          ))}
          <SkeletonPulse className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

// Generic page skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-72" />
      </div>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonPulse key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
