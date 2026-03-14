import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function TaxCompliancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Данъчно съответствие</h1>
      </div>
      
      <Tabs defaultValue="bulgaria">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bulgaria">България (НАП)</TabsTrigger>
          <TabsTrigger value="setup">Настройки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bulgaria" className="space-y-6 pt-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Информация за данъчно съответствие в България</AlertTitle>
            <AlertDescription>
              Тази страница обяснява изискванията за съответствие на фактурите според Националната агенция за приходите (НАП).
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Изисквания за български фактури (НАП)</CardTitle>
              <CardDescription>
                Законови изисквания за фактури, издадени на български клиенти според Закона за данък върху добавената стойност (ЗДДС)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Задължителни елементи във фактурите:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Пълно юридическо име и адрес на продавача (фирмата, издаваща фактурата)</li>
                <li>БУЛСТАТ/ЕИК (номер на фирмена регистрация) на продавача</li>
                <li>ДДС идентификационен номер (ако е регистриран по ДДС) с префикс BG</li>
                <li>Пълно юридическо име и адрес на купувача</li>
                <li>БУЛСТАТ/ЕИК на купувача (ако е приложимо)</li>
                <li>ДДС идентификационен номер на купувача (ако е приложимо)</li>
                <li>Номер на фактурата (последователен и уникален в рамките на календарната година)</li>
                <li>Дата на фактурата</li>
                <li>Дата на данъчното събитие (дата на доставка или извършване на услугата)</li>
                <li>Място на издаване на фактурата</li>
                <li>Описание на стоките или услугите</li>
                <li>Единична цена, количество и нетна сума</li>
                <li>Ставка на ДДС и сума на ДДС</li>
                <li>Обща сума на фактурата</li>
                <li>Условия и начин на плащане</li>
                <li>МОЛ (Материално отговорно лице) - име на упълномощеното лице</li>
                <li>Специални клаузи за освободени доставки или специални данъчни режими (ако е приложимо)</li>
                <li>Ясно обозначение дали е оригинална фактура или дубликат</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Изисквания за електронно фактуриране:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Електронните фактури трябва да съдържат същата информация като хартиените фактури</li>
                <li>Електронните фактури трябва да гарантират автентичност на произхода, цялост на съдържанието и четливост</li>
                <li>За фактури над 5 000 € се изисква електронно подаване към НАП</li>
                <li>За определени електронни фактури може да се изисква квалифициран електронен подпис</li>
                <li>Електронните фактури трябва да се съхраняват в оригиналния им формат</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Номериране на фактури:</h3>
              <p>
                Българските фактури трябва да следват специфичен формат на номериране, който е последователен в рамките на календарната година. Нашата система автоматично генерира номера във формата:
              </p>
              <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">
                YYCCCCNNNNNN
              </pre>
              <p className="text-sm mt-2">
                Където:<br />
                YY = Последните две цифри на годината<br />
                CCCC = Последните четири цифри на вашия БУЛСТАТ/ЕИК<br />
                NNNNNN = Последователен номер в рамките на годината и фирмата
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Изисквания за отчитане</CardTitle>
              <CardDescription>
                Ключови изисквания за отчитане на ДДС пред НАП (Национална агенция за приходите)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">ДДС декларации:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Месечните ДДС декларации трябва да се подават до 14-то число на следващия месец</li>
                <li>Плащанията на ДДС трябва да се извършват в същия срок</li>
                <li>ДДС декларациите трябва да се подават електронно чрез е-услугите на НАП</li>
                <li>Всички фактури над 5 000 € трябва да се отчитат подробно</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Регистри на продажбите и покупките:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Регистрите на продажбите и покупките трябва да се поддържат и подават с ДДС декларациите</li>
                <li>Регистрите трябва да включват подробна разбивка на всички фактури</li>
                <li>Електронното подаване е задължително</li>
              </ul>
              
              <h3 className="font-semibold mt-6">VIES декларации:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>VIES декларациите за вътрешнообщностни доставки трябва да се подават месечно</li>
                <li>Срокът за подаване на декларацията е до 14-то число на следващия месец</li>
                <li>Трябва да включват подробности за всички доставки на клиенти от ЕС, регистрирани по ДДС</li>
              </ul>
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Важна забележка</AlertTitle>
                <AlertDescription>
                  Закъснялото подаване на ДДС декларации или неточно отчитане може да доведе до значителни глоби в размер от 250 до 5 000 €. Уверете се, че цялата документация е пълна и подадена навреме.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Изисквания за съхранение на документи</CardTitle>
              <CardDescription>
                Законови изисквания за съхранение и запазване на фактури
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>Всички фактури трябва да се съхраняват поне 10 години от края на годината на издаване</li>
                <li>Фактурите трябва да се съхраняват в оригиналния им формат (хартиен или електронен)</li>
                <li>За електронните фактури трябва да се поддържат архивни копия</li>
                <li>Съхранението трябва да позволява бърз и лесен достъп при поискване от данъчните органи</li>
                <li>Документите трябва да се съхраняват с непокътнати всички оригинални данни</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Официални ресурси</CardTitle>
              <CardDescription>
                Връзки към официални български данъчни органи и разпоредби
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://nra.bg/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Национална агенция за приходите (НАП)
                    </a>
                    <p className="text-sm text-gray-500">Официален уебсайт на българския данъчен орган</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://www.lex.bg/laws/ldoc/2135533201" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Закон за данък върху добавената стойност (ЗДДС)
                    </a>
                    <p className="text-sm text-gray-500">Пълен текст на българското законодателство за ДДС</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://www.minfin.bg/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Министерство на финансите
                    </a>
                    <p className="text-sm text-gray-500">Официален уебсайт на българското Министерство на финансите</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ръководство за настройка</CardTitle>
              <CardDescription>
                Ръководство стъпка по стъпка за конфигуриране на данъчното съответствие в системата
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">1</span>
                  Настройте данните за вашата компания
                </h3>
                <p className="mt-2 text-sm">
                  Отидете в <Link href="/settings/company" className="text-blue-500 hover:underline">Настройки на компанията</Link> и се уверете, че всички задължителни полета са попълнени, особено данъчните идентификационни номера.
                </p>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">2</span>
                  Конфигурирайте българските данъчни настройки
                </h3>
                <p className="mt-2 text-sm">
                  За българските фактури се уверете, че сте попълнили специфичните за България полета:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>БУЛСТАТ/ЕИК номер</li>
                  <li>ДДС регистрационен номер (ако е приложимо)</li>
                  <li>МОЛ (Материално отговорно лице)</li>
                  <li>Място на издаване по подразбиране</li>
                </ul>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">3</span>
                  Създавайте фактури с правилни данъчни настройки
                </h3>
                <p className="mt-2 text-sm">
                  При създаване на фактури изберете EUR като валута, за да активирате автоматично всички функции за съответствие с българските данъчни изисквания:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Номерата на фактурите ще следват формата, съответстващ на НАП</li>
                  <li>Всички задължителни полета за българските фактури ще бъдат показани</li>
                  <li>PDF файловете ще бъдат генерирани в правилния български формат</li>
                </ul>
              </div>
              
              <Alert className="mt-4" variant="default">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Готови за съответствие</AlertTitle>
                <AlertDescription>
                  След като изпълните тези стъпки, системата ще валидира основните български идентификатори и ще съхранява снимка на юридическите данни към всеки издаден документ. Ако използвате НАП портални данни или сертификати, пазете ги актуални и не разчитайте на тази страница като заместител на правна консултация.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 