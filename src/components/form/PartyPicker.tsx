"use client";

import { CompanyBookLookupPanel } from "@/components/parties/CompanyBookLookupPanel";
import type { Control, FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PartyPickerProps<T extends FieldValues> = {
  control: Control<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  bulstatField: Path<T>;
  currentPlan: string | null;
  canUseCompanyBook: boolean;
  title?: string;
};

/**
 * Reusable EIK / registry block for company or client forms.
 */
export function PartyPicker<T extends FieldValues>({
  control,
  getValues,
  setValue,
  bulstatField,
  currentPlan,
  canUseCompanyBook,
  title = "Търговски регистър (ЕИК)",
}: PartyPickerProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CompanyBookLookupPanel
          control={control}
          getValues={getValues}
          setValue={setValue}
          bulstatField={bulstatField}
          currentPlan={currentPlan}
          canUseCompanyBook={canUseCompanyBook}
        />
      </CardContent>
    </Card>
  );
}
