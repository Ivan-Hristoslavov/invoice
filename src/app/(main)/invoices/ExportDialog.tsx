"use client";

import { useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DateField,
  DateRangePicker,
  Description,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  RangeCalendar,
  Select,
  Separator,
} from "@heroui/react";
import {
  exportInvoicesToCsv,
  exportInvoicesToJson,
  exportInvoiceAsPdf,
  exportInvoicesAsMicroinvestXmlRange,
} from "@/lib/invoice-export";
import { useRouter } from "next/navigation";
import { Download, FileCode2, FileSpreadsheet, FileText } from "lucide-react";
import { canExportFormat, type ExportCapability } from "@/lib/subscription-plans";

/** Popover must have explicit width: modal overflow + flex min-width otherwise collapses the grid to a narrow strip. */
const CALENDAR_POPOVER_CLASS =
  "z-[6000] box-border w-[min(100vw-1.5rem,320px)] min-w-[288px] max-w-[min(100vw-1.5rem,340px)] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl";

const ALL_COMPANIES_KEY = "__all_companies__";
const ALL_CLIENTS_KEY = "__all_clients__";
const ALL_STATUS_KEY = "__all_status__";

interface Company {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface ExportDialogProps {
  companies: Company[];
  clients: Client[];
  invoiceId?: string;
  exportCapability?: ExportCapability;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

type ExportFormat = "csv" | "json" | "pdf" | "microinvestXml";

function ExportRangeCalendar({ ariaLabel }: { ariaLabel: string }) {
  return (
    <RangeCalendar
      aria-label={ariaLabel}
      className="w-full min-w-[272px] text-popover-foreground"
    >
      <RangeCalendar.Header className="mb-2 flex w-full min-w-0 items-center justify-between gap-2">
        <RangeCalendar.YearPickerTrigger className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted">
          <RangeCalendar.YearPickerTriggerHeading />
          <RangeCalendar.YearPickerTriggerIndicator />
        </RangeCalendar.YearPickerTrigger>
        <div className="flex shrink-0 items-center gap-1">
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.NavButton slot="next" />
        </div>
      </RangeCalendar.Header>
      <RangeCalendar.Grid className="w-full [&_table]:w-full [&_table]:table-fixed">
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => <RangeCalendar.Cell date={date} />}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
      <RangeCalendar.YearPickerGrid className="w-full min-w-0">
        <RangeCalendar.YearPickerGridBody>
          {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
        </RangeCalendar.YearPickerGridBody>
      </RangeCalendar.YearPickerGrid>
    </RangeCalendar>
  );
}

function parseRangeStrings(
  start: string,
  end: string
): { start: DateValue; end: DateValue } | null {
  if (!start || !end) return null;
  try {
    return { start: parseDate(start), end: parseDate(end) };
  } catch {
    return null;
  }
}

export default function ExportDialog({
  companies,
  clients,
  invoiceId,
  exportCapability = "none",
  isOpen,
  onOpenChange,
  children,
}: ExportDialogProps) {
  const router = useRouter();
  const isControlled = isOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? isOpen : internalOpen;
  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!isControlled) setInternalOpen(next);
    },
    [onOpenChange, isControlled]
  );

  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [companyId, setCompanyId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<"all" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [microRangeStart, setMicroRangeStart] = useState<string>("");
  const [microRangeEnd, setMicroRangeEnd] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const canExportJson = exportCapability === "full";
  const canExportPdf = exportCapability === "full" && Boolean(invoiceId);
  const canExportMicroinvestXml = canExportFormat(exportCapability, "microinvestXml");
  const showCsvJsonBlock = exportFormat === "csv" || exportFormat === "json";
  const showMicroinvestBlock = exportFormat === "microinvestXml";
  const showSharedFilters = showCsvJsonBlock || showMicroinvestBlock;

  const csvJsonPickerValue = useMemo(
    () => (dateRange === "custom" ? parseRangeStrings(startDate, endDate) : null),
    [dateRange, startDate, endDate]
  );

  const microPickerValue = useMemo(
    () => parseRangeStrings(microRangeStart, microRangeEnd),
    [microRangeStart, microRangeEnd]
  );

  useEffect(() => {
    if (exportFormat === "json" && !canExportJson) setExportFormat("csv");
    if (exportFormat === "pdf" && !canExportPdf) setExportFormat("csv");
    if (exportFormat === "microinvestXml" && !canExportMicroinvestXml) setExportFormat("csv");
  }, [canExportJson, canExportPdf, canExportMicroinvestXml, exportFormat]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filters = {
        ...(companyId ? { companyId } : {}),
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
        ...(dateRange === "custom" && startDate ? { startDate } : {}),
        ...(dateRange === "custom" && endDate ? { endDate } : {}),
      };

      if (exportFormat === "csv") {
        await exportInvoicesToCsv(filters);
        toast.success("Фактурите са експортирани успешно като CSV");
      } else if (exportFormat === "json") {
        if (!canExportJson) throw new Error("JSON експортът изисква ПРО или БИЗНЕС план.");
        const result = await exportInvoicesToJson(filters);
        toast.success(`${result.invoices.length} фактури са експортирани като JSON`);
      } else if (exportFormat === "pdf" && invoiceId) {
        if (!canExportPdf) throw new Error("PDF експортът изисква ПРО или БИЗНЕС план.");
        await exportInvoiceAsPdf(invoiceId);
        toast.success("Фактурата е експортирана като PDF");
      } else if (exportFormat === "microinvestXml") {
        if (!canExportMicroinvestXml) {
          throw new Error("Microinvest XML е наличен в плановете Про и Бизнес.");
        }
        if (!microRangeStart || !microRangeEnd) {
          throw new Error("Изберете начална и крайна дата за периода.");
        }
        if (microRangeStart > microRangeEnd) {
          throw new Error("Началната дата не може да е след крайната.");
        }
        await exportInvoicesAsMicroinvestXmlRange({
          startDate: microRangeStart,
          endDate: microRangeEnd,
          ...(companyId ? { companyId } : {}),
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
        });
        toast.success("Microinvest XML за периода е изтеглен");
      }

      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Грешка при експортиране на фактурите"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const radioCardClass =
    "flex w-full max-w-full flex-row items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-3 shadow-xs transition-colors data-[selected=true]:border-primary/55 data-[selected=true]:bg-primary/10";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Експорт
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-visible gap-0 p-0 sm:max-w-[520px]">
        <div className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6">
          <DialogHeader className="p-0">
            <DialogTitle>Експорт на фактури</DialogTitle>
            <Description className="text-sm text-muted-foreground">
              Изберете опции за експорт и изтеглете вашите фактури
            </Description>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 max-h-[min(72vh,620px)] flex-1 flex-col gap-5 overflow-y-auto overflow-x-visible px-6 py-4">
          <div className="flex flex-col gap-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Формат
            </Label>
            <RadioGroup
              name="export-format"
              value={exportFormat}
              onChange={(v) => setExportFormat(v as ExportFormat)}
              className="flex flex-col gap-2"
            >
              <Radio value="csv" className={radioCardClass}>
                <Radio.Control className="mt-0.5 shrink-0">
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content className="min-w-0">
                  <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                    CSV (Excel)
                  </Label>
                </Radio.Content>
              </Radio>
              <Radio value="json" isDisabled={!canExportJson} className={radioCardClass}>
                <Radio.Control className="mt-0.5 shrink-0">
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content className="min-w-0">
                  <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    JSON{!canExportJson && " (ПРО / БИЗНЕС)"}
                  </Label>
                </Radio.Content>
              </Radio>
              <Radio value="pdf" isDisabled={!canExportPdf} className={radioCardClass}>
                <Radio.Control className="mt-0.5 shrink-0">
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content className="min-w-0">
                  <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    PDF
                    {!invoiceId && " (само за единична фактура)"}
                    {invoiceId && exportCapability !== "full" && " (ПРО / БИЗНЕС)"}
                  </Label>
                </Radio.Content>
              </Radio>
              <Radio
                value="microinvestXml"
                isDisabled={!canExportMicroinvestXml}
                className={radioCardClass}
              >
                <Radio.Control className="mt-0.5 shrink-0">
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content className="min-w-0">
                  <Label
                    className={
                      canExportMicroinvestXml
                        ? "flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                        : "flex cursor-not-allowed items-center gap-2 text-sm font-medium text-muted-foreground"
                    }
                  >
                    <FileCode2 className="h-4 w-4 shrink-0 text-primary" />
                    Microinvest XML (период)
                    {!canExportMicroinvestXml && " — ПРО / БИЗНЕС"}
                  </Label>
                </Radio.Content>
              </Radio>
            </RadioGroup>
            {exportCapability === "csv" && (
              <Description className="text-sm text-muted-foreground">
                Вашият план позволява CSV експорт. JSON, PDF и Microinvest XML за период са налични в ПРО и БИЗНЕС.
              </Description>
            )}
          </div>

          {showSharedFilters && (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Филтри
                </Label>

                <Select
                  fullWidth
                  selectedKey={companyId || ALL_COMPANIES_KEY}
                  onSelectionChange={(key) =>
                    setCompanyId(key === ALL_COMPANIES_KEY ? "" : String(key))
                  }
                  placeholder="Всички фирми"
                >
                  <Label className="text-sm font-medium text-foreground">Фирма</Label>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="z-[6000]">
                    <ListBox>
                      <ListBox.Item id={ALL_COMPANIES_KEY} textValue="Всички фирми">
                        Всички фирми
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {companies.map((company) => (
                        <ListBox.Item key={company.id} id={company.id} textValue={company.name}>
                          {company.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  fullWidth
                  selectedKey={clientId || ALL_CLIENTS_KEY}
                  onSelectionChange={(key) =>
                    setClientId(key === ALL_CLIENTS_KEY ? "" : String(key))
                  }
                  placeholder="Всички клиенти"
                >
                  <Label className="text-sm font-medium text-foreground">Клиент</Label>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="z-[6000]">
                    <ListBox>
                      <ListBox.Item id={ALL_CLIENTS_KEY} textValue="Всички клиенти">
                        Всички клиенти
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {clients.map((client) => (
                        <ListBox.Item key={client.id} id={client.id} textValue={client.name}>
                          {client.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  fullWidth
                  selectedKey={status || ALL_STATUS_KEY}
                  onSelectionChange={(key) =>
                    setStatus(key === ALL_STATUS_KEY ? "" : String(key))
                  }
                  placeholder="Всички статуси"
                >
                  <Label className="text-sm font-medium text-foreground">Статус</Label>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="z-[6000]">
                    <ListBox>
                      <ListBox.Item id={ALL_STATUS_KEY} textValue="Всички статуси">
                        Всички статуси
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="DRAFT" textValue="Чернова">
                        Чернова
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="ISSUED" textValue="Издадена">
                        Издадена
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="VOIDED" textValue="Анулирана">
                        Анулирана
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="CANCELLED" textValue="Отменена">
                        Отменена
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {showCsvJsonBlock && (
                <>
                  <Separator className="bg-border" />
                  <div className="flex flex-col gap-3">
                    <Label className="text-sm font-medium text-foreground">Период</Label>
                    <RadioGroup
                      name="export-date-range"
                      value={dateRange}
                      onChange={(v) => setDateRange(v as "all" | "custom")}
                      className="flex flex-col gap-2"
                    >
                      <Radio value="all" className={radioCardClass}>
                        <Radio.Control className="mt-0.5 shrink-0">
                          <Radio.Indicator />
                        </Radio.Control>
                        <Radio.Content>
                          <Label className="cursor-pointer text-sm font-medium text-foreground">
                            Всички фактури
                          </Label>
                        </Radio.Content>
                      </Radio>
                      <Radio value="custom" className={radioCardClass}>
                        <Radio.Control className="mt-0.5 shrink-0">
                          <Radio.Indicator />
                        </Radio.Control>
                        <Radio.Content>
                          <Label className="cursor-pointer text-sm font-medium text-foreground">
                            Ръчен период
                          </Label>
                        </Radio.Content>
                      </Radio>
                    </RadioGroup>

                    {dateRange === "custom" && (
                      <DateRangePicker
                        className="w-full min-w-0 shrink-0 gap-2"
                        value={csvJsonPickerValue}
                        onChange={(next) => {
                          if (!next?.start || !next?.end) {
                            setStartDate("");
                            setEndDate("");
                            return;
                          }
                          setStartDate(next.start.toString());
                          setEndDate(next.end.toString());
                        }}
                        isRequired
                      >
                        <Label className="text-sm font-medium text-foreground">
                          Избор на дати
                        </Label>
                        <DateField.Group
                          fullWidth
                          variant="secondary"
                          className="min-h-11 w-full min-w-[260px] rounded-xl border border-input bg-background shadow-xs"
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
                            <DateRangePicker.Trigger className="rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                              <DateRangePicker.TriggerIndicator />
                            </DateRangePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DateRangePicker.Popover
                          placement="bottom start"
                          offset={8}
                          className={CALENDAR_POPOVER_CLASS}
                        >
                          <ExportRangeCalendar ariaLabel="Период за филтър при експорт" />
                        </DateRangePicker.Popover>
                      </DateRangePicker>
                    )}
                  </div>
                </>
              )}

              {showMicroinvestBlock && (
                <>
                  <Separator className="bg-border" />
                  <div className="flex flex-col gap-3">
                    <Label className="text-sm font-medium text-foreground">
                      Период за експорт (задължително)
                    </Label>
                    <DateRangePicker
                      className="w-full min-w-0 shrink-0 gap-2"
                      value={microPickerValue}
                      onChange={(next) => {
                        if (!next?.start || !next?.end) {
                          setMicroRangeStart("");
                          setMicroRangeEnd("");
                          return;
                        }
                        setMicroRangeStart(next.start.toString());
                        setMicroRangeEnd(next.end.toString());
                      }}
                      isRequired
                    >
                      <Label className="text-sm font-medium text-foreground">Интервал</Label>
                      <DateField.Group
                        fullWidth
                        variant="secondary"
                        className="min-h-11 w-full min-w-[260px] rounded-xl border border-input bg-background shadow-xs"
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
                          <DateRangePicker.Trigger className="rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                            <DateRangePicker.TriggerIndicator />
                          </DateRangePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DateRangePicker.Popover
                        placement="bottom start"
                        offset={8}
                        className={CALENDAR_POPOVER_CLASS}
                      >
                        <ExportRangeCalendar ariaLabel="Период за Microinvest XML" />
                      </DateRangePicker.Popover>
                    </DateRangePicker>
                    <Description className="text-xs text-muted-foreground">
                      Един XML файл с отделен блок за всяка фактура по дата на издаване в избрания интервал (до
                      400 фактури).
                    </Description>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 px-6 pb-6 pt-4">
          <DialogFooter className="p-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Отказ
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={
                isExporting ||
                (exportFormat === "microinvestXml" && (!microRangeStart || !microRangeEnd))
              }
            >
              {isExporting ? "Експортиране..." : "Експорт"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
