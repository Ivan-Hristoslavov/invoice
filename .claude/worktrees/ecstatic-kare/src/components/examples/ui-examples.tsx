"use client"

import React, { useState } from 'react';
import { Spinner } from '@heroui/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { SuccessAnimation, SuccessDialog } from '@/components/ui/success-animation';
import { ErrorMessage } from '@/components/ui/error-message';
import { FormLayout, FormField, FormSection } from '@/components/forms/form-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileIcon, AlertTriangleIcon, PlusIcon, FileText } from 'lucide-react';

export default function UIExamples() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Симулиране на заявка
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1500);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-8">UI Компоненти</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Компоненти за зареждане */}
          <Card>
            <CardHeader>
              <CardTitle>Индикатори за зареждане</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Spinner</p>
                <div className="flex space-x-4">
                  <Loading variant="spinner" size="sm" />
                  <Loading variant="spinner" size="md" />
                  <Loading variant="spinner" size="lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Dots</p>
                <div className="flex space-x-4">
                  <Loading variant="dots" size="sm" />
                  <Loading variant="dots" size="md" />
                  <Loading variant="dots" size="lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Pulse</p>
                <div className="flex space-x-4">
                  <Loading variant="pulse" size="sm" />
                  <Loading variant="pulse" size="md" />
                  <Loading variant="pulse" size="lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">С текст</p>
                <Loading variant="spinner" showText text="Зареждане на данни..." />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Бутон със зареждане</p>
                <Button disabled className="inline-flex items-center gap-2">
                  <Spinner size="sm" color="current" className="shrink-0" />
                  Обработка...
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Компоненти за празни състояния */}
          <Card>
            <CardHeader>
              <CardTitle>Празни състояния</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmptyState
                heading="Няма резултати"
                description="Не бяха намерени резултати, отговарящи на вашите критерии."
                icon={FileIcon}
                action={
                  <Button variant="outline" size="sm" onClick={() => alert("Филтрите са изчистени")}>
                    Изчистване на филтрите
                  </Button>
                }
              />

              <EmptyState
                icon={FileText}
                heading="Нямате фактури"
                description="Създайте първата си фактура, за да започнете да следите вашите плащания."
                action={
                  <Button size="sm" onClick={() => alert("Създаване на нова фактура")}>
                    Създаване на фактура
                  </Button>
                }
              />
            </CardContent>
          </Card>
          
          {/* Компоненти за успешни действия */}
          <Card>
            <CardHeader>
              <CardTitle>Обратна връзка при успех</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Inline уведомление</p>
                <SuccessAnimation 
                  message="Промените са запазени успешно" 
                  variant="checkmark"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Действия</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSuccess(true)}
                  >
                    Покажи уведомление за успех
                  </Button>
                  
                  <Button
                    onClick={() => setShowSuccessDialog(true)}
                  >
                    Покажи диалог за успех
                  </Button>
                </div>
              </div>
              
              {showSuccess && (
                <SuccessAnimation 
                  message="Действието е изпълнено успешно" 
                  toast
                  duration={3}
                  onComplete={() => setShowSuccess(false)}
                />
              )}
              
              {showSuccessDialog && (
                <SuccessDialog
                  title="Успешно изпратено!"
                  message="Вашето запитване беше успешно изпратено. Ще се свържем с вас скоро."
                  onClose={() => setShowSuccessDialog(false)}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Компоненти за грешки */}
          <Card>
            <CardHeader>
              <CardTitle>Съобщения за грешки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ErrorMessage
                title="Грешка при свързване"
                message="Не успяхме да се свържем със сървъра. Моля, проверете вашата интернет връзка и опитайте отново."
                onRetry={() => alert('Повторен опит')}
              />
              
              <ErrorMessage
                title="Внимание"
                message="Имате неплатени фактури, които скоро ще бъдат просрочени."
                type="warning"
              />
              
              <ErrorMessage
                title="Информация"
                message="Ново споразумение за поверителност е достъпно. Моля, прегледайте го при следващото си влизане."
                type="info"
              />
              
              <ErrorMessage
                message="Полето е задължително"
                inline
                showIcon
                type="error"
              />
            </CardContent>
          </Card>
          
          {/* Форма */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Стандартизирана форма</CardTitle>
            </CardHeader>
            <CardContent>
              <FormLayout
                onSubmit={handleSubmit}
              >
                <FormSection
                  title="Основна информация"
                  description="Въведете основните данни за продукта"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Име на продукта"
                      htmlFor="product-name"
                      required
                    >
                      <Input id="product-name" placeholder="Въведете име" />
                    </FormField>
                    
                    <FormField
                      label="Цена"
                      htmlFor="product-price"
                      required
                    >
                      <Input id="product-price" type="number" placeholder="0.00" />
                    </FormField>
                  </div>
                  
                  <FormField
                    label="Описание"
                    htmlFor="product-description"
                    helpText="Добавете подробно описание на продукта"
                  >
                    <Textarea id="product-description" placeholder="Описание на продукта..." />
                  </FormField>
                </FormSection>
                
                <FormSection
                  title="Допълнителна информация"
                  description="Тази информация е по желание, но помага за по-добро категоризиране"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Категория"
                      htmlFor="product-category"
                    >
                      <Input id="product-category" placeholder="Категория" />
                    </FormField>
                    
                    <FormField
                      label="Единица"
                      htmlFor="product-unit"
                    >
                      <Input id="product-unit" placeholder="бр." />
                    </FormField>
                  </div>
                </FormSection>
              </FormLayout>
              
              {showSuccess && (
                <SuccessAnimation 
                  message="Продуктът е създаден успешно!"
                  toast
                  duration={3}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 