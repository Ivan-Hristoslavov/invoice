"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Button as HeroButton,
  Chip,
  Description,
  Label as HeroLabel,
  Popover,
} from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ContentLoader } from "@/components/ui/loading-spinner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDatePicker } from "@/components/ui/date-picker";
import { SearchField } from "@/components/ui/search-field";
import { NumberField } from "@/components/ui/number-field";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { toast } from "@/lib/toast";
import { DEFAULT_VAT_RATE } from "@/config/constants";
import { cn } from "@/lib/utils";
import { VAT_PROTOCOL_117_SCENARIOS } from "@/lib/vat-protocol-117-scenarios";
import { useAsyncLock } from "@/hooks/use-async-lock";

const FIELD_INVALID =
  "border-destructive ring-2 ring-destructive/25 data-[focus-visible]:ring-destructive/40";

export function VatProtocol117Form() {
  const router = useRouter();
  const submitLock = useAsyncLock();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    companyId: "",
    clientId: "",
    issueDate: today,
    taxEventDate: today,
    scenario: "INTRA_COMMUNITY_GOODS" as string,
    supplierInvoiceNumber: "",
    supplierInvoiceDate: "",
    placeOfIssue: "София",
    legalBasisNote: "",
    currency: "EUR",
    notes: "",
  });

  const [items, setItems] = useState<
    Array<{
      id: number;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >([
    {
      id: 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: DEFAULT_VAT_RATE,
    },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        const [clientsRes, companiesRes, productsRes] = await Promise.all([
          fetch("/api/clients").catch(() => ({ ok: false, json: async () => ({ clients: [] }) })),
          fetch("/api/companies").catch(() => ({ ok: false, json: async () => ({ companies: [] }) })),
          fetch("/api/products").catch(() => ({ ok: false, json: async () => ({ products: [] }) })),
        ]);

        const clientsData = await clientsRes.json();
        const companiesData = await companiesRes.json();
        const productsData = await productsRes.json();

        const clientsArray = Array.isArray(clientsData) ? clientsData : clientsData.clients || [];
        const companiesArray = Array.isArray(companiesData)
          ? companiesData
          : companiesData.companies || [];
        const productsArray = Array.isArray(productsData) ? productsData : productsData.products || [];

        setClients(clientsArray.filter((c: any) => c?.id && c?.name));
        setCompanies(companiesArray.filter((c: any) => c?.id && c?.name));
        setProducts(productsArray.filter((p: any) => p?.id && p?.name));
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Грешка при зареждане на данни");
        toast.error("Грешка при зареждане на данни");
      } finally {
        setIsLoadingData(false);
      }
    }

    void fetchData();
  }, []);

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(productSearchQuery.trim().toLowerCase())
  );

  function addItemFromProduct(product: any) {
    const price = Number(product.price) || 0;
    const tax = Number(product.taxRate ?? DEFAULT_VAT_RATE) || DEFAULT_VAT_RATE;
    setItems((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((i) => i.id)) + 1,
        description: product.name || "",
        quantity: 1,
        unitPrice: price,
        taxRate: tax,
      },
    ]);
    setShowProductSearch(false);
    setProductSearchQuery("");
    toast.success("Добавен артикул от каталога");
  }

  const totals = items.reduce(
    (acc, item) => {
      const sub = item.quantity * item.unitPrice;
      const tax = sub * (item.taxRate / 100);
      return {
        subtotal: acc.subtotal + sub,
        taxAmount: acc.taxAmount + tax,
        total: acc.total + sub + tax,
      };
    },
    { subtotal: 0, taxAmount: 0, total: 0 }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!formData.companyId || !formData.clientId) {
      toast.error("Моля, изберете компания и доставчик (клиент)");
      return;
    }
    if (!formData.issueDate || !formData.taxEventDate) {
      toast.error("Попълнете датите");
      return;
    }
    if (
      items.some(
        (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice <= 0
      )
    ) {
      toast.error("Попълнете валидно всички редове");
      return;
    }

    await submitLock.run(async () => {
      try {
        const response = await fetch("/api/vat-protocols-117", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: formData.companyId,
            clientId: formData.clientId,
            issueDate: formData.issueDate,
            taxEventDate: formData.taxEventDate,
            scenario: formData.scenario,
            supplierInvoiceNumber: formData.supplierInvoiceNumber.trim() || null,
            supplierInvoiceDate: formData.supplierInvoiceDate || null,
            placeOfIssue: formData.placeOfIssue.trim() || null,
            legalBasisNote: formData.legalBasisNote.trim() || null,
            currency: formData.currency,
            notes: formData.notes.trim() || undefined,
            items: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            })),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          const msg = data.details
            ? `${data.error || "Грешка"}: ${JSON.stringify(data.details)}`
            : data.error || "Грешка при създаване";
          throw new Error(msg);
        }

        toast.success("Протоколът по чл. 117 е създаден", {
          description: `Номер: ${data.vatProtocol117.protocolNumber}`,
        });
        router.push(`/vat-protocols-117/${data.vatProtocol117.id}`);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Грешка при създаване");
      }
    });
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6 text-center">
        <h1 className="text-2xl font-bold">Грешка</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          Опитай отново
        </Button>
      </div>
    );
  }

  const companyInvalid = submitAttempted && !formData.companyId;
  const clientInvalid = submitAttempted && !formData.clientId;

  return (
    <div className="app-page-shell mx-auto max-w-6xl">
      <div className="page-header sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <LinkButton
              href="/vat-protocols-117"
              variant="ghost"
              size="sm"
              linkClassName="inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </LinkButton>
            <Popover>
              <Popover.Trigger className="shrink-0 outline-none">
                <HeroButton
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  aria-label="Информация: какво е протокол по чл. 117 ЗДДС"
                >
                  <Info className="h-5 w-5" />
                </HeroButton>
              </Popover.Trigger>
              <Popover.Content
                placement="bottom end"
                offset={10}
                className="z-200 w-[min(100vw-2rem,22rem)] border border-border bg-popover p-0 text-popover-foreground shadow-xl"
              >
                <Popover.Dialog className="p-4">
                  <Popover.Heading className="text-base font-semibold leading-snug text-foreground">
                    За какво служи този протокол?
                  </Popover.Heading>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    <p>
                      При доставки с <strong>изискуем от получателя ДДС</strong> (напр.
                      вътреобщностно придобиване или услуги от ЕС) регистрираното лице —
                      получател издава протокол по чл. 117, за да отрази{" "}
                      <strong>самоначислен данък</strong>.
                    </p>
                    <p>
                      Тук <strong>вашата фирма</strong> е издател на документа, а полето
                      „Доставчик“ е контрагентът по сделката (клиент в системата, често с
                      чуждестранен ИН по ДДС).
                    </p>
                    <p className="text-muted-foreground">
                      Получавате PDF за архив и осчетоводяване. Това не е правен съвет —
                      при съмнение потърсете счетоводител.
                    </p>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
          <h1 className="page-title mt-4">Нов протокол по чл. 117 ЗДДС</h1>
          <p className="card-description mt-1 max-w-3xl">
            Документ от получателя при изискуем от него ДДС (напр. ВОП или услуги от ЕС). Полето
            „Клиент“ е вашият доставчик — въведете го с ИН по ДДС за съответната държава членка.
          </p>
        </div>
      </div>

      <ContentLoader
        loading={isLoadingData}
        title="Зареждане"
        subtitle="Фирми, клиенти и каталог…"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Получател и доставчик
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Вашата фирма (издава протокола) *</Label>
                    <Select
                      value={formData.companyId}
                      onValueChange={(v) => setFormData((p) => ({ ...p, companyId: v }))}
                    >
                      <SelectTrigger className={cn(companyInvalid && FIELD_INVALID)}>
                        <SelectValue placeholder="Изберете компания" />
                      </SelectTrigger>
                      <SelectContent className="z-100 max-h-[300px]">
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Доставчик (клиент в системата) *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(v) => setFormData((p) => ({ ...p, clientId: v }))}
                    >
                      <SelectTrigger className={cn(clientInvalid && FIELD_INVALID)}>
                        <SelectValue placeholder="Изберете доставчик" />
                      </SelectTrigger>
                      <SelectContent className="z-100 max-h-[300px]">
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormDatePicker
                      id="vat117-issue-date"
                      label="Дата на протокол *"
                      value={formData.issueDate}
                      onChange={(v) => setFormData((p) => ({ ...p, issueDate: v }))}
                      isRequired
                    />
                    <FormDatePicker
                      id="vat117-tax-event-date"
                      label="Дата на данъчно събитие *"
                      value={formData.taxEventDate}
                      onChange={(v) => setFormData((p) => ({ ...p, taxEventDate: v }))}
                      isRequired
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Сценарий (тип доставка) *</Label>
                    <Select
                      value={formData.scenario}
                      onValueChange={(v) => setFormData((p) => ({ ...p, scenario: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-100 max-h-[320px]">
                        {VAT_PROTOCOL_117_SCENARIOS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Description className="text-xs text-muted-foreground">
                      {VAT_PROTOCOL_117_SCENARIOS.find((s) => s.value === formData.scenario)?.hint}
                    </Description>
                  </div>
                  <div className="space-y-2">
                    <Label>Място на издаване</Label>
                    <Input
                      value={formData.placeOfIssue}
                      onChange={(e) => setFormData((p) => ({ ...p, placeOfIssue: e.target.value }))}
                      placeholder="Напр. София"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Фактура на доставчик №</Label>
                      <Input
                        value={formData.supplierInvoiceNumber}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, supplierInvoiceNumber: e.target.value }))
                        }
                        placeholder="Ако има издадена фактура"
                      />
                    </div>
                    <FormDatePicker
                      id="vat117-supplier-invoice-date"
                      label="Дата на фактура на доставчик"
                      value={formData.supplierInvoiceDate}
                      onChange={(v) => setFormData((p) => ({ ...p, supplierInvoiceDate: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Правно основание / пояснение</Label>
                    <Textarea
                      value={formData.legalBasisNote}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, legalBasisNote: e.target.value }))
                      }
                      placeholder="По избор: уточнение за счетоводството или конкретна разпоредба"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Редове
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProductSearch((v) => !v)}
                    >
                      От каталог
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setItems((prev) => [
                          ...prev,
                          {
                            id: Math.max(0, ...prev.map((i) => i.id)) + 1,
                            description: "",
                            quantity: 1,
                            unitPrice: 0,
                            taxRate: DEFAULT_VAT_RATE,
                          },
                        ])
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Ред
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showProductSearch ? (
                    <div className="rounded-xl border border-border/60 p-3">
                      <SearchField
                        placeholder="Търси продукт…"
                        value={productSearchQuery}
                        onChange={setProductSearchQuery}
                        aria-label="Търсене в каталог продукти"
                        className="mb-2"
                      />
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {filteredProducts.slice(0, 40).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                            onClick={() => addItemFromProduct(p)}
                          >
                            <span>{p.name}</span>
                            <span className="text-muted-foreground">{p.price} €</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-xl border border-border/50 p-3 md:grid-cols-12"
                    >
                      <div className="space-y-1.5 md:col-span-5">
                        <Label className="text-xs">Описание</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, description: v } : it))
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <NumberField
                          fullWidth
                          variant="secondary"
                          value={item.quantity}
                          onChange={(q) => {
                            const n = typeof q === "number" && !Number.isNaN(q) ? q : 0;
                            setItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, quantity: n } : it))
                            );
                          }}
                          minValue={0.0001}
                          step={0.01}
                          formatOptions={{ maximumFractionDigits: 4 }}
                        >
                          <HeroLabel className="text-xs font-medium text-foreground">Количество</HeroLabel>
                          <NumberField.Group className="min-h-11 rounded-xl border border-input bg-background shadow-xs">
                            <NumberField.Input className="px-3 text-sm font-medium" />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <NumberField
                          fullWidth
                          variant="secondary"
                          value={item.unitPrice}
                          onChange={(q) => {
                            const n = typeof q === "number" && !Number.isNaN(q) ? q : 0;
                            setItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, unitPrice: n } : it))
                            );
                          }}
                          minValue={0}
                          step={0.01}
                          formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                        >
                          <HeroLabel className="text-xs font-medium text-foreground">Ед. цена</HeroLabel>
                          <NumberField.Group className="min-h-11 rounded-xl border border-input bg-background shadow-xs">
                            <NumberField.Input className="px-3 text-sm font-medium" />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <NumberField
                          fullWidth
                          variant="secondary"
                          value={item.taxRate}
                          onChange={(q) => {
                            const n = typeof q === "number" && !Number.isNaN(q) ? q : 0;
                            setItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, taxRate: n } : it))
                            );
                          }}
                          minValue={0}
                          maxValue={100}
                          step={1}
                        >
                          <HeroLabel className="text-xs font-medium text-foreground">ДДС %</HeroLabel>
                          <NumberField.Group className="min-h-11 rounded-xl border border-input bg-background shadow-xs">
                            <NumberField.Input className="px-3 text-sm font-medium" />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                      <div className="flex items-end md:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={items.length <= 1}
                          onClick={() =>
                            setItems((prev) => prev.filter((it) => it.id !== item.id))
                          }
                          aria-label={`Премахни ред ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="border-teal-500/25 bg-teal-500/5">
                <CardHeader className="flex flex-row flex-wrap items-center gap-2">
                  <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                    <CalendarIcon className="h-5 w-5" />
                    Обобщение
                  </CardTitle>
                  <Chip size="sm" variant="soft" color="success" className="text-[10px]">
                    За счетоводство
                  </Chip>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Основа</span>
                    <span>
                      {totals.subtotal.toFixed(2)} {formData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ДДС</span>
                    <span>
                      {totals.taxAmount.toFixed(2)} {formData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-semibold">
                    <span>Общо</span>
                    <span>
                      {totals.total.toFixed(2)} {formData.currency}
                    </span>
                  </div>
                  <Description className="text-xs text-muted-foreground">
                    Съхранете протокола и го предоставете на счетоводството за отразяване в дневниците
                    по ЗДДС. Това не е автоматично подаване към НАП.
                  </Description>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Бележки</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    rows={4}
                    placeholder="Вътрешни бележки (незадължително)"
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={submitLock.isPending}
                loading={submitLock.isPending}
              >
                {submitLock.isPending ? "Създаване…" : "Създай протокол"}
              </Button>
            </div>
          </div>
        </form>
      </ContentLoader>
    </div>
  );
}
