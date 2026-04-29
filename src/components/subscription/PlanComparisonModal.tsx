"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

type PlanComparisonModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlanComparisonModal({ open, onOpenChange }: PlanComparisonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Сравнение на планове</DialogTitle>
          <DialogDescription>
            Преглед на основните лимити. Пълен списък с функции е в картите по-долу на страницата.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 font-medium">План</th>
                <th className="p-2 font-medium">Месечно (от)</th>
                <th className="p-2 font-medium">Годишно (от)</th>
              </tr>
            </thead>
            <tbody>
              {(
                ["FREE", "STARTER", "PRO", "BUSINESS"] as const
              ).map((key) => {
                const p = SUBSCRIPTION_PLANS[key];
                return (
                  <tr key={key} className="border-b border-border/50">
                    <td className="p-2 font-medium">{p.displayName}</td>
                    <td className="p-2">
                      {p.monthlyPrice === 0 ? "0" : `${p.monthlyPrice} €`}
                    </td>
                    <td className="p-2">
                      {p.yearlyPrice === 0 ? "0" : `${p.yearlyPrice} €/год.`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
