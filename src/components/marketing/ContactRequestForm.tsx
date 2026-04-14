"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsyncLock } from "@/hooks/use-async-lock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InquiryType = "support" | "demo" | "sales";

const inquiryOptions: { value: InquiryType; label: string }[] = [
  { value: "support", label: "Поддръжка" },
  { value: "demo", label: "Заявка за демо" },
  { value: "sales", label: "Търговски въпрос" },
];

export function ContactRequestForm() {
  const { run, isPending } = useAsyncLock();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setFeedback(null);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
      inquiryType: String(formData.get("inquiryType") || "support"),
      website: String(formData.get("website") || ""),
    };

    await run(async () => {
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          setFeedback({
            type: "error",
            message: data.message || "Неуспешно изпращане. Моля, опитайте отново.",
          });
          return;
        }

        setFeedback({
          type: "success",
          message: data.message || "Изпратихме запитването успешно.",
        });
        const form = document.getElementById("contact-request-form") as HTMLFormElement | null;
        form?.reset();
      } catch {
        setFeedback({
          type: "error",
          message: "Неуспешна връзка със сървъра. Моля, опитайте по-късно.",
        });
      }
    });
  }

  return (
    <form
      id="contact-request-form"
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleSubmit(formData);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Име</Label>
        <Input id="name" name="name" placeholder="Вашето име" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Имейл</Label>
        <Input id="email" name="email" type="email" placeholder="name@company.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inquiryType">Тип запитване</Label>
        <select
          id="inquiryType"
          name="inquiryType"
          required
          defaultValue="support"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {inquiryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Тема</Label>
        <Input id="subject" name="subject" placeholder="Кратка тема" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Съобщение</Label>
        <Textarea id="message" name="message" placeholder="Опишете как можем да помогнем..." rows={6} required />
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      {feedback ? (
        <p
          className={
            feedback.type === "success"
              ? "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
              : "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          }
        >
          {feedback.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending} loading={isPending}>
        <Send className="mr-2 h-4 w-4" />
        {isPending ? "Изпращане..." : "Изпрати запитване"}
      </Button>
    </form>
  );
}
