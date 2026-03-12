import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { ArrowLeftIcon, DownloadIcon, PrinterIcon, ShareIcon } from 'lucide-react';

export default function InvoiceGuidePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/docs/guides">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Всички ръководства
            </Link>
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Управление на фактури</h1>
        
        <div className="text-muted-foreground mb-8">
          <p>
            Научете как да създавате, управлявате и проследявате фактури с RapidFrame. 
            Това ръководство ще ви покаже всички функции за работа с фактури, от създаването 
            до изпращането и получаването на плащания.
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Секция 1: Създаване на фактура */}
          <section id="creating-invoice" className="space-y-4">
            <h2 className="text-2xl font-semibold">Създаване на фактура</h2>
            
            <p>
              За да създадете нова фактура, отидете в секцията "Фактури" и натиснете бутона 
              "+ Нова фактура" в горния десен ъгъл на страницата.
            </p>
            
            <Card className="border border-muted">
              <CardContent className="p-6">
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Изберете клиент</strong> - Изберете съществуващ клиент от падащото меню 
                    или създайте нов клиент, като кликнете върху "Добави нов клиент".
                    <HelpTooltip content="Данните за клиента ще бъдат автоматично попълнени, ако клиентът вече съществува в системата.">
                      <span className="text-sm text-primary ml-1">Повече инфо</span>
                    </HelpTooltip>
                  </li>
                  <li>
                    <strong>Попълнете данните за фактурата</strong> - Въведете номер на фактурата (или използвайте 
                    автоматично генерирания), дата на издаване, дата на плащане и бележки.
                  </li>
                  <li>
                    <strong>Добавете продукти или услуги</strong> - Кликнете върху "Добави ред", за да добавите продукти 
                    или услуги към фактурата. Можете да добавите съществуващи продукти или да създадете нови.
                  </li>
                  <li>
                    <strong>Задайте данъци и отстъпки</strong> - Добавете приложими данъци и отстъпки за цялата фактура 
                    или за отделни редове.
                  </li>
                  <li>
                    <strong>Прегледайте и запазете</strong> - Прегледайте фактурата за грешки и кликнете върху "Запази" 
                    или "Запази и изпрати", за да финализирате фактурата.
                  </li>
                </ol>
              </CardContent>
            </Card>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Съвет</p>
              <p className="text-sm">
                Можете да запазите фактура като чернова, ако не сте готови да я изпратите на клиента. 
                Чернови фактури могат да се редактират по всяко време.
              </p>
            </div>
          </section>
          
          {/* Секция 2: Изпращане на фактура */}
          <section id="sending-invoice" className="space-y-4">
            <h2 className="text-2xl font-semibold">Изпращане на фактура</h2>
            
            <p>
              След като фактурата е създадена, можете да я изпратите на клиента по няколко начина:
            </p>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <h3 className="font-medium flex items-center mb-2">
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Печат
                </h3>
                <p className="text-sm text-muted-foreground">
                  Принтирайте фактурата директно и я изпратете физически на клиента
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium flex items-center mb-2">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  PDF Експорт
                </h3>
                <p className="text-sm text-muted-foreground">
                  Изтеглете фактурата като PDF и я изпратете като прикачен файл
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium flex items-center mb-2">
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Имейл
                </h3>
                <p className="text-sm text-muted-foreground">
                  Изпратете фактурата директно на имейл адреса на клиента от системата
                </p>
              </Card>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Забележка</p>
              <p className="text-sm">
                Клиентите ще получат уведомление по имейл със сигурен линк за преглед на фактурата. 
                Те могат също да изтеглят PDF версия от този линк.
              </p>
            </div>
          </section>
          
          {/* Секция 3: Проследяване на плащания */}
          <section id="tracking-payments" className="space-y-4">
            <h2 className="text-2xl font-semibold">Проследяване на плащания</h2>
            
            <p>
              RapidFrame позволява лесно проследяване на плащанията по фактурите:
            </p>
            
            <Card className="border border-muted">
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Статус на плащане</strong> - Всяка фактура показва ясен статус: Платена, 
                    Частично платена, Просрочена или Предстояща.
                  </li>
                  <li>
                    <strong>Записване на плащания</strong> - Когато получите плащане, го запишете 
                    към съответната фактура, за да актуализирате нейния статус.
                  </li>
                  <li>
                    <strong>Автоматични напомняния</strong> - Системата може да изпраща автоматични 
                    напомняния за просрочени фактури (настройва се от Настройки {'>'} Фактуриране).
                  </li>
                  <li>
                    <strong>Отчети за плащания</strong> - Генерирайте отчети за платени, частично 
                    платени и просрочени фактури от секцията "Отчети".
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
          
          {/* Секция 4: Повтарящи се фактури */}
          <section id="recurring-invoices" className="space-y-4">
            <h2 className="text-2xl font-semibold">Повтарящи се фактури</h2>
            
            <p>
              За редовни услуги или продукти, можете да настроите повтарящи се фактури:
            </p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Отидете на "Фактури" {'>'} "Повтарящи се фактури" {'>'} "Нова повтаряща се фактура"
              </li>
              <li>
                Изберете клиент и попълнете данните за фактурата както обикновено
              </li>
              <li>
                В секцията "Настройки за повторение", задайте:
                <ul className="list-disc pl-6 mt-2">
                  <li>Честота (седмично, месечно, годишно)</li>
                  <li>Дата на стартиране</li>
                  <li>Брой повторения или дата на край</li>
                </ul>
              </li>
              <li>
                Запазете шаблона и системата ще генерира автоматично нови фактури според избрания график
              </li>
            </ol>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Бонус:</strong> Повтарящите се фактури могат да се настроят и за автоматично изпращане към клиентите 
                веднага след генериране, спестявайки ви време и усилия.
              </p>
            </div>
          </section>
        </div>
        
        <div className="mt-12 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Научете повече</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/docs/guides/payments" className="block hover:no-underline">
              <Card className="h-full hover:border-primary transition-all">
                <CardContent className="p-4">
                  <h4 className="font-medium">Управление на плащания</h4>
                  <p className="text-sm text-muted-foreground">
                    Научете как да обработвате различни типове плащания и транзакции
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/docs/guides/clients" className="block hover:no-underline">
              <Card className="h-full hover:border-primary transition-all">
                <CardContent className="p-4">
                  <h4 className="font-medium">Управление на клиенти</h4>
                  <p className="text-sm text-muted-foreground">
                    Научете как да управлявате клиентска информация и взаимоотношения
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 