"use client";

import { Button } from "@/components/ui/button";
import { Download, Lock, Crown } from "lucide-react";
import ExportDialog from "./ExportDialog";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { LockedButton } from "@/components/ui/pro-feature-lock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface ExportDialogWrapperProps {
  clients: Client[];
  companies: Company[];
  invoiceId?: string;
}

export default function ExportDialogWrapper({
  clients,
  companies,
  invoiceId
}: ExportDialogWrapperProps) {
  const { canUseFeature, isLoadingUsage } = useSubscriptionLimit();
  const canExport = canUseFeature('export');

  // Show loading state
  if (isLoadingUsage) {
    return (
      <Button size="sm" className="mt-2" variant="outline" disabled>
        <Download className="h-4 w-4 mr-2" />
        Експорт
      </Button>
    );
  }

  // If user can't export, show locked button
  if (!canExport) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings/subscription">
              <Button 
                size="sm" 
                className="mt-2 border-dashed border-amber-300 dark:border-amber-700" 
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2 text-amber-500" />
                Експорт
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                  PRO
                </span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm mb-1">Експортът е налична само в PRO и BUSINESS плановете.</p>
            <Link href="/settings/subscription" className="text-xs text-primary hover:underline">
              Надградете сега →
            </Link>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <ExportDialog clients={clients} companies={companies} invoiceId={invoiceId}>
      <Button size="sm" className="mt-2" variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Експорт
      </Button>
    </ExportDialog>
  );
} 