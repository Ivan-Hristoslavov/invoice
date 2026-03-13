"use client";

import { Accordion } from "@/components/ui/accordion";

export type FaqCategory = {
  title: string;
  questions: { q: string; a: string }[];
};

export function HelpFaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-6">
      {categories.map((category, catIndex) => (
        <div key={catIndex}>
          <h3 className="text-lg font-semibold mb-3">{category.title}</h3>
          <Accordion variant="surface" className="rounded-lg overflow-hidden">
            {category.questions.map((faq, faqIndex) => (
              <Accordion.Item key={faqIndex}>
                <Accordion.Heading>
                  <Accordion.Trigger className="w-full flex items-center justify-between gap-2 py-3 px-4 text-left font-medium hover:bg-muted/50 transition-colors">
                    {faq.q}
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="px-4 pb-3 text-muted-foreground text-sm">
                    {faq.a}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
