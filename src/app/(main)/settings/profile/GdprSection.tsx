"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/toast";
import { signOut } from "next-auth/react";
import { useAsyncLock } from "@/hooks/use-async-lock";

interface GdprSectionProps {
  userEmail: string;
}

export function GdprSection({ userEmail }: GdprSectionProps) {
  const exportLock = useAsyncLock();
  const deleteLock = useAsyncLock();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleExportData = async () => {
    void exportLock.run(async () => {
      try {
        const response = await fetch("/api/user/export");
        
        if (!response.ok) {
          throw new Error("Грешка при експорт на данните");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gdpr-export-${userEmail}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Данните са експортирани успешно!");
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Грешка при експорт на данните. Моля, опитайте отново.");
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== userEmail) {
      toast.error("Имейлът за потвърждение не съвпада");
      return;
    }

    void deleteLock.run(async () => {
      try {
        const response = await fetch("/api/user/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmation: deleteConfirmation }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Грешка при изтриване на акаунта");
        }

        toast.success("Акаунтът е изтрит успешно");
        
        await signOut({ callbackUrl: "/" });
      } catch (error: unknown) {
        console.error("Delete error:", error);
        toast.error(error instanceof Error ? error.message : "Грешка при изтриване на акаунта");
        setDeleteDialogOpen(false);
        setDeleteConfirmation("");
      }
    });
  };

  return (
    <>
      {/* GDPR Data Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <CardTitle>Лични данни (GDPR)</CardTitle>
          </div>
          <CardDescription>
            Съгласно GDPR имате право да изтеглите копие от всички ваши лични данни
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Експортирайте всички ваши данни в JSON формат: профил, фирми, клиенти, 
                продукти, фактури, документи и история на действията.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exportLock.isPending}
              loading={exportLock.isPending}
              className="shrink-0"
            >
              {!exportLock.isPending ? <Download className="h-4 w-4 mr-2" /> : null}
              {exportLock.isPending ? "Експортиране..." : "Експортирай данните"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Delete Account */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Опасна зона</CardTitle>
          </div>
          <CardDescription>
            Внимание! Действията в тази секция са необратими.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Изтриване на акаунт</p>
              <p className="text-sm text-muted-foreground">
                Изтриването на акаунта ще премахне всички ваши данни безвъзвратно: 
                фирми, клиенти, продукти, фактури и документи.
              </p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Изтрий акаунта
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Изтриване на акаунт
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Това действие е <strong>необратимо</strong>. Всички ваши данни ще бъдат 
                      изтрити завинаги, включително:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Профил и настройки</li>
                      <li>Всички фирми</li>
                      <li>Всички клиенти</li>
                      <li>Всички продукти</li>
                      <li>Всички фактури и кредитни известия</li>
                      <li>Всички качени документи</li>
                      <li>История на абонамента</li>
                    </ul>
                    <div className="pt-4">
                      <Label htmlFor="confirm-email" className="text-foreground">
                        Въведете <strong>{userEmail}</strong> за потвърждение:
                      </Label>
                      <Input
                        id="confirm-email"
                        type="email"
                        placeholder="вашият@имейл.com"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                               <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteLock.isPending}>
                    Отказ
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteLock.isPending || deleteConfirmation !== userEmail}
                    loading={deleteLock.isPending}
                  >
                    {!deleteLock.isPending ? <Trash2 className="h-4 w-4 mr-2" /> : null}
                    {deleteLock.isPending ? "Изтриване..." : "Изтрий завинаги"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
