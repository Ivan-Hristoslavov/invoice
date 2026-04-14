"use client";

import {
  DateField,
  DateRangePicker,
  Label,
  RangeCalendar,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

interface FormDateRangePickerFieldProps {
  startValue: string;
  endValue: string;
  onRangeChange: (start: string, end: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  id?: string;
}

export function FormDateRangePickerField({
  startValue,
  endValue,
  onRangeChange,
  label,
  isRequired,
  isDisabled,
  className,
  id,
}: FormDateRangePickerFieldProps) {
  const rangeValue =
    startValue && endValue
      ? { start: parseDate(startValue), end: parseDate(endValue) }
      : null;

  return (
    <DateRangePicker
      className={cn("w-full gap-2", className)}
      value={rangeValue}
      onChange={(next) => {
        if (!next?.start || !next?.end) {
          onRangeChange("", "");
          return;
        }
        onRangeChange(next.start.toString(), next.end.toString());
      }}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      {label ? (
        <Label className="text-sm font-medium leading-none text-foreground/90">
          {label}
        </Label>
      ) : null}

      <DateField.Group
        fullWidth
        variant="secondary"
        className="min-h-11 rounded-xl border border-input bg-background shadow-xs"
      >
        <DateField.InputContainer>
          <DateField.Input slot="start" className="px-2 text-sm font-medium">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateRangePicker.RangeSeparator className="text-muted-foreground" />
          <DateField.Input slot="end" className="px-2 text-sm font-medium">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
        </DateField.InputContainer>
        <DateField.Suffix className="pr-1.5">
          <DateRangePicker.Trigger
            id={id}
            className="rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

      <DateRangePicker.Popover className="z-[6000] rounded-2xl border border-border bg-background p-2 shadow-xl">
        <RangeCalendar aria-label={label || "Период"} className="w-[280px]">
          <RangeCalendar.Header className="mb-2 flex items-center justify-between gap-2">
            <RangeCalendar.YearPickerTrigger className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted">
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <div className="flex items-center gap-1">
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </div>
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
          <RangeCalendar.YearPickerGrid>
            <RangeCalendar.YearPickerGridBody>
              {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
            </RangeCalendar.YearPickerGridBody>
          </RangeCalendar.YearPickerGrid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}
