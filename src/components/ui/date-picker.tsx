"use client";

import { Calendar, DateField, DatePicker, Label } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

interface FormDatePickerProps {
  value?: string;
  onChange: (val: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  id?: string;
}

export function FormDatePicker({
  value,
  onChange,
  label,
  isRequired,
  isDisabled,
  className,
  id,
}: FormDatePickerProps) {
  const parsedValue = value ? parseDate(value) : null;

  return (
    <DatePicker
      className={cn("w-full gap-2", className)}
      value={parsedValue}
      onChange={(nextValue) => onChange(nextValue?.toString() ?? "")}
      isDisabled={isDisabled}
      isRequired={isRequired}
      name={id}
    >
      {label && (
        <Label className="text-sm font-medium leading-none text-foreground/90">
          {label}
        </Label>
      )}

      <DateField.Group
        fullWidth
        variant="secondary"
        className="min-h-11 rounded-xl border border-input bg-background shadow-xs"
      >
        <DateField.Input className="px-3 text-sm font-medium">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix className="pr-1.5">
          <DatePicker.Trigger
            id={id}
            className="rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

      <DatePicker.Popover className="rounded-2xl border border-border bg-background p-2 shadow-xl">
        <Calendar aria-label={label || "Изберете дата"} className="w-[280px]">
          <Calendar.Header className="mb-2 flex items-center justify-between gap-2">
            <Calendar.YearPickerTrigger className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted">
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <div className="flex items-center gap-1">
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </div>
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
