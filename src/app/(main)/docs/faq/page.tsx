import React from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// FAQItem компонент
function FAQItem({ question, answer, relatedQuestions = [] }) {
  return (
    <div className="border-b py-4">
      <h3 className="text-lg font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground mb-2">{answer}</p>
      
      {relatedQuestions.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium">Свързани въпроси:</p>
          <ul className="mt-1 space-y-1">
            {relatedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-primary hover:underline cursor-pointer">
                <Link href={`#${q.id}`}>{q.text}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Данни за въпросите по категории
const faqData = {
  billing: [
    {
      id: 'invoice-numbering',
      question: 'Как се номерират фактурите?',
      answer: 'Системата автоматично генерира последователни номера за фактурите във формат, съвместим с българското законодателство. Номерата включват година, пореден номер и опционално префикс, който можете да зададете в настройките.',
      relatedQuestions: [
        { id: 'invoice-edit', text: 'Мога ли да редактирам вече издадена фактура?' },
        { id: 'invoice-delete', text: 'Как да анулирам фактура?' }
      ]
    },
    {
      id: 'invoice-edit',
      question: 'Мога ли да редактирам вече издадена фактура?',
      answer: 'След като фактурата е маркирана като "Издадена", не е препоръчително да се редактира съдържанието ѝ поради счетоводни и законови причини. Вместо това, можете да създадете кредитно известие или да анулирате фактурата и да създадете нова.',
      relatedQuestions: [
        { id: 'invoice-numbering', text: 'Как се номерират фактурите?' }
      ]
    },
    {
      id: 'invoice-delete',
      question: 'Как да анулирам фактура?',
      answer: 'За да анулирате фактура, отворете я и използвайте бутона "Анулирай" в горния десен ъгъл. Системата ще ви попита за причината и ще маркира фактурата като анулирана, без да я изтрива от системата. Това спазва счетоводните правила за одитна следа.',
      relatedQuestions: [
        { id: 'invoice-edit', text: 'Мога ли да редактирам вече издадена фактура?' }
      ]
    },
  ],
  account: [
    {
      id: 'change-password',
      question: 'Как да променя паролата си?',
      answer: 'Можете да промените паролата си от страницата "Настройки на профила". Кликнете върху вашето име в горния десен ъгъл, изберете "Настройки" и след това секцията "Сигурност".',
      relatedQuestions: [
        { id: 'forgot-password', text: 'Забравих паролата си. Какво да направя?' }
      ]
    },
    {
      id: 'forgot-password',
      question: 'Забравих паролата си. Какво да направя?',
      answer: 'На страницата за вход има опция "Забравена парола". Кликнете върху нея и въведете имейла, с който сте се регистрирали. Ще получите имейл с инструкции за възстановяване на паролата.',
      relatedQuestions: [
        { id: 'change-password', text: 'Как да променя паролата си?' }
      ]
    },
  ],
  export: [
    {
      id: 'export-formats',
      question: 'В какви формати мога да експортирам данните си?',
      answer: 'RapidFrame позволява експорт на данни в следните формати: PDF (за фактури и отчети), Excel (.xlsx) за таблични данни, CSV за импорт в други системи и JSON за резервни копия на данните.',
      relatedQuestions: [
        { id: 'backup-data', text: 'Как да направя резервно копие на всичките си данни?' }
      ]
    },
    {
      id: 'backup-data',
      question: 'Как да направя резервно копие на всичките си данни?',
      answer: 'Отидете в "Настройки" > "Данни и експорт" и изберете "Пълно резервно копие". Системата ще подготви архив с всички ваши данни, който можете да изтеглите и съхраните локално.',
      relatedQuestions: [
        { id: 'export-formats', text: 'В какви формати мога да експортирам данните си?' }
      ]
    },
  ],
  legal: [
    {
      id: 'gdpr-compliance',
      question: 'Как RapidFrame спазва GDPR?',
      answer: 'RapidFrame е разработен с фокус върху GDPR съответствието. Съхраняваме само необходимите данни, осигуряваме възможност за експорт и изтриване на лични данни, и прилагаме строги мерки за сигурност на информацията. Повече информация можете да намерите в нашата Политика за поверителност.',
      relatedQuestions: [
        { id: 'data-security', text: 'Как се осигурява сигурността на моите данни?' }
      ]
    },
    {
      id: 'data-security',
      question: 'Как се осигурява сигурността на моите данни?',
      answer: 'Използваме модерни технологии за криптиране на данните, SSL сертификати за защитена комуникация, редовни одити за сигурност и многофакторна автентикация. Всички данни се съхраняват в сигурни центрове за данни, отговарящи на строги международни стандарти.',
      relatedQuestions: [
        { id: 'gdpr-compliance', text: 'Как RapidFrame спазва GDPR?' }
      ]
    },
  ]
};

export default function FAQPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Често задавани въпроси</h1>
        
        <div className="mb-8">
          <p className="text-muted-foreground">
            Намерете бързи отговори на най-често задаваните въпроси за RapidFrame. Ако не откриете отговор на вашия въпрос, не се колебайте да{' '}
            <Link href="/support" className="text-primary hover:underline">
              се свържете с нашия екип за поддръжка
            </Link>.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Търсене във FAQ..."
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded">
              Търси
            </button>
          </div>
        </div>
        
        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-8">
            <TabsTrigger value="billing">Фактуриране</TabsTrigger>
            <TabsTrigger value="account">Акаунт</TabsTrigger>
            <TabsTrigger value="export">Експорт</TabsTrigger>
            <TabsTrigger value="legal">Правни въпроси</TabsTrigger>
          </TabsList>
          
          <TabsContent value="billing" className="space-y-1" id="billing">
            <h2 className="text-xl font-semibold mb-4">Въпроси за фактуриране</h2>
            <div className="space-y-2">
              {faqData.billing.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-1" id="account">
            <h2 className="text-xl font-semibold mb-4">Управление на акаунт</h2>
            <div className="space-y-2">
              {faqData.account.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-1" id="export">
            <h2 className="text-xl font-semibold mb-4">Експорт и импорт</h2>
            <div className="space-y-2">
              {faqData.export.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="legal" className="space-y-1" id="legal">
            <h2 className="text-xl font-semibold mb-4">Правни въпроси</h2>
            <div className="space-y-2">
              {faqData.legal.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-12 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Не намерихте отговор?</h3>
          <p className="text-muted-foreground mb-4">
            Свържете се с нашия екип за поддръжка и ще ви отговорим възможно най-бързо.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Свържете се с нас
          </Link>
        </div>
      </div>
    </div>
  );
} 