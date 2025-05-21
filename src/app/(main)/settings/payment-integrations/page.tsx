"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function PaymentIntegrationsPage() {
  const [activeTab, setActiveTab] = useState("apple-pay");
  const [isApplePayEnabled, setIsApplePayEnabled] = useState(false);
  const [isGooglePayEnabled, setIsGooglePayEnabled] = useState(false);
  const [isStripeEnabled, setIsStripeEnabled] = useState(false);
  const [isPaymentLinkEnabled, setIsPaymentLinkEnabled] = useState(false);
  
  const handleSaveSettings = () => {
    toast.success("Настройките са запазени", {
      description: "Вашите настройки за интеграция на плащанията са обновени."
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад към Настройки
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Интеграции за плащане</h1>
        </div>
        <Button onClick={handleSaveSettings}>
          Запази настройките
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Обработка на плащания</CardTitle>
          <CardDescription>
            Конфигурирайте платежни портали, за да позволите на клиентите да плащат фактури директно
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
            <h3 className="font-medium text-amber-800 mb-2">Очаквайте скоро</h3>
            <p className="text-amber-700 text-sm">
              Интеграцията с платежни доставчици в момента е в разработка. Настройките на тази страница
              са предварителни за предстояща функционалност. В момента можете да записвате плащания ръчно,
              които са получени чрез тези методи.
            </p>
          </div>
          
          <Tabs defaultValue="apple-pay" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="apple-pay">Apple Pay</TabsTrigger>
              <TabsTrigger value="google-pay">Google Pay</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="payment-links">Платежни линкове</TabsTrigger>
            </TabsList>
            
            <TabsContent value="apple-pay">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Активиране на Apple Pay</h3>
                    <p className="text-muted-foreground text-sm">Позволяване на клиентите да плащат фактури чрез Apple Pay</p>
                  </div>
                  <Switch 
                    checked={isApplePayEnabled} 
                    onCheckedChange={setIsApplePayEnabled} 
                    id="apple-pay-enabled"
                  />
                </div>
                
                {isApplePayEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apple-merchant-id">Merchant ID</Label>
                        <Input id="apple-merchant-id" placeholder="merchant.com.yourcompany.app" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apple-merchant-cert">Сертификат на търговеца</Label>
                        <Input id="apple-merchant-cert" type="file" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apple-domain-verification">Файл за проверка на домейна</Label>
                      <Input id="apple-domain-verification" type="file" />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://developer.apple.com/documentation/apple_pay_on_the_web" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Научете повече за интеграцията с Apple Pay
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="google-pay">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Активиране на Google Pay</h3>
                    <p className="text-muted-foreground text-sm">Позволяване на клиентите да плащат фактури чрез Google Pay</p>
                  </div>
                  <Switch 
                    checked={isGooglePayEnabled} 
                    onCheckedChange={setIsGooglePayEnabled} 
                    id="google-pay-enabled"
                  />
                </div>
                
                {isGooglePayEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="google-merchant-id">Merchant ID</Label>
                        <Input id="google-merchant-id" placeholder="1234567890" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="google-merchant-name">Име на търговеца</Label>
                        <Input id="google-merchant-name" placeholder="Името на вашия бизнес" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="google-api-key">Google Pay API ключ</Label>
                      <Input id="google-api-key" type="password" />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://developers.google.com/pay/api" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Научете повече за интеграцията с Google Pay
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stripe">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Активиране на Stripe</h3>
                    <p className="text-muted-foreground text-sm">Обработка на плащания с кредитни карти чрез Stripe</p>
                  </div>
                  <Switch 
                    checked={isStripeEnabled} 
                    onCheckedChange={setIsStripeEnabled} 
                    id="stripe-enabled"
                  />
                </div>
                
                {isStripeEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripe-public-key">Публичен ключ</Label>
                        <Input id="stripe-public-key" placeholder="pk_test_..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripe-secret-key">Секретен ключ</Label>
                        <Input id="stripe-secret-key" type="password" placeholder="sk_test_..." />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stripe-webhook-secret">Webhook секрет</Label>
                      <Input id="stripe-webhook-secret" type="password" placeholder="whsec_..." />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://stripe.com/docs/payments" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Научете повече за интеграцията със Stripe
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="payment-links">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Активиране на платежни линкове</h3>
                    <p className="text-muted-foreground text-sm">Генериране на линкове за споделяне, които клиентите могат да използват за плащане на фактури</p>
                  </div>
                  <Switch 
                    checked={isPaymentLinkEnabled} 
                    onCheckedChange={setIsPaymentLinkEnabled} 
                    id="payment-link-enabled"
                  />
                </div>
                
                {isPaymentLinkEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-expiration">Валидност на линка</Label>
                        <select 
                          id="link-expiration" 
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="never">Никога</option>
                          <option value="24h">24 часа</option>
                          <option value="7d">7 дни</option>
                          <option value="30d">30 дни</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-payments">Разрешени методи на плащане</Label>
                        <select 
                          id="link-payments" 
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="all">Всички налични методи</option>
                          <option value="cards">Само кредитни карти</option>
                          <option value="wallets">Само дигитални портфейли</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded bg-green-50 border border-green-200">
                      <h4 className="font-medium text-green-700 mb-1 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Как работи
                      </h4>
                      <p className="text-sm text-green-700">
                        Когато е активирано, бутон "Плати сега" ще се появи на фактурите на клиентите.
                        Можете също да генерирате и споделяте платежни линкове директно от детайлите на фактурата.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Страница за плащане, видима от клиентите</CardTitle>
          <CardDescription>
            Персонализирайте изживяването при плащане, което вашите клиенти ще виждат
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="payment-page-logo">Лого на компанията</Label>
              <Input id="payment-page-logo" type="file" />
              <p className="text-xs text-muted-foreground mt-1">Препоръчителен размер: 200x60px</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-page-color">Цвят на бранда</Label>
              <Input id="payment-page-color" type="color" defaultValue="#4F46E5" className="h-10 w-20" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-page-message">Благодарствено съобщение</Label>
              <Input 
                id="payment-page-message" 
                placeholder="Благодарим за плащането!" 
                defaultValue="Благодарим за плащането! Оценяваме вашия бизнес."
              />
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Активиране на разписки за плащане</h3>
                <p className="text-sm text-muted-foreground">Автоматично изпращане на имейл разписки при получаване на плащания</p>
              </div>
              <Switch id="enable-receipts" defaultChecked />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSettings}>Запази промените</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 