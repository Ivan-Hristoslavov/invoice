"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAsyncAction } from "@/hooks/use-async-action";

type Lookup = { id: string; name: string };
type Product = { id: string; name: string; price: string | number; taxRate?: string | number | null };

type Item = {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
};

export default function ProformaNewClient({
  clients,
  companies,
  products,
}: {
  clients: Lookup[];
  companies: Lookup[];
  products: Product[];
}) {
  const router = useRouter();
  const submitAction = useAsyncAction();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [accountType, setAccountType] = useState("BUSINESS");
  const [currency, setCurrency] = useState("EUR");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, price: 0, taxRate: 20 }]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.quantity * item.price * (item.taxRate / 100), 0);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }, [items]);

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0, taxRate: 20 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function submit() {
    if (!clientId || !companyId) {
      toast.error("Изберете клиент и компания");
      return;
    }
    const validItems = items.filter((item) => item.description.trim() && item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      toast.error("Добавете поне един валиден артикул");
      return;
    }
    await submitAction.execute(async () => {
      const response = await fetch("/api/proforma-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          companyId,
          issueDate,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          currency,
          paymentMethod,
          accountType,
          items: validItems,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !payload?.id) throw new Error(payload?.error || "Неуспешно създаване");
      toast.success("Проформа фактурата е създадена");
      router.push(`/proforma-invoices/${payload.id}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Нова проформа фактура</h1>
          <p className="card-description">Подгответе оферта към клиента с отделна проформа номерация.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Основни данни</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Компания</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Клиент</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Валута</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="BGN">BGN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Дата</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
          <div className="space-y-1"><Label>Падеж</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Плащане</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">По банка</SelectItem>
                <SelectItem value="CASH">В брой</SelectItem>
                <SelectItem value="CARD">Карта</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Бележки</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Бележка към проформа фактурата" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Артикули</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden md:grid md:grid-cols-[1.2fr_2fr_0.7fr_0.7fr_0.7fr_auto] md:gap-2 text-xs font-semibold text-muted-foreground px-1">
            <span>Продукт</span>
            <span>Описание</span>
            <span>Брой</span>
            <span>Ед. цена</span>
            <span>ДДС %</span>
            <span className="text-right">Изтрий</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/40 bg-muted/10 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
              <div className="grid gap-2 md:grid-cols-[1.2fr_2fr_0.7fr_0.7fr_0.7fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">Продукт</Label>
                  <Select
                    value={item.productId || "custom"}
                    onValueChange={(value) => {
                      if (value === "custom") return;
                      const product = products.find((p) => p.id === value);
                      updateItem(index, {
                        productId: value,
                        description: product?.name || "",
                        price: Number(product?.price || 0),
                        taxRate: Number(product?.taxRate || 20),
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Продукт" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Ръчно</SelectItem>
                      {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">Описание</Label>
                  <Input value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Описание" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">Брой</Label>
                  <Input type="number" step="0.01" min="0.01" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">Ед. цена</Label>
                  <Input type="number" step="0.01" min="0.01" value={item.price} onChange={(e) => updateItem(index, { price: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">ДДС %</Label>
                  <Input type="number" step="0.01" min="0" max="100" value={item.taxRate} onChange={(e) => updateItem(index, { taxRate: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:sr-only">Изтрий</Label>
                  <Button type="button" variant="outline" onClick={() => removeItem(index)} className="w-full md:w-auto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Добави артикул
          </Button>
          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
            <p>Основа: <strong>{totals.subtotal.toFixed(2)} {currency}</strong></p>
            <p>ДДС: <strong>{totals.taxAmount.toFixed(2)} {currency}</strong></p>
            <p>Общо: <strong>{totals.total.toFixed(2)} {currency}</strong></p>
          </div>
          <div className="flex justify-end">
            <LoadingButton
              onClick={() => void submit()}
              loading={submitAction.loading}
              idleText="Създай проформа"
              loadingText="Създаване..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
